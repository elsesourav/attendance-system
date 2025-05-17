import { AuthProvider } from "@/components/auth-provider";
import { LoadingProvider } from "@/components/loading-overlay";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
   title: "Attendance System",
   description: "A system for tracking student attendance",
   icons: {
      icon: [
         { url: "/images/icon-64.png", sizes: "64x64", type: "image/png" },
         {
            url: "/images/icon-1024.png",
            sizes: "1024x1024",
            type: "image/png",
         },
      ],
   },
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang="en" suppressHydrationWarning>
         <body className={inter.className}>
            <ThemeProvider
               attribute="class"
               defaultTheme="system"
               enableSystem
               disableTransitionOnChange
            >
               <AuthProvider>
                  <LoadingProvider>
                     {children}
                     <Toaster richColors position="top-right" />
                  </LoadingProvider>
               </AuthProvider>
            </ThemeProvider>
         </body>
      </html>
   );
}
