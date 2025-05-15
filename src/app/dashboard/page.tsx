"use client";

import { Loading } from "@/components/loading";
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
import { toast } from "sonner";

interface Stream {
   id: number;
   name: string;
   description: string;
   teacher_id: number;
   created_at: string;
}

export default function DashboardPage() {
   const { data: session, status } = useSession();
   const [streams, setStreams] = useState<Stream[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);

      const fetchStreams = async () => {
         if (status !== "authenticated") return;

         try {
            const response = await fetch("/api/streams", {
               credentials: "include",
               headers: {
                  "Content-Type": "application/json",
               },
            });

            if (!response.ok) {
               throw new Error("Failed to fetch streams");
            }

            const data = await response.json();
            setStreams(data);
         } catch (error) {
            console.error("Error fetching streams:", error);
            toast.error("Failed to load streams");
         } finally {
            setIsLoading(false);
         }
      };

      if (mounted && status === "authenticated") {
         fetchStreams();
      } else if (mounted) {
         setIsLoading(false);
      }
   }, [session, status, mounted]);

   const handleDeleteStream = async (streamId: number) => {
      if (!confirm("Are you sure you want to delete this stream?")) {
         return;
      }

      try {
         const response = await fetch(`/api/streams/${streamId}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
               "Content-Type": "application/json",
            },
         });

         if (!response.ok) {
            throw new Error("Failed to delete stream");
         }

         setStreams(streams.filter((stream) => stream.id !== streamId));
         toast.success("Stream deleted successfully");
      } catch (error) {
         console.error("Error deleting stream:", error);
         toast.error("Failed to delete stream");
      }
   };

   if (!mounted || status === "loading") {
      return <Loading />;
   }

   if (isLoading) {
      return (
         <div className="flex items-center justify-center min-h-[50vh]">
            <p>Loading streams...</p>
         </div>
      );
   }

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {session?.user?.role === "teacher" && (
               <Link href="/dashboard/streams/create">
                  <Button>Create New Stream</Button>
               </Link>
            )}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.length === 0 ? (
               <div className="col-span-full text-center py-12">
                  <h2 className="text-xl font-semibold mb-2">
                     No streams found
                  </h2>
                  {session?.user?.role === "teacher" ? (
                     <p className="text-muted-foreground mb-4">
                        Create your first stream to get started
                     </p>
                  ) : (
                     <p className="text-muted-foreground mb-4">
                        You are not enrolled in any streams yet
                     </p>
                  )}
                  {session?.user?.role === "teacher" && (
                     <Link href="/dashboard/streams/create">
                        <Button>Create Stream</Button>
                     </Link>
                  )}
               </div>
            ) : (
               streams.map((stream) => (
                  <Card key={stream.id} className="overflow-hidden">
                     <CardHeader>
                        <CardTitle>{stream.name}</CardTitle>
                        <CardDescription>
                           {stream.description || "No description"}
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <p className="text-sm text-muted-foreground">
                           Created:{" "}
                           {new Date(stream.created_at).toLocaleDateString()}
                        </p>
                     </CardContent>
                     <CardFooter className="flex justify-between border-t p-4 bg-muted/50">
                        <Link href={`/dashboard/streams/${stream.id}`}>
                           <Button variant="outline" size="sm">
                              View Details
                           </Button>
                        </Link>
                        {session?.user?.role === "teacher" && (
                           <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteStream(stream.id)}
                           >
                              Delete
                           </Button>
                        )}
                     </CardFooter>
                  </Card>
               ))
            )}
         </div>
      </div>
   );
}
