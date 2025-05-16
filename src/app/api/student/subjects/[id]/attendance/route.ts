import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import {
   getAttendanceByStudentAndSubject,
   getAttendanceStats,
} from "@/lib/models/attendance";
import { getSubjectById } from "@/lib/models/subject";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
   req: NextRequest,
   { params }: { params: { id: string } }
) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "student") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { id } = await params;

      const studentId = session.user.id;
      const subjectId = parseInt(id);
      const url = new URL(req.url);
      const limit = url.searchParams.get("limit")
         ? parseInt(url.searchParams.get("limit")!)
         : undefined;

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
      )) as any[];

      if (isEnrolled.length === 0) {
         return NextResponse.json(
            { error: "You are not enrolled in this subject" },
            { status: 403 }
         );
      }

      // Get attendance records
      let attendanceRecords = await getAttendanceByStudentAndSubject(
         Number(studentId),
         subjectId
      );

      // Sort by date (newest first)
      attendanceRecords.sort(
         (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Apply limit if specified
      if (limit && limit > 0) {
         attendanceRecords = attendanceRecords.slice(0, limit);
      }

      // Get attendance statistics
      const stats = await getAttendanceStats(Number(studentId), subjectId);

      return NextResponse.json({
         records: attendanceRecords,
         stats,
      });
   } catch (error) {
      console.error("Error fetching attendance records:", error);
      return NextResponse.json(
         { error: "Failed to fetch attendance records" },
         { status: 500 }
      );
   }
}
