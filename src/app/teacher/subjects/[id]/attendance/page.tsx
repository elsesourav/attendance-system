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
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
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
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiFilter } from "react-icons/fi";
import { toast } from "sonner";

interface Subject {
   id: number;
   name: string;
   streamName: string;
   streamId: number;
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

// Type for grouped attendance records
interface GroupedAttendance {
   [date: string]: AttendanceRecord[];
}

export default function TeacherAttendanceView() {
   const params = useParams();
   const router = useRouter();
   const { hideLoading } = useLoading();
   const subjectId = params.id as string;

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
   // Get current date, month, and year for default filters
   const today = new Date();
   const currentMonth = String(today.getMonth() + 1); // Month is 0-indexed
   const currentYear = String(today.getFullYear());

   // Initialize with current month and year as default filters
   const [filterDate, setFilterDate] = useState<string>("");
   const [filterMonth, setFilterMonth] = useState<string>(currentMonth);
   const [filterYear, setFilterYear] = useState<string>(currentYear);
   const [currentPage, setCurrentPage] = useState<number>(1);
   const [totalPages, setTotalPages] = useState<number>(1);
   const [totalRecords, setTotalRecords] = useState<number>(0);
   const pageSize = 50; // Number of records per page
   const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);

   // State to track grouped attendance records by date
   const [groupedAttendance, setGroupedAttendance] =
      useState<GroupedAttendance>({});

   useEffect(() => {
      const fetchAttendanceData = async () => {
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

            // Fetch attendance records is handled by the other useEffect
         } catch (error) {
            console.error("Error fetching attendance data:", error);
            toast.error("Failed to load attendance data");
         } finally {
            setIsLoading(false);
         }
      };

      fetchAttendanceData();
   }, [subjectId, router]);

   const fetchAttendanceRecords = async () => {
      setIsLoadingRecords(true);
      try {
         // Build the URL with filters and pagination
         let url = `/api/teacher/subjects/${subjectId}/attendance?page=${currentPage}&pageSize=${pageSize}`;

         if (filterDate) {
            url += `&date=${filterDate}`;
         } else if (filterMonth && filterYear) {
            url += `&month=${filterMonth}&year=${filterYear}`;
         } else if (filterYear) {
            url += `&year=${filterYear}`;
         }

         const attendanceResponse = await fetch(url);
         if (!attendanceResponse.ok) {
            // Try to get more detailed error information
            try {
               const errorData = await attendanceResponse.json();
               throw new Error(
                  errorData.error ||
                     errorData.details ||
                     "Failed to fetch attendance records"
               );
            } catch (parseError) {
               throw new Error(
                  `Failed to fetch attendance records: ${attendanceResponse.status}`
               );
            }
         }

         const data = await attendanceResponse.json();
         setAttendanceRecords(data.records);
         setTotalPages(data.pagination.totalPages);
         setTotalRecords(data.pagination.total);

         // Group records by date
         const grouped = data.records.reduce(
            (acc: GroupedAttendance, record: AttendanceRecord) => {
               // Format date as YYYY-MM-DD
               const dateKey = new Date(record.date)
                  .toISOString()
                  .split("T")[0];
               if (!acc[dateKey]) {
                  acc[dateKey] = [];
               }
               acc[dateKey].push(record);
               return acc;
            },
            {} as GroupedAttendance
         );

         // Sort dates in descending order (newest first)
         const sortedGrouped: GroupedAttendance = {};
         Object.keys(grouped)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .forEach((date) => {
               sortedGrouped[date] = grouped[date];
            });

         setGroupedAttendance(sortedGrouped);
      } catch (error) {
         console.error("Error fetching attendance records:", error);
         console.error("Request parameters:", {
            subjectId,
            currentPage,
            pageSize,
            filterDate,
            filterMonth,
            filterYear,
         });

         // Show a more detailed error message
         toast.error(
            error instanceof Error
               ? `Failed to load attendance records: ${error.message}`
               : "Failed to load attendance records"
         );
      } finally {
         setIsLoadingRecords(false);
      }
   };

   // Fetch records when filters or pagination changes
   useEffect(() => {
      fetchAttendanceRecords();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [currentPage, filterDate, filterMonth, filterYear, subjectId]);

   const handleAttendanceChange = (
      studentId: number,
      status: "present" | "absent" | "late"
   ) => {
      setAttendanceData((prev) => ({
         ...prev,
         [studentId]: status,
      }));
   };

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
            toast.success("Attendance saved successfully");
            setIsAddingAttendance(false);
            setAttendanceData({});

            // Refresh attendance records
            await fetchAttendanceRecords();
         } else {
            const error = await response.json();
            toast.error(error.error || "Failed to save attendance");
         }
      } catch (error) {
         console.error("Error saving attendance:", error);
         toast.error("An error occurred while saving attendance");
      }
   };

   const handleDateFilterChange = (date: string) => {
      setFilterDate(date);
      setFilterMonth("");
      setFilterYear("");
      setCurrentPage(1);
   };

   const handleMonthYearFilterChange = (month: string, year: string) => {
      setFilterDate("");
      setFilterMonth(month);
      setFilterYear(year);
      setCurrentPage(1);
   };

   const handleYearFilterChange = (year: string) => {
      setFilterDate("");
      setFilterMonth("");
      setFilterYear(year);
      setCurrentPage(1);
   };

   const handlePageChange = (page: number) => {
      setCurrentPage(page);
   };

   if (isLoading) {
      return (
         <div className="text-center py-10">Loading attendance data...</div>
      );
   }

   if (!subject) {
      return null; // Will redirect in the useEffect
   }

   // No need to group by date anymore as we're using pagination and filters

   return (
      <div className="space-y-6">
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
            <h1 className="text-3xl font-bold">Attendance Records</h1>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>{subject.name}</CardTitle>
               <CardDescription>{subject.streamName}</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4">
                     {/* Date Filter - Responsive */}
                     <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <div className="flex items-center gap-2">
                           <FiFilter className="text-muted-foreground flex-shrink-0" />
                           <div className="text-sm font-medium">Date:</div>
                        </div>
                        <div className="flex flex-1 flex-wrap gap-2">
                           <Input
                              type="date"
                              value={filterDate}
                              onChange={(e) =>
                                 handleDateFilterChange(e.target.value)
                              }
                              className="w-full sm:w-40"
                           />
                           <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => {
                                 const today = new Date()
                                    .toISOString()
                                    .split("T")[0];
                                 handleDateFilterChange(today);
                              }}
                           >
                              Today
                           </Button>
                        </div>
                     </div>

                     {/* Month/Year Filter - Responsive */}
                     <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <div className="flex items-center gap-2">
                           <div className="text-sm font-medium ml-6 sm:ml-0">
                              Month/Year:
                           </div>
                        </div>
                        <div className="flex flex-1 flex-wrap gap-2">
                           <select
                              className="h-9 rounded-md border border-input px-3 py-1 w-full sm:w-auto"
                              value={filterMonth}
                              onChange={(e) => {
                                 if (filterYear) {
                                    handleMonthYearFilterChange(
                                       e.target.value,
                                       filterYear
                                    );
                                 } else {
                                    setFilterMonth(e.target.value);
                                 }
                              }}
                           >
                              <option value="">Select Month</option>
                              <option value="1">January</option>
                              <option value="2">February</option>
                              <option value="3">March</option>
                              <option value="4">April</option>
                              <option value="5">May</option>
                              <option value="6">June</option>
                              <option value="7">July</option>
                              <option value="8">August</option>
                              <option value="9">September</option>
                              <option value="10">October</option>
                              <option value="11">November</option>
                              <option value="12">December</option>
                           </select>

                           <select
                              className="h-9 rounded-md border border-input px-3 py-1 w-full sm:w-auto"
                              value={filterYear}
                              onChange={(e) => {
                                 if (filterMonth) {
                                    handleMonthYearFilterChange(
                                       filterMonth,
                                       e.target.value
                                    );
                                 } else {
                                    handleYearFilterChange(e.target.value);
                                 }
                              }}
                           >
                              <option value="">Select Year</option>
                              {Array.from(
                                 { length: 5 },
                                 (_, i) => new Date().getFullYear() - i
                              ).map((year) => (
                                 <option key={year} value={year}>
                                    {year}
                                 </option>
                              ))}
                           </select>

                           <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => {
                                 const today = new Date();
                                 handleMonthYearFilterChange(
                                    String(today.getMonth() + 1),
                                    String(today.getFullYear())
                                 );
                              }}
                           >
                              Current Month
                           </Button>
                        </div>
                     </div>

                     {/* Action Buttons - Responsive */}
                     <div className="flex flex-wrap gap-2 justify-between items-center">
                        {(filterDate || filterMonth || filterYear) && (
                           <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => {
                                 setFilterDate("");
                                 setFilterMonth("");
                                 setFilterYear("");
                                 setCurrentPage(1);
                              }}
                           >
                              Clear Filters
                           </Button>
                        )}

                        {totalRecords > 0 && (
                           <div className="text-sm text-muted-foreground w-full sm:w-auto text-center sm:text-right sm:ml-auto">
                              Showing {totalRecords} records
                           </div>
                        )}
                     </div>
                  </div>

                  <Dialog
                     open={isAddingAttendance}
                     onOpenChange={setIsAddingAttendance}
                  >
                     <DialogContent className="max-w-3xl">
                        <DialogHeader>
                           <DialogTitle>Take Attendance</DialogTitle>
                           <DialogDescription>
                              Record attendance for {subject.name} on{" "}
                              {selectedDate}
                           </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                           <div className="mb-4">
                              <Label htmlFor="attendance-date">Date</Label>
                              <Input
                                 id="attendance-date"
                                 type="date"
                                 value={selectedDate}
                                 onChange={(e) =>
                                    setSelectedDate(e.target.value)
                                 }
                                 className="mt-1"
                              />
                           </div>

                           {students.length === 0 ? (
                              <p className="text-center py-4 text-muted-foreground">
                                 No students enrolled in this stream
                              </p>
                           ) : (
                              <div className="max-h-96 overflow-y-auto">
                                 <Table>
                                    <TableHeader>
                                       <TableRow>
                                          <TableHead>Name</TableHead>
                                          <TableHead>
                                             Registration No.
                                          </TableHead>
                                          <TableHead>Status</TableHead>
                                       </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                       {students.map((student) => (
                                          <TableRow key={student.id}>
                                             <TableCell>
                                                {student.name}
                                             </TableCell>
                                             <TableCell>
                                                {student.registration_number}
                                             </TableCell>
                                             <TableCell>
                                                <Select
                                                   value={
                                                      attendanceData[
                                                         student.id
                                                      ] || ""
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
            </CardContent>
         </Card>

         {isLoadingRecords ? (
            <div className="text-center py-10">
               <p className="text-muted-foreground">
                  Loading attendance records...
               </p>
            </div>
         ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-lg">
               <p className="text-muted-foreground">
                  No attendance records found. Attendance can be taken from the
                  subject page.
               </p>
            </div>
         ) : (
            <>
               {/* Attendance Summary Card */}
               <Card className="mb-6">
                  <CardHeader>
                     <CardTitle>Attendance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="bg-green-50 dark:bg-green-950/30 p-2 sm:p-4 rounded-lg border border-green-200 dark:border-green-800">
                           <div className="text-green-600 dark:text-green-400 font-medium text-sm sm:text-lg text-center sm:text-left">
                              Present
                           </div>
                           <div className="text-xl sm:text-2xl font-bold mt-1 text-green-600 dark:text-green-400 text-center sm:text-left">
                              {
                                 attendanceRecords.filter(
                                    (r) => r.status === "present"
                                 ).length
                              }
                           </div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2 sm:p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                           <div className="text-yellow-600 dark:text-yellow-400 font-medium text-sm sm:text-lg text-center sm:text-left">
                              Late
                           </div>
                           <div className="text-xl sm:text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400 text-center sm:text-left">
                              {
                                 attendanceRecords.filter(
                                    (r) => r.status === "late"
                                 ).length
                              }
                           </div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950/30 p-2 sm:p-4 rounded-lg border border-red-200 dark:border-red-800">
                           <div className="text-red-600 dark:text-red-400 font-medium text-sm sm:text-lg text-center sm:text-left">
                              Absent
                           </div>
                           <div className="text-xl sm:text-2xl font-bold mt-1 text-red-600 dark:text-red-400 text-center sm:text-left">
                              {
                                 attendanceRecords.filter(
                                    (r) => r.status === "absent"
                                 ).length
                              }
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Attendance Records Grouped by Date */}
               <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <h2 className="text-xl font-semibold">
                        Attendance Records
                     </h2>

                     {/* Pagination Controls */}
                     {totalPages > 1 && (
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                           <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              onClick={() => handlePageChange(1)}
                              disabled={currentPage === 1}
                           >
                              First
                           </Button>
                           <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                           >
                              Previous
                           </Button>
                           <span className="text-sm text-center w-full sm:w-auto sm:px-2">
                              Page {currentPage} of {totalPages}
                           </span>
                           <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                           >
                              Next
                           </Button>
                           <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              onClick={() => handlePageChange(totalPages)}
                              disabled={currentPage === totalPages}
                           >
                              Last
                           </Button>
                        </div>
                     )}
                  </div>

                  <div className="text-sm text-muted-foreground mb-4">
                     {filterDate
                        ? `Showing records for ${new Date(
                             filterDate
                          ).toLocaleDateString(undefined, {
                             weekday: "long",
                             year: "numeric",
                             month: "long",
                             day: "numeric",
                          })}`
                        : filterMonth && filterYear
                        ? `Showing records for ${new Date(
                             parseInt(filterYear),
                             parseInt(filterMonth) - 1,
                             1
                          ).toLocaleDateString(undefined, {
                             year: "numeric",
                             month: "long",
                          })}`
                        : filterYear
                        ? `Showing records for ${filterYear}`
                        : "Showing all records"}
                  </div>

                  {/* Display attendance records grouped by date */}
                  {Object.keys(groupedAttendance).length === 0 ? (
                     <div className="text-center py-6 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground">
                           No attendance records found for the selected filters.
                           Try adjusting your filters or go to the subject page
                           to take attendance.
                        </p>
                     </div>
                  ) : (
                     Object.entries(groupedAttendance).map(
                        ([date, records]) => (
                           <Card key={date} className="mb-4">
                              <CardHeader className="pb-2">
                                 <CardTitle className="text-lg">
                                    {new Date(date).toLocaleDateString(
                                       undefined,
                                       {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                       }
                                    )}
                                 </CardTitle>
                                 <CardDescription>
                                    {records.length} student
                                    {records.length !== 1 ? "s" : ""}
                                 </CardDescription>
                              </CardHeader>
                              <CardContent>
                                 <div className="rounded-md border">
                                    <Table>
                                       <TableHeader>
                                          <TableRow>
                                             <TableHead>Student</TableHead>
                                             <TableHead>
                                                Registration No.
                                             </TableHead>
                                             <TableHead>Status</TableHead>
                                          </TableRow>
                                       </TableHeader>
                                       <TableBody>
                                          {records.map((record) => (
                                             <TableRow key={record.id}>
                                                <TableCell>
                                                   {record.student_name}
                                                </TableCell>
                                                <TableCell>
                                                   {record.registration_number}
                                                </TableCell>
                                                <TableCell>
                                                   <span
                                                      className={
                                                         record.status ===
                                                         "present"
                                                            ? "text-green-600 font-medium"
                                                            : record.status ===
                                                              "late"
                                                            ? "text-yellow-600 font-medium"
                                                            : "text-red-600 font-medium"
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
                              </CardContent>
                           </Card>
                        )
                     )
                  )}

                  {/* Bottom Pagination Controls */}
                  {totalPages > 1 && (
                     <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                        <Button
                           variant="outline"
                           size="sm"
                           className="flex-1 sm:flex-none max-w-[100px]"
                           onClick={() => handlePageChange(1)}
                           disabled={currentPage === 1}
                        >
                           First
                        </Button>
                        <Button
                           variant="outline"
                           size="sm"
                           className="flex-1 sm:flex-none max-w-[100px]"
                           onClick={() => handlePageChange(currentPage - 1)}
                           disabled={currentPage === 1}
                        >
                           Previous
                        </Button>
                        <span className="text-sm text-center w-full sm:w-auto sm:px-2">
                           Page {currentPage} of {totalPages}
                        </span>
                        <Button
                           variant="outline"
                           size="sm"
                           className="flex-1 sm:flex-none max-w-[100px]"
                           onClick={() => handlePageChange(currentPage + 1)}
                           disabled={currentPage === totalPages}
                        >
                           Next
                        </Button>
                        <Button
                           variant="outline"
                           size="sm"
                           className="flex-1 sm:flex-none max-w-[100px]"
                           onClick={() => handlePageChange(totalPages)}
                           disabled={currentPage === totalPages}
                        >
                           Last
                        </Button>
                     </div>
                  )}
               </div>
            </>
         )}
      </div>
   );
}
