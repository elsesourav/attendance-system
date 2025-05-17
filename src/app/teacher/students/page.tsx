"use client";

import { useLoading } from "@/components/loading-overlay";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { toast } from "sonner";

interface Student {
   id: number;
   name: string;
   email: string;
   registration_number: string;
   mobile_number: string;
}

export default function TeacherStudentsPage() {
   const { showLoading, hideLoading } = useLoading();
   const [students, setStudents] = useState<Student[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

   // Hide loading overlay when component mounts
   useEffect(() => {
      hideLoading();
   }, [hideLoading]);

   useEffect(() => {
      const fetchStudents = async () => {
         setIsLoading(true);
         showLoading("Loading students...");

         try {
            const response = await fetch("/api/teacher/students");
            if (response.ok) {
               const data = await response.json();
               setStudents(data);
               setFilteredStudents(data);
            } else {
               throw new Error("Failed to fetch students");
            }
         } catch (error) {
            console.error("Error fetching students:", error);
            toast.error("Failed to load students");
         } finally {
            setIsLoading(false);
            hideLoading();
         }
      };

      fetchStudents();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   useEffect(() => {
      // Filter students based on search term
      const filtered = students.filter(
         (student) =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.registration_number
               .toLowerCase()
               .includes(searchTerm.toLowerCase()) ||
            student.mobile_number
               .toLowerCase()
               .includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
   }, [searchTerm, students]);

   // Removed handleViewStudent function as it's no longer needed

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Students</h1>
            <div className="flex items-center space-x-2">
               <FiSearch className="text-muted-foreground" />
               <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
               />
            </div>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>All Students</CardTitle>
               <CardDescription>
                  View and manage all students in the system
               </CardDescription>
            </CardHeader>
            <CardContent>
               {isLoading ? (
                  <div className="text-center py-10">Loading students...</div>
               ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-10">
                     <p className="text-muted-foreground">No students found</p>
                  </div>
               ) : (
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Name</TableHead>
                           <TableHead>Email</TableHead>
                           <TableHead>Registration No.</TableHead>
                           <TableHead>Mobile Number</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {filteredStudents.map((student) => (
                           <TableRow key={student.id}>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>{student.email}</TableCell>
                              <TableCell>
                                 {student.registration_number}
                              </TableCell>
                              <TableCell>{student.mobile_number}</TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               )}
            </CardContent>
         </Card>
      </div>
   );
}
