import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

// GET attendance records
export async function GET(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const url = new URL(req.url);
      const streamId = url.searchParams.get("streamId");
      const date = url.searchParams.get("date");
      const studentId = url.searchParams.get("studentId");

      if (!streamId) {
         return NextResponse.json(
            { error: "Stream ID is required" },
            { status: 400 }
         );
      }

      const userId = session.user.id;
      const role = session.user.role;

      // Check if user has access to this stream
      let hasAccess = false;

      if (role === "teacher") {
         // First try with the session user ID
         const teacherStreams = await executeQuery({
            query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
            values: [streamId, userId],
         });

         if (teacherStreams.length > 0) {
            hasAccess = true;
         } else {
            // If not found, try to find the teacher by email
            const teacherEmail = session.user.email;
            console.log("Checking teacher access by email:", teacherEmail);

            const teacherByEmail = await executeQuery({
               query: "SELECT * FROM users WHERE email = ? AND role = 'teacher'",
               values: [teacherEmail],
            });

            if (teacherByEmail.length > 0) {
               const dbTeacherId = teacherByEmail[0].id;
               console.log("Found teacher by email with ID:", dbTeacherId);

               const teacherStreamsByEmail = await executeQuery({
                  query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
                  values: [streamId, dbTeacherId],
               });

               hasAccess = teacherStreamsByEmail.length > 0;
            }
         }
      } else if (role === "student") {
         const studentEnrollments = await executeQuery({
            query: "SELECT * FROM enrollments WHERE stream_id = ? AND student_id = ?",
            values: [streamId, userId],
         });
         hasAccess = studentEnrollments.length > 0;
      }

      if (!hasAccess) {
         return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Build query based on parameters
      let query = `
      SELECT a.*, u.name as student_name, u.email as student_email, u.mobile_number, u.registration_number
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      WHERE a.stream_id = ?
    `;

      console.log("Attendance query:", query);

      const queryParams: any[] = [streamId];

      // Check for subject_id parameter
      const subjectId = url.searchParams.get("subjectId");
      console.log("Subject ID:", subjectId);

      if (subjectId) {
         query += " AND a.subject_id = ?";
         queryParams.push(subjectId);
      }

      if (date) {
         query += " AND a.date = ?";
         queryParams.push(date);
      }

      if (studentId) {
         query += " AND a.student_id = ?";
         queryParams.push(studentId);
      }

      // For students, only show their own attendance
      if (role === "student") {
         query += " AND a.student_id = ?";
         queryParams.push(userId);
      }

      query += " ORDER BY a.date DESC, u.name ASC";

      console.log("Final attendance query:", query);
      console.log("Query params:", queryParams);

      // First check if there are any students enrolled in this stream
      const enrolledStudents = await executeQuery<any[]>({
         query: "SELECT * FROM enrollments WHERE stream_id = ?",
         values: [streamId],
      });

      console.log("Enrolled students in stream:", enrolledStudents);

      // Check if there are any attendance records at all for this stream
      const allStreamAttendance = await executeQuery<any[]>({
         query: "SELECT * FROM attendance WHERE stream_id = ?",
         values: [streamId],
      });

      console.log("All attendance records for stream:", allStreamAttendance);

      const attendance = await executeQuery<any[]>({
         query,
         values: queryParams,
      });

      console.log("Attendance records for query:", attendance);

      // If no attendance records found, check if there are students enrolled
      if (attendance.length === 0) {
         // If there are enrolled students but no attendance records, return an empty array with a message
         if (enrolledStudents.length > 0) {
            return NextResponse.json({
               records: [],
               message:
                  "No attendance records found for the selected date and stream",
               enrolledStudents: enrolledStudents.length,
               hasAttendanceRecords: allStreamAttendance.length > 0,
            });
         }
      }

      return NextResponse.json(attendance);
   } catch (error) {
      console.error("Error fetching attendance:", error);
      return NextResponse.json(
         { error: "Failed to fetch attendance" },
         { status: 500 }
      );
   }
}

// POST record attendance (teachers only)
export async function POST(req: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { streamId, subjectId, studentId, date, status } = await req.json();

      console.log("Attendance API received:", {
         streamId,
         subjectId,
         studentId,
         date,
         status,
      });

      if (!streamId || !studentId || !date || !status) {
         return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
         );
      }

      // If subjectId is provided, verify it exists and belongs to the stream
      if (subjectId) {
         const subjects = await executeQuery({
            query: "SELECT * FROM subjects WHERE id = ? AND stream_id = ?",
            values: [subjectId, streamId],
         });

         if (subjects.length === 0) {
            return NextResponse.json(
               { error: "Subject not found or does not belong to this stream" },
               { status: 400 }
            );
         }
      }

      // Check if teacher owns this stream
      let hasAccess = false;

      // First try with the session user ID
      const teacherStreams = await executeQuery({
         query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
         values: [streamId, session.user.id],
      });

      if (teacherStreams.length > 0) {
         hasAccess = true;
      } else {
         // If not found, try to find the teacher by email
         const teacherEmail = session.user.email;
         console.log("Checking teacher access by email:", teacherEmail);

         const teacherByEmail = await executeQuery({
            query: "SELECT * FROM users WHERE email = ? AND role = 'teacher'",
            values: [teacherEmail],
         });

         if (teacherByEmail.length > 0) {
            const dbTeacherId = teacherByEmail[0].id;
            console.log("Found teacher by email with ID:", dbTeacherId);

            const teacherStreamsByEmail = await executeQuery({
               query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
               values: [streamId, dbTeacherId],
            });

            hasAccess = teacherStreamsByEmail.length > 0;
         }
      }

      if (!hasAccess) {
         return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Check if student is enrolled in this stream
      console.log(
         "Checking enrollment for student:",
         studentId,
         "in stream:",
         streamId
      );

      // First, let's check what enrollments exist for this stream
      const allStreamEnrollments = await executeQuery({
         query: "SELECT * FROM enrollments WHERE stream_id = ?",
         values: [streamId],
      });
      console.log("All enrollments for this stream:", allStreamEnrollments);

      // Get the user ID for this student
      const userQuery = await executeQuery({
         query: "SELECT id FROM users WHERE id = ?",
         values: [studentId],
      });

      console.log("User query result:", userQuery);

      if (userQuery.length === 0) {
         return NextResponse.json(
            { error: "Student not found" },
            { status: 400 }
         );
      }

      const userId = userQuery[0].id;

      const enrollments = await executeQuery({
         query: "SELECT * FROM enrollments WHERE stream_id = ? AND student_id = ?",
         values: [streamId, userId],
      });

      console.log("Enrollment check:", {
         enrollments,
         query: "SELECT * FROM enrollments WHERE stream_id = ? AND student_id = ?",
         values: [streamId, userId],
      });

      if (enrollments.length === 0) {
         return NextResponse.json(
            { error: "Student is not enrolled in this stream" },
            { status: 400 }
         );
      }

      // Insert or update attendance record
      if (subjectId) {
         // Subject-specific attendance
         await executeQuery({
            query: `
            INSERT INTO attendance (student_id, stream_id, subject_id, date, status)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status = ?
         `,
            values: [userId, streamId, subjectId, date, status, status],
         });
      } else {
         // Stream-level attendance (no specific subject)
         await executeQuery({
            query: `
            INSERT INTO attendance (student_id, stream_id, date, status)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status = ?
         `,
            values: [userId, streamId, date, status, status],
         });
      }

      return NextResponse.json({ message: "Attendance recorded successfully" });
   } catch (error) {
      console.error("Error recording attendance:", error);
      return NextResponse.json(
         { error: "Failed to record attendance" },
         { status: 500 }
      );
   }
}
