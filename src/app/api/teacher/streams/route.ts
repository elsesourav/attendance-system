import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { createStream } from "@/lib/models/stream";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;

      const streams = await executeQuery(
         `SELECT s.id, s.name, s.description,
        (SELECT COUNT(*) FROM subjects WHERE stream_id = s.id) as subjectCount,
        (SELECT COUNT(DISTINCT se.student_id)
         FROM subject_enrollments se
         JOIN subjects sub ON se.subject_id = sub.id
         WHERE sub.stream_id = s.id) as studentCount
       FROM streams s
       WHERE s.teacher_id = ?
       ORDER BY s.created_at DESC`,
         [teacherId]
      );

      return NextResponse.json(streams);
   } catch (error) {
      console.error("Error fetching streams:", error);
      return NextResponse.json(
         { error: "Failed to fetch streams" },
         { status: 500 }
      );
   }
}

export async function POST(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;
      const { name, description } = await req.json();

      if (!name) {
         return NextResponse.json(
            { error: "Stream name is required" },
            { status: 400 }
         );
      }

      const streamId = await createStream({
         name,
         description,
         teacher_id: Number(teacherId),
      });

      return NextResponse.json({ id: streamId, name, description });
   } catch (error) {
      console.error("Error creating stream:", error);
      return NextResponse.json(
         { error: "Failed to create stream" },
         { status: 500 }
      );
   }
}
