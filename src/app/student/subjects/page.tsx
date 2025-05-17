"use client";

import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";

import { useEffect, useState } from "react";
import { FiBook, FiCalendar, FiSearch } from "react-icons/fi";
import { toast } from "sonner";

interface Subject {
   id: number;
   name: string;
   description: string | null;
   stream_id: number;
   stream_name: string;
   teacher_name: string;
}

export default function StudentSubjectsPage() {
   const [subjects, setSubjects] = useState<Subject[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);

   useEffect(() => {
      const fetchSubjects = async () => {
         try {
            const response = await fetch("/api/student/subjects");
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
         }
      };

      fetchSubjects();
   }, []);

   useEffect(() => {
      if (searchTerm.trim() === "") {
         setFilteredSubjects(subjects);
      } else {
         const lowercaseSearch = searchTerm.toLowerCase();
         const filtered = subjects.filter(
            (subject) =>
               subject.name.toLowerCase().includes(lowercaseSearch) ||
               (subject.description &&
                  subject.description
                     .toLowerCase()
                     .includes(lowercaseSearch)) ||
               subject.stream_name.toLowerCase().includes(lowercaseSearch)
         );
         setFilteredSubjects(filtered);
      }
   }, [searchTerm, subjects]);

   // Group subjects by stream
   const groupedByStream: { [key: string]: Subject[] } = {};
   filteredSubjects.forEach((subject) => {
      if (!groupedByStream[subject.stream_name]) {
         groupedByStream[subject.stream_name] = [];
      }
      groupedByStream[subject.stream_name].push(subject);
   });

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">My Subjects</h1>
            <div className="relative w-64">
               <FiSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input
                  type="search"
                  placeholder="Search subjects..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
         </div>

         {isLoading ? (
            <div className="text-center py-10">Loading subjects...</div>
         ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-lg">
               <p className="text-muted-foreground">
                  {searchTerm
                     ? "No subjects match your search"
                     : "You are not enrolled in any subjects"}
               </p>
            </div>
         ) : (
            <div className="space-y-8">
               {Object.entries(groupedByStream).map(
                  ([streamName, streamSubjects]) => (
                     <div key={streamName} className="space-y-4">
                        <div className="flex items-center">
                           <h2 className="text-xl font-semibold">
                              {streamName}
                           </h2>
                           {streamSubjects[0].stream_id && (
                              <Link
                                 href={`/student/streams/${streamSubjects[0].stream_id}`}
                              >
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2"
                                 >
                                    View Stream
                                 </Button>
                              </Link>
                           )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {streamSubjects.map((subject) => (
                              <Card
                                 key={subject.id}
                                 className="overflow-hidden"
                              >
                                 <CardHeader className="pb-3">
                                    <CardTitle>{subject.name}</CardTitle>
                                    <CardDescription>
                                       Teacher: {subject.teacher_name}
                                    </CardDescription>
                                 </CardHeader>
                                 <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                       {subject.description ||
                                          "No description provided"}
                                    </p>
                                    <div className="flex justify-between mt-4">
                                       <Link
                                          href={`/student/subjects/${subject.id}`}
                                       >
                                          <Button variant="outline" size="sm">
                                             <FiBook className="mr-2 h-4 w-4" />
                                             View Details
                                          </Button>
                                       </Link>
                                       <Link
                                          href={`/student/subjects/${subject.id}/attendance`}
                                       >
                                          <Button variant="outline" size="sm">
                                             <FiCalendar className="mr-2 h-4 w-4" />
                                             Attendance
                                          </Button>
                                       </Link>
                                    </div>
                                 </CardContent>
                              </Card>
                           ))}
                        </div>
                     </div>
                  )
               )}
            </div>
         )}
      </div>
   );
}
