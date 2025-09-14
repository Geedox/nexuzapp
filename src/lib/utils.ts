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

export type LiveMarketPrice = {
  code: number,
  msg: string,
  data: {
    prices:
    {
      base_symbol: string,
      quote_symbol: string,
      price: string,
      market: string
    }[]
  }
}

export const liveMarketPrice = async (): Promise<{
  USDC: string,
  SUI: string,
  USDT: string
}> => {
  const [suiUsdcResponse, usdtusdcResponse] = await Promise.all([
    await fetch("https://api-sui.cetus.zone/v3/sui/market_price?base_symbol_address=0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI,0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC"),
    await fetch("https://api-sui.cetus.zone/v3/sui/market_price?base_symbol_address=0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT,0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC")
  ])

  const [suiUsdcData, usdtusdcData] = await Promise.all([
    suiUsdcResponse.json(),
    usdtusdcResponse.json()
  ])
  return {
    USDC: suiUsdcData.data.prices[1].price,
    SUI: suiUsdcData.data.prices[0].price,
    USDT: usdtusdcData.data.prices[0].price
  }
}

export const verifyCoinForRoomCreation = (coin: string) => {
  if (coin !== "USDC" && coin !== "USDT") return false;
  else return true;
}
