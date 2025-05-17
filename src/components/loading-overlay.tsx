"use client";

import { createContext, useContext, useState } from "react";

// Create a context to manage the loading state globally
interface LoadingContextType {
   isLoading: boolean;
   message: string;
   setLoading: (loading: boolean) => void;
   showLoading: (message?: string) => void;
   hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
   isLoading: false,
   message: "Loading...",
   setLoading: () => {},
   showLoading: () => {},
   hideLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({
   children,
}: {
   children: React.ReactNode;
}) => {
   const [isLoading, setIsLoading] = useState(false);
   const [message, setMessage] = useState("Loading...");

   const setLoading = (loading: boolean) => {
      setIsLoading(loading);
   };

   const showLoading = (customMessage?: string) => {
      if (customMessage) {
         setMessage(customMessage);
      } else {
         setMessage("Loading...");
      }
      setIsLoading(true);
   };

   const hideLoading = () => {
      setIsLoading(false);
   };

   return (
      <LoadingContext.Provider
         value={{ isLoading, message, setLoading, showLoading, hideLoading }}
      >
         {children}
         {isLoading && <LoadingOverlay message={message} />}
      </LoadingContext.Provider>
   );
};

interface LoadingOverlayProps {
   message: string;
}

export const LoadingOverlay = ({ message }: LoadingOverlayProps) => {
   return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
         <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl flex flex-col items-center max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 animate-scaleIn">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-xl pointer-events-none">
               <div className="absolute -top-6 -left-6 w-12 h-12 bg-primary/10 rounded-full"></div>
               <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-primary/10 rounded-full"></div>
               <div className="absolute top-1/4 right-4 w-2 h-2 bg-primary/20 rounded-full"></div>
               <div className="absolute bottom-1/4 left-4 w-2 h-2 bg-primary/20 rounded-full"></div>
            </div>

            {/* Spinner */}
            <div className="relative z-10">
               <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
               <div
                  className="w-20 h-20 border-4 border-transparent border-l-primary/40 rounded-full animate-spin absolute top-0 left-0"
                  style={{
                     animationDirection: "reverse",
                     animationDuration: "1.5s",
                  }}
               ></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full animate-pulse"></div>
               </div>
            </div>

            {/* Message */}
            <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-300 relative z-10">
               {message}
            </p>

            {/* Progress bar */}
            <div className="mt-4 w-56 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative z-10">
               <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full animate-progressBar"></div>
            </div>

            {/* Additional text */}
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 animate-pulse relative z-10">
               Please wait while we process your request
            </p>
         </div>
      </div>
   );
};
