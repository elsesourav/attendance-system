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
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiArrowRight, FiBook, FiCalendar } from "react-icons/fi";
import { toast } from "sonner";

interface DashboardStats {
   streamCount: number;
   subjectCount: number;
   attendancePercentage: number;
}

interface AttendanceRecord {
   id: number;
   student_id: number;
   subject_id: number;
   status: "present" | "absent" | "late";
   date: string;
   subject_name: string;
}

export default function StudentDashboard() {
   const { data: session } = useSession();
   const { hideLoading } = useLoading();
   const [stats, setStats] = useState<DashboardStats>({
      streamCount: 0,
      subjectCount: 0,
      attendancePercentage: 0,
   });
   const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>(
      []
   );
   const [isLoading, setIsLoading] = useState(true);
   const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);

   // Hide loading overlay when component mounts
   useEffect(() => {
      hideLoading();
   }, [hideLoading]);

   useEffect(() => {
      const fetchStats = async () => {
         try {
            const response = await fetch("/api/student/stats");
            if (response.ok) {
               const data = await response.json();
               setStats(data);
            }
         } catch (error) {
            console.error("Error fetching stats:", error);
         } finally {
            setIsLoading(false);
         }
      };

      fetchStats();
   }, []);

   useEffect(() => {
      const fetchRecentAttendance = async () => {
         try {
            // Fetch recent attendance with a limit of 5 records
            const response = await fetch("/api/student/attendance?limit=5");
            if (response.ok) {
               const data = await response.json();
               setRecentAttendance(data.records);
            } else {
               throw new Error("Failed to fetch attendance records");
            }
         } catch (error) {
            console.error("Error fetching recent attendance:", error);
            toast.error("Failed to load recent attendance");
         } finally {
            setIsLoadingAttendance(false);
         }
      };

      fetchRecentAttendance();
   }, []);

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
               Welcome back, {session?.user?.name}
            </p>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Enrolled Streams
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center">
                        <FiBook className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="text-2xl font-bold">
                           {isLoading ? "..." : stats.streamCount}
                        </div>
                     </div>
                     <Link
                        href="/student/streams"
                        onClick={() => hideLoading()}
                     >
                        <Button variant="outline" size="sm">
                           View
                        </Button>
                     </Link>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Subjects
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center">
                        <FiBook className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="text-2xl font-bold">
                           {isLoading ? "..." : stats.subjectCount}
                        </div>
                     </div>
                     <Link
                        href="/student/subjects"
                        onClick={() => hideLoading()}
                     >
                        <Button variant="outline" size="sm">
                           View
                        </Button>
                     </Link>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Attendance
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center">
                        <FiCalendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="text-2xl font-bold">
                           {isLoading
                              ? "..."
                              : `${stats.attendancePercentage}%`}
                        </div>
                     </div>
                     <Link
                        href="/student/attendance"
                        onClick={() => hideLoading()}
                     >
                        <Button variant="outline" size="sm">
                           View
                        </Button>
                     </Link>
                  </div>
               </CardContent>
            </Card>
         </div>

         <div className="flex justify-center my-6">
            <Link
               href="/student/subjects"
               onClick={() => hideLoading()}
               className="w-full sm:w-auto"
            >
               <Button size="lg" className="w-full sm:w-auto px-4 sm:px-8">
                  <FiBook className="mr-2 h-5 w-5" />
                  View All Subjects
               </Button>
            </Link>
         </div>

         <div className="grid grid-cols-1 gap-6">
            <Card>
               <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                     <CardTitle>Recent Attendance</CardTitle>
                     <CardDescription>
                        Your recent attendance records
                     </CardDescription>
                  </div>
                  <Link
                     href="/student/attendance"
                     onClick={() => hideLoading()}
                     className="w-full sm:w-auto"
                  >
                     <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                     >
                        View All
                        <FiArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                  </Link>
               </CardHeader>
               <CardContent>
                  {isLoadingAttendance ? (
                     <p>Loading recent attendance...</p>
                  ) : recentAttendance.length === 0 ? (
                     <div className="space-y-4">
                        <p className="text-muted-foreground">
                           No recent attendance records to display.
                        </p>
                     </div>
                  ) : (
                     <div className="overflow-x-auto">
                        <Table>
                           <TableHeader>
                              <TableRow>
                                 <TableHead>Subject</TableHead>
                                 <TableHead>Date</TableHead>
                                 <TableHead>Status</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {recentAttendance.map((record) => (
                                 <TableRow key={record.id}>
                                    <TableCell className="font-medium">
                                       {record.subject_name}
                                    </TableCell>
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
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>
      </div>
   );
}
