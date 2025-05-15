import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

// GET students enrolled in a stream
export async function GET(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const url = new URL(req.url);
      const streamId = url.searchParams.get("streamId");

      if (!streamId) {
         return NextResponse.json(
            { error: "Stream ID is required" },
            { status: 400 }
         );
      }

      const userId = session.user.id;
      const role = session.user.role;

      // Check if user has access to this stream
      let hasAccess = false;

      if (role === "teacher") {
         const teacherStreams = await executeQuery({
            query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
            values: [streamId, userId],
         });
         hasAccess = teacherStreams.length > 0;
      } else if (role === "student") {
         const studentEnrollments = await executeQuery({
            query: "SELECT * FROM enrollments WHERE stream_id = ? AND student_id = ?",
            values: [streamId, userId],
         });
         hasAccess = studentEnrollments.length > 0;
      }

      if (!hasAccess) {
         return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Get enrolled students
      const enrollments = await executeQuery({
         query: `
        SELECT e.id, e.student_id, e.stream_id, e.created_at, u.id as user_id, u.name, u.email
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        WHERE e.stream_id = ?
        ORDER BY u.name ASC
      `,
         values: [streamId],
      });

      console.log("Enrollments data:", enrollments);

      return NextResponse.json(enrollments);
   } catch (error) {
      console.error("Error fetching enrollments:", error);
      return NextResponse.json(
         { error: "Failed to fetch enrollments" },
         { status: 500 }
      );
   }
}

// POST enroll a student (teachers only)
export async function POST(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { streamId, studentEmail } = await req.json();

      if (!streamId || !studentEmail) {
         return NextResponse.json(
            { error: "Stream ID and student email are required" },
            { status: 400 }
         );
      }

      // Check if teacher owns this stream
      const teacherStreams = await executeQuery({
         query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
         values: [streamId, session.user.id],
      });

      if (teacherStreams.length === 0) {
         return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Find student by email
      const students = await executeQuery({
         query: "SELECT * FROM users WHERE email = ? AND role = 'student'",
         values: [studentEmail],
      });

      if (students.length === 0) {
         return NextResponse.json(
            { error: "Student not found" },
            { status: 404 }
         );
      }

      const studentId = students[0].id;

      // Check if student is already enrolled
      const existingEnrollments = await executeQuery({
         query: "SELECT * FROM enrollments WHERE stream_id = ? AND student_id = ?",
         values: [streamId, studentId],
      });

      if (existingEnrollments.length > 0) {
         return NextResponse.json(
            { error: "Student is already enrolled in this stream" },
            { status: 400 }
         );
      }

      // Enroll student
      await executeQuery({
         query: "INSERT INTO enrollments (student_id, stream_id) VALUES (?, ?)",
         values: [studentId, streamId],
      });

      return NextResponse.json({ message: "Student enrolled successfully" });
   } catch (error) {
      console.error("Error enrolling student:", error);
      return NextResponse.json(
         { error: "Failed to enroll student" },
         { status: 500 }
      );
   }
}

// DELETE unenroll a student (teachers only)
export async function DELETE(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const url = new URL(req.url);
      const streamId = url.searchParams.get("streamId");
      const studentId = url.searchParams.get("studentId");

      if (!streamId || !studentId) {
         return NextResponse.json(
            { error: "Stream ID and student ID are required" },
            { status: 400 }
         );
      }

      // Check if teacher owns this stream
      const teacherStreams = await executeQuery({
         query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
         values: [streamId, session.user.id],
      });

      if (teacherStreams.length === 0) {
         return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Unenroll student
      await executeQuery({
         query: "DELETE FROM enrollments WHERE stream_id = ? AND student_id = ?",
         values: [streamId, studentId],
      });

      return NextResponse.json({ message: "Student unenrolled successfully" });
   } catch (error) {
      console.error("Error unenrolling student:", error);
      return NextResponse.json(
         { error: "Failed to unenroll student" },
         { status: 500 }
      );
   }
}
