import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { executeQuery } from "@/lib/db";

// GET all streams for a teacher
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;
    
    let streams;
    
    if (role === 'teacher') {
      // Get streams created by this teacher
      streams = await executeQuery({
        query: "SELECT * FROM streams WHERE teacher_id = ?",
        values: [userId],
      });
    } else if (role === 'student') {
      // Get streams the student is enrolled in
      streams = await executeQuery({
        query: `
          SELECT s.* 
          FROM streams s
          JOIN enrollments e ON s.id = e.stream_id
          WHERE e.student_id = ?
        `,
        values: [userId],
      });
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    return NextResponse.json(streams);
  } catch (error) {
    console.error("Error fetching streams:", error);
    return NextResponse.json(
      { error: "Failed to fetch streams" },
      { status: 500 }
    );
  }
}

// POST create a new stream (teachers only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user || session.user.role !== 'teacher') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();
    
    if (!name) {
      return NextResponse.json(
        { error: "Stream name is required" },
        { status: 400 }
      );
    }

    const result = await executeQuery({
      query: "INSERT INTO streams (name, description, teacher_id) VALUES (?, ?, ?)",
      values: [name, description || "", session.user.id],
    });

    return NextResponse.json({ 
      message: "Stream created successfully",
      streamId: result.insertId 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating stream:", error);
    return NextResponse.json(
      { error: "Failed to create stream" },
      { status: 500 }
    );
  }
}
