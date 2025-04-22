import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}

export function formatMessageDateTime(date: string | Date): string {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // If message is from today, only show time
  if (messageDate.toDateString() === today.toDateString()) {
    return format(messageDate, 'HH:mm');
  }
  // If message is from yesterday, show "Yesterday" and time
  else if (messageDate.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${format(messageDate, 'HH:mm')}`;
  }
  // Otherwise show short date and time
  return format(messageDate, 'MMM d, HH:mm');
}
