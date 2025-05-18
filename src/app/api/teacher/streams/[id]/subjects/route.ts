import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getStreamById } from "@/lib/models/stream";
import { createSubject } from "@/lib/models/subject";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

interface Subject {
   id: number;
   name: string;
   description: string | null;
}

export async function GET(
   _req: NextRequest,
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

      // Verify teacher access
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

      // Get subjects
      const subjects = await executeQuery(
         `SELECT id, name, description
       FROM subjects
       WHERE stream_id = ?
       ORDER BY name ASC`,
         [streamId]
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

export async function POST(
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

      // Verify teacher access
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
            { error: "Subject name is required" },
            { status: 400 }
         );
      }

      // Create subject
      const subjectId = await createSubject({
         name,
         description,
         stream_id: streamId,
      });

      // Get created subject
      const subjects = (await executeQuery(
         "SELECT id, name, description FROM subjects WHERE id = ?",
         [subjectId]
      )) as Subject[];

      return NextResponse.json(subjects[0], { status: 201 });
   } catch (error) {
      console.error("Error creating subject:", error);
      return NextResponse.json(
         { error: "Failed to create subject" },
         { status: 500 }
      );
   }
}
