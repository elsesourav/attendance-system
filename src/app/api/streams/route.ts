import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

// GET all streams for a teacher
export async function GET(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const userId = session.user.id;
      const role = session.user.role;

      let streams;

      if (role === "teacher") {
         // Get streams created by this teacher
         streams = await executeQuery({
            query: "SELECT * FROM streams WHERE teacher_id = ?",
            values: [userId],
         });
      } else if (role === "student") {
         // Get streams the student is enrolled in
         streams = await executeQuery({
            query: `
          SELECT s.*
          FROM streams s
          JOIN enrollments e ON s.id = e.stream_id
          WHERE e.student_id = ?
        `,
            values: [userId],
         });
      } else {
         return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      return NextResponse.json(streams);
   } catch (error) {
      console.error("Error fetching streams:", error);
      return NextResponse.json(
         { error: "Failed to fetch streams" },
         { status: 500 }
      );
   }
}

// POST create a new stream (teachers only)
export async function POST(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      console.log("Session in stream creation:", session);

      if (!session || !session.user) {
         return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
         );
      }

      if (session.user.role !== "teacher") {
         return NextResponse.json(
            { error: "Only teachers can create streams" },
            { status: 403 }
         );
      }

      const { name, description } = await req.json();

      console.log("Stream creation request:", {
         name,
         description,
         userId: session.user.id,
      });

      if (!name) {
         return NextResponse.json(
            { error: "Stream name is required" },
            { status: 400 }
         );
      }

      // Ensure user ID is a number
      let teacherId = parseInt(session.user.id);

      if (isNaN(teacherId)) {
         return NextResponse.json(
            { error: "Invalid teacher ID" },
            { status: 400 }
         );
      }

      // Check if the teacher exists in the database
      let teachers = await executeQuery<any[]>({
         query: "SELECT * FROM users WHERE id = ? AND role = 'teacher'",
         values: [teacherId],
      });

      console.log("Teacher check by ID:", {
         teacherId,
         found: teachers.length > 0,
      });

      // If teacher not found by ID, try to find by email
      if (!teachers.length) {
         console.log(
            "Teacher not found by ID. Checking if email exists:",
            session.user.email
         );

         // Try to find the teacher by email
         const teachersByEmail = await executeQuery<any[]>({
            query: "SELECT * FROM users WHERE email = ? AND role = 'teacher'",
            values: [session.user.email],
         });

         console.log("Teacher check by email:", {
            email: session.user.email,
            found: teachersByEmail.length > 0,
            teacher: teachersByEmail[0] || null,
         });

         if (teachersByEmail.length > 0) {
            // Use the teacher found by email
            teachers = teachersByEmail;
            teacherId = teachersByEmail[0].id;
            console.log(
               "Found teacher by email. Using ID from database:",
               teacherId
            );
         }
      }

      // If still no teacher found, create a new one
      if (!teachers.length) {
         console.log("Teacher not found. Creating a new teacher record.");

         try {
            // Create a new teacher record
            const result = await executeQuery<any>({
               query: "INSERT INTO users (name, email, mobile_number, password, role) VALUES (?, ?, ?, ?, ?)",
               values: [
                  session.user.name || "Teacher",
                  session.user.email,
                  "0000000000", // Default mobile number
                  "$2b$10$JsRJUEFgUJkEHDFDVSnSxOJySKxK2sxjqVeWQ7LqHs9JJgj3bKVdW", // Default password: password123
                  "teacher",
               ],
            });

            teacherId = result.insertId;
            console.log("Created new teacher with ID:", teacherId);
         } catch (error) {
            console.error("Error creating teacher:", error);

            // If creation fails (e.g., due to duplicate email), try to find the teacher again
            const teachersByEmail = await executeQuery<any[]>({
               query: "SELECT * FROM users WHERE email = ? AND role = 'teacher'",
               values: [session.user.email],
            });

            if (teachersByEmail.length > 0) {
               teacherId = teachersByEmail[0].id;
               console.log(
                  "Found teacher after creation attempt. Using ID:",
                  teacherId
               );
            } else {
               return NextResponse.json(
                  { error: "Failed to find or create teacher" },
                  { status: 500 }
               );
            }
         }
      }

      const result = await executeQuery<any>({
         query: "INSERT INTO streams (name, description, teacher_id) VALUES (?, ?, ?)",
         values: [name, description || "", teacherId],
      });

      return NextResponse.json(
         {
            message: "Stream created successfully",
            streamId: result.insertId,
         },
         { status: 201 }
      );
   } catch (error) {
      console.error("Error creating stream:", error);
      return NextResponse.json(
         { error: "Failed to create stream" },
         { status: 500 }
      );
   }
}
