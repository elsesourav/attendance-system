import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { executeQuery } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// GET students enrolled in a subject
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const subjectId = url.searchParams.get("subjectId");
    
    if (!subjectId) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const role = session.user.role;
    
    // Get subject details to check stream access
    const subjects = await executeQuery({
      query: "SELECT * FROM subjects WHERE id = ?",
      values: [subjectId],
    });
    
    if (subjects.length === 0) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
    
    const subject = subjects[0];
    const streamId = subject.stream_id;
    
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
    
    // Get enrolled students
    const enrollments = await executeQuery({
      query: `
        SELECT se.*, u.name, u.email, u.mobile_number, u.registration_number
        FROM subject_enrollments se
        JOIN users u ON se.student_id = u.id
        WHERE se.subject_id = ?
        ORDER BY u.name ASC
      `,
      values: [subjectId],
    });
    
    return NextResponse.json(enrollments);
  } catch (error) {
    console.error("Error fetching subject enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch subject enrollments" },
      { status: 500 }
    );
  }
}

// POST enroll a student in a subject (teachers only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'teacher') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subjectId, studentEmail } = await req.json();
    
    if (!subjectId || !studentEmail) {
      return NextResponse.json(
        { error: "Subject ID and student email are required" },
        { status: 400 }
      );
    }
    
    // Get subject details to check stream ownership
    const subjects = await executeQuery({
      query: "SELECT * FROM subjects WHERE id = ?",
      values: [subjectId],
    });
    
    if (subjects.length === 0) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
    
    const subject = subjects[0];
    const streamId = subject.stream_id;
    
    // Check if teacher owns this stream
    const teacherStreams = await executeQuery({
      query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
      values: [streamId, session.user.id],
    });
    
    if (teacherStreams.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Get student by email
    const students = await executeQuery({
      query: "SELECT * FROM users WHERE email = ? AND role = 'student'",
      values: [studentEmail],
    });
    
    if (students.length === 0) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }
    
    const student = students[0];
    const studentId = student.id;
    
    // Check if student is enrolled in the stream
    const streamEnrollments = await executeQuery({
      query: "SELECT * FROM enrollments WHERE stream_id = ? AND student_id = ?",
      values: [streamId, studentId],
    });
    
    if (streamEnrollments.length === 0) {
      // Enroll student in the stream first
      await executeQuery({
        query: "INSERT INTO enrollments (student_id, stream_id) VALUES (?, ?)",
        values: [studentId, streamId],
      });
    }
    
    // Check if student is already enrolled in this subject
    const subjectEnrollments = await executeQuery({
      query: "SELECT * FROM subject_enrollments WHERE subject_id = ? AND student_id = ?",
      values: [subjectId, studentId],
    });
    
    if (subjectEnrollments.length > 0) {
      return NextResponse.json(
        { error: "Student is already enrolled in this subject" },
        { status: 400 }
      );
    }
    
    // Enroll student in the subject
    await executeQuery({
      query: "INSERT INTO subject_enrollments (student_id, subject_id) VALUES (?, ?)",
      values: [studentId, subjectId],
    });
    
    return NextResponse.json({ message: "Student enrolled successfully" });
  } catch (error) {
    console.error("Error enrolling student:", error);
    return NextResponse.json(
      { error: "Failed to enroll student" },
      { status: 500 }
    );
  }
}

// DELETE remove a student from a subject (teachers only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'teacher') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const subjectId = url.searchParams.get("subjectId");
    const studentId = url.searchParams.get("studentId");
    
    if (!subjectId || !studentId) {
      return NextResponse.json(
        { error: "Subject ID and student ID are required" },
        { status: 400 }
      );
    }
    
    // Get subject details to check stream ownership
    const subjects = await executeQuery({
      query: "SELECT * FROM subjects WHERE id = ?",
      values: [subjectId],
    });
    
    if (subjects.length === 0) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
    
    const subject = subjects[0];
    const streamId = subject.stream_id;
    
    // Check if teacher owns this stream
    const teacherStreams = await executeQuery({
      query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
      values: [streamId, session.user.id],
    });
    
    if (teacherStreams.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Remove student from the subject
    await executeQuery({
      query: "DELETE FROM subject_enrollments WHERE subject_id = ? AND student_id = ?",
      values: [subjectId, studentId],
    });
    
    return NextResponse.json({ message: "Student removed from subject successfully" });
  } catch (error) {
    console.error("Error removing student from subject:", error);
    return NextResponse.json(
      { error: "Failed to remove student from subject" },
      { status: 500 }
    );
  }
}
