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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "sonner";

export default function CreateStream() {
   const router = useRouter();
   const { hideLoading } = useLoading();
   const [isLoading, setIsLoading] = useState(false);
   const [formData, setFormData] = useState({
      name: "",
      description: "",
   });

   const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
   ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
         const response = await fetch("/api/teacher/streams", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
         });

         if (response.ok) {
            await response.json(); // Parse response but we don't need the data
            toast.success("Stream created successfully");
            router.push("/teacher/streams");
         } else {
            const error = await response.json();
            toast.error(error.error || "Failed to create stream");
         }
      } catch (error) {
         console.error("Error creating stream:", error);
         toast.error("An error occurred while creating the stream");
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="space-y-6">
         <div className="flex items-center">
            <Button
               variant="ghost"
               size="icon"
               className="mr-2"
               onClick={() => {
                  hideLoading();
                  router.back();
               }}
            >
               <FiArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Create Stream</h1>
         </div>

         <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
               <CardHeader>
                  <CardTitle>Stream Details</CardTitle>
                  <CardDescription>
                     Create a new stream for your students
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="space-y-2">
                     <Label htmlFor="name">Stream Name</Label>
                     <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Computer Science"
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
                        placeholder="Provide a brief description of this stream"
                        rows={4}
                     />
                  </div>
               </CardContent>
               <CardFooter className="flex justify-between">
                  <Button
                     type="button"
                     variant="outline"
                     onClick={() => router.push("/teacher/streams")}
                  >
                     Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                     {isLoading ? "Creating..." : "Create Stream"}
                  </Button>
               </CardFooter>
            </form>
         </Card>
      </div>
   );
}
