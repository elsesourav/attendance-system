import { executeQuery } from '../db';
import bcrypt from 'bcrypt';

export interface Student {
  id: number;
  name: string;
  email: string;
  mobile_number: string;
  registration_number: string;
  password?: string;
  created_at: string;
  updated_at: string;
}

export async function getStudentByEmail(email: string): Promise<Student | null> {
  const students = await executeQuery(
    'SELECT * FROM students WHERE email = ?',
    [email]
  ) as Student[];
  
  return students.length > 0 ? students[0] : null;
}

export async function getStudentById(id: number): Promise<Student | null> {
  const students = await executeQuery(
    'SELECT * FROM students WHERE id = ?',
    [id]
  ) as Student[];
  
  return students.length > 0 ? students[0] : null;
}

export async function getStudentByRegistrationNumber(registrationNumber: string): Promise<Student | null> {
  const students = await executeQuery(
    'SELECT * FROM students WHERE registration_number = ?',
    [registrationNumber]
  ) as Student[];
  
  return students.length > 0 ? students[0] : null;
}

export async function createStudent(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const hashedPassword = await bcrypt.hash(student.password!, 10);
  
  const result = await executeQuery(
    'INSERT INTO students (name, email, mobile_number, registration_number, password) VALUES (?, ?, ?, ?, ?)',
    [student.name, student.email, student.mobile_number, student.registration_number, hashedPassword]
  ) as any;
  
  return result.insertId;
}

export async function verifyStudentPassword(email: string, password: string): Promise<Student | null> {
  const student = await getStudentByEmail(email);
  
  if (!student || !student.password) {
    return null;
  }
  
  const isValid = await bcrypt.compare(password, student.password);
  
  if (!isValid) {
    return null;
  }
  
  // Don't return the password
  const { password: _, ...studentWithoutPassword } = student;
  return studentWithoutPassword as Student;
}
