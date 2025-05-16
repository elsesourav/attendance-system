import { executeQuery } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

// This is a utility endpoint to create a test user
// DO NOT USE IN PRODUCTION - for debugging only
export async function POST(req: NextRequest) {
  try {
    // Create a test teacher user
    const teacherEmail = "test.teacher@example.com";
    const teacherPassword = "password123";
    const hashedTeacherPassword = await bcrypt.hash(teacherPassword, 10);

    // Check if user already exists
    const existingTeacher = await executeQuery<any[]>({
      query: "SELECT * FROM users WHERE email = ?",
      values: [teacherEmail],
    });

    let teacherId;

    if (existingTeacher.length > 0) {
      teacherId = existingTeacher[0].id;
      console.log("Test teacher already exists with ID:", teacherId);
    } else {
      // Create the teacher
      const teacherResult = await executeQuery<any>({
        query: "INSERT INTO users (name, email, mobile_number, password, role) VALUES (?, ?, ?, ?, ?)",
        values: ["Test Teacher", teacherEmail, "1234567890", hashedTeacherPassword, "teacher"],
      });
      teacherId = teacherResult.insertId;
      console.log("Created test teacher with ID:", teacherId);
    }

    // Create a test student user
    const studentEmail = "test.student@example.com";
    const studentPassword = "password123";
    const hashedStudentPassword = await bcrypt.hash(studentPassword, 10);

    // Check if user already exists
    const existingStudent = await executeQuery<any[]>({
      query: "SELECT * FROM users WHERE email = ?",
      values: [studentEmail],
    });

    let studentId;

    if (existingStudent.length > 0) {
      studentId = existingStudent[0].id;
      console.log("Test student already exists with ID:", studentId);
    } else {
      // Create the student
      const studentResult = await executeQuery<any>({
        query: "INSERT INTO users (name, email, mobile_number, registration_number, password, role) VALUES (?, ?, ?, ?, ?, ?)",
        values: ["Test Student", studentEmail, "0987654321", "TEST001", hashedStudentPassword, "student"],
      });
      studentId = studentResult.insertId;
      console.log("Created test student with ID:", studentId);
    }

    // Create a test stream
    let streamId;
    const existingStream = await executeQuery<any[]>({
      query: "SELECT * FROM streams WHERE name = ? AND teacher_id = ?",
      values: ["Test Stream", teacherId],
    });

    if (existingStream.length > 0) {
      streamId = existingStream[0].id;
      console.log("Test stream already exists with ID:", streamId);
    } else {
      const streamResult = await executeQuery<any>({
        query: "INSERT INTO streams (name, description, teacher_id) VALUES (?, ?, ?)",
        values: ["Test Stream", "A test stream for debugging", teacherId],
      });
      streamId = streamResult.insertId;
      console.log("Created test stream with ID:", streamId);
    }

    // Enroll the student in the stream
    const existingEnrollment = await executeQuery<any[]>({
      query: "SELECT * FROM enrollments WHERE student_id = ? AND stream_id = ?",
      values: [studentId, streamId],
    });

    if (existingEnrollment.length === 0) {
      await executeQuery({
        query: "INSERT INTO enrollments (student_id, stream_id) VALUES (?, ?)",
        values: [studentId, streamId],
      });
      console.log("Enrolled test student in test stream");
    } else {
      console.log("Test student already enrolled in test stream");
    }

    return NextResponse.json({
      status: "success",
      message: "Test users created successfully",
      teacher: {
        id: teacherId,
        email: teacherEmail,
        password: teacherPassword, // Only for testing!
      },
      student: {
        id: studentId,
        email: studentEmail,
        password: studentPassword, // Only for testing!
      },
      stream: {
        id: streamId,
        name: "Test Stream",
      },
    });
  } catch (error) {
    console.error("Error creating test users:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to create test users",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
