import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { markAttendance } from "@/lib/models/attendance";
import { getStreamById } from "@/lib/models/stream";
import { getSubjectById } from "@/lib/models/subject";
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
      const url = new URL(req.url);
      const page = url.searchParams.get("page")
         ? parseInt(url.searchParams.get("page")!)
         : 1;
      const pageSize = url.searchParams.get("pageSize")
         ? parseInt(url.searchParams.get("pageSize")!)
         : 50;
      const date = url.searchParams.get("date");
      const month = url.searchParams.get("month");
      const year = url.searchParams.get("year");

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

      // Build the query based on parameters
      let query = `
      SELECT a.id, a.student_id, s.name as student_name, s.registration_number, a.status, a.date
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.subject_id = ?
    `;

      const queryParams: any[] = [subjectId];

      // Filter by specific date if provided
      if (date) {
         query += " AND a.date = ?";
         queryParams.push(date);
      }
      // Filter by month and year if provided
      else if (month && year) {
         query += " AND MONTH(a.date) = ? AND YEAR(a.date) = ?";
         queryParams.push(month, year);
      }
      // Filter by year only if provided
      else if (year) {
         query += " AND YEAR(a.date) = ?";
         queryParams.push(year);
      }

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
      const countResult = (await executeQuery(countQuery, queryParams)) as [
         { total: number }
      ];
      const total = countResult[0].total;

      // Add sorting
      query += " ORDER BY a.date DESC, s.name ASC";

      // Add pagination
      const offset = (page - 1) * pageSize;
      query += ` LIMIT ${pageSize} OFFSET ${offset}`;

      // Execute the main query
      const attendanceRecords = await executeQuery(query, queryParams);

      // Return records with pagination metadata
      return NextResponse.json({
         records: attendanceRecords,
         pagination: {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
         },
      });
   } catch (error) {
      console.error("Error fetching attendance records:", error);
      return NextResponse.json(
         { error: "Failed to fetch attendance records" },
         { status: 500 }
      );
   }
}

export async function POST(
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
      const { id } = params;
      const subjectId = parseInt(id);
      const { date, records } = await req.json();

      if (
         !date ||
         !records ||
         !Array.isArray(records) ||
         records.length === 0
      ) {
         return NextResponse.json(
            { error: "Invalid attendance data" },
            { status: 400 }
         );
      }

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

      // Mark attendance for each student
      for (const record of records) {
         await markAttendance(
            record.student_id,
            subjectId,
            record.status,
            date
         );
      }

      return NextResponse.json({ success: true });
   } catch (error) {
      console.error("Error marking attendance:", error);
      return NextResponse.json(
         { error: "Failed to mark attendance" },
         { status: 500 }
      );
   }
}
