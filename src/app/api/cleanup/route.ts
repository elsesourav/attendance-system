import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { executeQuery } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// POST cleanup old data (teachers only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'teacher') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, beforeDate, streamId, subjectId } = await req.json();
    
    if (!type || !beforeDate) {
      return NextResponse.json(
        { error: "Type and date are required" },
        { status: 400 }
      );
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(beforeDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    let deletedCount = 0;
    
    switch (type) {
      case 'attendance':
        // Delete attendance records before the specified date
        if (!streamId) {
          return NextResponse.json(
            { error: "Stream ID is required for attendance cleanup" },
            { status: 400 }
          );
        }
        
        // Check if teacher owns this stream
        const teacherStreams = await executeQuery({
          query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
          values: [streamId, userId],
        });
        
        if (teacherStreams.length === 0) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        
        // Delete attendance records
        let query = "DELETE FROM attendance WHERE stream_id = ? AND date < ?";
        const queryParams: any[] = [streamId, beforeDate];
        
        // If subject ID is provided, only delete attendance for that subject
        if (subjectId) {
          query += " AND subject_id = ?";
          queryParams.push(subjectId);
        }
        
        const result = await executeQuery({
          query,
          values: queryParams,
        });
        
        deletedCount = result.affectedRows;
        break;
        
      case 'subjects':
        // Delete subjects that haven't been used for attendance since the specified date
        if (!streamId) {
          return NextResponse.json(
            { error: "Stream ID is required for subjects cleanup" },
            { status: 400 }
          );
        }
        
        // Check if teacher owns this stream
        const teacherStreamsForSubjects = await executeQuery({
          query: "SELECT * FROM streams WHERE id = ? AND teacher_id = ?",
          values: [streamId, userId],
        });
        
        if (teacherStreamsForSubjects.length === 0) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        
        // Find subjects that haven't been used for attendance since the specified date
        const unusedSubjects = await executeQuery({
          query: `
            SELECT s.id 
            FROM subjects s
            LEFT JOIN attendance a ON s.id = a.subject_id AND a.date >= ?
            WHERE s.stream_id = ? AND a.id IS NULL
          `,
          values: [beforeDate, streamId],
        });
        
        if (unusedSubjects.length === 0) {
          return NextResponse.json({ 
            message: "No unused subjects found to delete",
            deletedCount: 0
          });
        }
        
        // Extract subject IDs
        const subjectIds = unusedSubjects.map((subject: any) => subject.id);
        
        // Delete unused subjects
        const deleteResult = await executeQuery({
          query: `DELETE FROM subjects WHERE id IN (?)`,
          values: [subjectIds],
        });
        
        deletedCount = deleteResult.affectedRows;
        break;
        
      case 'inactive_students':
        // Delete students who haven't attended any classes since the specified date
        // Only teachers can delete students from their own streams
        
        // Find inactive students in teacher's streams
        const inactiveStudents = await executeQuery({
          query: `
            SELECT DISTINCT e.student_id
            FROM enrollments e
            JOIN streams s ON e.stream_id = s.id
            LEFT JOIN attendance a ON e.student_id = a.student_id AND a.date >= ?
            WHERE s.teacher_id = ? AND a.id IS NULL
          `,
          values: [beforeDate, userId],
        });
        
        if (inactiveStudents.length === 0) {
          return NextResponse.json({ 
            message: "No inactive students found to delete",
            deletedCount: 0
          });
        }
        
        // Extract student IDs
        const studentIds = inactiveStudents.map((student: any) => student.student_id);
        
        // Delete inactive students
        const deleteStudentsResult = await executeQuery({
          query: `DELETE FROM users WHERE id IN (?) AND role = 'student'`,
          values: [studentIds],
        });
        
        deletedCount = deleteStudentsResult.affectedRows;
        break;
        
      default:
        return NextResponse.json(
          { error: "Invalid cleanup type. Use 'attendance', 'subjects', or 'inactive_students'" },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ 
      message: `${deletedCount} ${type} records deleted successfully`,
      deletedCount
    });
  } catch (error) {
    console.error("Error cleaning up data:", error);
    return NextResponse.json(
      { error: "Failed to clean up data" },
      { status: 500 }
    );
  }
}
