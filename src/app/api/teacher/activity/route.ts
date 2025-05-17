import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;

      // Get month and year filters from query parameters
      const url = new URL(req.url);
      const month = url.searchParams.get("month");
      const year = url.searchParams.get("year");

      // Create date filter conditions
      let dateFilter = "";
      let dateParams: any[] = [];

      if (month && year) {
         // Filter by specific month and year
         const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
         const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month

         dateFilter = "AND (a.date BETWEEN ? AND ?)";
         dateParams = [
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0],
         ];
      } else if (year) {
         // Filter by year only
         const startDate = new Date(parseInt(year), 0, 1);
         const endDate = new Date(parseInt(year), 11, 31);

         dateFilter = "AND (a.date BETWEEN ? AND ?)";
         dateParams = [
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0],
         ];
      }

      // Get recent attendance records taken by this teacher
      const attendanceActivity = await executeQuery(
         `SELECT a.id, a.date, a.status, s.name as student_name,
              sub.name as subject_name, sub.id as subject_id
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN subjects sub ON a.subject_id = sub.id
       JOIN streams str ON sub.stream_id = str.id
       WHERE str.teacher_id = ? ${dateFilter}
       ORDER BY a.created_at DESC
       LIMIT 50`,
         [teacherId, ...dateParams]
      );

      // Get recent subject enrollments for subjects taught by this teacher
      let enrollmentDateFilter = "";
      if (month && year) {
         enrollmentDateFilter = "AND (DATE(se.created_at) BETWEEN ? AND ?)";
      } else if (year) {
         enrollmentDateFilter = "AND (DATE(se.created_at) BETWEEN ? AND ?)";
      }

      const enrollmentActivity = await executeQuery(
         `SELECT se.id, se.created_at, s.name as student_name,
              sub.name as subject_name, sub.id as subject_id
       FROM subject_enrollments se
       JOIN students s ON se.student_id = s.id
       JOIN subjects sub ON se.subject_id = sub.id
       JOIN streams str ON sub.stream_id = str.id
       WHERE str.teacher_id = ? ${enrollmentDateFilter}
       ORDER BY se.created_at DESC
       LIMIT 50`,
         dateFilter ? [teacherId, ...dateParams] : [teacherId]
      );

      // Get recently created subjects by this teacher
      let subjectDateFilter = "";
      if (month && year) {
         subjectDateFilter = "AND (DATE(sub.created_at) BETWEEN ? AND ?)";
      } else if (year) {
         subjectDateFilter = "AND (DATE(sub.created_at) BETWEEN ? AND ?)";
      }

      const subjectActivity = await executeQuery(
         `SELECT sub.id, sub.name, sub.created_at, str.name as stream_name, str.id as stream_id
       FROM subjects sub
       JOIN streams str ON sub.stream_id = str.id
       WHERE str.teacher_id = ? ${subjectDateFilter}
       ORDER BY sub.created_at DESC
       LIMIT 50`,
         dateFilter ? [teacherId, ...dateParams] : [teacherId]
      );

      // Get recently created streams by this teacher
      let streamDateFilter = "";
      if (month && year) {
         streamDateFilter = "AND (DATE(created_at) BETWEEN ? AND ?)";
      } else if (year) {
         streamDateFilter = "AND (DATE(created_at) BETWEEN ? AND ?)";
      }

      const streamActivity = await executeQuery(
         `SELECT id, name, created_at
       FROM streams
       WHERE teacher_id = ? ${streamDateFilter}
       ORDER BY created_at DESC
       LIMIT 50`,
         dateFilter ? [teacherId, ...dateParams] : [teacherId]
      );

      // Combine and format all activities
      const allActivities = [
         ...attendanceActivity.map((item: any) => ({
            type: "attendance",
            id: item.id,
            date: item.date,
            timestamp: new Date(item.date).getTime(),
            description: `Marked ${item.student_name} as ${item.status} in ${item.subject_name}`,
            link: `/teacher/subjects/${item.subject_id}/attendance`,
         })),
         ...enrollmentActivity.map((item: any) => ({
            type: "enrollment",
            id: item.id,
            date: new Date(item.created_at).toISOString().split("T")[0],
            timestamp: new Date(item.created_at).getTime(),
            description: `Enrolled ${item.student_name} in ${item.subject_name}`,
            link: `/teacher/subjects/${item.subject_id}/students`,
         })),
         ...subjectActivity.map((item: any) => ({
            type: "subject",
            id: item.id,
            date: new Date(item.created_at).toISOString().split("T")[0],
            timestamp: new Date(item.created_at).getTime(),
            description: `Created subject ${item.name} in ${item.stream_name}`,
            link: `/teacher/subjects/${item.id}`,
         })),
         ...streamActivity.map((item: any) => ({
            type: "stream",
            id: item.id,
            date: new Date(item.created_at).toISOString().split("T")[0],
            timestamp: new Date(item.created_at).getTime(),
            description: `Created stream ${item.name}`,
            link: `/teacher/streams/${item.id}`,
         })),
      ];

      // Sort by timestamp (most recent first)
      allActivities.sort((a, b) => b.timestamp - a.timestamp);

      // Return the 15 most recent activities
      return NextResponse.json(allActivities.slice(0, 15));
   } catch (error) {
      console.error("Error fetching teacher activity:", error);
      return NextResponse.json(
         { error: "Failed to fetch activity data" },
         { status: 500 }
      );
   }
}
