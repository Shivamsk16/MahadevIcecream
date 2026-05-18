import { format, parseISO } from "date-fns";

export function formatDate(date: string): string {
  return format(parseISO(date), "dd MMM yyyy");
}

export function formatDateTime(date: string): string {
  return format(parseISO(date), "dd MMM yyyy, h:mm a");
}
