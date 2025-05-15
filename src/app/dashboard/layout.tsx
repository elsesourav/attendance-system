"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/loading";

export default function DashboardLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   const router = useRouter();
   const { data: session, status } = useSession();
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);

      if (status === "unauthenticated") {
         router.push("/login");
      }
   }, [status, router]);

   if (!mounted || status === "loading") {
      return <Loading />;
   }

   if (status === "unauthenticated") {
      return null;
   }

   return (
      <div className="relative items-center flex min-h-screen mx-4 md:mx-8 lg:mx-12 flex-col">
         <header className="sticky w-full top-0 z-10 border-b bg-background">
            <div className="relative w-full flex h-16 items-center justify-between py-4">
               <div className="flex items-center gap-4">
                  <Link href="/dashboard" className="text-xl font-bold">
                     Attendance System
                  </Link>
               </div>
               <div className="flex items-center gap-4">
                  {session?.user?.role === "teacher" && (
                     <Link href="/dashboard/streams/create">
                        <Button variant="outline" size="sm">
                           Create Stream
                        </Button>
                     </Link>
                  )}
                  <div className="flex items-center gap-2">
                     <span className="text-sm font-medium">
                        {session?.user?.name} ({session?.user?.role})
                     </span>
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut({ callbackUrl: "/" })}
                     >
                        Logout
                     </Button>
                  </div>
               </div>
            </div>
         </header>
         <main className="flex-1 container py-6">{children}</main>
         <footer className="border-t w-full py-4">
            <div className="container flex justify-center">
               <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} Attendance System. All rights
                  reserved.
               </p>
            </div>
         </footer>
      </div>
   );
}
