import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStreamById } from "@/lib/models/stream";
import { unenrollStudent } from "@/lib/models/enrollment";

export async function DELETE(
   req: NextRequest,
   { params }: { params: { id: string; studentId: string } }
) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { id, studentId } = await params;

      const teacherId = session.user.id;
      const streamId = parseInt(id);
      const SID = parseInt(studentId);

      // Check if the stream belongs to the teacher
      const stream = await getStreamById(streamId);
      if (!stream) {
         return NextResponse.json(
            { error: "Stream not found" },
            { status: 404 }
         );
      }

      if (stream.teacher_id !== Number(teacherId)) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Unenroll the student
      const success = await unenrollStudent(SID, streamId);

      if (!success) {
         return NextResponse.json(
            { error: "Failed to remove student from stream" },
            { status: 500 }
         );
      }

      return NextResponse.json({ success: true });
   } catch (error) {
      console.error("Error removing student from stream:", error);
      return NextResponse.json(
         { error: "Failed to remove student from stream" },
         { status: 500 }
      );
   }
}
