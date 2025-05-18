import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
   const token = await getToken({ req: request });
   const isAuthenticated = !!token;
   const isTeacher = token?.role === "teacher";
   const isStudent = token?.role === "student";
   const path = request.nextUrl.pathname;

   // Public routes
   const publicRoutes = [
      "/",
      "/login",
      "/register/student",
      "/register/teacher",
   ];
   const isPublicRoute =
      publicRoutes.includes(path) ||
      path.startsWith("/api/auth") ||
      path.startsWith("/api/register");

   // Redirect to login
   if (!isAuthenticated && !isPublicRoute) {
      return NextResponse.redirect(new URL("/", request.url));
   }

   // Redirect to dashboard
   if (isAuthenticated && (path === "/login" || path.startsWith("/register"))) {
      if (isTeacher) {
         return NextResponse.redirect(
            new URL("/teacher/dashboard", request.url)
         );
      } else if (isStudent) {
         return NextResponse.redirect(
            new URL("/student/dashboard", request.url)
         );
      }
   }

   // Teacher routes
   if (path.startsWith("/teacher") && !isTeacher) {
      if (isStudent) {
         return NextResponse.redirect(
            new URL("/student/dashboard", request.url)
         );
      }
      return NextResponse.redirect(new URL("/login", request.url));
   }

   // Student routes
   if (path.startsWith("/student") && !isStudent) {
      if (isTeacher) {
         return NextResponse.redirect(
            new URL("/teacher/dashboard", request.url)
         );
      }
      return NextResponse.redirect(new URL("/login", request.url));
   }

   return NextResponse.next();
}

export const config = {
   matcher: [
      // Exclude Next.js files and images
      "/((?!_next/static|_next/image|favicon.ico).*)",
   ],
};
