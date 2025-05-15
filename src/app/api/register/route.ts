import { executeQuery } from "@/lib/db";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
   try {
      const { name, email, mobileNumber, registrationNumber, password, role } =
         await req.json();

      // Basic validation
      if (!name || !email || !mobileNumber || !password || !role) {
         return NextResponse.json(
            { error: "All required fields must be filled" },
            { status: 400 }
         );
      }

      // Role validation
      if (role !== "student" && role !== "teacher") {
         return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      // Student-specific validation
      if (role === "student" && !registrationNumber) {
         return NextResponse.json(
            { error: "Registration number is required for students" },
            { status: 400 }
         );
      }

      // Check if user already exists by email
      const existingUsersByEmail = await executeQuery({
         query: "SELECT * FROM users WHERE email = ?",
         values: [email],
      });

      if (existingUsersByEmail.length > 0) {
         return NextResponse.json(
            { error: "User with this email already exists" },
            { status: 400 }
         );
      }

      // Check if student with this registration number already exists
      if (role === "student" && registrationNumber) {
         const existingStudents = await executeQuery({
            query: "SELECT * FROM users WHERE registration_number = ? AND role = 'student'",
            values: [registrationNumber],
         });

         if (existingStudents.length > 0) {
            return NextResponse.json(
               {
                  error: "Student with this registration number already exists",
               },
               { status: 400 }
            );
         }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with appropriate fields
      if (role === "student") {
         await executeQuery({
            query: "INSERT INTO users (name, email, mobile_number, registration_number, password, role) VALUES (?, ?, ?, ?, ?, ?)",
            values: [
               name,
               email,
               mobileNumber,
               registrationNumber,
               hashedPassword,
               role,
            ],
         });
      } else {
         await executeQuery({
            query: "INSERT INTO users (name, email, mobile_number, password, role) VALUES (?, ?, ?, ?, ?)",
            values: [name, email, mobileNumber, hashedPassword, role],
         });
      }

      return NextResponse.json(
         { message: "User registered successfully" },
         { status: 201 }
      );
   } catch (error) {
      console.error("Error registering user:", error);
      return NextResponse.json(
         { error: "Failed to register user" },
         { status: 500 }
      );
   }
}
