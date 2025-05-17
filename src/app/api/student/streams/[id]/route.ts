import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

interface StreamWithTeacher {
   id: number;
   name: string;
   description: string | null;
   teacherName: string;
}

export async function GET(
   _req: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
   try {
      const id = (await params).id;
      
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "student") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (!id || id === "undefined") {
         return NextResponse.json(
            { error: "Stream ID is required" },
            { status: 400 }
         );
      }

      const studentId = session.user.id;
      const streamId = parseInt(id);

      // Check if the student is enrolled in any subject of this stream
      const enrollmentCheck = (await executeQuery(
         `SELECT COUNT(*) as count
       FROM subject_enrollments se
       JOIN subjects s ON se.subject_id = s.id
       WHERE se.student_id = ? AND s.stream_id = ?`,
         [studentId, streamId]
      )) as [{ count: number }];

      if (enrollmentCheck[0].count === 0) {
         return NextResponse.json(
            { error: "You are not enrolled in any subject of this stream" },
            { status: 403 }
         );
      }

      // Get stream details with teacher name
      const streams = (await executeQuery(
         `SELECT s.id, s.name, s.description, t.name as teacherName
       FROM streams s
       JOIN teachers t ON s.teacher_id = t.id
       WHERE s.id = ?`,
         [streamId]
      )) as StreamWithTeacher[];

      if (streams.length === 0) {
         return NextResponse.json(
            { error: "Stream not found" },
            { status: 404 }
         );
      }

      return NextResponse.json(streams[0]);
   } catch (error) {
      console.error("Error fetching stream details:", error);
      return NextResponse.json(
         { error: "Failed to fetch stream details" },
         { status: 500 }
      );
   }
}
