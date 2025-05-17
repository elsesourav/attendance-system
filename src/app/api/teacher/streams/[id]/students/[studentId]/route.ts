import { authOptions } from "@/lib/auth";
import { unenrollStudent } from "@/lib/models/enrollment";
import { getStreamById } from "@/lib/models/stream";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
   req: NextRequest,
   { params }: { params: Promise<{ id: string, studentId: string }> }
) {
   try {
      const id = (await params).id;
      const studentId = (await params).studentId;
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

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
