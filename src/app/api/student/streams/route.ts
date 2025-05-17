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

      // Get streams the student is enrolled in, along with teacher name and subject count
      const streams = await executeQuery(
         `SELECT DISTINCT s.id, s.name, s.description, t.name as teacherName,
        (SELECT COUNT(*) FROM subjects WHERE stream_id = s.id) as subjectCount,
        (SELECT COUNT(*) FROM subject_enrollments se
         JOIN subjects sub ON se.subject_id = sub.id
         WHERE sub.stream_id = s.id AND se.student_id = ?) as enrolledSubjectCount
       FROM streams s
       JOIN subjects sub ON s.id = sub.stream_id
       JOIN subject_enrollments se ON sub.id = se.subject_id
       JOIN teachers t ON s.teacher_id = t.id
       WHERE se.student_id = ?
       ORDER BY s.name ASC`,
         [studentId, studentId]
      );

      return NextResponse.json(streams);
   } catch (error) {
      console.error("Error fetching student streams:", error);
      return NextResponse.json(
         { error: "Failed to fetch streams" },
         { status: 500 }
      );
   }
}
