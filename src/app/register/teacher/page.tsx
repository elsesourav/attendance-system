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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "sonner";

export default function TeacherRegisterPage() {
   const router = useRouter();
   const { hideLoading } = useLoading();
   const [isLoading, setIsLoading] = useState(false);
   const [formData, setFormData] = useState({
      name: "",
      email: "",
      mobile_number: "",
      password: "",
      confirmPassword: "",
   });

   // Hide loading overlay when component mounts
   useEffect(() => {
      hideLoading();
   }, [hideLoading]);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate form
      if (formData.password !== formData.confirmPassword) {
         toast.error("Passwords do not match");
         return;
      }

      setIsLoading(true);

      try {
         const response = await fetch("/api/register/teacher", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               name: formData.name,
               email: formData.email,
               mobile_number: formData.mobile_number,
               password: formData.password,
            }),
         });

         const data = await response.json();

         if (response.ok) {
            toast.success("Registration successful! You can now login.");
            hideLoading();
            router.push("/login");
         } else {
            hideLoading();
            toast.error(data.error || "Registration failed");
         }
      } catch (error) {
         console.error("Registration error:", error);
         toast.error("An error occurred during registration");
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
         <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
               <div className="flex items-center">
                  <Button
                     variant="ghost"
                     size="icon"
                     className="mr-2"
                     onClick={() => {
                        hideLoading();
                        router.push("/login");
                     }}
                  >
                     <FiArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-xl font-bold md:text-2xl">
                     Teacher Registration
                  </CardTitle>
               </div>
               <CardDescription>Create a new teacher account</CardDescription>
            </CardHeader>
            <CardContent>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                     <Label htmlFor="name">Full Name</Label>
                     <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                     />
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="email">Email</Label>
                     <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john.doe@example.com"
                        required
                     />
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="mobile_number">Mobile Number</Label>
                     <Input
                        id="mobile_number"
                        name="mobile_number"
                        value={formData.mobile_number}
                        onChange={handleChange}
                        placeholder="9876543210"
                        required
                     />
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="password">Password</Label>
                     <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                     />
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="confirmPassword">Confirm Password</Label>
                     <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                     />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading ? "Registering..." : "Register"}
                  </Button>
               </form>
            </CardContent>
            <CardFooter>
               <p className="text-center text-sm text-muted-foreground w-full">
                  Already have an account?{" "}
                  <Link
                     href="/login"
                     className="text-primary underline underline-offset-4 hover:text-primary/90"
                     onClick={() => hideLoading()}
                  >
                     Login
                  </Link>
               </p>
            </CardFooter>
         </Card>
      </div>
   );
}
