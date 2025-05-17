import { authOptions } from "@/lib/auth";
import { getStreamById } from "@/lib/models/stream";
import { getSubjectById } from "@/lib/models/subject";
import { unenrollStudentFromSubject } from "@/lib/models/subjectEnrollment";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
   req: NextRequest,
   { params }: { params: Promise<{ id: string, studentId: string }> }
) {
   try {
      const id = (await params).id;
      const sid = (await params).studentId;
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;
      const subjectId = parseInt(id);
      const studentId = parseInt(sid);

      // Get subject details
      const subject = await getSubjectById(subjectId);
      if (!subject) {
         return NextResponse.json(
            { error: "Subject not found" },
            { status: 404 }
         );
      }

      // Check if the subject's stream belongs to the teacher
      const stream = await getStreamById(subject.stream_id);
      if (!stream) {
         return NextResponse.json(
            { error: "Stream not found" },
            { status: 404 }
         );
      }

      if (stream.teacher_id !== Number(teacherId)) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Unenroll the student from the subject
      const success = await unenrollStudentFromSubject(studentId, subjectId);

      if (!success) {
         return NextResponse.json(
            { error: "Failed to remove student from subject" },
            { status: 500 }
         );
      }

      return NextResponse.json({ success: true });
   } catch (error) {
      console.error("Error removing student from subject:", error);
      return NextResponse.json(
         { error: "Failed to remove student from subject" },
         { status: 500 }
      );
   }
}
