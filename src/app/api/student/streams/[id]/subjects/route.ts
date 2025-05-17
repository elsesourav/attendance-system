import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
   req: NextRequest,
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

      // Get subjects in this stream with enrollment status
      const subjects = await executeQuery(
         `SELECT s.id, s.name, s.description,
        CASE WHEN se.id IS NOT NULL THEN true ELSE false END as enrolled
       FROM subjects s
       LEFT JOIN subject_enrollments se ON s.id = se.subject_id AND se.student_id = ?
       WHERE s.stream_id = ?
       ORDER BY s.name ASC`,
         [studentId, streamId]
      );

      return NextResponse.json(subjects);
   } catch (error) {
      console.error("Error fetching subjects:", error);
      return NextResponse.json(
         { error: "Failed to fetch subjects" },
         { status: 500 }
      );
   }
}
