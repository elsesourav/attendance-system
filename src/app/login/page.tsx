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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
   const router = useRouter();
   const [isLoading, setIsLoading] = useState(false);
   const { showLoading, hideLoading } = useLoading();

   const handleSubmit = async (
      event: React.FormEvent<HTMLFormElement>,
      role: "student" | "teacher"
   ) => {
      event.preventDefault();
      setIsLoading(true);
      showLoading(`Signing in as ${role}...`); // Show the loading overlay with custom message

      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      try {
         const result = await signIn(
            role === "teacher" ? "teacher-login" : "student-login",
            {
               email,
               password,
               redirect: false,
            }
         );

         if (result?.error) {
            toast.error("Invalid credentials. Please try again.");
         } else {
            toast.success(`Logged in successfully as ${role}`);
            showLoading(`Welcome back! Redirecting to your dashboard...`);
            router.push(
               role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"
            );
            router.refresh();
         }
      } catch (error) {
         toast.error("An error occurred. Please try again.");
         console.error(error);
      } finally {
         setIsLoading(false);
         hideLoading(); // Hide the loading overlay
      }
   };

   return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
         <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
               <CardTitle className="text-2xl font-bold text-center">
                  Attendance System
               </CardTitle>
               <CardDescription className="text-center">
                  Login to access your account
               </CardDescription>
            </CardHeader>
            <CardContent>
               <Tabs defaultValue="student" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                     <TabsTrigger value="student">Student</TabsTrigger>
                     <TabsTrigger value="teacher">Teacher</TabsTrigger>
                  </TabsList>

                  <TabsContent value="student">
                     <form
                        onSubmit={(e) => handleSubmit(e, "student")}
                        className="space-y-4 mt-4"
                     >
                        <div className="space-y-2">
                           <Label htmlFor="student-email">Email</Label>
                           <Input
                              id="student-email"
                              name="email"
                              type="email"
                              placeholder="student@example.com"
                              required
                           />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="student-password">Password</Label>
                           <Input
                              id="student-password"
                              name="password"
                              type="password"
                              required
                           />
                        </div>
                        <Button
                           type="submit"
                           className="w-full"
                           disabled={isLoading}
                        >
                           {isLoading ? "Logging in..." : "Login as Student"}
                        </Button>
                     </form>
                  </TabsContent>

                  <TabsContent value="teacher">
                     <form
                        onSubmit={(e) => handleSubmit(e, "teacher")}
                        className="space-y-4 mt-4"
                     >
                        <div className="space-y-2">
                           <Label htmlFor="teacher-email">Email</Label>
                           <Input
                              id="teacher-email"
                              name="email"
                              type="email"
                              placeholder="teacher@example.com"
                              required
                           />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="teacher-password">Password</Label>
                           <Input
                              id="teacher-password"
                              name="password"
                              type="password"
                              required
                           />
                        </div>
                        <Button
                           type="submit"
                           className="w-full"
                           disabled={isLoading}
                        >
                           {isLoading ? "Logging in..." : "Login as Teacher"}
                        </Button>
                     </form>
                  </TabsContent>
               </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
               <div className="w-full text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                     Don&apos;t have an account?
                  </p>
                  <div className="flex justify-center space-x-4">
                     <Button
                        variant="outline"
                        onClick={() => {
                           showLoading(
                              "Preparing student registration form..."
                           );
                           router.push("/register/student");
                        }}
                     >
                        Register as Student
                     </Button>
                     <Button
                        variant="outline"
                        onClick={() => {
                           showLoading(
                              "Preparing teacher registration form..."
                           );
                           router.push("/register/teacher");
                        }}
                     >
                        Register as Teacher
                     </Button>
                  </div>
               </div>
            </CardFooter>
         </Card>
      </div>
   );
}
