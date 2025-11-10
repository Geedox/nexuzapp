import { chain } from "panna-sdk/core";

type SupportedNetwork = "testnet" | "mainnet";

const TOKEN_ADDRESS_MAP = {
  testnet: {
    LSK: "0x8a21CF9Ba08Ae709D64Cb25AfAA951183EC9FF6D",
    ETH: "0x6bb6ed8d3604a61de0b14ab71e8cb15980e49cc9",
    USDC: "0x0E82fDDAd51cc3ac12b69761C45bBCB9A2Bf3C83",
    USDT: null,
  },
  mainnet: {
    LSK: "0xac485391EB2d7D88253a7F1eF18C37f4242D1A24",
    ETH: "0x6bb6ed8d3604a61de0b14ab71e8cb15980e49cc9",
    USDC: "0xF242275d3a6527d877f2c927a82D9b057609cc71",
    USDT: "0x05D032ac25d322df992303dCa074EE7392C117b9",
  },
} as const satisfies Record<SupportedNetwork, Record<string, string | null>>;


export const SUPPORTED_TOKENS = ["LSK", "ETH", "USDC", "USDT"] as const;
export type SupportedToken = (typeof SUPPORTED_TOKENS)[number];

export const TOKEN_DECIMALS: Record<SupportedToken, number> = {
  LSK: 18,
  ETH: 18,
  USDC: 6,
  USDT: 6,
};

export const ADMIN_WALLET_ADDRESS = import.meta.env.VITE_ADMIN_WALLET_ADDRESS ?? "";
const resolveNetwork = (): SupportedNetwork => {
  const explicit = import.meta.env.VITE_PANNA_NETWORK;
  if (explicit === "mainnet" || explicit === "testnet") {
    return explicit;
  }
  return import.meta.env.NODE_ENV === "production" ? "mainnet" : "testnet";
};

export const PANNA_NETWORK: SupportedNetwork = resolveNetwork();

export const TOKEN_ADDRESSES = TOKEN_ADDRESS_MAP[PANNA_NETWORK];
export const getTokenAddress = (
  symbol: SupportedToken,
  network: SupportedNetwork = PANNA_NETWORK
) => TOKEN_ADDRESS_MAP[network][symbol] ?? undefined;

export const CURRENCY: Record<SupportedToken, SupportedToken> = {
  LSK: "LSK",
  ETH: "ETH",
  USDC: "USDC",
  USDT: "USDT",
};

export const SESSION_STORAGE_KEY = "nexuz_game_sessions";
export const ROOM_ID = "room_id";

export const pannaClientId = import.meta.env.VITE_PANNA_CLIENT_ID;
export const ecosystemPartnerId = import.meta.env.VITE_ECOSYSTEM_PARTNER_ID;
export const CHAIN_ID = String(chain.liskSepolia.id);
export const NETWORK = chain.liskSepolia;

export const Currency = {
  USDT: 0,
  USDC: 1,
} as const;

export const SplitRule = {
  WinnerTakesAll: 0,
  Top2: 1,
  Top3: 2,
  Top4: 3,
  Top5: 4,
  Top10: 5,
} as const;

export const convertSplitRuleToString = (splitRule: "winner_takes_all" | "top_2" | "top_3" | "top_4" | "top_5" | "top_10") => {
  switch (splitRule) {
    case "winner_takes_all":
      return SplitRule.WinnerTakesAll;
    case "top_2":
      return SplitRule.Top2;
    case "top_3":
      return SplitRule.Top3;
    case "top_4":
      return SplitRule.Top4;
    case "top_5":
      return SplitRule.Top5;
    case "top_10":
      return SplitRule.Top10;
  }
};