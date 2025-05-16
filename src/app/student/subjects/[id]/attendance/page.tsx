"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FiArrowLeft, FiCalendar } from "react-icons/fi";
import { toast } from "sonner";

interface Subject {
  id: number;
  name: string;
  streamName: string;
}

interface AttendanceRecord {
  id: number;
  status: 'present' | 'absent' | 'late';
  date: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export default function StudentAttendanceView() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        // Fetch subject details
        const subjectResponse = await fetch(`/api/student/subjects/${subjectId}`);
        if (!subjectResponse.ok) {
          if (subjectResponse.status === 404) {
            toast.error("Subject not found");
            router.push("/student/streams");
            return;
          }
          throw new Error("Failed to fetch subject details");
        }
        
        const subjectData = await subjectResponse.json();
        setSubject(subjectData);
        
        // Fetch all attendance records
        const attendanceResponse = await fetch(`/api/student/subjects/${subjectId}/attendance`);
        if (!attendanceResponse.ok) {
          throw new Error("Failed to fetch attendance records");
        }
        
        const attendanceData = await attendanceResponse.json();
        setAttendanceRecords(attendanceData.records);
        setAttendanceStats(attendanceData.stats);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        toast.error("Failed to load attendance data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, [subjectId, router]);

  if (isLoading) {
    return <div className="text-center py-10">Loading attendance data...</div>;
  }

  if (!subject) {
    return null; // Will redirect in the useEffect
  }

  // Group attendance records by month
  const groupedByMonth: { [key: string]: AttendanceRecord[] } = {};
  attendanceRecords.forEach(record => {
    const date = new Date(record.date);
    const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    
    if (!groupedByMonth[monthYear]) {
      groupedByMonth[monthYear] = [];
    }
    
    groupedByMonth[monthYear].push(record);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => router.push(`/student/subjects/${subjectId}`)}
        >
          <FiArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Attendance Records</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{subject.name}</CardTitle>
          <CardDescription>{subject.streamName}</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-muted/20 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-bold">{attendanceStats.total}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{attendanceStats.present}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{attendanceStats.late}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{attendanceStats.absent}</p>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Attendance Percentage</p>
            <div className="w-full bg-muted rounded-full h-4">
              <div 
                className="bg-primary h-4 rounded-full" 
                style={{ width: `${attendanceStats?.percentage || 0}%` }}
              ></div>
            </div>
            <p className="mt-2 font-medium">{attendanceStats?.percentage || 0}%</p>
          </div>
        </CardContent>
      </Card>
      
      {attendanceRecords.length === 0 ? (
        <div className="text-center py-10 bg-muted/20 rounded-lg">
          <p className="text-muted-foreground">No attendance records found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByMonth).map(([monthYear, records]) => (
            <Card key={monthYear}>
              <CardHeader>
                <CardTitle className="text-lg">{monthYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={
                            record.status === 'present' 
                              ? 'text-green-600 font-medium' 
                              : record.status === 'late' 
                                ? 'text-yellow-600 font-medium' 
                                : 'text-red-600 font-medium'
                          }>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
