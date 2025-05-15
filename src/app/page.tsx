import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
   return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
         <main className="w-full max-w-4xl">
            <Card className="w-full shadow-lg">
               <CardHeader className="text-center">
                  <CardTitle className="text-3xl font-bold">
                     Attendance System
                  </CardTitle>
                  <CardDescription>
                     Track student attendance with ease
                  </CardDescription>
               </CardHeader>
               <CardContent className="flex flex-col items-center space-y-6 p-6">
                  <div className="text-center space-y-2">
                     <h2 className="text-xl font-semibold">
                        Welcome to the Attendance System
                     </h2>
                     <p className="text-muted-foreground">
                        A comprehensive solution for teachers to manage classes
                        and track student attendance
                     </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                     <Link href="/login?role=teacher" className="w-full">
                        <Button variant="default" className="w-full py-6">
                           Teacher Login
                        </Button>
                     </Link>
                     <Link href="/login?role=student" className="w-full">
                        <Button variant="outline" className="w-full py-6">
                           Student Login
                        </Button>
                     </Link>
                  </div>

                  <div className="text-center pt-4">
                     <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link
                           href="/register"
                           className="text-primary hover:underline"
                        >
                           Register here
                        </Link>
                     </p>
                  </div>
               </CardContent>
               <CardFooter className="flex justify-center border-t p-4">
                  <p className="text-xs text-muted-foreground">
                     © {new Date().getFullYear()} Attendance System. All rights
                     reserved.
                  </p>
               </CardFooter>
            </Card>
         </main>
      </div>
   );
}
