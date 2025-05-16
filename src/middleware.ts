import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
   const token = await getToken({ req: request });
   const isAuthenticated = !!token;
   const isTeacher = token?.role === "teacher";
   const isStudent = token?.role === "student";
   const path = request.nextUrl.pathname;

   // Public routes that don't require authentication
   const publicRoutes = ["/login", "/register/student", "/register/teacher"];
   const isPublicRoute =
      publicRoutes.includes(path) ||
      path.startsWith("/api/auth") ||
      path.startsWith("/api/register");

   // Redirect to login if not authenticated and not accessing a public route
   if (!isAuthenticated && !isPublicRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
   }

   // Redirect to appropriate dashboard if already logged in and trying to access login or register pages
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

   // Protect teacher routes
   if (path.startsWith("/teacher") && !isTeacher) {
      if (isStudent) {
         return NextResponse.redirect(
            new URL("/student/dashboard", request.url)
         );
      }
      return NextResponse.redirect(new URL("/login", request.url));
   }

   // Protect student routes
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
      /*
       * Match all request paths except for the ones starting with:
       * - api/auth (Next Auth API routes)
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico (favicon file)
       */
      "/((?!_next/static|_next/image|favicon.ico).*)",
   ],
};
