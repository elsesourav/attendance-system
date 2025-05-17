import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getSubjectById } from "@/lib/models/subject";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

interface SubjectEnrollment {
   id: number;
   student_id: number;
   subject_id: number;
   created_at: string;
}

interface StreamDetails {
   streamName: string;
   teacherName: string;
}

export async function GET(
   _req: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
   try {
      const id = (await params).id;
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "student") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const studentId = session.user.id;
      const subjectId = parseInt(id);

      // Get subject details
      const subject = await getSubjectById(subjectId);
      if (!subject) {
         return NextResponse.json(
            { error: "Subject not found" },
            { status: 404 }
         );
      }

      // Check if the student is enrolled in this subject
      const isEnrolled = (await executeQuery(
         "SELECT * FROM subject_enrollments WHERE student_id = ? AND subject_id = ?",
         [studentId, subjectId]
      )) as SubjectEnrollment[];

      if (isEnrolled.length === 0) {
         return NextResponse.json(
            { error: "You are not enrolled in this subject" },
            { status: 403 }
         );
      }

      // Get additional details
      const streamDetails = (await executeQuery(
         `SELECT s.name as streamName, t.name as teacherName
       FROM streams s
       JOIN teachers t ON s.teacher_id = t.id
       WHERE s.id = ?`,
         [subject.stream_id]
      )) as StreamDetails[];

      if (streamDetails.length === 0) {
         return NextResponse.json(
            { error: "Stream not found" },
            { status: 404 }
         );
      }

      return NextResponse.json({
         id: subject.id,
         name: subject.name,
         description: subject.description,
         streamId: subject.stream_id,
         streamName: streamDetails[0].streamName,
         teacherName: streamDetails[0].teacherName,
      });
   } catch (error) {
      console.error("Error fetching subject details:", error);
      return NextResponse.json(
         { error: "Failed to fetch subject details" },
         { status: 500 }
      );
   }
}
