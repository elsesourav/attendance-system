"use client";

import { useLoading } from "@/components/loading-overlay";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import {
   FiBook,
   FiCalendar,
   FiHome,
   FiLogOut,
   FiMenu,
   FiX,
} from "react-icons/fi";

export default function StudentLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   const { data: session, status } = useSession();
   const { showLoading, hideLoading } = useLoading();
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

   // Hide loading overlay when component mounts
   useEffect(() => {
      hideLoading();
   }, [hideLoading]);

   // Close sidebar when screen size changes to larger than mobile
   useEffect(() => {
      const handleResize = () => {
         if (window.innerWidth >= 1024) {
            setIsSidebarOpen(false);
         }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
   }, []);

   if (status === "loading") {
      return (
         <div className="flex items-center justify-center min-h-screen">
            Loading...
         </div>
      );
   }

   if (status === "unauthenticated" || session?.user?.role !== "student") {
      redirect("/login");
   }

   return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
         {/* Mobile Header */}
         <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
            <div className="flex items-center">
               <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="mr-2"
               >
                  {isSidebarOpen ? <FiX /> : <FiMenu />}
               </Button>
               <h2 className="text-xl font-bold">Student Dashboard</h2>
            </div>
            <div className="flex items-center space-x-2">
               <ThemeToggle />
            </div>
         </div>

         <div className="relative flex h-[100svh] overflow-hidden">
            {/* Sidebar - hidden on mobile unless toggled */}
            <div
               className={`
                  fixed lg:sticky top-0 left-0 z-50 min-h-screen w-64
                  bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
                  transition-transform duration-300 ease-in-out
                  flex flex-col overflow-y-auto
                  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                  lg:translate-x-0 lg:h-screen
               `}
            >
               {/* Sidebar Header - visible only on desktop */}
               <div className="hidden lg:block p-6 pr-1">
                  <div className="flex justify-between items-center">
                     <div>
                        <h2 className="text-md font-bold">Student Dashboard</h2>
                        <p className="text-sm text-muted-foreground">
                           {session?.user?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                           Reg: {session?.user?.registrationNumber}
                        </p>
                     </div>
                     <ThemeToggle />
                  </div>
               </div>

               {/* Mobile Sidebar Header - with close button */}
               <div className="lg:hidden p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                  <div>
                     <p className="text-md text-lg font-bold">
                        {session?.user?.name}
                     </p>
                     <p className="text-xs text-muted-foreground">
                        Reg: {session?.user?.registrationNumber}
                     </p>
                  </div>
                  <Button
                     variant="ghost"
                     size="icon"
                     onClick={() => setIsSidebarOpen(false)}
                  >
                     <FiX />
                  </Button>
               </div>

               <nav className="mt-6 flex-1">
                  <div className="px-4 space-y-2">
                     <Link
                        href="/student/dashboard"
                        className="block"
                        onClick={() => {
                           showLoading("Loading dashboard...");
                           setIsSidebarOpen(false);
                        }}
                     >
                        <Button
                           variant="ghost"
                           className="w-full justify-start"
                        >
                           <FiHome className="mr-2" />
                           Dashboard
                        </Button>
                     </Link>
                     <Link
                        href="/student/streams"
                        className="block"
                        onClick={() => {
                           showLoading("Loading streams...");
                           setIsSidebarOpen(false);
                        }}
                     >
                        <Button
                           variant="ghost"
                           className="w-full justify-start"
                        >
                           <FiBook className="mr-2" />
                           My Streams
                        </Button>
                     </Link>
                     <Link
                        href="/student/subjects"
                        className="block"
                        onClick={() => {
                           showLoading("Loading subjects...");
                           setIsSidebarOpen(false);
                        }}
                     >
                        <Button
                           variant="ghost"
                           className="w-full justify-start"
                        >
                           <FiBook className="mr-2 rotate-90" />
                           My Subjects
                        </Button>
                     </Link>
                     <Link
                        href="/student/attendance"
                        className="block"
                        onClick={() => {
                           showLoading("Loading attendance...");
                           setIsSidebarOpen(false);
                        }}
                     >
                        <Button
                           variant="ghost"
                           className="w-full justify-start"
                        >
                           <FiCalendar className="mr-2" />
                           Attendance
                        </Button>
                     </Link>
                  </div>
                  <div className="px-4 mt-auto pt-6">
                     <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => {
                           showLoading("Logging out...");
                           signOut({ callbackUrl: "/login" });
                        }}
                     >
                        <FiLogOut className="mr-2" />
                        Logout
                     </Button>
                  </div>
               </nav>
            </div>

            {/* Overlay for mobile when sidebar is open */}
            <div
               className={`
                  fixed inset-0 bg-black z-40 lg:hidden
                  transition-opacity duration-300 ease-in-out
                  ${
                     isSidebarOpen
                        ? "opacity-50 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                  }
               `}
               onClick={() => setIsSidebarOpen(false)}
            />

            {/* Main content */}
            <div className="flex-1 overflow-auto w-full">
               <main className="p-4 md:p-6 pb-20">{children}</main>
            </div>
         </div>
      </div>
   );
}
