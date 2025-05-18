import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merges Tailwind classes
export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}
