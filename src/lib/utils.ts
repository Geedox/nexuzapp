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
