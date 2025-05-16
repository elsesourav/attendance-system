import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

// GET a specific stream
export async function GET(
   req: NextRequest,
   context: { params: { id: string } }
) {
   try {
      // In Next.js App Router, params is already resolved
      const { id } = await context.params;
      const streamId = id;

      const session = await getServerSession(authOptions);
      console.log("Session:", session);

      if (!session || !session.user) {
         console.log("Unauthorized: No session or user");
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const userId = session.user.id;
      const role = session.user.role;

      // Check if user has access to this stream
      let hasAccess = false;

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

      if (hasAccess === false) {
         return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Get stream details
      const streams = await executeQuery<any[]>({
         query: "SELECT * FROM streams WHERE id = ?",
         values: [streamId],
      });

      if (streams.length === 0) {
         return NextResponse.json(
            { error: "Stream not found" },
            { status: 404 }
         );
      }

      return NextResponse.json(streams[0]);
   } catch (error) {
      console.error("Error fetching stream:", error);
      return NextResponse.json(
         { error: "Failed to fetch stream" },
         { status: 500 }
      );
   }
}

// PUT update a stream (teachers only)
export async function PUT(
   req: NextRequest,
   context: { params: { id: string } }
) {
   try {
      // Extract the ID from context.params
      const { id } = context.params;
      const streamId = id;

      const session = await getServerSession(authOptions);

      if (!session || !session.user || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const { name, description } = await req.json();

      if (!name) {
         return NextResponse.json(
            { error: "Stream name is required" },
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

      await executeQuery({
         query: "UPDATE streams SET name = ?, description = ? WHERE id = ?",
         values: [name, description || "", streamId],
      });

      return NextResponse.json({ message: "Stream updated successfully" });
   } catch (error) {
      console.error("Error updating stream:", error);
      return NextResponse.json(
         { error: "Failed to update stream" },
         { status: 500 }
      );
   }
}

// DELETE a stream (teachers only)
export async function DELETE(
   _req: NextRequest, // Prefix with underscore to indicate it's not used
   context: { params: { id: string } }
) {
   try {
      // Extract the ID from context.params
      const { id } = context.params;
      const streamId = id;

      const session = await getServerSession(authOptions);

      if (!session || !session.user || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

      await executeQuery({
         query: "DELETE FROM streams WHERE id = ?",
         values: [streamId],
      });

      return NextResponse.json({ message: "Stream deleted successfully" });
   } catch (error) {
      console.error("Error deleting stream:", error);
      return NextResponse.json(
         { error: "Failed to delete stream" },
         { status: 500 }
      );
   }
}
