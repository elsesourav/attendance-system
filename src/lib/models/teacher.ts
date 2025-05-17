import bcrypt from "bcrypt";
import { executeQuery } from "../db";

export interface Teacher {
   id: number;
   name: string;
   email: string;
   mobile_number: string;
   password?: string;
   created_at: string;
   updated_at: string;
}

export async function getTeacherByEmail(
   email: string
): Promise<Teacher | null> {
   const teachers = (await executeQuery(
      "SELECT * FROM teachers WHERE email = ?",
      [email]
   )) as Teacher[];

   return teachers.length > 0 ? teachers[0] : null;
}

export async function getTeacherById(id: number): Promise<Teacher | null> {
   const teachers = (await executeQuery("SELECT * FROM teachers WHERE id = ?", [
      id,
   ])) as Teacher[];

   return teachers.length > 0 ? teachers[0] : null;
}

export async function createTeacher(
   teacher: Omit<Teacher, "id" | "created_at" | "updated_at">
): Promise<number> {
   const hashedPassword = await bcrypt.hash(teacher.password!, 10);

   const result = (await executeQuery(
      "INSERT INTO teachers (name, email, mobile_number, password) VALUES (?, ?, ?, ?)",
      [teacher.name, teacher.email, teacher.mobile_number, hashedPassword]
   )) as { insertId: number };

   return result.insertId;
}

export async function verifyTeacherPassword(
   email: string,
   password: string
): Promise<Teacher | null> {
   const teacher = await getTeacherByEmail(email);

   if (!teacher || !teacher.password) {
      return null;
   }

   const isValid = await bcrypt.compare(password, teacher.password);

   if (!isValid) {
      return null;
   }

   // Don't return the password
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   const { password: _password, ...teacherWithoutPassword } = teacher;
   return teacherWithoutPassword as Teacher;
}
