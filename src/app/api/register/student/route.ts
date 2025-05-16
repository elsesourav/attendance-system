import { NextRequest, NextResponse } from "next/server";
import { createStudent, getStudentByEmail, getStudentByRegistrationNumber } from "@/lib/models/student";

export async function POST(req: NextRequest) {
  try {
    const { name, email, mobile_number, registration_number, password } = await req.json();

    // Validate required fields
    if (!name || !email || !mobile_number || !registration_number || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingStudentByEmail = await getStudentByEmail(email);
    if (existingStudentByEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Check if registration number already exists
    const existingStudentByRegNumber = await getStudentByRegistrationNumber(registration_number);
    if (existingStudentByRegNumber) {
      return NextResponse.json(
        { error: "Registration number already exists" },
        { status: 409 }
      );
    }

    // Create new student
    const studentId = await createStudent({
      name,
      email,
      mobile_number,
      registration_number,
      password,
    });

    return NextResponse.json(
      { 
        message: "Student registered successfully",
        id: studentId 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering student:", error);
    return NextResponse.json(
      { error: "Failed to register student" },
      { status: 500 }
    );
  }
}
