"use client";

import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CreateStreamPage() {
   const router = useRouter();
   const { data: session, status } = useSession();
   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);

      // Redirect if not a teacher
      if (status === "authenticated" && session?.user?.role !== "teacher") {
         router.push("/dashboard");
      }
   }, [status, session, router]);

   if (!mounted || status === "loading") {
      return <Loading />;
   }

   if (status === "unauthenticated") {
      router.push("/login");
      return null;
   }

   if (status === "authenticated" && session?.user?.role !== "teacher") {
      return null;
   }

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!name) {
         toast.error("Stream name is required");
         return;
      }

      setIsLoading(true);

      try {
         console.log("Submitting stream creation form:", { name, description });

         const response = await fetch("/api/streams", {
            method: "POST",
            credentials: "include",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               name,
               description,
            }),
         });

         const data = await response.json();
         console.log("Stream creation response:", {
            status: response.status,
            data,
         });

         if (!response.ok) {
            throw new Error(data.error || "Failed to create stream");
         }

         toast.success(
            "Stream created successfully! You can now add subjects to this stream."
         );

         // Navigate to the newly created stream
         if (data.streamId) {
            console.log("Navigating to new stream:", data.streamId);
            router.push(`/dashboard/streams/${data.streamId}`);
         } else {
            console.log("No stream ID returned, navigating to dashboard");
            router.push("/dashboard");
         }
      } catch (error) {
         console.error("Error creating stream:", error);
         toast.error(
            error instanceof Error
               ? error.message
               : "An error occurred while creating the stream"
         );
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="max-w-2xl mx-auto">
         <div className="mb-6">
            <h1 className="text-3xl font-bold">Create New Stream</h1>
            <p className="text-muted-foreground">
               Create a new class or course stream. You can add subjects to this
               stream after creation.
            </p>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>Stream Details</CardTitle>
               <CardDescription>
                  Enter the details for your new stream. After creating the
                  stream, you'll be able to add subjects to it.
               </CardDescription>
            </CardHeader>
            <CardContent>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                     <Label htmlFor="name">Stream Name</Label>
                     <Input
                        id="name"
                        placeholder="e.g., Computer Science, Electronics, Mechanical Engineering"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                     />
                     <p className="text-sm text-muted-foreground">
                        Enter the name of the stream or department (e.g.,
                        Computer Science, Physics)
                     </p>
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="description">Description (Optional)</Label>
                     <Textarea
                        id="description"
                        placeholder="e.g., B.Tech Computer Science Engineering program"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                     />
                     <p className="text-sm text-muted-foreground">
                        Provide details about this stream. You'll be able to add
                        specific subjects (like DSA, Algorithms) after creating
                        the stream.
                     </p>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                     <Link href="/dashboard">
                        <Button variant="outline" type="button">
                           Cancel
                        </Button>
                     </Link>
                     <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating Stream..." : "Create Stream"}
                     </Button>
                  </div>
               </form>
            </CardContent>
         </Card>
      </div>
   );
}
