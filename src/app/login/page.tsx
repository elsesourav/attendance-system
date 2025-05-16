"use client";

import { Loading } from "@/components/loading";
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
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
   const router = useRouter();
   const { status } = useSession();
   const searchParams = useSearchParams();
   const role = searchParams.get("role") || "student";

   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);

      // Redirect to dashboard if already authenticated
      if (status === "authenticated") {
         router.push("/dashboard");
      }
   }, [status, router]);

   if (!mounted) {
      return <Loading />;
   }

   // Don't render the login form if already authenticated
   if (status === "authenticated") {
      return null;
   }

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!email || !password) {
         toast.error("Please fill in all fields");
         return;
      }

      setIsLoading(true);

      try {
         console.log("Login attempt with:", { email, password: "********" });
         const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
         });

         console.log("SignIn result:", result);

         if (result?.error) {
            console.error("Login error from NextAuth:", result.error);

            // More specific error messages based on the error
            if (result.error === "CredentialsSignin") {
               toast.error("Invalid email or password");
            } else {
               toast.error(`Login failed: ${result.error}`);
            }

            setIsLoading(false);
            return;
         }

         toast.success("Login successful");
         router.push("/dashboard");
      } catch (error) {
         console.error("Login error:", error);

         // More detailed error message
         if (error instanceof Error) {
            toast.error(`Login error: ${error.message}`);
         } else {
            toast.error("An unexpected error occurred during login");
         }
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
         <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
               <CardTitle className="text-2xl font-bold">
                  {role === "teacher" ? "Teacher Login" : "Student Login"}
               </CardTitle>
               <CardDescription>
                  Enter your credentials to access your account
               </CardDescription>
            </CardHeader>
            <CardContent>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                     <Label htmlFor="email">Email</Label>
                     <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                     />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="password">Password</Label>
                     <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                     />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading ? "Logging in..." : "Login"}
                  </Button>
               </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
               <p className="text-sm text-muted-foreground text-center">
                  Don't have an account?{" "}
                  <Link
                     href="/register"
                     className="text-primary hover:underline"
                  >
                     Register here
                  </Link>
               </p>
               <p className="text-sm text-muted-foreground text-center">
                  {role === "teacher" ? (
                     <Link
                        href="/login?role=student"
                        className="text-primary hover:underline"
                     >
                        Login as Student
                     </Link>
                  ) : (
                     <Link
                        href="/login?role=teacher"
                        className="text-primary hover:underline"
                     >
                        Login as Teacher
                     </Link>
                  )}
               </p>
            </CardFooter>
         </Card>
      </div>
   );
}
