import { executeQuery } from "../db";

export interface SubjectEnrollment {
   id: number;
   student_id: number;
   subject_id: number;
   created_at: string;
}

export async function enrollStudentInSubject(
   studentId: number,
   subjectId: number
): Promise<number> {
   try {
      const result = (await executeQuery(
         "INSERT INTO subject_enrollments (student_id, subject_id) VALUES (?, ?)",
         [studentId, subjectId]
      )) as { insertId: number };

      return result.insertId;
   } catch (error) {
      const mysqlError = error as { code?: string };
      // Check if it's a duplicate entry error
      if (mysqlError.code === "ER_DUP_ENTRY") {
         throw new Error("Student is already enrolled in this subject");
      }
      throw error;
   }
}

export async function unenrollStudentFromSubject(
   studentId: number,
   subjectId: number
): Promise<boolean> {
   try {
      // First, delete all attendance records for this student in this subject
      await executeQuery(
         "DELETE FROM attendance WHERE student_id = ? AND subject_id = ?",
         [studentId, subjectId]
      );

      // Then, delete the enrollment
      const result = (await executeQuery(
         "DELETE FROM subject_enrollments WHERE student_id = ? AND subject_id = ?",
         [studentId, subjectId]
      )) as { affectedRows: number };

      return result.affectedRows > 0;
   } catch (error) {
      console.error("Error unenrolling student from subject:", error);
      return false;
   }
}

export async function getEnrollmentsBySubjectId(
   subjectId: number
): Promise<SubjectEnrollment[]> {
   return (await executeQuery(
      "SELECT * FROM subject_enrollments WHERE subject_id = ?",
      [subjectId]
   )) as SubjectEnrollment[];
}

export async function getEnrollmentsByStudentId(
   studentId: number
): Promise<SubjectEnrollment[]> {
   return (await executeQuery(
      "SELECT * FROM subject_enrollments WHERE student_id = ?",
      [studentId]
   )) as SubjectEnrollment[];
}

export async function isStudentEnrolledInSubject(
   studentId: number,
   subjectId: number
): Promise<boolean> {
   const enrollments = (await executeQuery(
      "SELECT * FROM subject_enrollments WHERE student_id = ? AND subject_id = ?",
      [studentId, subjectId]
   )) as SubjectEnrollment[];

   return enrollments.length > 0;
}

export interface EnrolledStudent {
   id: number;
   name: string;
   email: string;
   registration_number: string;
}

export async function getStudentsBySubjectId(
   subjectId: number
): Promise<EnrolledStudent[]> {
   return (await executeQuery(
      `SELECT s.id, s.name, s.email, s.registration_number
     FROM students s
     JOIN subject_enrollments se ON s.id = se.student_id
     WHERE se.subject_id = ?
     ORDER BY s.name ASC`,
      [subjectId]
   )) as EnrolledStudent[];
}

export async function getAvailableStudentsForSubject(
   subjectId: number
): Promise<EnrolledStudent[]> {
   return (await executeQuery(
      `SELECT s.id, s.name, s.email, s.registration_number
     FROM students s
     WHERE s.id NOT IN (
       SELECT student_id FROM subject_enrollments WHERE subject_id = ?
     )
     ORDER BY s.name ASC`,
      [subjectId]
   )) as EnrolledStudent[];
}
