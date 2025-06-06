import { authOptions } from "@/lib/auth";
import { getStreamById } from "@/lib/models/stream";
import { getSubjectById } from "@/lib/models/subject";
import {
   enrollStudentInSubject,
   getStudentsBySubjectId,
} from "@/lib/models/subjectEnrollment";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

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
      const subjectId = parseInt(id);

      // Get subject
      const subject = await getSubjectById(subjectId);
      if (!subject) {
         return NextResponse.json(
            { error: "Subject not found" },
            { status: 404 }
         );
      }

      // Verify teacher access
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

      // Get enrolled students
      const students = await getStudentsBySubjectId(subjectId);

      return NextResponse.json(students);
   } catch (error) {
      console.error("Error fetching enrolled students:", error);
      return NextResponse.json(
         { error: "Failed to fetch enrolled students" },
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
      const subjectId = parseInt(id);
      const { studentId } = await req.json();

      if (!studentId) {
         return NextResponse.json(
            { error: "Student ID is required" },
            { status: 400 }
         );
      }

      // Get subject
      const subject = await getSubjectById(subjectId);
      if (!subject) {
         return NextResponse.json(
            { error: "Subject not found" },
            { status: 404 }
         );
      }

      // Verify teacher access
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

      // Enroll student
      try {
         await enrollStudentInSubject(studentId, subjectId);
         return NextResponse.json({ success: true });
      } catch (enrollError) {
         const error = enrollError as Error;
         if (error.message === "Student is already enrolled in this subject") {
            return NextResponse.json(
               { error: "Student is already enrolled in this subject" },
               { status: 409 }
            );
         }
         throw enrollError;
      }
   } catch (error) {
      console.error("Error enrolling student:", error);
      return NextResponse.json(
         { error: "Failed to enroll student" },
         { status: 500 }
      );
   }
}
