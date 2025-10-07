import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractIdFromUrl(url: string) {
  const parts = url.split("/");
  return parts[parts.length - 1];
}

export function getFileType(filename: string | undefined): string {
  if (!filename) {
    return ""; // Return an empty string if filename is undefined or empty
  }

  const parts = filename.split(".");

  if (parts.length < 2) {
    return ""; // Return an empty string if there is no file extension
  }

  return parts.pop()!.toLowerCase();
}
