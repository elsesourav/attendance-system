"use client";

import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
   FiArrowLeft,
   FiCalendar,
   FiEdit,
   FiPlus,
   FiUsers,
} from "react-icons/fi";
import { toast } from "sonner";

interface Subject {
   id: number;
   name: string;
   description: string | null;
   streamName: string;
   streamId: number;
   studentCount: number;
}

interface Student {
   id: number;
   name: string;
   registration_number: string;
}

interface AttendanceRecord {
   id: number;
   student_id: number;
   student_name: string;
   registration_number: string;
   status: "present" | "absent" | "late";
   date: string;
}

export default function SubjectView() {
   const params = useParams();
   const router = useRouter();
   const subjectId = params.id as string;
   const searchParams = useSearchParams();
   const fromStream = searchParams.get("from") === "stream";

   const [subject, setSubject] = useState<Subject | null>(null);
   const [students, setStudents] = useState<Student[]>([]);
   const [attendanceRecords, setAttendanceRecords] = useState<
      AttendanceRecord[]
   >([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isAddingAttendance, setIsAddingAttendance] = useState(false);
   const [selectedDate, setSelectedDate] = useState(
      new Date().toISOString().split("T")[0]
   );
   const [attendanceData, setAttendanceData] = useState<{
      [key: number]: "present" | "absent" | "late";
   }>({});
   const [isEditingExistingAttendance, setIsEditingExistingAttendance] =
      useState(false);

   useEffect(() => {
      const fetchSubjectDetails = async () => {
         try {
            // Fetch subject details
            const subjectResponse = await fetch(
               `/api/teacher/subjects/${subjectId}`
            );
            if (!subjectResponse.ok) {
               if (subjectResponse.status === 404) {
                  toast.error("Subject not found");
                  router.push("/teacher/subjects");
                  return;
               }
               throw new Error("Failed to fetch subject details");
            }

            const subjectData = await subjectResponse.json();
            setSubject(subjectData);

            // Fetch students enrolled in this subject
            const studentsResponse = await fetch(
               `/api/teacher/subjects/${subjectId}/students`
            );
            if (!studentsResponse.ok) {
               throw new Error("Failed to fetch students");
            }

            const studentsData = await studentsResponse.json();
            setStudents(studentsData);

            // Fetch today's attendance records
            const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
            const attendanceResponse = await fetch(
               `/api/teacher/subjects/${subjectId}/attendance?date=${today}`
            );
            if (!attendanceResponse.ok) {
               throw new Error("Failed to fetch attendance records");
            }

            const attendanceData = await attendanceResponse.json();
            setAttendanceRecords(attendanceData?.records || []);
         } catch (error) {
            console.error("Error fetching subject details:", error);
            toast.error("Failed to load subject details");
         } finally {
            setIsLoading(false);
         }
      };

      fetchSubjectDetails();
   }, [subjectId, router]);

   const handleAttendanceChange = (
      studentId: number,
      status: "present" | "absent" | "late"
   ) => {
      setAttendanceData((prev) => ({
         ...prev,
         [studentId]: status,
      }));
   };

   // Function to check for existing attendance records for the selected date
   const checkExistingAttendance = async (date: string) => {
      try {
         const response = await fetch(
            `/api/teacher/subjects/${subjectId}/attendance?date=${date}`
         );

         if (!response.ok) {
            throw new Error("Failed to fetch attendance records");
         }

         const data = await response.json();
         const records = data.records || [];

         // If records exist for this date, pre-populate the attendance data
         if (records.length > 0) {
            const existingData: {
               [key: number]: "present" | "absent" | "late";
            } = {};

            records.forEach((record: AttendanceRecord) => {
               existingData[record.student_id] = record.status;
            });

            setAttendanceData(existingData);
            setIsEditingExistingAttendance(true);
         } else {
            // No existing records, reset the form
            setAttendanceData({});
            setIsEditingExistingAttendance(false);
         }

         return records.length > 0;
      } catch (error) {
         console.error("Error checking existing attendance:", error);
         return false;
      }
   };

   // Function to handle opening the attendance dialog
   const handleOpenAttendanceDialog = async () => {
      // Check for existing attendance records for today
      await checkExistingAttendance(selectedDate);
      setIsAddingAttendance(true);
   };

   // Effect to check for existing attendance when the selected date changes
   useEffect(() => {
      if (isAddingAttendance) {
         checkExistingAttendance(selectedDate);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [selectedDate, isAddingAttendance, subjectId]);

   const handleSaveAttendance = async () => {
      if (Object.keys(attendanceData).length === 0) {
         toast.error("No attendance data to save");
         return;
      }

      try {
         const attendanceRecords = Object.entries(attendanceData).map(
            ([studentId, status]) => ({
               student_id: parseInt(studentId),
               status,
               date: selectedDate,
            })
         );

         const response = await fetch(
            `/api/teacher/subjects/${subjectId}/attendance`,
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  date: selectedDate,
                  records: attendanceRecords,
               }),
            }
         );

         if (response.ok) {
            toast.success(
               isEditingExistingAttendance
                  ? "Attendance updated successfully"
                  : "Attendance saved successfully"
            );
            setIsAddingAttendance(false);

            // Refresh attendance records - get today's records
            const today = new Date().toISOString().split("T")[0];
            const attendanceResponse = await fetch(
               `/api/teacher/subjects/${subjectId}/attendance?date=${today}`
            );
            if (attendanceResponse.ok) {
               const newAttendanceData = await attendanceResponse.json();
               setAttendanceRecords(newAttendanceData?.records || []);
            }
         } else {
            const error = await response.json();
            toast.error(error.error || "Failed to save attendance");
         }
      } catch (error) {
         console.error("Error saving attendance:", error);
         toast.error("An error occurred while saving attendance");
      }
   };

   if (isLoading) {
      return (
         <div className="text-center py-10">Loading subject details...</div>
      );
   }

   if (!subject) {
      return null; // Will redirect in the useEffect
   }

   return (
      <div className="space-y-6">
         <div className="flex items-center">
            <Button
               variant="ghost"
               size="icon"
               className="mr-2"
               onClick={() => {
                  if (fromStream && subject) {
                     router.push(`/teacher/streams/${subject.streamId}`);
                  } else {
                     router.push("/teacher/subjects");
                  }
               }}
            >
               <FiArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">{subject.name}</h1>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>Subject Details</CardTitle>
               <CardDescription>
                  {subject.description || "No description provided"}
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-2 text-sm text-muted-foreground">
                  <div>Stream: {subject.streamName}</div>
                  <div>Students: {subject.studentCount}</div>
               </div>
            </CardContent>
            <CardFooter className="flex justify-between">
               <div className="space-x-2">
                  <Link href={`/teacher/subjects/${subjectId}/students`}>
                     <Button variant="outline">
                        <FiUsers className="mr-2" />
                        Manage Students
                     </Button>
                  </Link>
                  <Link href={`/teacher/subjects/${subjectId}/attendance`}>
                     <Button variant="outline">
                        <FiCalendar className="mr-2" />
                        View Attendance
                     </Button>
                  </Link>
               </div>
               <Link href={`/teacher/subjects/${subjectId}/edit`}>
                  <Button variant="outline">
                     <FiEdit className="mr-2" />
                     Edit Subject
                  </Button>
               </Link>
            </CardFooter>
         </Card>

         <div className="mt-8 flex justify-between items-center">
            <div>
               <h2 className="text-2xl font-bold">Today&apos;s Attendance</h2>
               <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString(undefined, {
                     weekday: "long",
                     year: "numeric",
                     month: "long",
                     day: "numeric",
                  })}
               </p>
            </div>
            <Dialog
               open={isAddingAttendance}
               onOpenChange={(open) => {
                  if (open) {
                     handleOpenAttendanceDialog();
                  } else {
                     setIsAddingAttendance(false);
                  }
               }}
            >
               <DialogTrigger asChild>
                  <Button>
                     <FiPlus className="mr-2" />
                     Take Attendance
                  </Button>
               </DialogTrigger>
               <DialogContent className="max-w-3xl">
                  <DialogHeader>
                     <DialogTitle>
                        {isEditingExistingAttendance
                           ? "Edit Attendance"
                           : "Take Attendance"}
                     </DialogTitle>
                     <DialogDescription>
                        {isEditingExistingAttendance
                           ? `Update attendance records for ${subject.name} on ${selectedDate}`
                           : `Record attendance for ${subject.name} on ${selectedDate}`}
                     </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                     <div className="mb-4">
                        <Label htmlFor="attendance-date">Date</Label>
                        <Input
                           id="attendance-date"
                           type="date"
                           value={selectedDate}
                           onChange={(e) => setSelectedDate(e.target.value)}
                           className="mt-1"
                        />
                     </div>

                     {students.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground">
                           No students enrolled in this subject
                        </p>
                     ) : (
                        <div className="max-h-96 overflow-y-auto">
                           <Table>
                              <TableHeader>
                                 <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Registration No.</TableHead>
                                    <TableHead>Status</TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {students.map((student) => (
                                    <TableRow key={student.id}>
                                       <TableCell>{student.name}</TableCell>
                                       <TableCell>
                                          {student.registration_number}
                                       </TableCell>
                                       <TableCell>
                                          <Select
                                             value={
                                                attendanceData[student.id] || ""
                                             }
                                             onValueChange={(value) =>
                                                handleAttendanceChange(
                                                   student.id,
                                                   value as
                                                      | "present"
                                                      | "absent"
                                                      | "late"
                                                )
                                             }
                                          >
                                             <SelectTrigger className="w-32">
                                                <SelectValue placeholder="Select" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                <SelectItem value="present">
                                                   Present
                                                </SelectItem>
                                                <SelectItem value="absent">
                                                   Absent
                                                </SelectItem>
                                                <SelectItem value="late">
                                                   Late
                                                </SelectItem>
                                             </SelectContent>
                                          </Select>
                                       </TableCell>
                                    </TableRow>
                                 ))}
                              </TableBody>
                           </Table>
                        </div>
                     )}
                  </div>
                  <DialogFooter>
                     <Button
                        variant="outline"
                        onClick={() => setIsAddingAttendance(false)}
                     >
                        Cancel
                     </Button>
                     <Button onClick={handleSaveAttendance}>
                        Save Attendance
                     </Button>
                  </DialogFooter>
               </DialogContent>
            </Dialog>
         </div>

         {attendanceRecords.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-lg">
               <p className="text-muted-foreground mb-4">
                  No attendance records found for today
               </p>
               <Button onClick={handleOpenAttendanceDialog}>
                  <FiPlus className="mr-2" />
                  Take Today&apos;s Attendance
               </Button>
            </div>
         ) : (
            <Card>
               <CardContent className="pt-6">
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Date</TableHead>
                           <TableHead>Student</TableHead>
                           <TableHead>Registration No.</TableHead>
                           <TableHead>Status</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {attendanceRecords.map((record) => (
                           <TableRow key={record.id}>
                              <TableCell>
                                 {new Date(record.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{record.student_name}</TableCell>
                              <TableCell>
                                 {record.registration_number}
                              </TableCell>
                              <TableCell>
                                 <span
                                    className={
                                       record.status === "present"
                                          ? "text-green-600 font-medium"
                                          : record.status === "late"
                                          ? "text-yellow-600 font-medium"
                                          : "text-red-600 font-medium"
                                    }
                                 >
                                    {record.status.charAt(0).toUpperCase() +
                                       record.status.slice(1)}
                                 </span>
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
                  <div className="mt-4 text-center">
                     <Link href={`/teacher/subjects/${subjectId}/attendance`}>
                        <Button variant="outline" size="sm">
                           View All Attendance Records
                        </Button>
                     </Link>
                  </div>
               </CardContent>
            </Card>
         )}
      </div>
   );
}
