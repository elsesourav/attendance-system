import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;

      // Get stream count
      const streamCountResult = (await executeQuery(
         "SELECT COUNT(*) as count FROM streams WHERE teacher_id = ?",
         [teacherId]
      )) as [{ count: number }];
      const streamCount = streamCountResult[0]?.count || 0;

      // Get subject count
      const subjectCountResult = (await executeQuery(
         `SELECT COUNT(*) as count FROM subjects
       WHERE stream_id IN (SELECT id FROM streams WHERE teacher_id = ?)`,
         [teacherId]
      )) as [{ count: number }];
      const subjectCount = subjectCountResult[0]?.count || 0;

      // Get student count (unique students enrolled in teacher's subjects)
      const studentCountResult = (await executeQuery(
         `SELECT COUNT(DISTINCT se.student_id) as count
       FROM subject_enrollments se
       JOIN subjects sub ON se.subject_id = sub.id
       JOIN streams str ON sub.stream_id = str.id
       WHERE str.teacher_id = ?`,
         [teacherId]
      )) as [{ count: number }];
      const studentCount = studentCountResult[0]?.count || 0;

      return NextResponse.json({
         streamCount,
         subjectCount,
         studentCount,
      });
   } catch (error) {
      console.error("Error fetching teacher stats:", error);
      return NextResponse.json(
         { error: "Failed to fetch stats" },
         { status: 500 }
      );
   }
}
