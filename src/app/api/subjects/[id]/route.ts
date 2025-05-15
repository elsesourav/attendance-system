import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { executeQuery } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// GET a specific subject
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjectId = params.id;
    const userId = session.user.id;
    const role = session.user.role;
    
    // Get subject details
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
    
    return NextResponse.json(subject);
  } catch (error) {
    console.error("Error fetching subject:", error);
    return NextResponse.json(
      { error: "Failed to fetch subject" },
      { status: 500 }
    );
  }
}

// PUT update a subject (teachers only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'teacher') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjectId = params.id;
    const { name, description } = await req.json();
    
    if (!name) {
      return NextResponse.json(
        { error: "Subject name is required" },
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
    
    // Check if another subject with this name already exists in this stream
    const existingSubjects = await executeQuery({
      query: "SELECT * FROM subjects WHERE name = ? AND stream_id = ? AND id != ?",
      values: [name, streamId, subjectId],
    });
    
    if (existingSubjects.length > 0) {
      return NextResponse.json(
        { error: "Another subject with this name already exists in this stream" },
        { status: 400 }
      );
    }
    
    // Update subject
    await executeQuery({
      query: "UPDATE subjects SET name = ?, description = ? WHERE id = ?",
      values: [name, description || "", subjectId],
    });
    
    return NextResponse.json({ message: "Subject updated successfully" });
  } catch (error) {
    console.error("Error updating subject:", error);
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}

// DELETE a subject (teachers only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'teacher') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjectId = params.id;
    
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
    
    // Delete subject
    await executeQuery({
      query: "DELETE FROM subjects WHERE id = ?",
      values: [subjectId],
    });
    
    return NextResponse.json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}
