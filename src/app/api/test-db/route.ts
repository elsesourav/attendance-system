import { executeQuery } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

// This is a test endpoint to verify database connection and user credentials
// DO NOT USE IN PRODUCTION - for debugging only
export async function GET(req: NextRequest) {
  try {
    // Test database connection
    const testQuery = await executeQuery<any[]>({
      query: "SELECT 1 as test",
      values: [],
    });

    // Get users table info
    const usersCount = await executeQuery<any[]>({
      query: "SELECT COUNT(*) as count FROM users",
      values: [],
    });

    // Get sample users (without passwords)
    const sampleUsers = await executeQuery<any[]>({
      query: "SELECT id, name, email, role FROM users LIMIT 5",
      values: [],
    });

    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      testQuery,
      usersCount: usersCount[0].count,
      sampleUsers,
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Test user authentication
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { status: "error", message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const users = await executeQuery<any[]>({
      query: "SELECT * FROM users WHERE email = ?",
      values: [email],
    });

    if (users.length === 0) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    const user = users[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { status: "error", message: "Invalid password" },
        { status: 401 }
      );
    }

    // Return user info (without password)
    const { password: _, ...userInfo } = user;

    return NextResponse.json({
      status: "success",
      message: "Authentication successful",
      user: userInfo,
    });
  } catch (error) {
    console.error("Authentication test error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Authentication test failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
