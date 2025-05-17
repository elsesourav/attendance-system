"use client";

import { DeleteConfirmation } from "@/components/delete-confirmation";
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
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiBook, FiEdit, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";

interface Stream {
   id: number;
   name: string;
   description: string | null;
   subjectCount: number;
   studentCount: number;
}

export default function TeacherStreams() {
   const { data: session } = useSession();
   const { showLoading, hideLoading } = useLoading();
   const [streams, setStreams] = useState<Stream[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [streamToDelete, setStreamToDelete] = useState<number | null>(null);

   // Hide loading overlay when component mounts
   useEffect(() => {
      hideLoading();
   }, [hideLoading]);

   useEffect(() => {
      const fetchStreams = async () => {
         setIsLoading(true);
         showLoading("Loading streams...");

         try {
            const response = await fetch("/api/teacher/streams");
            if (response.ok) {
               const data = await response.json();
               setStreams(data);
            } else {
               toast.error("Failed to load streams");
            }
         } catch (error) {
            console.error("Error fetching streams:", error);
            toast.error("Failed to load streams");
         } finally {
            setIsLoading(false);
            hideLoading();
         }
      };

      fetchStreams();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const openDeleteDialog = (id: number) => {
      setStreamToDelete(id);
      setDeleteDialogOpen(true);
   };

   const handleDeleteStream = async () => {
      if (!streamToDelete) return;

      showLoading("Deleting stream...");

      try {
         const response = await fetch(
            `/api/teacher/streams/${streamToDelete}`,
            {
               method: "DELETE",
            }
         );

         if (response.ok) {
            setStreams(
               streams.filter((stream) => stream.id !== streamToDelete)
            );
            toast.success("Stream deleted successfully");
         } else {
            const error = await response.json();
            toast.error(error.message || "Failed to delete stream");
         }
      } catch (error) {
         console.error("Error deleting stream:", error);
         toast.error("An error occurred while deleting the stream");
      } finally {
         setDeleteDialogOpen(false);
         setStreamToDelete(null);
         hideLoading();
      }
   };

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Streams</h1>
            <Link
               href="/teacher/streams/create"
               onClick={() => showLoading("Loading stream creation form...")}
               className="w-full sm:w-auto"
            >
               <Button className="w-full sm:w-auto">
                  <FiPlus className="mr-2" />
                  Create Stream
               </Button>
            </Link>
         </div>

         {isLoading ? (
            <div className="text-center py-10">Loading streams...</div>
         ) : streams.length === 0 ? (
            <div className="text-center py-10">
               <p className="text-muted-foreground mb-4">
                  You haven't created any streams yet.
               </p>
               <Link
                  href="/teacher/streams/create"
                  onClick={() => showLoading("Loading stream creation form...")}
                  className="inline-block w-full sm:w-auto"
               >
                  <Button className="w-full sm:w-auto">
                     <FiPlus className="mr-2" />
                     Create Your First Stream
                  </Button>
               </Link>
            </div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
               {streams.map((stream) => (
                  <Card key={stream.id} className="flex flex-col h-full">
                     <CardHeader>
                        <CardTitle className="line-clamp-1">
                           {stream.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                           {stream.description || "No description provided"}
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <div className="flex justify-between text-sm text-muted-foreground">
                           <div>Subjects: {stream.subjectCount}</div>
                           <div>Students: {stream.studentCount}</div>
                        </div>
                     </CardContent>
                     <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between mt-auto">
                        <Link
                           href={`/teacher/streams/${stream.id}`}
                           onClick={() =>
                              showLoading(`Loading ${stream.name} stream...`)
                           }
                           className="w-full sm:w-auto"
                        >
                           <Button
                              variant="outline"
                              className="w-full sm:w-auto"
                           >
                              <FiBook className="mr-2" />
                              View
                           </Button>
                        </Link>
                        <div className="flex space-x-2 w-full sm:w-auto justify-end">
                           <Link
                              href={`/teacher/streams/${stream.id}/edit`}
                              onClick={() =>
                                 showLoading(
                                    `Loading edit form for ${stream.name}...`
                                 )
                              }
                           >
                              <Button variant="outline" size="icon">
                                 <FiEdit className="h-4 w-4" />
                              </Button>
                           </Link>
                           <Button
                              variant="outline"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => openDeleteDialog(stream.id)}
                           >
                              <FiTrash2 className="h-4 w-4" />
                           </Button>
                        </div>
                     </CardFooter>
                  </Card>
               ))}
            </div>
         )}

         <DeleteConfirmation
            isOpen={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={handleDeleteStream}
            title="Delete Stream"
            description="Are you sure you want to delete this stream? This will also delete all subjects and attendance records associated with it."
         />
      </div>
   );
}
