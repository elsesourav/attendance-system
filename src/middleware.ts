import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
   const token = await getToken({ req: request });
   const isAuthenticated = !!token;

   // Paths that don't require authentication
   const publicPaths = ["/", "/login", "/register"];

   // Check if the path is public
   const isPublicPath = publicPaths.some(
      (path) =>
         request.nextUrl.pathname === path ||
         request.nextUrl.pathname.startsWith(`${path}/`)
   );

   // Redirect logic
   if (!isAuthenticated && !isPublicPath) {
      // Redirect to login if trying to access protected route while not authenticated
      return NextResponse.redirect(new URL("/login", request.url));
   }

   if (isAuthenticated && isPublicPath && request.nextUrl.pathname !== "/") {
      // Redirect to dashboard if trying to access login/register while authenticated
      return NextResponse.redirect(new URL("/dashboard", request.url));
   }

   return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
   matcher: [
      /*
       * Match all request paths except:
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico (favicon file)
       * - public folder
       * - api routes
       */
      "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
   ],
};
