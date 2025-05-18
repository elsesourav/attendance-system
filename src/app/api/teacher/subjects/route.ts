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

      // Get teacher subjects
      const subjects = await executeQuery(
         `SELECT s.id, s.name, s.description, s.stream_id,
         str.name as streamName,
         (SELECT COUNT(*) FROM subject_enrollments se WHERE se.subject_id = s.id) as studentCount
         FROM subjects s
         JOIN streams str ON s.stream_id = str.id
         WHERE str.teacher_id = ?
         ORDER BY str.name ASC, s.name ASC`,
         [teacherId]
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
