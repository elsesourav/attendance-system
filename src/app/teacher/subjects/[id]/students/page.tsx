"use client";

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
   DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { FiArrowLeft, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";

interface Subject {
   id: number;
   name: string;
   description: string | null;
   streamName: string;
   streamId: number;
}

interface Student {
   id: number;
   name: string;
   email: string;
   registration_number: string;
}

export default function ManageSubjectStudents() {
   const params = useParams();
   const router = useRouter();
   const subjectId = params.id as string;

   const [subject, setSubject] = useState<Subject | null>(null);
   const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
   const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isAddingStudent, setIsAddingStudent] = useState(false);
   const [searchTerm, setSearchTerm] = useState("");
   const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

   useEffect(() => {
      const fetchSubjectAndStudents = async () => {
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

            // Fetch enrolled students
            const enrolledResponse = await fetch(
               `/api/teacher/subjects/${subjectId}/students`
            );
            if (!enrolledResponse.ok) {
               throw new Error("Failed to fetch enrolled students");
            }

            const enrolledData = await enrolledResponse.json();
            setEnrolledStudents(enrolledData);

            // Fetch available students
            const availableResponse = await fetch(
               `/api/teacher/students/available-for-subject?subjectId=${subjectId}`
            );
            if (!availableResponse.ok) {
               throw new Error("Failed to fetch available students");
            }

            const availableData = await availableResponse.json();
            setAvailableStudents(availableData);
            setFilteredStudents(availableData);
         } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
         } finally {
            setIsLoading(false);
         }
      };

      fetchSubjectAndStudents();
   }, [subjectId, router]);

   useEffect(() => {
      // Filter available students based on search term
      const filtered = availableStudents.filter(
         (student) =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.registration_number
               .toLowerCase()
               .includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
   }, [searchTerm, availableStudents]);

   const handleEnrollStudent = async (studentId: number) => {
      try {
         const response = await fetch(
            `/api/teacher/subjects/${subjectId}/students`,
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({ studentId }),
            }
         );

         if (response.ok) {
            // Find the student in available students
            const student = availableStudents.find((s) => s.id === studentId);
            if (student) {
               // Add to enrolled students
               setEnrolledStudents([...enrolledStudents, student]);
               // Remove from available students
               setAvailableStudents(
                  availableStudents.filter((s) => s.id !== studentId)
               );
               setFilteredStudents(
                  filteredStudents.filter((s) => s.id !== studentId)
               );
               toast.success(`${student.name} enrolled successfully`);
            }
         } else {
            const error = await response.json();
            toast.error(error.error || "Failed to enroll student");
         }
      } catch (error) {
         console.error("Error enrolling student:", error);
         toast.error("An error occurred while enrolling the student");
      }
   };

   const handleUnenrollStudent = async (studentId: number) => {
      if (
         !confirm(
            "Are you sure you want to remove this student from the subject?"
         )
      ) {
         return;
      }

      try {
         const response = await fetch(
            `/api/teacher/subjects/${subjectId}/students/${studentId}`,
            {
               method: "DELETE",
            }
         );

         if (response.ok) {
            // Find the student in enrolled students
            const student = enrolledStudents.find((s) => s.id === studentId);
            if (student) {
               // Remove from enrolled students
               setEnrolledStudents(
                  enrolledStudents.filter((s) => s.id !== studentId)
               );
               // Add to available students
               setAvailableStudents([...availableStudents, student]);
               setFilteredStudents([...filteredStudents, student]);
               toast.success(`${student.name} removed from subject`);
            }
         } else {
            const error = await response.json();
            toast.error(error.error || "Failed to remove student");
         }
      } catch (error) {
         console.error("Error removing student:", error);
         toast.error("An error occurred while removing the student");
      }
   };

   if (isLoading) {
      return <div className="text-center py-10">Loading...</div>;
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
                  // Preserve the 'from' parameter if it exists
                  const searchParams = new URLSearchParams(
                     window.location.search
                  );
                  const fromParam = searchParams.get("from");

                  if (fromParam) {
                     router.push(
                        `/teacher/subjects/${subjectId}?from=${fromParam}`
                     );
                  } else {
                     router.push(`/teacher/subjects/${subjectId}`);
                  }
               }}
            >
               <FiArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Manage Students</h1>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>{subject.name}</CardTitle>
               <CardDescription>
                  {subject.description || "No description provided"}
                  <div className="mt-1 text-sm">
                     Stream: {subject.streamName}
                  </div>
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                     <h2 className="text-xl font-semibold">
                        Enrolled Students ({enrolledStudents.length})
                     </h2>
                     <Dialog
                        open={isAddingStudent}
                        onOpenChange={setIsAddingStudent}
                     >
                        <DialogTrigger asChild>
                           <Button>
                              <FiPlus className="mr-2" />
                              Add Student
                           </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                           <DialogHeader>
                              <DialogTitle>Add Students to Subject</DialogTitle>
                              <DialogDescription>
                                 Enroll students in {subject.name}
                              </DialogDescription>
                           </DialogHeader>
                           <div className="py-4">
                              <div className="flex items-center space-x-2 mb-4">
                                 <FiSearch className="text-muted-foreground" />
                                 <Input
                                    placeholder="Search by name, email, or registration number"
                                    value={searchTerm}
                                    onChange={(e) =>
                                       setSearchTerm(e.target.value)
                                    }
                                    className="flex-1"
                                 />
                              </div>

                              {filteredStudents.length === 0 ? (
                                 <p className="text-center py-4 text-muted-foreground">
                                    No students available to enroll
                                 </p>
                              ) : (
                                 <div className="max-h-96 overflow-y-auto">
                                    <Table>
                                       <TableHeader>
                                          <TableRow>
                                             <TableHead>Name</TableHead>
                                             <TableHead>Email</TableHead>
                                             <TableHead>
                                                Registration No.
                                             </TableHead>
                                             <TableHead className="text-right">
                                                Action
                                             </TableHead>
                                          </TableRow>
                                       </TableHeader>
                                       <TableBody>
                                          {filteredStudents.map((student) => (
                                             <TableRow key={student.id}>
                                                <TableCell>
                                                   {student.name}
                                                </TableCell>
                                                <TableCell>
                                                   {student.email}
                                                </TableCell>
                                                <TableCell>
                                                   {student.registration_number}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                   <Button
                                                      size="sm"
                                                      onClick={() =>
                                                         handleEnrollStudent(
                                                            student.id
                                                         )
                                                      }
                                                   >
                                                      Enroll
                                                   </Button>
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
                                 onClick={() => setIsAddingStudent(false)}
                              >
                                 Close
                              </Button>
                           </DialogFooter>
                        </DialogContent>
                     </Dialog>
                  </div>

                  {enrolledStudents.length === 0 ? (
                     <div className="text-center py-6 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground">
                           No students enrolled in this subject yet
                        </p>
                        <Button
                           variant="outline"
                           className="mt-2"
                           onClick={() => setIsAddingStudent(true)}
                        >
                           <FiPlus className="mr-2" />
                           Add Students
                        </Button>
                     </div>
                  ) : (
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Registration No.</TableHead>
                              <TableHead className="text-right">
                                 Action
                              </TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {enrolledStudents.map((student) => (
                              <TableRow key={student.id}>
                                 <TableCell>{student.name}</TableCell>
                                 <TableCell>{student.email}</TableCell>
                                 <TableCell>
                                    {student.registration_number}
                                 </TableCell>
                                 <TableCell className="text-right">
                                    <Button
                                       variant="outline"
                                       size="icon"
                                       className="text-red-500 hover:text-red-600"
                                       onClick={() =>
                                          handleUnenrollStudent(student.id)
                                       }
                                    >
                                       <FiTrash2 className="h-4 w-4" />
                                    </Button>
                                 </TableCell>
                              </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  )}
               </div>
            </CardContent>
         </Card>
      </div>
   );
}
