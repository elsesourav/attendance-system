import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { deleteStream, getStreamById, updateStream } from "@/lib/models/stream";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
   req: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
   try {
      const id = (await params).id;
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      console.log("id", id);

      const teacherId = session.user.id;
      const streamId = parseInt(id);

      // Get stream
      const stream = await getStreamById(streamId);

      if (!stream) {
         return NextResponse.json(
            { error: "Stream not found" },
            { status: 404 }
         );
      }

      // Verify teacher access
      if (stream.teacher_id !== Number(teacherId)) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Get subject count
      const subjectCountResult = (await executeQuery(
         "SELECT COUNT(*) as count FROM subjects WHERE stream_id = ?",
         [streamId]
      )) as [{ count: number }];
      const subjectCount = subjectCountResult[0]?.count || 0;

      // Get student count
      const studentCountResult = (await executeQuery(
         `SELECT COUNT(DISTINCT se.student_id) as count
       FROM subject_enrollments se
       JOIN subjects sub ON se.subject_id = sub.id
       WHERE sub.stream_id = ?`,
         [streamId]
      )) as [{ count: number }];
      const studentCount = studentCountResult[0]?.count || 0;

      return NextResponse.json({
         ...stream,
         subjectCount,
         studentCount,
      });
   } catch (error) {
      console.error("Error fetching stream:", error);
      return NextResponse.json(
         { error: "Failed to fetch stream" },
         { status: 500 }
      );
   }
}

export async function PUT(
   req: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
   try {
      const id = (await params).id;
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;
      const streamId = parseInt(id);
      const { name, description } = await req.json();

      // Verify stream access
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

      if (!name) {
         return NextResponse.json(
            { error: "Stream name is required" },
            { status: 400 }
         );
      }

      const updated = await updateStream(streamId, { name, description });

      if (!updated) {
         return NextResponse.json(
            { error: "Failed to update stream" },
            { status: 500 }
         );
      }

      return NextResponse.json({ id: streamId, name, description });
   } catch (error) {
      console.error("Error updating stream:", error);
      return NextResponse.json(
         { error: "Failed to update stream" },
         { status: 500 }
      );
   }
}

export async function DELETE(
   req: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
   try {
      const id = (await params).id;
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;
      const streamId = parseInt(id);

      // Verify stream access
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

      const deleted = await deleteStream(streamId);

      if (!deleted) {
         return NextResponse.json(
            { error: "Failed to delete stream" },
            { status: 500 }
         );
      }

      return NextResponse.json({ success: true });
   } catch (error) {
      console.error("Error deleting stream:", error);
      return NextResponse.json(
         { error: "Failed to delete stream" },
         { status: 500 }
      );
   }
}
