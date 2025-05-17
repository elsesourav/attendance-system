"use client";

import { useLoading } from "@/components/loading-overlay";
import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
   FiCalendar,
   FiEdit,
   FiEye,
   FiPlus,
   FiSearch,
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

export default function TeacherSubjectsPage() {
   const router = useRouter();
   const { showLoading, hideLoading } = useLoading();
   const [subjects, setSubjects] = useState<Subject[]>([]);
   const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");

   // Hide loading overlay when component mounts
   useEffect(() => {
      hideLoading();
   }, [hideLoading]);

   useEffect(() => {
      const fetchSubjects = async () => {
         setIsLoading(true);
         showLoading("Loading subjects...");

         try {
            const response = await fetch("/api/teacher/subjects");
            if (!response.ok) {
               throw new Error("Failed to fetch subjects");
            }

            const data = await response.json();
            setSubjects(data);
            setFilteredSubjects(data);
         } catch (error) {
            console.error("Error fetching subjects:", error);
            toast.error("Failed to load subjects");
         } finally {
            setIsLoading(false);
            hideLoading();
         }
      };

      fetchSubjects();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   useEffect(() => {
      // Filter subjects based on search term
      if (searchTerm.trim() === "") {
         setFilteredSubjects(subjects);
      } else {
         const term = searchTerm.toLowerCase();
         const filtered = subjects.filter(
            (subject) =>
               subject.name.toLowerCase().includes(term) ||
               subject.description?.toLowerCase().includes(term) ||
               subject.streamName.toLowerCase().includes(term)
         );
         setFilteredSubjects(filtered);
      }
   }, [searchTerm, subjects]);

   // Loading state is now handled by the loading overlay

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <h1 className="text-2xl sm:text-3xl font-bold">All Subjects</h1>
            <Link
               href="/teacher/subjects/create"
               onClick={() => showLoading("Loading subject creation form...")}
               className="w-full sm:w-auto"
            >
               <Button className="w-full sm:w-auto">
                  <FiPlus className="mr-2" />
                  Create Subject
               </Button>
            </Link>
         </div>

         <div className="flex items-center space-x-2 mb-6">
            <FiSearch className="text-muted-foreground flex-shrink-0" />
            <Input
               placeholder="Search subjects..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full"
            />
         </div>

         {filteredSubjects.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-lg">
               <p className="text-muted-foreground mb-4">
                  {searchTerm
                     ? "No subjects match your search"
                     : "No subjects found"}
               </p>
            </div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
               {filteredSubjects.map((subject) => (
                  <Card key={subject.id} className="flex flex-col h-full">
                     <CardHeader>
                        <CardTitle className="line-clamp-1">
                           {subject.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">
                           Stream: {subject.streamName}
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                           {subject.description || "No description provided"}
                        </p>
                        <div className="text-sm text-muted-foreground">
                           <p>Students: {subject.studentCount}</p>
                        </div>
                     </CardContent>
                     <CardFooter className="flex flex-col gap-4 mt-auto">
                        <div className="grid grid-cols-2 gap-2 w-full">
                           <Link
                              href={`/teacher/subjects/${subject.id}`}
                              onClick={() =>
                                 showLoading(
                                    `Loading ${subject.name} subject...`
                                 )
                              }
                              className="w-full"
                           >
                              <Button
                                 variant="outline"
                                 size="sm"
                                 className="w-full"
                              >
                                 <FiEye className="mr-2" />
                                 View
                              </Button>
                           </Link>
                           <Link
                              href={`/teacher/subjects/${subject.id}/students`}
                              onClick={() =>
                                 showLoading(
                                    `Loading students for ${subject.name}...`
                                 )
                              }
                              className="w-full"
                           >
                              <Button
                                 variant="outline"
                                 size="sm"
                                 className="w-full"
                              >
                                 <FiUsers className="mr-2" />
                                 Students
                              </Button>
                           </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-2 w-full">
                           <Link
                              href={`/teacher/subjects/${subject.id}/attendance`}
                              onClick={() =>
                                 showLoading(
                                    `Loading attendance for ${subject.name}...`
                                 )
                              }
                              className="w-full"
                           >
                              <Button
                                 variant="outline"
                                 size="sm"
                                 className="w-full"
                              >
                                 <FiCalendar className="mr-2" />
                                 Attendance
                              </Button>
                           </Link>
                           <Link
                              href={`/teacher/subjects/${subject.id}/edit`}
                              onClick={() =>
                                 showLoading(
                                    `Loading edit form for ${subject.name}...`
                                 )
                              }
                              className="w-full"
                           >
                              <Button
                                 variant="outline"
                                 size="sm"
                                 className="w-full"
                              >
                                 <FiEdit className="mr-2" />
                                 Edit
                              </Button>
                           </Link>
                        </div>
                     </CardFooter>
                  </Card>
               ))}
            </div>
         )}
      </div>
   );
}
