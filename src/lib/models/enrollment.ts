import { executeQuery } from "../db";
import { getSubjectsByStreamId } from "./subject";

export interface Enrollment {
   id: number;
   student_id: number;
   subject_id: number;
   created_at: string;
}

// Enroll a student in a stream by enrolling them in all subjects of that stream
export async function enrollStudent(
   studentId: number,
   streamId: number
): Promise<number[]> {
   try {
      // Get all subjects in the stream
      const subjects = await getSubjectsByStreamId(streamId);

      if (subjects.length === 0) {
         throw new Error("No subjects found in this stream");
      }

      // Enroll the student in each subject
      const enrollmentIds: number[] = [];

      for (const subject of subjects) {
         try {
            const result = (await executeQuery(
               "INSERT INTO subject_enrollments (student_id, subject_id) VALUES (?, ?)",
               [studentId, subject.id]
            )) as { insertId: number };

            enrollmentIds.push(result.insertId);
         } catch (error) {
            const mysqlError = error as { code?: string };
            // Ignore duplicate entry errors for individual subjects
            if (mysqlError.code !== "ER_DUP_ENTRY") {
               throw error;
            }
         }
      }

      return enrollmentIds;
   } catch (error) {
      const err = error as Error;
      if (err.message === "No subjects found in this stream") {
         throw error;
      }
      throw new Error("Failed to enroll student in stream");
   }
}

// Unenroll a student from a stream by removing them from all subjects in that stream
export async function unenrollStudent(
   studentId: number,
   streamId: number
): Promise<boolean> {
   try {
      // Get all subjects in the stream
      const subjects = await getSubjectsByStreamId(streamId);

      if (subjects.length === 0) {
         return false;
      }

      // Unenroll the student from each subject
      for (const subject of subjects) {
         await executeQuery(
            "DELETE FROM subject_enrollments WHERE student_id = ? AND subject_id = ?",
            [studentId, subject.id]
         );
      }

      return true;
   } catch (error) {
      console.error("Error unenrolling student:", error);
      return false;
   }
}

// Get all students enrolled in any subject of a stream
export interface EnrolledStudent {
   id: number;
   name: string;
   email: string;
   registration_number: string;
}

export async function getStudentsByStreamId(
   streamId: number
): Promise<EnrolledStudent[]> {
   return (await executeQuery(
      `SELECT DISTINCT s.id, s.name, s.email, s.registration_number
     FROM students s
     JOIN subject_enrollments se ON s.id = se.student_id
     JOIN subjects sub ON se.subject_id = sub.id
     WHERE sub.stream_id = ?
     ORDER BY s.name ASC`,
      [streamId]
   )) as EnrolledStudent[];
}

// Check if a student is enrolled in any subject of a stream
export async function isStudentEnrolled(
   studentId: number,
   streamId: number
): Promise<boolean> {
   const result = (await executeQuery(
      `SELECT COUNT(*) as count
     FROM subject_enrollments se
     JOIN subjects s ON se.subject_id = s.id
     WHERE se.student_id = ? AND s.stream_id = ?`,
      [studentId, streamId]
   )) as [{ count: number }];

   return result[0].count > 0;
}
