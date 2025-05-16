import { executeQuery } from "@/lib/db";
import bcrypt from "bcrypt";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Extend the built-in session types
declare module "next-auth" {
   interface Session {
      user: {
         id: string;
         name?: string | null;
         email?: string | null;
         image?: string | null;
         role: string;
      };
   }

   interface User {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
   }
}

declare module "next-auth/jwt" {
   interface JWT {
      id: string;
      role: string;
   }
}

interface User {
   id: number;
   name: string;
   email: string;
   password: string;
   role: "student" | "teacher";
}

export const authOptions: NextAuthOptions = {
   providers: [
      CredentialsProvider({
         name: "Credentials",
         credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
         },
         async authorize(credentials) {
            console.log("Auth attempt with credentials:", {
               email: credentials?.email,
            });

            if (!credentials?.email || !credentials?.password) {
               console.log("Missing credentials");
               return null;
            }

            try {
               console.log("Querying database for user:", credentials.email);

               const users = await executeQuery<User[]>({
                  query: "SELECT * FROM users WHERE email = ?",
                  values: [credentials.email],
               });

               console.log(
                  "Query result:",
                  users.length > 0 ? "User found" : "User not found"
               );

               const user = users[0];

               if (!user) {
                  console.log("User not found in database");
                  return null;
               }

               console.log("Comparing passwords");
               const passwordMatch = await bcrypt.compare(
                  credentials.password,
                  user.password
               );

               console.log("Password match:", passwordMatch);

               if (!passwordMatch) {
                  console.log("Password does not match");
                  return null;
               }

               console.log("Authentication successful for user:", user.email);
               return {
                  id: user.id.toString(),
                  name: user.name,
                  email: user.email,
                  role: user.role,
               };
            } catch (error) {
               console.error("Authentication error:", error);
               return null;
            }
         },
      }),
   ],
   callbacks: {
      async jwt({ token, user }) {
         if (user) {
            token.id = user.id;
            token.role = user.role;
         }
         return token;
      },
      async session({ session, token }) {
         if (token && session.user) {
            session.user.id = token.id as string;
            session.user.role = token.role as string;
         }
         return session;
      },
   },
   pages: {
      signIn: "/login",
   },
   session: {
      strategy: "jwt",
   },
   secret: process.env.NEXTAUTH_SECRET,
};
