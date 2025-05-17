"use client";

import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiCalendar } from "react-icons/fi";
import { toast } from "sonner";

interface Stream {
   id: number;
   name: string;
   description: string | null;
   teacherName: string;
}

interface Subject {
   id: number;
   name: string;
   description: string | null;
}

export default function StudentStreamView() {
   const params = useParams();
   const router = useRouter();
   const streamId = params.id as string;

   const [stream, setStream] = useState<Stream | null>(null);
   const [subjects, setSubjects] = useState<Subject[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const fetchStreamDetails = async () => {
         try {
            // Fetch stream details
            const streamResponse = await fetch(
               `/api/student/streams/${streamId}`
            );
            if (!streamResponse.ok) {
               if (streamResponse.status === 404) {
                  toast.error("Stream not found");
                  router.push("/student/streams");
                  return;
               }
               throw new Error("Failed to fetch stream details");
            }

            const streamData = await streamResponse.json();
            setStream(streamData);

            // Fetch subjects in this stream
            const subjectsResponse = await fetch(
               `/api/student/streams/${streamId}/subjects`
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
               onClick={() => {
                  // Just navigate back without showing loading
                  router.back();
               }}
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
               <p className="text-sm text-muted-foreground">
                  Teacher: {stream.teacherName}
               </p>
            </CardContent>
         </Card>

         <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Subjects</h2>

            {subjects.length === 0 ? (
               <p className="text-muted-foreground">
                  No subjects have been added to this stream yet.
               </p>
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
                        <CardContent className="pt-0">
                           <Link
                              href={`/student/subjects/${subject.id}/attendance`}
                           >
                              <Button variant="outline" className="w-full mt-4">
                                 <FiCalendar className="mr-2" />
                                 View Attendance
                              </Button>
                           </Link>
                        </CardContent>
                     </Card>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
