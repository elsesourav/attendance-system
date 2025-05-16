import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyTeacherPassword } from "./models/teacher";
import { verifyStudentPassword } from "./models/student";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "teacher-login",
      name: "Teacher Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const teacher = await verifyTeacherPassword(
          credentials.email,
          credentials.password
        );

        if (!teacher) {
          return null;
        }

        return {
          id: String(teacher.id),
          name: teacher.name,
          email: teacher.email,
          role: "teacher",
        };
      },
    }),
    CredentialsProvider({
      id: "student-login",
      name: "Student Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const student = await verifyStudentPassword(
          credentials.email,
          credentials.password
        );

        if (!student) {
          return null;
        }

        return {
          id: String(student.id),
          name: student.name,
          email: student.email,
          role: "student",
          registrationNumber: student.registration_number,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        if (user.role === "student" && user.registrationNumber) {
          token.registrationNumber = user.registrationNumber;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        if (token.role === "student" && token.registrationNumber) {
          session.user.registrationNumber = token.registrationNumber as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
