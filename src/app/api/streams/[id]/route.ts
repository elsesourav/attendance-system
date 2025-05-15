import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

// GET a specific stream
export async function GET(
   req: NextRequest,
   { params }: { params: { id: string } }
) {
   try {
      console.log("Fetching stream with ID:", params.id);
      const session = await getServerSession(authOptions);
      console.log("Session:", session);

      if (!session || !session.user) {
         console.log("Unauthorized: No session or user");
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const streamId = params.id;
      const userId = session.user.id;
      const role = session.user.role;

      // Check if user has access to this stream
      let hasAccess = false;

      if (role === "teacher") {
         const teacherStreams = await executeQuery({
            query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
            values: [streamId, userId],
         });
         hasAccess = teacherStreams.length > 0;
      } else if (role === "student") {
         const studentEnrollments = await executeQuery({
            query: "SELECT * FROM enrollments WHERE stream_id = ? AND student_id = ?",
            values: [streamId, userId],
         });
         hasAccess = studentEnrollments.length > 0;
      }

      if (!hasAccess) {
         return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Get stream details
      const streams = await executeQuery({
         query: "SELECT * FROM streams WHERE id = ?",
         values: [streamId],
      });

      if (streams.length === 0) {
         return NextResponse.json(
            { error: "Stream not found" },
            { status: 404 }
         );
      }

      return NextResponse.json(streams[0]);
   } catch (error) {
      console.error("Error fetching stream:", error);
      return NextResponse.json(
         { error: "Failed to fetch stream" },
         { status: 500 }
      );
   }
}

// PUT update a stream (teachers only)
export async function PUT(
   req: NextRequest,
   { params }: { params: { id: string } }
) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const streamId = params.id;
      const { name, description } = await req.json();

      if (!name) {
         return NextResponse.json(
            { error: "Stream name is required" },
            { status: 400 }
         );
      }

      // Check if teacher owns this stream
      const teacherStreams = await executeQuery({
         query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
         values: [streamId, session.user.id],
      });

      if (teacherStreams.length === 0) {
         return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      await executeQuery({
         query: "UPDATE streams SET name = ?, description = ? WHERE id = ?",
         values: [name, description || "", streamId],
      });

      return NextResponse.json({ message: "Stream updated successfully" });
   } catch (error) {
      console.error("Error updating stream:", error);
      return NextResponse.json(
         { error: "Failed to update stream" },
         { status: 500 }
      );
   }
}

// DELETE a stream (teachers only)
export async function DELETE(
   req: NextRequest,
   { params }: { params: { id: string } }
) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const streamId = params.id;

      // Check if teacher owns this stream
      const teacherStreams = await executeQuery({
         query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
         values: [streamId, session.user.id],
      });

      if (teacherStreams.length === 0) {
         return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      await executeQuery({
         query: "DELETE FROM streams WHERE id = ?",
         values: [streamId],
      });

      return NextResponse.json({ message: "Stream deleted successfully" });
   } catch (error) {
      console.error("Error deleting stream:", error);
      return NextResponse.json(
         { error: "Failed to delete stream" },
         { status: 500 }
      );
   }
}
