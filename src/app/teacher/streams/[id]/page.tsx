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
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiEdit, FiPlus, FiTrash2, FiUsers } from "react-icons/fi";
import { toast } from "sonner";

interface Stream {
   id: number;
   name: string;
   description: string | null;
   subjectCount: number;
   studentCount: number;
}

interface Subject {
   id: number;
   name: string;
   description: string | null;
}

export default function TeacherStreamView() {
   const params = useParams();
   const router = useRouter();
   const streamId = params.id as string;

   const [stream, setStream] = useState<Stream | null>(null);
   const [subjects, setSubjects] = useState<Subject[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isAddingSubject, setIsAddingSubject] = useState(false);
   const [newSubject, setNewSubject] = useState({
      name: "",
      description: "",
   });

   useEffect(() => {
      const fetchStreamDetails = async () => {
         try {
            // Fetch stream details
            const streamResponse = await fetch(
               `/api/teacher/streams/${streamId}`
            );
            if (!streamResponse.ok) {
               if (streamResponse.status === 404) {
                  toast.error("Stream not found");
                  router.push("/teacher/streams");
                  return;
               }
               throw new Error("Failed to fetch stream details");
            }

            const streamData = await streamResponse.json();
            setStream(streamData);

            // Fetch subjects in this stream
            const subjectsResponse = await fetch(
               `/api/teacher/streams/${streamId}/subjects`
            );
            if (!subjectsResponse.ok) {
               throw new Error("Failed to fetch subjects");
            }

            const subjectsData = await subjectsResponse.json();
            setSubjects(subjectsData);
         } catch (error) {
            console.error("Error fetching stream details:", error);
            toast.error("Failed to load stream details");
         } finally {
            setIsLoading(false);
         }
      };

      fetchStreamDetails();
   }, [streamId, router]);

   const handleAddSubject = async () => {
      if (!newSubject.name.trim()) {
         toast.error("Subject name is required");
         return;
      }

      try {
         const response = await fetch(
            `/api/teacher/streams/${streamId}/subjects`,
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify(newSubject),
            }
         );

         if (response.ok) {
            const data = await response.json();
            setSubjects([...subjects, data]);
            setNewSubject({ name: "", description: "" });
            setIsAddingSubject(false);
            toast.success("Subject added successfully");
         } else {
            const error = await response.json();
            toast.error(error.error || "Failed to add subject");
         }
      } catch (error) {
         console.error("Error adding subject:", error);
         toast.error("An error occurred while adding the subject");
      }
   };

   const handleDeleteSubject = async (subjectId: number) => {
      if (
         !confirm(
            "Are you sure you want to delete this subject? This will also delete all attendance records associated with it."
         )
      ) {
         return;
      }

      try {
         const response = await fetch(`/api/teacher/subjects/${subjectId}`, {
            method: "DELETE",
         });

         if (response.ok) {
            setSubjects(subjects.filter((subject) => subject.id !== subjectId));
            toast.success("Subject deleted successfully");
         } else {
            const error = await response.json();
            toast.error(error.error || "Failed to delete subject");
         }
      } catch (error) {
         console.error("Error deleting subject:", error);
         toast.error("An error occurred while deleting the subject");
      }
   };

   if (isLoading) {
      return <div className="text-center py-10">Loading stream details...</div>;
   }

   if (!stream) {
      return null; // Will redirect in the useEffect
   }

   return (
      <div className="space-y-6">
         <div className="flex items-center">
            <Button
               variant="ghost"
               size="icon"
               className="mr-2"
               onClick={() => router.push("/teacher/streams")}
            >
               <FiArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">{stream.name}</h1>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>Stream Details</CardTitle>
               <CardDescription>
                  {stream.description || "No description provided"}
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex justify-between text-sm text-muted-foreground">
                  <div>Subjects: {stream.subjectCount}</div>
                  <div>Students: {stream.studentCount}</div>
               </div>
            </CardContent>
            <CardFooter className="flex justify-end">
               <Link href={`/teacher/streams/${streamId}/edit`}>
                  <Button variant="outline">
                     <FiEdit className="mr-2" />
                     Edit Stream
                  </Button>
               </Link>
            </CardFooter>
         </Card>

         <div className="mt-8 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Subjects</h2>
            <Dialog open={isAddingSubject} onOpenChange={setIsAddingSubject}>
               <DialogTrigger asChild>
                  <Button>
                     <FiPlus className="mr-2" />
                     Add Subject
                  </Button>
               </DialogTrigger>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>Add New Subject</DialogTitle>
                     <DialogDescription>
                        Create a new subject for this stream.
                     </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
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

         {subjects.length === 0 ? (
            <div className="text-center py-10">
               <p className="text-muted-foreground mb-4">
                  No subjects have been added to this stream yet.
               </p>
               <Button onClick={() => setIsAddingSubject(true)}>
                  <FiPlus className="mr-2" />
                  Add Your First Subject
               </Button>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {subjects.map((subject) => (
                  <Card key={subject.id}>
                     <CardHeader>
                        <CardTitle>{subject.name}</CardTitle>
                        <CardDescription>
                           {subject.description || "No description provided"}
                        </CardDescription>
                     </CardHeader>
                     <CardContent className="pt-0 pb-2">
                        <div className="flex justify-between mt-4">
                           <Link
                              href={`/teacher/subjects/${subject.id}/students?from=stream`}
                           >
                              <Button variant="outline" size="sm">
                                 <FiUsers className="mr-2" />
                                 Manage Students
                              </Button>
                           </Link>
                           <Link
                              href={`/teacher/subjects/${subject.id}?from=stream`}
                           >
                              <Button variant="outline" size="sm">
                                 View
                              </Button>
                           </Link>
                        </div>
                     </CardContent>
                     <CardFooter className="flex justify-between pt-2">
                        <div className="space-x-2">
                           <Link
                              href={`/teacher/subjects/${subject.id}/edit?from=stream`}
                           >
                              <Button variant="outline" size="icon">
                                 <FiEdit className="h-4 w-4" />
                              </Button>
                           </Link>
                           <Button
                              variant="outline"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteSubject(subject.id)}
                           >
                              <FiTrash2 className="h-4 w-4" />
                           </Button>
                        </div>
                     </CardFooter>
                  </Card>
               ))}
            </div>
         )}
      </div>
   );
}
