"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import * as React from "react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
   const [mounted, setMounted] = React.useState(false);

   // useEffect only runs on the client, so now we can safely show the UI
   React.useEffect(() => {
      setMounted(true);
   }, []);

   // Prevent hydration mismatch by only rendering children when mounted
   return (
      <NextThemesProvider
         {...props}
         enableSystem
         attribute="class"
         defaultTheme="system"
         enableColorScheme
         disableTransitionOnChange
      >
         {mounted ? children : null}
      </NextThemesProvider>
   );
}
