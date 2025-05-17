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
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiBook, FiCalendar } from "react-icons/fi";
import { toast } from "sonner";

interface Stream {
   id: number;
   name: string;
   description: string | null;
   subjectCount: number;
   teacherName: string;
}

export default function StudentStreams() {
   useSession(); // Ensure user is authenticated
   const [streams, setStreams] = useState<Stream[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const fetchStreams = async () => {
         try {
            const response = await fetch("/api/student/streams");
            if (response.ok) {
               const data = await response.json();
               setStreams(data);
            }
         } catch (error) {
            console.error("Error fetching streams:", error);
            toast.error("Failed to load streams");
         } finally {
            setIsLoading(false);
         }
      };

      fetchStreams();
   }, []);

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">My Streams</h1>
         </div>

         {isLoading ? (
            <div className="text-center py-10">Loading streams...</div>
         ) : streams.length === 0 ? (
            <div className="text-center py-10">
               <p className="text-muted-foreground mb-4">
                  You are not enrolled in any streams yet.
               </p>
               <p className="text-sm text-muted-foreground">
                  Please contact your teacher to be enrolled in a stream.
               </p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {streams.map((stream) => (
                  <Card key={stream.id}>
                     <CardHeader>
                        <CardTitle>{stream.name}</CardTitle>
                        <CardDescription>
                           {stream.description || "No description provided"}
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                           <div>Teacher: {stream.teacherName}</div>
                           <div>Subjects: {stream.subjectCount}</div>
                        </div>
                     </CardContent>
                     <CardFooter className="flex justify-between">
                        <Link href={`/student/streams/${stream.id}`}>
                           <Button variant="outline">
                              <FiBook className="mr-2" />
                              View Subjects
                           </Button>
                        </Link>
                        <Link href={`/student/streams/${stream.id}/attendance`}>
                           <Button variant="outline">
                              <FiCalendar className="mr-2" />
                              Attendance
                           </Button>
                        </Link>
                     </CardFooter>
                  </Card>
               ))}
            </div>
         )}
      </div>
   );
}
