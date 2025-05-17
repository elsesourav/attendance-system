import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "student") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const studentId = session.user.id;

      // Get stream count (distinct streams where student is enrolled in at least one subject)
      const streamCountResult = (await executeQuery(
         `SELECT COUNT(DISTINCT sub.stream_id) as count
          FROM subject_enrollments se
          JOIN subjects sub ON se.subject_id = sub.id
          WHERE se.student_id = ?`,
         [studentId]
      )) as [{ count: number }];
      const streamCount = streamCountResult[0]?.count || 0;

      // Get subject count
      const subjectCountResult = (await executeQuery(
         `SELECT COUNT(*) as count FROM subject_enrollments
          WHERE student_id = ?`,
         [studentId]
      )) as [{ count: number }];
      const subjectCount = subjectCountResult[0]?.count || 0;

      // Get attendance percentage
      const attendanceResult = (await executeQuery(
         `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'present' OR status = 'late' THEN 1 ELSE 0 END) as present
       FROM attendance
       WHERE student_id = ?`,
         [studentId]
      )) as [{ total: number; present: number }];

      const total = attendanceResult[0]?.total || 0;
      const present = attendanceResult[0]?.present || 0;
      const attendancePercentage =
         total > 0 ? Math.round((present / total) * 100) : 0;

      return NextResponse.json({
         streamCount,
         subjectCount,
         attendancePercentage,
      });
   } catch (error) {
      console.error("Error fetching student stats:", error);
      return NextResponse.json(
         { error: "Failed to fetch stats" },
         { status: 500 }
      );
   }
}
