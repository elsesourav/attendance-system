import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { enrollStudent } from "@/lib/models/enrollment";
import { getStreamById } from "@/lib/models/stream";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
   _req: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
   try {
      const id = (await params).id;
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;
      const streamId = parseInt(id);

      // Check if the stream belongs to the teacher
      const stream = await getStreamById(streamId);
      if (!stream) {
         return NextResponse.json(
            { error: "Stream not found" },
            { status: 404 }
         );
      }

      if (stream.teacher_id !== Number(teacherId)) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Get students enrolled in this stream
      const students = await executeQuery(
         `SELECT DISTINCT s.id, s.name, s.email, s.registration_number
       FROM students s
       JOIN subject_enrollments se ON s.id = se.student_id
       JOIN subjects sub ON se.subject_id = sub.id
       WHERE sub.stream_id = ?
       ORDER BY s.name ASC`,
         [streamId]
      );

      return NextResponse.json(students);
   } catch (error) {
      console.error("Error fetching enrolled students:", error);
      return NextResponse.json(
         { error: "Failed to fetch enrolled students" },
         { status: 500 }
      );
   }
}

export async function POST(
   req: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
   try {
      const id = (await params).id;
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;
      const streamId = parseInt(id);
      const { studentId } = await req.json();

      if (!studentId) {
         return NextResponse.json(
            { error: "Student ID is required" },
            { status: 400 }
         );
      }

      // Check if the stream belongs to the teacher
      const stream = await getStreamById(streamId);
      if (!stream) {
         return NextResponse.json(
            { error: "Stream not found" },
            { status: 404 }
         );
      }

      if (stream.teacher_id !== Number(teacherId)) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Enroll the student
      try {
         const enrollmentIds = await enrollStudent(studentId, streamId);
         if (enrollmentIds.length === 0) {
            return NextResponse.json(
               {
                  error: "Student is already enrolled in all subjects of this stream",
               },
               { status: 409 }
            );
         }
         return NextResponse.json({ success: true, enrollmentIds });
      } catch (enrollError) {
         const error = enrollError as Error;
         if (error.message === "No subjects found in this stream") {
            return NextResponse.json(
               {
                  error: "No subjects found in this stream. Please add subjects first.",
               },
               { status: 400 }
            );
         }
         throw enrollError;
      }
   } catch (error) {
      console.error("Error enrolling student:", error);
      return NextResponse.json(
         { error: "Failed to enroll student" },
         { status: 500 }
      );
   }
}
