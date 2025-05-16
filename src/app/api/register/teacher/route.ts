import { NextRequest, NextResponse } from "next/server";
import { createTeacher, getTeacherByEmail } from "@/lib/models/teacher";

export async function POST(req: NextRequest) {
  try {
    const { name, email, mobile_number, password } = await req.json();

    // Validate required fields
    if (!name || !email || !mobile_number || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingTeacher = await getTeacherByEmail(email);
    if (existingTeacher) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Create new teacher
    const teacherId = await createTeacher({
      name,
      email,
      mobile_number,
      password,
    });

    return NextResponse.json(
      { 
        message: "Teacher registered successfully",
        id: teacherId 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering teacher:", error);
    return NextResponse.json(
      { error: "Failed to register teacher" },
      { status: 500 }
    );
  }
}
