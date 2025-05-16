import { executeQuery } from '../db';

export interface SubjectEnrollment {
  id: number;
  student_id: number;
  subject_id: number;
  created_at: string;
}

export async function enrollStudentInSubject(studentId: number, subjectId: number): Promise<number> {
  try {
    const result = await executeQuery(
      'INSERT INTO subject_enrollments (student_id, subject_id) VALUES (?, ?)',
      [studentId, subjectId]
    ) as any;
    
    return result.insertId;
  } catch (error: any) {
    // Check if it's a duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Student is already enrolled in this subject');
    }
    throw error;
  }
}

export async function unenrollStudentFromSubject(studentId: number, subjectId: number): Promise<boolean> {
  const result = await executeQuery(
    'DELETE FROM subject_enrollments WHERE student_id = ? AND subject_id = ?',
    [studentId, subjectId]
  ) as any;
  
  return result.affectedRows > 0;
}

export async function getEnrollmentsBySubjectId(subjectId: number): Promise<SubjectEnrollment[]> {
  return await executeQuery(
    'SELECT * FROM subject_enrollments WHERE subject_id = ?',
    [subjectId]
  ) as SubjectEnrollment[];
}

export async function getEnrollmentsByStudentId(studentId: number): Promise<SubjectEnrollment[]> {
  return await executeQuery(
    'SELECT * FROM subject_enrollments WHERE student_id = ?',
    [studentId]
  ) as SubjectEnrollment[];
}

export async function isStudentEnrolledInSubject(studentId: number, subjectId: number): Promise<boolean> {
  const enrollments = await executeQuery(
    'SELECT * FROM subject_enrollments WHERE student_id = ? AND subject_id = ?',
    [studentId, subjectId]
  ) as SubjectEnrollment[];
  
  return enrollments.length > 0;
}

export async function getStudentsBySubjectId(subjectId: number): Promise<any[]> {
  return await executeQuery(
    `SELECT s.id, s.name, s.email, s.registration_number
     FROM students s
     JOIN subject_enrollments se ON s.id = se.student_id
     WHERE se.subject_id = ?
     ORDER BY s.name ASC`,
    [subjectId]
  ) as any[];
}

export async function getAvailableStudentsForSubject(subjectId: number): Promise<any[]> {
  return await executeQuery(
    `SELECT s.id, s.name, s.email, s.registration_number
     FROM students s
     WHERE s.id NOT IN (
       SELECT student_id FROM subject_enrollments WHERE subject_id = ?
     )
     ORDER BY s.name ASC`,
    [subjectId]
  ) as any[];
}
