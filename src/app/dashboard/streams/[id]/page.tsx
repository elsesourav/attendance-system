'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Stream {
  id: number;
  name: string;
  description: string;
  teacher_id: number;
  created_at: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
}

interface AttendanceRecord {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  stream_id: number;
  status: 'present' | 'absent' | 'late';
  date: string;
}

export default function StreamDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { data: session } = useSession();
  const [stream, setStream] = useState<Stream | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentEmail, setStudentEmail] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isRecordingAttendance, setIsRecordingAttendance] = useState(false);

  const isTeacher = session?.user?.role === 'teacher';

  useEffect(() => {
    const fetchStreamData = async () => {
      try {
        // Fetch stream details
        const streamResponse = await fetch(`/api/streams/${id}`);
        if (!streamResponse.ok) {
          throw new Error('Failed to fetch stream details');
        }
        const streamData = await streamResponse.json();
        setStream(streamData);

        // Fetch enrolled students
        const studentsResponse = await fetch(`/api/enrollments?streamId=${id}`);
        if (!studentsResponse.ok) {
          throw new Error('Failed to fetch enrolled students');
        }
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);

        // Fetch attendance records
        const attendanceResponse = await fetch(`/api/attendance?streamId=${id}`);
        if (!attendanceResponse.ok) {
          throw new Error('Failed to fetch attendance records');
        }
        const attendanceData = await attendanceResponse.json();
        setAttendance(attendanceData);
      } catch (error) {
        console.error('Error fetching stream data:', error);
        toast.error('Failed to load stream data');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchStreamData();
    }
  }, [id, session]);

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentEmail) {
      toast.error('Student email is required');
      return;
    }
    
    setIsEnrolling(true);
    
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamId: id,
          studentEmail,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll student');
      }
      
      toast.success('Student enrolled successfully');
      setStudentEmail('');
      
      // Refresh student list
      const studentsResponse = await fetch(`/api/enrollments?streamId=${id}`);
      const studentsData = await studentsResponse.json();
      setStudents(studentsData);
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while enrolling the student');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRecordAttendance = async (studentId: number, status: 'present' | 'absent' | 'late') => {
    setIsRecordingAttendance(true);
    
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamId: id,
          studentId,
          date: attendanceDate,
          status,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to record attendance');
      }
      
      toast.success('Attendance recorded successfully');
      
      // Refresh attendance records
      const attendanceResponse = await fetch(`/api/attendance?streamId=${id}&date=${attendanceDate}`);
      const attendanceData = await attendanceResponse.json();
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while recording attendance');
    } finally {
      setIsRecordingAttendance(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p>Loading stream data...</p>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Stream not found</h2>
        <p className="text-muted-foreground mb-4">
          The stream you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{stream.name}</h1>
          <p className="text-muted-foreground">
            {stream.description || 'No description provided'}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
      
      <Tabs defaultValue="students">
        <TabsList className="mb-4">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
              <CardDescription>
                Students enrolled in this stream
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isTeacher && (
                <form onSubmit={handleEnrollStudent} className="mb-6 flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="studentEmail" className="sr-only">
                      Student Email
                    </Label>
                    <Input
                      id="studentEmail"
                      placeholder="Enter student email to enroll"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isEnrolling}>
                    {isEnrolling ? 'Enrolling...' : 'Enroll Student'}
                  </Button>
                </form>
              )}
              
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No students enrolled in this stream yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Track and view attendance for this stream
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isTeacher && (
                <div className="mb-6">
                  <Label htmlFor="attendanceDate" className="block mb-2">
                    Select Date
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="attendanceDate"
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                </div>
              )}
              
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No students enrolled to take attendance.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      {isTeacher && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const attendanceRecord = attendance.find(
                        (record) => 
                          record.student_id === student.id && 
                          record.date === attendanceDate
                      );
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>
                            {attendanceRecord ? (
                              <span className={`font-medium ${
                                attendanceRecord.status === 'present' 
                                  ? 'text-green-600' 
                                  : attendanceRecord.status === 'late' 
                                  ? 'text-yellow-600' 
                                  : 'text-red-600'
                              }`}>
                                {attendanceRecord.status.charAt(0).toUpperCase() + 
                                  attendanceRecord.status.slice(1)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Not recorded</span>
                            )}
                          </TableCell>
                          {isTeacher && (
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 hover:bg-green-100 text-green-700"
                                  onClick={() => handleRecordAttendance(student.id, 'present')}
                                  disabled={isRecordingAttendance}
                                >
                                  Present
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                                  onClick={() => handleRecordAttendance(student.id, 'late')}
                                  disabled={isRecordingAttendance}
                                >
                                  Late
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-50 hover:bg-red-100 text-red-700"
                                  onClick={() => handleRecordAttendance(student.id, 'absent')}
                                  disabled={isRecordingAttendance}
                                >
                                  Absent
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
