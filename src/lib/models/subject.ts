import { executeQuery } from "../db";

export interface Subject {
   id: number;
   name: string;
   description: string | null;
   stream_id: number;
   created_at: string;
   updated_at: string;
}

export async function getSubjectById(id: number): Promise<Subject | null> {
   const subjects = (await executeQuery("SELECT * FROM subjects WHERE id = ?", [
      id,
   ])) as Subject[];

   return subjects.length > 0 ? subjects[0] : null;
}

export async function getSubjectsByStreamId(
   streamId: number
): Promise<Subject[]> {
   return (await executeQuery("SELECT * FROM subjects WHERE stream_id = ?", [
      streamId,
   ])) as Subject[];
}

export async function createSubject(
   subject: Omit<Subject, "id" | "created_at" | "updated_at">
): Promise<number> {
   const result = (await executeQuery(
      "INSERT INTO subjects (name, description, stream_id) VALUES (?, ?, ?)",
      [subject.name, subject.description, subject.stream_id]
   )) as { insertId: number };

   return result.insertId;
}

export async function updateSubject(
   id: number,
   subject: Partial<Omit<Subject, "id" | "created_at" | "updated_at">>
): Promise<boolean> {
   const { name, description } = subject;

   // Ensure name is not undefined
   if (!name) {
      throw new Error("Subject name is required for update");
   }

   const result = (await executeQuery(
      "UPDATE subjects SET name = ?, description = ? WHERE id = ?",
      [name, description || null, id]
   )) as { affectedRows: number };

   return result.affectedRows > 0;
}

export async function deleteSubject(id: number): Promise<boolean> {
   const result = (await executeQuery("DELETE FROM subjects WHERE id = ?", [
      id,
   ])) as { affectedRows: number };

   return result.affectedRows > 0;
}
