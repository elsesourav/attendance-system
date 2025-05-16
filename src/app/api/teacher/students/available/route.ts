import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getStreamById } from "@/lib/models/stream";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;
      const url = new URL(req.url);
      const streamId = url.searchParams.get("streamId");

      if (!streamId) {
         return NextResponse.json(
            { error: "Stream ID is required" },
            { status: 400 }
         );
      }

      // Check if the stream belongs to the teacher
      const stream = await getStreamById(parseInt(streamId));
      if (!stream) {
         return NextResponse.json(
            { error: "Stream not found" },
            { status: 404 }
         );
      }

      if (stream.teacher_id !== Number(teacherId)) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Get students not enrolled in any subject of this stream
      const students = await executeQuery(
         `SELECT id, name, email, registration_number
       FROM students
       WHERE id NOT IN (
         SELECT DISTINCT se.student_id
         FROM subject_enrollments se
         JOIN subjects sub ON se.subject_id = sub.id
         WHERE sub.stream_id = ?
       )
       ORDER BY name ASC`,
         [streamId]
      );

      return NextResponse.json(students);
   } catch (error) {
      console.error("Error fetching available students:", error);
      return NextResponse.json(
         { error: "Failed to fetch available students" },
         { status: 500 }
      );
   }
}
