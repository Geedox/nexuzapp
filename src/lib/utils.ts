import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface MarketPlaceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'nfts' | 'gaming' | 'arts' | 'assets' | 'general';
  rarity?: string;
}

export const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/** Converts a Date object from one timezone to another and returns a new Date object in the target timezone.
 *Note: The returned Date object is in local time, but represents the same wall-clock time in the target timezone.
 *If you need a string, use .toLocaleString with the target timezone.
 *This function does not mutate the original date.
 *This function does not mutate the original date.

 Example: convertTimezone(new Date(), "America/New_York", "Asia/Tokyo")
*/
export const convertTimezone = (
  date: Date,
  fromTimezone: string,
  toTimezone: string
) => {
  // Get the date's components in the source timezone
  const utcDate = new Date(
    date.toLocaleString("en-US", { timeZone: fromTimezone })
  );

  // Get the equivalent time in the target timezone as a string
  const targetDateString = utcDate.toLocaleString("en-US", {
    timeZone: toTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Parse the string back to a Date object (in local time)
  // Format: MM/DD/YYYY, HH:MM:SS
  const [datePart, timePart] = targetDateString.split(", ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);

  // Construct a Date object in the local timezone, but representing the target timezone's wall-clock time
  return new Date(year, month - 1, day, hour, minute, second).toLocaleString("en-US", {
    timeZone: toTimezone,
  });
};
