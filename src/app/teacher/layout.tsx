"use client";

import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiBook, FiBookOpen, FiHome, FiLogOut, FiUsers } from "react-icons/fi";

export default function TeacherLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   const { data: session, status } = useSession();

   if (status === "loading") {
      return (
         <div className="flex items-center justify-center min-h-screen">
            Loading...
         </div>
      );
   }

   if (status === "unauthenticated" || session?.user?.role !== "teacher") {
      redirect("/login");
   }

   return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
         {/* Sidebar */}
         <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="p-6">
               <h2 className="text-xl font-bold">Teacher Dashboard</h2>
               <p className="text-sm text-gray-500 mt-1">
                  {session?.user?.name}
               </p>
            </div>
            <nav className="mt-6">
               <div className="px-4 space-y-2">
                  <Link href="/teacher/dashboard" className="block">
                     <Button variant="ghost" className="w-full justify-start">
                        <FiHome className="mr-2" />
                        Dashboard
                     </Button>
                  </Link>
                  <Link href="/teacher/streams" className="block">
                     <Button variant="ghost" className="w-full justify-start">
                        <FiBook className="mr-2" />
                        Streams
                     </Button>
                  </Link>
                  <Link href="/teacher/students" className="block">
                     <Button variant="ghost" className="w-full justify-start">
                        <FiUsers className="mr-2" />
                        Students
                     </Button>
                  </Link>
                  <Link href="/teacher/subjects" className="block">
                     <Button variant="ghost" className="w-full justify-start">
                        <FiBookOpen className="mr-2" />
                        Subjects
                     </Button>
                  </Link>
               </div>
               <div className="px-4 mt-auto pt-6">
                  <Button
                     variant="ghost"
                     className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                     onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                     <FiLogOut className="mr-2" />
                     Logout
                  </Button>
               </div>
            </nav>
         </div>

         {/* Main content */}
         <div className="flex-1 overflow-auto">
            <main className="p-6">{children}</main>
         </div>
      </div>
   );
}
