"use client";

import { useLoading } from "@/components/loading-overlay";
import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiCalendar, FiFilter } from "react-icons/fi";
import { toast } from "sonner";

interface Stream {
   id: number;
   name: string;
   description: string | null;
   teacherName: string;
}

interface Subject {
   id: number;
   name: string;
   description: string | null;
}

interface AttendanceRecord {
   id: number;
   student_id: number;
   subject_id: number;
   status: "present" | "absent" | "late";
   date: string;
   subject_name: string;
}

interface AttendanceStats {
   total: number;
   present: number;
   absent: number;
   late: number;
   percentage: number;
}

export default function StudentStreamAttendance() {
   const params = useParams();
   const router = useRouter();
   const streamId = params.id as string;
   const { showLoading, hideLoading } = useLoading();

   const [stream, setStream] = useState<Stream | null>(null);
   const [subjects, setSubjects] = useState<Subject[]>([]);
   const [attendanceRecords, setAttendanceRecords] = useState<
      AttendanceRecord[]
   >([]);
   const [attendanceStats, setAttendanceStats] =
      useState<AttendanceStats | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   // Filter states
   const [filterMonth, setFilterMonth] = useState<string>(
      (new Date().getMonth() + 1).toString()
   );
   const [filterYear, setFilterYear] = useState<string>(
      new Date().getFullYear().toString()
   );

   // Generate month and year options
   const months = [
      { value: "1", label: "January" },
      { value: "2", label: "February" },
      { value: "3", label: "March" },
      { value: "4", label: "April" },
      { value: "5", label: "May" },
      { value: "6", label: "June" },
      { value: "7", label: "July" },
      { value: "8", label: "August" },
      { value: "9", label: "September" },
      { value: "10", label: "October" },
      { value: "11", label: "November" },
      { value: "12", label: "December" },
   ];

   const currentYear = new Date().getFullYear();
   const years = Array.from({ length: 5 }, (_, i) => ({
      value: (currentYear - i).toString(),
      label: (currentYear - i).toString(),
   }));

   // Memoize the months array to prevent it from being recreated on every render
   const getMonthName = (monthValue: string) => {
      return (
         months.find((m) => m.value === monthValue)?.label || "current month"
      );
   };

   useEffect(() => {
      const fetchAttendanceData = async () => {
         setIsLoading(true);
         const monthName = getMonthName(filterMonth);
         showLoading(
            `Loading attendance data for ${monthName} ${filterYear}...`
         );

         try {
            // Construct the API URL with filters
            const url = `/api/student/streams/${streamId}/attendance?month=${filterMonth}&year=${filterYear}`;

            const response = await fetch(url);
            if (!response.ok) {
               if (response.status === 404) {
                  toast.error("Stream not found");
                  router.push("/student/streams");
                  return;
               }
               throw new Error("Failed to fetch attendance records");
            }

            const data = await response.json();
            setStream(data.stream);
            setSubjects(data.subjects);
            setAttendanceRecords(data.records);
            setAttendanceStats(data.stats);
         } catch (error) {
            console.error("Error fetching attendance data:", error);
            toast.error("Failed to load attendance data");
         } finally {
            setIsLoading(false);
            hideLoading();
         }
      };

      fetchAttendanceData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [streamId, filterMonth, filterYear, router]);

   // Group attendance records by subject
   const groupedBySubject: { [key: string]: AttendanceRecord[] } = {};
   attendanceRecords.forEach((record) => {
      if (!groupedBySubject[record.subject_name]) {
         groupedBySubject[record.subject_name] = [];
      }

      groupedBySubject[record.subject_name].push(record);
   });

   if (isLoading) {
      return (
         <div className="text-center py-10">Loading attendance data...</div>
      );
   }

   if (!stream) {
      return null; // Will redirect in the useEffect
   }

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center">
               <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2"
                  onClick={() => {
                     // Hide loading first, then navigate back
                     hideLoading();
                     router.back();
                  }}
               >
                  <FiArrowLeft className="h-4 w-4" />
               </Button>
               <h1 className="text-3xl font-bold">Stream Attendance</h1>
            </div>
            <div className="flex items-center space-x-2">
               <FiFilter className="text-muted-foreground" />
               <Select
                  value={filterMonth}
                  onValueChange={(value) => {
                     const monthName = getMonthName(value);
                     showLoading(
                        `Loading attendance data for ${monthName} ${filterYear}...`
                     );
                     setFilterMonth(value);
                  }}
               >
                  <SelectTrigger className="w-[120px]">
                     <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                     {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                           {month.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
               <Select
                  value={filterYear}
                  onValueChange={(value) => {
                     const monthName = getMonthName(filterMonth);
                     showLoading(
                        `Loading attendance data for ${monthName} ${value}...`
                     );
                     setFilterYear(value);
                  }}
               >
                  <SelectTrigger className="w-[100px]">
                     <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                     {years.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                           {year.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>{stream.name}</CardTitle>
               <CardDescription>
                  {stream.description || "No description provided"} • Teacher:{" "}
                  {stream.teacherName}
               </CardDescription>
            </CardHeader>
            <CardContent>
               {attendanceStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                     <div className="bg-muted/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                           Total Classes
                        </p>
                        <p className="text-2xl font-bold">
                           {attendanceStats.total}
                        </p>
                     </div>
                     <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Present</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                           {attendanceStats.present}
                        </p>
                     </div>
                     <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Late</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                           {attendanceStats.late}
                        </p>
                     </div>
                     <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Absent</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                           {attendanceStats.absent}
                        </p>
                     </div>
                     <div className="col-span-2 md:col-span-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                           Attendance Percentage
                        </p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                           {attendanceStats.percentage}%
                        </p>
                     </div>
                  </div>
               )}
            </CardContent>
         </Card>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {subjects.map((subject) => (
               <Card key={subject.id}>
                  <CardHeader>
                     <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                           {subject.name}
                        </CardTitle>
                        <Link
                           href={`/student/subjects/${subject.id}/attendance`}
                        >
                           <Button variant="outline" size="sm">
                              <FiCalendar className="mr-2 h-4 w-4" />
                              View Details
                           </Button>
                        </Link>
                     </div>
                     <CardDescription>
                        {subject.description || "No description provided"}
                     </CardDescription>
                  </CardHeader>
               </Card>
            ))}
         </div>

         {attendanceRecords.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-lg">
               <p className="text-muted-foreground">
                  No attendance records found for this period
               </p>
            </div>
         ) : (
            <div className="space-y-6">
               {Object.entries(groupedBySubject).map(
                  ([subjectName, records]) => (
                     <Card key={subjectName}>
                        <CardHeader>
                           <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">
                                 {subjectName}
                              </CardTitle>
                              <Link
                                 href={`/student/subjects/${records[0].subject_id}/attendance`}
                              >
                                 <Button variant="outline" size="sm">
                                    <FiCalendar className="mr-2 h-4 w-4" />
                                    View All
                                 </Button>
                              </Link>
                           </div>
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
                                       <TableCell>
                                          {new Date(
                                             record.date
                                          ).toLocaleDateString()}
                                       </TableCell>
                                       <TableCell>
                                          <span
                                             className={
                                                record.status === "present"
                                                   ? "text-green-600 dark:text-green-400 font-medium"
                                                   : record.status === "late"
                                                   ? "text-yellow-600 dark:text-yellow-400 font-medium"
                                                   : "text-red-600 dark:text-red-400 font-medium"
                                             }
                                          >
                                             {record.status
                                                .charAt(0)
                                                .toUpperCase() +
                                                record.status.slice(1)}
                                          </span>
                                       </TableCell>
                                    </TableRow>
                                 ))}
                              </TableBody>
                           </Table>
                        </CardContent>
                     </Card>
                  )
               )}
            </div>
         )}
      </div>
   );
}
