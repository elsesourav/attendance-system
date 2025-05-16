import { executeQuery } from '../db';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface Attendance {
  id: number;
  student_id: number;
  subject_id: number;
  status: AttendanceStatus;
  date: string;
  created_at: string;
}

export async function markAttendance(
  studentId: number, 
  subjectId: number, 
  status: AttendanceStatus, 
  date: string
): Promise<number> {
  try {
    const result = await executeQuery(
      `INSERT INTO attendance (student_id, subject_id, status, date) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE status = ?`,
      [studentId, subjectId, status, date, status]
    ) as any;
    
    return result.insertId || 0;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
}

export async function getAttendanceByStudentAndSubject(
  studentId: number, 
  subjectId: number
): Promise<Attendance[]> {
  return await executeQuery(
    'SELECT * FROM attendance WHERE student_id = ? AND subject_id = ? ORDER BY date DESC',
    [studentId, subjectId]
  ) as Attendance[];
}

export async function getAttendanceByStudentId(studentId: number): Promise<Attendance[]> {
  return await executeQuery(
    'SELECT a.*, s.name as subject_name FROM attendance a JOIN subjects s ON a.subject_id = s.id WHERE a.student_id = ? ORDER BY a.date DESC',
    [studentId]
  ) as (Attendance & { subject_name: string })[];
}

export async function getAttendanceBySubjectAndDate(
  subjectId: number, 
  date: string
): Promise<Attendance[]> {
  return await executeQuery(
    'SELECT * FROM attendance WHERE subject_id = ? AND date = ?',
    [subjectId, date]
  ) as Attendance[];
}

export async function getAttendanceStats(studentId: number, subjectId: number): Promise<{
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}> {
  const attendanceRecords = await executeQuery(
    'SELECT status, COUNT(*) as count FROM attendance WHERE student_id = ? AND subject_id = ? GROUP BY status',
    [studentId, subjectId]
  ) as { status: AttendanceStatus; count: number }[];
  
  const stats = {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0
  };
  
  attendanceRecords.forEach(record => {
    stats.total += record.count;
    if (record.status === 'present') stats.present += record.count;
    if (record.status === 'absent') stats.absent += record.count;
    if (record.status === 'late') stats.late += record.count;
  });
  
  stats.percentage = stats.total > 0 
    ? Math.round(((stats.present + stats.late) / stats.total) * 100) 
    : 0;
  
  return stats;
}
