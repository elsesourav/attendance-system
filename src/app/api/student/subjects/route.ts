import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = session.user.id;

    // Get all subjects the student is enrolled in
    const subjects = await executeQuery(
      `SELECT s.id, s.name, s.description, 
        str.id as stream_id, str.name as stream_name,
        t.name as teacher_name
       FROM subjects s
       JOIN subject_enrollments se ON s.id = se.subject_id
       JOIN streams str ON s.stream_id = str.id
       JOIN teachers t ON str.teacher_id = t.id
       WHERE se.student_id = ?
       ORDER BY str.name, s.name`,
      [studentId]
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
