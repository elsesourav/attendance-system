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

      const role = session.user.role;
      let userId;
      let streams;

      // get user id from email
      const users: any[] = await executeQuery({
         query: "SELECT * FROM users WHERE email = ?",
         values: [session.user.email],
      });

      if (users.length > 0) {
         userId = users[0].id;
      }

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

      // If teacher not found by ID, try to find by email
      let teacherId;
      let teachers = [];   

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


      if (teachers.length > 0) {
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
      } else {
         return NextResponse.json(
            { error: "No Teacher Found" },
            { status: 401 }
         );
      }
      
   } catch (error) {
      console.error("Error creating stream:", error);
      return NextResponse.json(
         { error: "Failed to create stream" },
         { status: 500 }
      );
   }
}
