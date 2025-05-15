import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { executeQuery } from "@/lib/db";

// GET attendance records
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
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
    
    if (role === 'teacher') {
      const teacherStreams = await executeQuery({
        query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
        values: [streamId, userId],
      });
      hasAccess = teacherStreams.length > 0;
    } else if (role === 'student') {
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
      SELECT a.*, u.name as student_name, u.email as student_email
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      WHERE a.stream_id = ?
    `;
    
    const queryParams: any[] = [streamId];
    
    if (date) {
      query += " AND a.date = ?";
      queryParams.push(date);
    }
    
    if (studentId) {
      query += " AND a.student_id = ?";
      queryParams.push(studentId);
    }
    
    // For students, only show their own attendance
    if (role === 'student') {
      query += " AND a.student_id = ?";
      queryParams.push(userId);
    }
    
    query += " ORDER BY a.date DESC, u.name ASC";
    
    const attendance = await executeQuery({
      query,
      values: queryParams,
    });

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
    const session = await getServerSession();
    
    if (!session || !session.user || session.user.role !== 'teacher') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { streamId, studentId, date, status } = await req.json();
    
    if (!streamId || !studentId || !date || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if teacher owns this stream
    const teacherStreams = await executeQuery({
      query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
      values: [streamId, session.user.id],
    });
    
    if (teacherStreams.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if student is enrolled in this stream
    const enrollments = await executeQuery({
      query: "SELECT * FROM enrollments WHERE stream_id = ? AND student_id = ?",
      values: [streamId, studentId],
    });
    
    if (enrollments.length === 0) {
      return NextResponse.json(
        { error: "Student is not enrolled in this stream" },
        { status: 400 }
      );
    }

    // Insert or update attendance record
    await executeQuery({
      query: `
        INSERT INTO attendance (student_id, stream_id, date, status)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status = ?
      `,
      values: [studentId, streamId, date, status, status],
    });

    return NextResponse.json({ message: "Attendance recorded successfully" });
  } catch (error) {
    console.error("Error recording attendance:", error);
    return NextResponse.json(
      { error: "Failed to record attendance" },
      { status: 500 }
    );
  }
}
