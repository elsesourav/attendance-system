import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubjectById } from "@/lib/models/subject";
import { getStreamById } from "@/lib/models/stream";
import { getAvailableStudentsForSubject } from "@/lib/models/subjectEnrollment";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherId = session.user.id;
    const url = new URL(req.url);
    const subjectId = url.searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }

    // Get subject details
    const subject = await getSubjectById(parseInt(subjectId));
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if the subject's stream belongs to the teacher
    const stream = await getStreamById(subject.stream_id);
    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.teacher_id !== Number(teacherId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get students not enrolled in this subject
    const students = await getAvailableStudentsForSubject(parseInt(subjectId));

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching available students:", error);
    return NextResponse.json(
      { error: "Failed to fetch available students" },
      { status: 500 }
    );
  }
}
