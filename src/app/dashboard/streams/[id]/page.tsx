"use client";

import { Loading } from "@/components/loading";
import { SubjectManager } from "@/components/subjects/SubjectManager";
import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
   mobile_number?: string;
   registration_number?: string;
}

interface Subject {
   id: number;
   name: string;
   description: string;
   stream_id: number;
   created_at: string;
}

interface AttendanceRecord {
   id: number;
   student_id: number;
   student_name: string;
   student_email: string;
   stream_id: number;
   subject_id?: number;
   status: "present" | "absent" | "late";
   date: string;
}

export default function StreamDetailPage() {
   const router = useRouter();
   const { id } = useParams();
   const { data: session, status } = useSession();
   const [stream, setStream] = useState<Stream | null>(null);
   const [students, setStudents] = useState<Student[]>([]);
   const [subjects, setSubjects] = useState<Subject[]>([]);
   const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [studentEmail, setStudentEmail] = useState("");
   const [attendanceDate, setAttendanceDate] = useState(
      new Date().toISOString().split("T")[0]
   );
   const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
   const [isEnrolling, setIsEnrolling] = useState(false);
   const [isRecordingAttendance, setIsRecordingAttendance] = useState(false);
   const [mounted, setMounted] = useState(false);
   const [activeTab, setActiveTab] = useState("students");

   // Handle tab parameter from URL
   useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (
         tabParam &&
         ["students", "subjects", "attendance"].includes(tabParam)
      ) {
         setActiveTab(tabParam);
      }
   }, []);

   const isTeacher = session?.user?.role === "teacher";

   useEffect(() => {
      setMounted(true);

      const fetchStreamData = async () => {
         if (status !== "authenticated") return;

         try {
            // Fetch stream details
            const streamResponse = await fetch(`/api/streams/${id}`, {
               credentials: "include",
               headers: {
                  "Content-Type": "application/json",
               },
            });

            if (!streamResponse.ok) {
               throw new Error("Failed to fetch stream details");
            }

            const streamData = await streamResponse.json();
            setStream(streamData);

            // Fetch enrolled students
            const studentsResponse = await fetch(
               `/api/enrollments?streamId=${id}`,
               {
                  credentials: "include",
                  headers: {
                     "Content-Type": "application/json",
                  },
               }
            );

            if (!studentsResponse.ok) {
               throw new Error("Failed to fetch enrolled students");
            }

            const studentsData = await studentsResponse.json();
            setStudents(studentsData);

            // Fetch subjects
            const subjectsResponse = await fetch(
               `/api/subjects?streamId=${id}`,
               {
                  credentials: "include",
                  headers: {
                     "Content-Type": "application/json",
                  },
               }
            );

            console.log("Subjects response:", subjectsResponse);

            if (!subjectsResponse.ok) {
               throw new Error("Failed to fetch subjects");
            }

            const subjectsData = await subjectsResponse.json();
            console.log("Subjects data:", subjectsData);

            setSubjects(subjectsData);

            // Fetch attendance records
            await fetchAttendanceRecords();
         } catch (error) {
            console.error("Error fetching stream data:", error);
            toast.error("Failed to load stream data");
         } finally {
            setIsLoading(false);
         }
      };

      if (mounted && status === "authenticated") {
         fetchStreamData();
      } else if (mounted) {
         setIsLoading(false);
      }
   }, [id, status, mounted]);

   const fetchAttendanceRecords = async () => {
      try {
         let url = `/api/attendance?streamId=${id}&date=${attendanceDate}`;

         if (selectedSubjectId) {
            url += `&subjectId=${selectedSubjectId}`;
         }

         const attendanceResponse = await fetch(url, {
            credentials: "include",
            headers: {
               "Content-Type": "application/json",
            },
         });

         if (!attendanceResponse.ok) {
            throw new Error("Failed to fetch attendance records");
         }

         const attendanceData = await attendanceResponse.json();

         // Check if the response has the new format with records property
         if (attendanceData.records !== undefined) {
            setAttendance(attendanceData.records);

            // If there's a message and no records, show it to the user
            if (attendanceData.records.length === 0 && attendanceData.message) {
               toast.info(attendanceData.message);
            }
         } else {
            // Handle the old format (array of attendance records)
            setAttendance(attendanceData);
         }
      } catch (error) {
         console.error("Error fetching attendance records:", error);
         toast.error("Failed to load attendance records");
      }
   };

   useEffect(() => {
      if (mounted && status === "authenticated") {
         fetchAttendanceRecords();
      }
   }, [attendanceDate, selectedSubjectId, mounted, status]);

   const handleEnrollStudent = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!studentEmail) {
         toast.error("Student email is required");
         return;
      }

      setIsEnrolling(true);

      try {
         const response = await fetch("/api/enrollments", {
            method: "POST",
            credentials: "include",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               streamId: id,
               studentEmail,
            }),
         });

         const data = await response.json();

         if (!response.ok) {
            throw new Error(data.error || "Failed to enroll student");
         }

         toast.success("Student enrolled successfully");
         setStudentEmail("");

         // Refresh student list
         const studentsResponse = await fetch(
            `/api/enrollments?streamId=${id}`,
            {
               credentials: "include",
               headers: {
                  "Content-Type": "application/json",
               },
            }
         );
         const studentsData = await studentsResponse.json();
         setStudents(studentsData);
      } catch (error) {
         console.error("Error enrolling student:", error);
         toast.error(
            error instanceof Error
               ? error.message
               : "An error occurred while enrolling the student"
         );
      } finally {
         setIsEnrolling(false);
      }
   };

   const handleRecordAttendance = async (
      studentId: number,
      status: "present" | "absent" | "late"
   ) => {
      setIsRecordingAttendance(true);

      try {
         const payload: any = {
            streamId: id,
            studentId,
            date: attendanceDate,
            status,
         };

         if (selectedSubjectId) {
            payload.subjectId = parseInt(selectedSubjectId);
         }

         const response = await fetch("/api/attendance", {
            method: "POST",
            credentials: "include",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
         });

         const data = await response.json();

         if (!response.ok) {
            throw new Error(data.error || "Failed to record attendance");
         }

         toast.success("Attendance recorded successfully");

         // Refresh attendance records
         await fetchAttendanceRecords();
      } catch (error) {
         console.error("Error recording attendance:", error);
         toast.error(
            error instanceof Error
               ? error.message
               : "An error occurred while recording attendance"
         );
      } finally {
         setIsRecordingAttendance(false);
      }
   };

   if (!mounted || status === "loading") {
      return <Loading />;
   }

   if (status === "unauthenticated") {
      router.push("/login");
      return null;
   }

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
               The stream you're looking for doesn't exist or you don't have
               access to it.
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
                  {stream.description || "No description provided"}
               </p>
            </div>
            <Link href="/dashboard">
               <Button variant="outline">Back to Dashboard</Button>
            </Link>
         </div>

         <Tabs
            defaultValue="students"
            value={activeTab}
            onValueChange={setActiveTab}
         >
            <TabsList className="mb-4">
               <TabsTrigger value="students">Students</TabsTrigger>
               <TabsTrigger value="subjects">Subjects</TabsTrigger>
               <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>

            {/* Students Tab */}
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
                        <form
                           onSubmit={handleEnrollStudent}
                           className="mb-6 flex gap-2"
                        >
                           <div className="flex-1">
                              <Label htmlFor="studentEmail" className="sr-only">
                                 Student Email
                              </Label>
                              <Input
                                 id="studentEmail"
                                 placeholder="Enter student email to enroll"
                                 value={studentEmail}
                                 onChange={(e) =>
                                    setStudentEmail(e.target.value)
                                 }
                              />
                           </div>
                           <Button type="submit" disabled={isEnrolling}>
                              {isEnrolling ? "Enrolling..." : "Enroll Student"}
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
                                 <TableHead>Mobile</TableHead>
                                 <TableHead>Registration No.</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {students.map((student) => (
                                 <TableRow key={student.id}>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.email}</TableCell>
                                    <TableCell>
                                       {student.mobile_number || "-"}
                                    </TableCell>
                                    <TableCell>
                                       {student.registration_number || "-"}
                                    </TableCell>
                                 </TableRow>
                              ))}
                           </TableBody>
                        </Table>
                     )}
                  </CardContent>
               </Card>
            </TabsContent>

            {/* Subjects Tab */}
            <TabsContent value="subjects">
               <SubjectManager
                  streamId={parseInt(id as string)}
                  streamName={stream.name}
               />
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance">
               <Card>
                  <CardHeader>
                     <CardTitle>Attendance Records</CardTitle>
                     <CardDescription>
                        Track and view attendance for this stream
                     </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="w-full md:w-1/3">
                           <Label
                              htmlFor="attendanceDate"
                              className="block mb-2"
                           >
                              Select Date
                           </Label>
                           <Input
                              id="attendanceDate"
                              type="date"
                              value={attendanceDate}
                              onChange={(e) =>
                                 setAttendanceDate(e.target.value)
                              }
                           />
                        </div>

                        <div className="w-full md:w-1/3">
                           <Label
                              htmlFor="subjectSelect"
                              className="block mb-2"
                           >
                              Select Subject (Optional)
                           </Label>
                           <Select
                              value={selectedSubjectId}
                              onValueChange={setSelectedSubjectId}
                           >
                              <SelectTrigger id="subjectSelect">
                                 <SelectValue placeholder="All subjects" />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="">All subjects</SelectItem>
                                 {subjects.map((subject) => (
                                    <SelectItem
                                       key={subject.id}
                                       value={subject.id.toString()}
                                    >
                                       {subject.name}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                     </div>

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
                                    (record) => record.student_id === student.id
                                 );

                                 return (
                                    <TableRow key={student.id}>
                                       <TableCell>{student.name}</TableCell>
                                       <TableCell>
                                          {attendanceRecord ? (
                                             <span
                                                className={`font-medium ${
                                                   attendanceRecord.status ===
                                                   "present"
                                                      ? "text-green-600"
                                                      : attendanceRecord.status ===
                                                        "late"
                                                      ? "text-yellow-600"
                                                      : "text-red-600"
                                                }`}
                                             >
                                                {attendanceRecord.status
                                                   .charAt(0)
                                                   .toUpperCase() +
                                                   attendanceRecord.status.slice(
                                                      1
                                                   )}
                                             </span>
                                          ) : (
                                             <span className="text-muted-foreground">
                                                Not recorded
                                             </span>
                                          )}
                                       </TableCell>
                                       {isTeacher && (
                                          <TableCell>
                                             <div className="flex gap-2">
                                                <Button
                                                   variant="outline"
                                                   size="sm"
                                                   className="bg-green-50 hover:bg-green-100 text-green-700"
                                                   onClick={() =>
                                                      handleRecordAttendance(
                                                         student.id,
                                                         "present"
                                                      )
                                                   }
                                                   disabled={
                                                      isRecordingAttendance
                                                   }
                                                >
                                                   Present
                                                </Button>
                                                <Button
                                                   variant="outline"
                                                   size="sm"
                                                   className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                                                   onClick={() =>
                                                      handleRecordAttendance(
                                                         student.id,
                                                         "late"
                                                      )
                                                   }
                                                   disabled={
                                                      isRecordingAttendance
                                                   }
                                                >
                                                   Late
                                                </Button>
                                                <Button
                                                   variant="outline"
                                                   size="sm"
                                                   className="bg-red-50 hover:bg-red-100 text-red-700"
                                                   onClick={() =>
                                                      handleRecordAttendance(
                                                         student.id,
                                                         "absent"
                                                      )
                                                   }
                                                   disabled={
                                                      isRecordingAttendance
                                                   }
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
