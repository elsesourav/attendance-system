"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { FiHome, FiBook, FiCalendar, FiLogOut } from "react-icons/fi";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (status === "unauthenticated" || session?.user?.role !== "student") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-xl font-bold">Student Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">{session?.user?.name}</p>
          <p className="text-xs text-gray-400">Reg: {session?.user?.registrationNumber}</p>
        </div>
        <nav className="mt-6">
          <div className="px-4 space-y-2">
            <Link href="/student/dashboard" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <FiHome className="mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/student/streams" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <FiBook className="mr-2" />
                My Streams
              </Button>
            </Link>
            <Link href="/student/attendance" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <FiCalendar className="mr-2" />
                Attendance
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
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
