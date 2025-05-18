import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
   try {
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "teacher") {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get students
      const students = await executeQuery(
         `SELECT id, name, email, registration_number, mobile_number
       FROM students
       ORDER BY name ASC`
      );

      return NextResponse.json(students);
   } catch (error) {
      console.error("Error fetching students:", error);
      return NextResponse.json(
         { error: "Failed to fetch students" },
         { status: 500 }
      );
   }
}
