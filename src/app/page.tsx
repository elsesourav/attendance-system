"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
   FiBook,
   FiCheckCircle,
   FiDatabase,
   FiLayers,
   FiMenu,
   FiShield,
   FiUser,
   FiUsers,
} from "react-icons/fi";

export default function Home() {
   const { data: session } = useSession();
   const router = useRouter();
   const [isMenuOpen, setIsMenuOpen] = useState(false);

   // Redirect authenticated users to their dashboard
   useEffect(() => {
      if (session?.user) {
         if (session.user.role === "teacher") {
            router.push("/teacher/dashboard");
         } else if (session.user.role === "student") {
            router.push("/student/dashboard");
         }
      }
   }, [session, router]);

   return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
         {/* Header */}
         <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
               <div className="flex items-center gap-2 font-bold text-xl">
                  <Image
                     src="/images/icon-64.png"
                     alt="Attendance System Logo"
                     width={32}
                     height={32}
                     className="h-8 w-8"
                  />
                  <span className="hidden sm:inline">Attendance System</span>
               </div>

               {/* Desktop Navigation */}
               <div className="hidden md:flex items-center gap-4">
                  <ThemeToggle />
                  <Link href="/login">
                     <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/register/student">
                     <Button>Register</Button>
                  </Link>
               </div>

               {/* Mobile Navigation */}
               <div className="flex md:hidden items-center gap-4">
                  <ThemeToggle />
                  <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                     <SheetTrigger asChild>
                        <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8 p-0"
                        >
                           <FiMenu className="h-5 w-5" />
                        </Button>
                     </SheetTrigger>
                     <SheetContent
                        side="right"
                        className="w-[250px] sm:w-[300px]"
                     >
                        <div className="flex flex-col gap-6 mt-6">
                           <div className="flex items-center gap-2">
                              <Image
                                 src="/images/icon-64.png"
                                 alt="Attendance System Logo"
                                 width={32}
                                 height={32}
                              />
                              <span className="font-bold">
                                 Attendance System
                              </span>
                           </div>
                           <div className="flex flex-col gap-4">
                              <Link
                                 href="/login"
                                 onClick={() => setIsMenuOpen(false)}
                              >
                                 <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                 >
                                    Login
                                 </Button>
                              </Link>
                              <Link
                                 href="/register/student"
                                 onClick={() => setIsMenuOpen(false)}
                              >
                                 <Button className="w-full justify-start">
                                    Register
                                 </Button>
                              </Link>
                              <Link
                                 href="/register/teacher"
                                 onClick={() => setIsMenuOpen(false)}
                              >
                                 <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                 >
                                    Teacher Registration
                                 </Button>
                              </Link>
                           </div>
                        </div>
                     </SheetContent>
                  </Sheet>
               </div>
            </div>
         </header>

         {/* Hero Section */}
         <section className="container py-12 md:py-24 lg:py-32 space-y-8">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-6 text-center">
               <div className="relative w-24 h-24 md:w-32 md:h-32 mb-2">
                  <Image
                     src="/images/icon-1024.png"
                     alt="Attendance System Logo"
                     fill
                     priority
                     className="object-contain"
                  />
               </div>
               <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
                  Streamline Attendance Management
               </h1>
               <p className="max-w-[46rem] text-lg text-muted-foreground sm:text-xl">
                  A comprehensive system for tracking student attendance across
                  streams and subjects. Designed for educational institutions to
                  simplify the attendance process.
               </p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
                  <Link href="/register/teacher" className="w-full sm:w-auto">
                     <Button size="lg" className="gap-2 w-full">
                        <FiUser className="h-5 w-5" />
                        Teacher Registration
                     </Button>
                  </Link>
                  <Link href="/register/student" className="w-full sm:w-auto">
                     <Button
                        size="lg"
                        variant="outline"
                        className="gap-2 w-full"
                     >
                        <FiUsers className="h-5 w-5" />
                        Student Registration
                     </Button>
                  </Link>
               </div>
            </div>
         </section>

         {/* Features Section */}
         <section className="container py-12 md:py-24 lg:py-32 bg-muted/50">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
               <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-4xl">
                  Key Features
               </h2>
               <p className="max-w-[46rem] text-lg text-muted-foreground">
                  Our attendance system provides a comprehensive solution for
                  educational institutions.
               </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 grid-cols-1 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 lg:gap-8 mt-8">
               <Card className="flex flex-col items-center text-center p-4 h-full">
                  <CardHeader className="pb-2">
                     <div className="p-2 bg-primary/10 rounded-full mb-3">
                        <FiUsers className="h-6 w-6 text-primary" />
                     </div>
                     <CardTitle>User Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <CardDescription>
                        Separate interfaces for teachers and students with
                        role-based access control.
                     </CardDescription>
                  </CardContent>
               </Card>
               <Card className="flex flex-col items-center text-center p-4 h-full">
                  <CardHeader className="pb-2">
                     <div className="p-2 bg-primary/10 rounded-full mb-3">
                        <FiLayers className="h-6 w-6 text-primary" />
                     </div>
                     <CardTitle>Stream Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <CardDescription>
                        Create and manage academic streams with associated
                        subjects.
                     </CardDescription>
                  </CardContent>
               </Card>
               <Card className="flex flex-col items-center text-center p-4 h-full">
                  <CardHeader className="pb-2">
                     <div className="p-2 bg-primary/10 rounded-full mb-3">
                        <FiBook className="h-6 w-6 text-primary" />
                     </div>
                     <CardTitle>Subject Enrollment</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <CardDescription>
                        Enroll students in specific subjects within streams for
                        targeted attendance tracking.
                     </CardDescription>
                  </CardContent>
               </Card>
               <Card className="flex flex-col items-center text-center p-4 h-full">
                  <CardHeader className="pb-2">
                     <div className="p-2 bg-primary/10 rounded-full mb-3">
                        <FiCheckCircle className="h-6 w-6 text-primary" />
                     </div>
                     <CardTitle>Attendance Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <CardDescription>
                        Mark and track attendance with options for present,
                        absent, or late status.
                     </CardDescription>
                  </CardContent>
               </Card>
               <Card className="flex flex-col items-center text-center p-4 h-full">
                  <CardHeader className="pb-2">
                     <div className="p-2 bg-primary/10 rounded-full mb-3">
                        <FiDatabase className="h-6 w-6 text-primary" />
                     </div>
                     <CardTitle>Attendance Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <CardDescription>
                        View and filter attendance records by date, subject, or
                        status.
                     </CardDescription>
                  </CardContent>
               </Card>
               <Card className="flex flex-col items-center text-center p-4 h-full">
                  <CardHeader className="pb-2">
                     <div className="p-2 bg-primary/10 rounded-full mb-3">
                        <FiShield className="h-6 w-6 text-primary" />
                     </div>
                     <CardTitle>Secure Authentication</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <CardDescription>
                        Secure login and registration with role-based access
                        control.
                     </CardDescription>
                  </CardContent>
               </Card>
            </div>
         </section>

         {/* CTA Section */}
         <section className="container py-12 md:py-24 lg:py-32">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
               <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-4xl">
                  Get Started Today
               </h2>
               <p className="max-w-[46rem] text-lg text-muted-foreground">
                  Join our attendance system and simplify your attendance
                  management process.
               </p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-6 w-full">
                  <Card className="w-full sm:max-w-sm h-full">
                     <CardHeader>
                        <div className="flex justify-center mb-4">
                           <div className="p-3 bg-primary/10 rounded-full">
                              <FiUser className="h-8 w-8 text-primary" />
                           </div>
                        </div>
                        <CardTitle>For Teachers</CardTitle>
                        <CardDescription className="mt-2">
                           Create streams, manage subjects, and track student
                           attendance.
                        </CardDescription>
                     </CardHeader>
                     <CardContent className="flex justify-center pb-6">
                        <Link href="/register/teacher" className="w-full">
                           <Button className="w-full">
                              Register as Teacher
                           </Button>
                        </Link>
                     </CardContent>
                  </Card>
                  <Card className="w-full sm:max-w-sm h-full">
                     <CardHeader>
                        <div className="flex justify-center mb-4">
                           <div className="p-3 bg-primary/10 rounded-full">
                              <FiUsers className="h-8 w-8 text-primary" />
                           </div>
                        </div>
                        <CardTitle>For Students</CardTitle>
                        <CardDescription className="mt-2">
                           Enroll in subjects and view your attendance records.
                        </CardDescription>
                     </CardHeader>
                     <CardContent className="flex justify-center pb-6">
                        <Link href="/register/student" className="w-full">
                           <Button className="w-full">
                              Register as Student
                           </Button>
                        </Link>
                     </CardContent>
                  </Card>
               </div>
            </div>
         </section>

         {/* Footer */}
         <footer className="border-t bg-muted/50 py-6 md:py-0 mt-auto">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
               <div className="flex items-center gap-2">
                  <Image
                     src="/images/icon-64.png"
                     alt="Attendance System Logo"
                     width={24}
                     height={24}
                     className="h-6 w-6"
                  />
                  <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                     © {new Date().getFullYear()} Attendance System. All rights
                     reserved.
                  </p>
               </div>
               <div className="flex items-center gap-4">
                  <Link href="/login">
                     <Button variant="ghost" size="sm">
                        Login
                     </Button>
                  </Link>
                  <ThemeToggle />
               </div>
            </div>
         </footer>
      </div>
   );
}
