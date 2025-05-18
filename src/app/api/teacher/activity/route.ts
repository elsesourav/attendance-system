import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

interface AttendanceActivity {
   id: number;
   date: string;
   status: string;
   student_name: string;
   subject_name: string;
   subject_id: number;
}

interface EnrollmentActivity {
   id: number;
   created_at: string;
   student_name: string;
   subject_name: string;
   subject_id: number;
}

interface SubjectActivity {
   id: number;
   name: string;
   created_at: string;
   stream_name: string;
   stream_id: number;
}

interface StreamActivity {
   id: number;
   name: string;
   created_at: string;
}

interface FormattedActivity {
   type: "attendance" | "enrollment" | "subject" | "stream";
   id: number;
   date: string;
   timestamp: number;
   description: string;
   link: string;
}

export async function GET(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const teacherId = session.user.id;

      // Get filters
      const url = new URL(req.url);
      const month = url.searchParams.get("month");
      const year = url.searchParams.get("year");
      const limit = url.searchParams.get("limit")
         ? parseInt(url.searchParams.get("limit")!)
         : 15;

      // Date filters
      let dateFilter = "";
      let dateParams: string[] = [];

      if (month && year) {
         // Month and year
         const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
         const endDate = new Date(parseInt(year), parseInt(month), 0);

         dateFilter = "AND (a.date BETWEEN ? AND ?)";
         dateParams = [
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0],
         ];
      } else if (year) {
         // Year only
         const startDate = new Date(parseInt(year), 0, 1);
         const endDate = new Date(parseInt(year), 11, 31);

         dateFilter = "AND (a.date BETWEEN ? AND ?)";
         dateParams = [
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0],
         ];
      }

      // Attendance records
      const attendanceActivity = (await executeQuery(
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
      )) as AttendanceActivity[];

      // Subject enrollments
      let enrollmentDateFilter = "";
      if (month && year) {
         enrollmentDateFilter = "AND (DATE(se.created_at) BETWEEN ? AND ?)";
      } else if (year) {
         enrollmentDateFilter = "AND (DATE(se.created_at) BETWEEN ? AND ?)";
      }

      const enrollmentActivity = (await executeQuery(
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
      )) as EnrollmentActivity[];

      // Created subjects
      let subjectDateFilter = "";
      if (month && year) {
         subjectDateFilter = "AND (DATE(sub.created_at) BETWEEN ? AND ?)";
      } else if (year) {
         subjectDateFilter = "AND (DATE(sub.created_at) BETWEEN ? AND ?)";
      }

      const subjectActivity = (await executeQuery(
         `SELECT sub.id, sub.name, sub.created_at, str.name as stream_name, str.id as stream_id
         FROM subjects sub
         JOIN streams str ON sub.stream_id = str.id
         WHERE str.teacher_id = ? ${subjectDateFilter}
         ORDER BY sub.created_at DESC
         LIMIT 50`,
         dateFilter ? [teacherId, ...dateParams] : [teacherId]
      )) as SubjectActivity[];

      // Created streams
      let streamDateFilter = "";
      if (month && year) {
         streamDateFilter = "AND (DATE(created_at) BETWEEN ? AND ?)";
      } else if (year) {
         streamDateFilter = "AND (DATE(created_at) BETWEEN ? AND ?)";
      }

      const streamActivity = (await executeQuery(
         `SELECT id, name, created_at
         FROM streams
         WHERE teacher_id = ? ${streamDateFilter}
         ORDER BY created_at DESC
         LIMIT 50`,
         dateFilter ? [teacherId, ...dateParams] : [teacherId]
      )) as StreamActivity[];

      // Format activities
      const allActivities: FormattedActivity[] = [
         ...attendanceActivity.map((item) => ({
            type: "attendance" as const,
            id: item.id,
            date: item.date,
            timestamp: new Date(item.date).getTime(),
            description: `Marked ${item.student_name} as ${item.status} in ${item.subject_name}`,
            link: `/teacher/subjects/${item.subject_id}/attendance`,
         })),
         ...enrollmentActivity.map((item) => ({
            type: "enrollment" as const,
            id: item.id,
            date: new Date(item.created_at).toISOString().split("T")[0],
            timestamp: new Date(item.created_at).getTime(),
            description: `Enrolled ${item.student_name} in ${item.subject_name}`,
            link: `/teacher/subjects/${item.subject_id}/students`,
         })),
         ...subjectActivity.map((item) => ({
            type: "subject" as const,
            id: item.id,
            date: new Date(item.created_at).toISOString().split("T")[0],
            timestamp: new Date(item.created_at).getTime(),
            description: `Created subject ${item.name} in ${item.stream_name}`,
            link: `/teacher/subjects/${item.id}`,
         })),
         ...streamActivity.map((item) => ({
            type: "stream" as const,
            id: item.id,
            date: new Date(item.created_at).toISOString().split("T")[0],
            timestamp: new Date(item.created_at).getTime(),
            description: `Created stream ${item.name}`,
            link: `/teacher/streams/${item.id}`,
         })),
      ];

      // Sort by time
      allActivities.sort((a, b) => b.timestamp - a.timestamp);

      return NextResponse.json(allActivities.slice(0, limit));
   } catch (error) {
      console.error("Error fetching teacher activity:", error);
      return NextResponse.json(
         { error: "Failed to fetch activity data" },
         { status: 500 }
      );
   }
}
