import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

// GET all subjects for a stream
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

      console.log("Session in subject fetch:", session.user);

      if (role === "teacher") {
         // First try with the session user ID
         const teacherStreams = await executeQuery<any[]>({
            query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
            values: [streamId, userId],
         });

         if (teacherStreams.length > 0) {
            hasAccess = true;
         } else {
            // If not found, try to find the teacher by email
            const teacherEmail = session.user.email;
            console.log("Checking teacher access by email:", teacherEmail);

            const teacherByEmail = await executeQuery<any[]>({
               query: "SELECT * FROM users WHERE email = ? AND role = 'teacher'",
               values: [teacherEmail],
            });

            if (teacherByEmail.length > 0) {
               const dbTeacherId = teacherByEmail[0].id;
               console.log("Found teacher by email with ID:", dbTeacherId);

               const teacherStreamsByEmail = await executeQuery<any[]>({
                  query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
                  values: [streamId, dbTeacherId],
               });

               hasAccess = teacherStreamsByEmail.length > 0;
            }
         }
      } else if (role === "student") {
         // First try with the session user ID
         const studentEnrollments = await executeQuery<any[]>({
            query: "SELECT * FROM enrollments WHERE stream_id = ? AND student_id = ?",
            values: [streamId, userId],
         });

         if (studentEnrollments.length > 0) {
            hasAccess = true;
         } else {
            // If not found, try to find the student by email
            const studentEmail = session.user.email;
            console.log("Checking student access by email:", studentEmail);

            const studentByEmail = await executeQuery<any[]>({
               query: "SELECT * FROM users WHERE email = ? AND role = 'student'",
               values: [studentEmail],
            });

            if (studentByEmail.length > 0) {
               const dbStudentId = studentByEmail[0].id;
               console.log("Found student by email with ID:", dbStudentId);

               const studentEnrollmentsByEmail = await executeQuery<any[]>({
                  query: "SELECT * FROM enrollments WHERE stream_id = ? AND student_id = ?",
                  values: [streamId, dbStudentId],
               });

               hasAccess = studentEnrollmentsByEmail.length > 0;
            }
         }
      }

      if (!hasAccess) {
         return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Get subjects for this stream
      const subjects = await executeQuery<any[]>({
         query: "SELECT * FROM subjects WHERE stream_id = ? ORDER BY name ASC",
         values: [streamId],
      });

      return NextResponse.json(subjects);
   } catch (error) {
      console.error("Error fetching subjects:", error);
      return NextResponse.json(
         { error: "Failed to fetch subjects" },
         { status: 500 }
      );
   }
}

// POST create a new subject (teachers only)
export async function POST(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { name, description, streamId } = await req.json();

      if (!name || !streamId) {
         return NextResponse.json(
            { error: "Subject name and stream ID are required" },
            { status: 400 }
         );
      }

      // Check if teacher owns this stream
      let hasAccess = false;

      // First try with the session user ID
      const teacherStreams = await executeQuery<any[]>({
         query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
         values: [streamId, session.user.id],
      });

      if (teacherStreams.length > 0) {
         hasAccess = true;
      } else {
         // If not found, try to find the teacher by email
         const teacherEmail = session.user.email;
         console.log("Checking teacher access by email:", teacherEmail);

         const teacherByEmail = await executeQuery<any[]>({
            query: "SELECT * FROM users WHERE email = ? AND role = 'teacher'",
            values: [teacherEmail],
         });

         if (teacherByEmail.length > 0) {
            const dbTeacherId = teacherByEmail[0].id;
            console.log("Found teacher by email with ID:", dbTeacherId);

            const teacherStreamsByEmail = await executeQuery<any[]>({
               query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
               values: [streamId, dbTeacherId],
            });

            hasAccess = teacherStreamsByEmail.length > 0;
         }
      }

      if (!hasAccess) {
         return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Check if subject with this name already exists in this stream
      const existingSubjects = await executeQuery<any[]>({
         query: "SELECT * FROM subjects WHERE name = ? AND stream_id = ?",
         values: [name, streamId],
      });

      if (existingSubjects.length > 0) {
         return NextResponse.json(
            { error: "Subject with this name already exists in this stream" },
            { status: 400 }
         );
      }

      // Create subject
      const result = await executeQuery<any>({
         query: "INSERT INTO subjects (name, description, stream_id) VALUES (?, ?, ?)",
         values: [name, description || "", streamId],
      });

      return NextResponse.json(
         {
            message: "Subject created successfully",
            subjectId: result.insertId,
         },
         { status: 201 }
      );
   } catch (error) {
      console.error("Error creating subject:", error);
      return NextResponse.json(
         { error: "Failed to create subject" },
         { status: 500 }
      );
   }
}

// DELETE all subjects in a stream (teachers only)
export async function DELETE(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user || session.user.role !== "teacher") {
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

      // Check if teacher owns this stream
      let hasAccess = false;

      // First try with the session user ID
      const teacherStreams = await executeQuery<any[]>({
         query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
         values: [streamId, session.user.id],
      });

      if (teacherStreams.length > 0) {
         hasAccess = true;
      } else {
         // If not found, try to find the teacher by email
         const teacherEmail = session.user.email;
         console.log("Checking teacher access by email:", teacherEmail);

         const teacherByEmail = await executeQuery<any[]>({
            query: "SELECT * FROM users WHERE email = ? AND role = 'teacher'",
            values: [teacherEmail],
         });

         if (teacherByEmail.length > 0) {
            const dbTeacherId = teacherByEmail[0].id;
            console.log("Found teacher by email with ID:", dbTeacherId);

            const teacherStreamsByEmail = await executeQuery<any[]>({
               query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
               values: [streamId, dbTeacherId],
            });

            hasAccess = teacherStreamsByEmail.length > 0;
         }
      }

      if (!hasAccess) {
         return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Delete all subjects in this stream
      await executeQuery<any>({
         query: "DELETE FROM subjects WHERE stream_id = ?",
         values: [streamId],
      });

      return NextResponse.json({
         message: "All subjects in this stream deleted successfully",
      });
   } catch (error) {
      console.error("Error deleting subjects:", error);
      return NextResponse.json(
         { error: "Failed to delete subjects" },
         { status: 500 }
      );
   }
}
