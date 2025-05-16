import { executeQuery } from "../db";

export interface Stream {
   id: number;
   name: string;
   description: string | null;
   teacher_id: number;
   created_at: string;
   updated_at: string;
}

export async function getStreamById(id: number): Promise<Stream | null> {
   const streams = (await executeQuery("SELECT * FROM streams WHERE id = ?", [
      id,
   ])) as Stream[];

   return streams.length > 0 ? streams[0] : null;
}

export async function getStreamsByTeacherId(
   teacherId: number
): Promise<Stream[]> {
   return (await executeQuery("SELECT * FROM streams WHERE teacher_id = ?", [
      teacherId,
   ])) as Stream[];
}

export async function createStream(
   stream: Omit<Stream, "id" | "created_at" | "updated_at">
): Promise<number> {
   const result = (await executeQuery(
      "INSERT INTO streams (name, description, teacher_id) VALUES (?, ?, ?)",
      [stream.name, stream.description, stream.teacher_id]
   )) as any;

   return result.insertId;
}

export async function updateStream(
   id: number,
   stream: Partial<Omit<Stream, "id" | "created_at" | "updated_at">>
): Promise<boolean> {
   const { name, description } = stream;

   const result = (await executeQuery(
      "UPDATE streams SET name = ?, description = ? WHERE id = ?",
      [name, description, id]
   )) as any;

   return result.affectedRows > 0;
}

export async function deleteStream(id: number): Promise<boolean> {
   const result = (await executeQuery("DELETE FROM streams WHERE id = ?", [
      id,
   ])) as any;

   return result.affectedRows > 0;
}

export async function getStudentStreams(studentId: number): Promise<Stream[]> {
   return (await executeQuery(
      `SELECT DISTINCT str.* FROM streams str
     JOIN subjects sub ON str.id = sub.stream_id
     JOIN subject_enrollments se ON sub.id = se.subject_id
     WHERE se.student_id = ?`,
      [studentId]
   )) as Stream[];
}
