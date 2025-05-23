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
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
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

interface Stream {
   id: number;
   name: string;
}

export default function TeacherSubjectsPage() {
   const { showLoading, hideLoading } = useLoading();
   const [subjects, setSubjects] = useState<Subject[]>([]);
   const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
   const [, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [isAddingSubject, setIsAddingSubject] = useState(false);
   const [streams, setStreams] = useState<Stream[]>([]);
   const [newSubject, setNewSubject] = useState({
      name: "",
      description: "",
      streamId: "",
   });

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

   // Fetch streams for the dropdown
   useEffect(() => {
      const fetchStreams = async () => {
         try {
            const response = await fetch("/api/teacher/streams");
            if (!response.ok) {
               throw new Error("Failed to fetch streams");
            }

            const data = await response.json();
            setStreams(data);
         } catch (error) {
            console.error("Error fetching streams:", error);
            toast.error("Failed to load streams");
         }
      };

      if (isAddingSubject) {
         fetchStreams();
      }
   }, [isAddingSubject]);

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

   const handleAddSubject = async () => {
      if (!newSubject.name.trim()) {
         toast.error("Subject name is required");
         return;
      }

      if (!newSubject.streamId) {
         toast.error("Please select a stream");
         return;
      }

      showLoading("Adding new subject...");

      try {
         const response = await fetch(
            `/api/teacher/streams/${newSubject.streamId}/subjects`,
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  name: newSubject.name,
                  description: newSubject.description,
               }),
            }
         );

         if (response.ok) {
            await response.json(); // Parse response but we don't need the data

            // Fetch updated subjects list
            const subjectsResponse = await fetch("/api/teacher/subjects");
            if (subjectsResponse.ok) {
               const subjectsData = await subjectsResponse.json();
               setSubjects(subjectsData);
               setFilteredSubjects(subjectsData);
            }

            setNewSubject({ name: "", description: "", streamId: "" });
            setIsAddingSubject(false);
            toast.success("Subject added successfully");
         } else {
            const error = await response.json();
            toast.error(error.error || "Failed to add subject");
         }
      } catch (error) {
         console.error("Error adding subject:", error);
         toast.error("An error occurred while adding the subject");
      } finally {
         hideLoading();
      }
   };

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <h1 className="text-2xl sm:text-3xl font-bold">All Subjects</h1>
            <Dialog open={isAddingSubject} onOpenChange={setIsAddingSubject}>
               <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                     <FiPlus className="mr-2" />
                     Add Subject
                  </Button>
               </DialogTrigger>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>Add New Subject</DialogTitle>
                     <DialogDescription>
                        Create a new subject for a stream.
                     </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="stream-select">Select Stream</Label>
                        <Select
                           value={newSubject.streamId}
                           onValueChange={(value) =>
                              setNewSubject({
                                 ...newSubject,
                                 streamId: value,
                              })
                           }
                        >
                           <SelectTrigger id="stream-select"   className="w-full">
                              <SelectValue placeholder="Select a stream" />
                           </SelectTrigger>
                           <SelectContent>
                              {streams.map((stream) => (
                                 <SelectItem
                                    key={stream.id}
                                    value={String(stream.id)}
                                 >
                                    {stream.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="subject-name">Subject Name</Label>
                        <Input
                           id="subject-name"
                           value={newSubject.name}
                           onChange={(e) =>
                              setNewSubject({
                                 ...newSubject,
                                 name: e.target.value,
                              })
                           }
                           placeholder="e.g., Mathematics"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="subject-description">
                           Description (Optional)
                        </Label>
                        <Textarea
                           id="subject-description"
                           value={newSubject.description}
                           onChange={(e) =>
                              setNewSubject({
                                 ...newSubject,
                                 description: e.target.value,
                              })
                           }
                           placeholder="Provide a brief description of this subject"
                           rows={3}
                        />
                     </div>
                  </div>
                  <DialogFooter>
                     <Button
                        variant="outline"
                        onClick={() => setIsAddingSubject(false)}
                     >
                        Cancel
                     </Button>
                     <Button onClick={handleAddSubject}>Add Subject</Button>
                  </DialogFooter>
               </DialogContent>
            </Dialog>
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
