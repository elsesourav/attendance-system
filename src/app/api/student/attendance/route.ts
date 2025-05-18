import { authOptions } from "@/lib/auth";
import { getAttendanceByStudentId } from "@/lib/models/attendance";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "student") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const studentId = session.user.id;
      const url = new URL(req.url);

      // Get filters
      const month = url.searchParams.get("month");
      const year = url.searchParams.get("year");
      const limit = url.searchParams.get("limit")
         ? parseInt(url.searchParams.get("limit")!)
         : undefined;

      // Get records
      let attendanceRecords = await getAttendanceByStudentId(Number(studentId));

      // Apply filters
      if (month && year) {
         const monthNum = parseInt(month);
         const yearNum = parseInt(year);

         attendanceRecords = attendanceRecords.filter((record) => {
            const recordDate = new Date(record.date);
            return (
               recordDate.getMonth() + 1 === monthNum &&
               recordDate.getFullYear() === yearNum
            );
         });
      } else if (year) {
         const yearNum = parseInt(year);

         attendanceRecords = attendanceRecords.filter((record) => {
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === yearNum;
         });
      }

      // Sort by date
      attendanceRecords.sort(
         (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Apply limit
      if (limit && limit > 0) {
         attendanceRecords = attendanceRecords.slice(0, limit);
      }

      // Calculate stats
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
