import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function statusColor(status: string) {
  switch (status) {
    case "active":
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "running":
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "failed":
    case "disabled":
      return "bg-red-100 text-red-800";
    case "draft":
    case "pending":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}
