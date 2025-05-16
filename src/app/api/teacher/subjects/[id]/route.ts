import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getStreamById } from "@/lib/models/stream";
import {
   deleteSubject,
   getSubjectById,
   updateSubject,
} from "@/lib/models/subject";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
   req: NextRequest,
   { params }: { params: { id: string } }
) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;
      // Convert params.id to number after ensuring it's available
      const { id } = await params;
      const subjectId = parseInt(id);

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

      // Get student count for this subject
      const studentCountResult = (await executeQuery(
         `SELECT COUNT(*) as count
       FROM subject_enrollments
       WHERE subject_id = ?`,
         [subjectId]
      )) as [{ count: number }];

      const studentCount = studentCountResult[0]?.count || 0;

      return NextResponse.json({
         ...subject,
         studentCount,
         streamName: stream.name,
      });
   } catch (error) {
      console.error("Error fetching subject:", error);
      return NextResponse.json(
         { error: "Failed to fetch subject" },
         { status: 500 }
      );
   }
}

export async function PUT(
   req: NextRequest,
   { params }: { params: { id: string } }
) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;
      // Convert params.id to number after ensuring it's available
      const { id } = await params;
      const subjectId = parseInt(id);
      const { name, description } = await req.json();

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

      if (!name) {
         return NextResponse.json(
            { error: "Subject name is required" },
            { status: 400 }
         );
      }

      // Update the subject
      const updated = await updateSubject(subjectId, { name, description });

      if (!updated) {
         return NextResponse.json(
            { error: "Failed to update subject" },
            { status: 500 }
         );
      }

      return NextResponse.json({ id: subjectId, name, description });
   } catch (error) {
      console.error("Error updating subject:", error);
      return NextResponse.json(
         { error: "Failed to update subject" },
         { status: 500 }
      );
   }
}

export async function DELETE(
   req: NextRequest,
   { params }: { params: { id: string } }
) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;
      // Convert params.id to number after ensuring it's available
      const { id } = await params;
      const subjectId = parseInt(id);

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

      // Delete the subject
      const deleted = await deleteSubject(subjectId);

      if (!deleted) {
         return NextResponse.json(
            { error: "Failed to delete subject" },
            { status: 500 }
         );
      }

      return NextResponse.json({ success: true });
   } catch (error) {
      console.error("Error deleting subject:", error);
      return NextResponse.json(
         { error: "Failed to delete subject" },
         { status: 500 }
      );
   }
}
