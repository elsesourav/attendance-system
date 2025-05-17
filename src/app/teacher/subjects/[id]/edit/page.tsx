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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "sonner";

interface SubjectData {
   id: number;
   name: string;
   description: string | null;
   streamId: number;
   streamName: string;
}

export default function EditSubject() {
   const params = useParams();
   const router = useRouter();
   const { hideLoading } = useLoading();
   const subjectId = params.id as string;
   const searchParams = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
   );
   const fromStream = searchParams.get("from") === "stream";

   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const [formData, setFormData] = useState({
      name: "",
      description: "",
   });
   const [streamName, setStreamName] = useState("");

   useEffect(() => {
      const fetchSubject = async () => {
         try {
            const response = await fetch(`/api/teacher/subjects/${subjectId}`);

            if (!response.ok) {
               if (response.status === 404) {
                  toast.error("Subject not found");
                  router.push("/teacher/subjects");
                  return;
               }
               throw new Error("Failed to fetch subject");
            }

            const data: SubjectData = await response.json();
            setFormData({
               name: data.name,
               description: data.description || "",
            });
            setStreamName(data.streamName);
         } catch (error) {
            console.error("Error fetching subject:", error);
            toast.error("Failed to load subject data");
         } finally {
            setIsLoading(false);
         }
      };

      fetchSubject();
   }, [subjectId, router]);

   const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
   ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);

      try {
         const response = await fetch(`/api/teacher/subjects/${subjectId}`, {
            method: "PUT",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
         });

         if (response.ok) {
            toast.success("Subject updated successfully");
            router.push(`/teacher/subjects/${subjectId}`);
         } else {
            const error = await response.json();
            toast.error(error.error || "Failed to update subject");
         }
      } catch (error) {
         console.error("Error updating subject:", error);
         toast.error("An error occurred while updating the subject");
      } finally {
         setIsSaving(false);
      }
   };

   if (isLoading) {
      return <div className="text-center py-10">Loading subject data...</div>;
   }

   return (
      <div className="space-y-6">
         <div className="flex items-center">
            <Button
               variant="ghost"
               size="icon"
               className="mr-2"
               onClick={() => {
                  // Hide loading first, then navigate back
                  hideLoading();
                  router.back();
               }}
            >
               <FiArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Edit Subject</h1>
         </div>

         <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
               <CardHeader>
                  <CardTitle>Subject Details</CardTitle>
                  <CardDescription>
                     Update your subject information for {streamName}
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="space-y-2">
                     <Label htmlFor="name">Subject Name</Label>
                     <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Mathematics"
                        required
                     />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="description">Description (Optional)</Label>
                     <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Provide a brief description of this subject"
                        rows={4}
                     />
                  </div>
               </CardContent>
               <CardFooter className="flex justify-between">
                  <Button
                     type="button"
                     variant="outline"
                     onClick={() => {
                        // Hide loading first, then navigate back
                        hideLoading();
                        router.back();
                     }}
                  >
                     Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                     {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
               </CardFooter>
            </form>
         </Card>
      </div>
   );
}
