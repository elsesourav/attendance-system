import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { executeQuery } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// GET a specific user
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    const currentUserId = session.user.id;
    const role = session.user.role;
    
    // Only allow teachers to view other users, or users to view themselves
    if (role !== 'teacher' && userId !== currentUserId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Get user details (excluding password)
    const users = await executeQuery({
      query: "SELECT id, name, email, mobile_number, registration_number, role, created_at, updated_at FROM users WHERE id = ?",
      values: [userId],
    });
    
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(users[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// DELETE a user (teachers only, or self-deletion)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    const currentUserId = session.user.id;
    const role = session.user.role;
    
    // Only allow teachers to delete other users, or users to delete themselves
    if (role !== 'teacher' && userId !== currentUserId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Get user details
    const users = await executeQuery({
      query: "SELECT * FROM users WHERE id = ?",
      values: [userId],
    });
    
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userToDelete = users[0];
    
    // Prevent teachers from deleting other teachers
    if (role === 'teacher' && userToDelete.role === 'teacher' && userId !== currentUserId) {
      return NextResponse.json(
        { error: "Teachers cannot delete other teachers" },
        { status: 403 }
      );
    }
    
    // Delete user
    await executeQuery({
      query: "DELETE FROM users WHERE id = ?",
      values: [userId],
    });
    
    // If user deleted themselves, return a special message
    if (userId === currentUserId) {
      return NextResponse.json({ 
        message: "Your account has been deleted successfully",
        selfDeleted: true
      });
    }
    
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
