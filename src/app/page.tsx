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
import icon128 from "/public/images/icon-128.png";
import icon670 from "/public/images/icon-670.png";

export default function Home() {
   const { data: session } = useSession();
   const router = useRouter();
   const [isMenuOpen, setIsMenuOpen] = useState(false);

   // Feature cards data
   const featureCardsData = [
      {
         icon: FiUsers,
         title: "User Management",
         description:
            "Separate interfaces for teachers and students with role-based access control.",
      },
      {
         icon: FiLayers,
         title: "Stream Management",
         description:
            "Create and manage academic streams with associated subjects.",
      },
      {
         icon: FiBook,
         title: "Subject Enrollment",
         description:
            "Enroll students in specific subjects within streams for targeted attendance tracking.",
      },
      {
         icon: FiCheckCircle,
         title: "Attendance Tracking",
         description:
            "Mark and track attendance with options for present, absent, or late status.",
      },
      {
         icon: FiDatabase,
         title: "Attendance Records",
         description:
            "View and filter attendance records by date, subject, or status.",
      },
      {
         icon: FiShield,
         title: "Secure Authentication",
         description:
            "Secure login and registration with role-based access control.",
      },
   ];

   // Redirect to dashboard
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
                     src={icon128}
                     alt="Attendance System Logo"
                     width={32}
                     height={32}
                     className="h-8 w-8"
                  />
                  <span className="hidden sm:inline">Attendance System</span>
               </div>

               {/* Desktop Nav */}
               <div className="hidden md:flex items-center gap-4">
                  <ThemeToggle />
                  <Link href="/login">
                     <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/register/student">
                     <Button>Register</Button>
                  </Link>
               </div>

               {/* Mobile Nav */}
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
                                 src={icon670}
                                 alt="Attendance System Logo"
                                 width={64}
                                 height={64}
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

         {/* Hero */}
         <section className="container py-12 md:py-20 lg:py-28 space-y-8">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-6 text-center">
               <div className="relative w-24 h-24 md:w-40 md:h-40 mb-2">
                  <Image
                     src={icon670}
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

         {/* Features */}
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
            <div className="mx-auto grid justify-center gap-x-4 gap-y-8 grid-cols-1 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 lg:gap-y-16 mt-8">
               {featureCardsData.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                     <div
                        className="relative grid place-items-center pt-6"
                        key={index}
                     >
                        <div className="absolute -top-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full p-4 shadow-lg shadow-muted border border-primary/20 backdrop-blur-sm z-10">
                           <Icon className="size-8 md:size-12 text-primary" />
                        </div>

                        <Card className="flex py-4 flex-col items-center text-center h-full rounded-xl border-0 shadow-lg backdrop-blur-sm bg-background/40 hover:shadow-xl transition-all duration-300">
                           <div className="w-full mt-4 px-6 flex flex-col items-center relative">
                              <div className="mt-4">
                                 <CardTitle className="text-2xl font-bold">
                                    {feature.title}
                                 </CardTitle>
                              </div>
                           </div>
                           <CardContent className="pt-2 pb-4 px-6">
                              <CardDescription className="text-base">
                                 {feature.description}
                              </CardDescription>
                           </CardContent>
                        </Card>
                     </div>
                  );
               })}
            </div>
         </section>

         {/* CTA */}
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
                     src={icon128}
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
