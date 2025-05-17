import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
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

      if (!id || id === "undefined") {
         return NextResponse.json(
            { error: "Stream ID is required" },
            { status: 400 }
         );
      }

      const studentId = session.user.id;
      const streamId = parseInt(id);
      const url = new URL(req.url);

      // Parse query parameters for filtering
      const month = url.searchParams.get("month");
      const year = url.searchParams.get("year");
      const limit = url.searchParams.get("limit")
         ? parseInt(url.searchParams.get("limit")!)
         : undefined;

      // Check if the student is enrolled in any subject of this stream
      const enrollmentCheck = (await executeQuery(
         `SELECT COUNT(*) as count
         FROM subject_enrollments se
         JOIN subjects s ON se.subject_id = s.id
         WHERE se.student_id = ? AND s.stream_id = ?`,
         [studentId, streamId]
      )) as [{ count: number }];

      if (enrollmentCheck[0].count === 0) {
         return NextResponse.json(
            { error: "You are not enrolled in any subject of this stream" },
            { status: 403 }
         );
      }

      // Get stream details
      const streams = (await executeQuery(
         `SELECT s.id, s.name, s.description, t.name as teacherName
         FROM streams s
         JOIN teachers t ON s.teacher_id = t.id
         WHERE s.id = ?`,
         [streamId]
      )) as any[];

      if (streams.length === 0) {
         return NextResponse.json(
            { error: "Stream not found" },
            { status: 404 }
         );
      }

      // Build the query for attendance records
      let query = `
         SELECT a.id, a.student_id, a.subject_id, a.status, a.date, sub.name as subject_name
         FROM attendance a
         JOIN subjects sub ON a.subject_id = sub.id
         WHERE a.student_id = ? AND sub.stream_id = ?
    `;

      const queryParams: any[] = [studentId, streamId];

      // Filter by month and year if provided
      if (month && year) {
         query += " AND MONTH(a.date) = ? AND YEAR(a.date) = ?";
         queryParams.push(parseInt(month), parseInt(year));
      } else if (year) {
         query += " AND YEAR(a.date) = ?";
         queryParams.push(parseInt(year));
      }

      // Get attendance records
      let attendanceRecords = (await executeQuery(query, queryParams)) as any[];

      // Sort by date (newest first)
      attendanceRecords.sort(
         (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Apply limit if specified
      if (limit && limit > 0) {
         attendanceRecords = attendanceRecords.slice(0, limit);
      }

      // Calculate attendance statistics
      const stats = {
         total: attendanceRecords.length,
         present: attendanceRecords.filter(
            (record) => record.status === "present"
         ).length,
         absent: attendanceRecords.filter(
            (record) => record.status === "absent"
         ).length,
         late: attendanceRecords.filter((record) => record.status === "late")
            .length,
         percentage: 0,
      };

      stats.percentage =
         stats.total > 0
            ? Math.round(((stats.present + stats.late) / stats.total) * 100)
            : 0;

      // Get subjects in this stream that the student is enrolled in
      const subjects = await executeQuery(
         `SELECT s.id, s.name, s.description
         FROM subjects s
         JOIN subject_enrollments se ON s.id = se.subject_id
         WHERE s.stream_id = ? AND se.student_id = ?
         ORDER BY s.name ASC`,
         [streamId, studentId]
      );

      return NextResponse.json({
         stream: streams[0],
         subjects,
         records: attendanceRecords,
         stats,
      });
   } catch (error) {
      console.error("Error fetching stream attendance:", error);
      return NextResponse.json(
         { error: "Failed to fetch attendance records" },
         { status: 500 }
      );
   }
}
