import { SupportedToken } from "@/constants";
import { pannaClient } from "@/lib/panna";
import { Database } from "@/integrations/supabase/types";
import { Account } from "panna-sdk/core";

export type WalletAccount = Account;

export type WalletBalances = Record<SupportedToken, number>;
export type FiatBalances = Record<SupportedToken, number>;

export interface WalletContextType {
    address: string | null;
    account: WalletAccount;
    loading: boolean;
    refreshingBalances: boolean;
    getTotalBalanceInUSD: () => number;
    lskBalance: number;
    ethBalance: number;
    usdcBalance: number;
    usdtBalance: number;
    suiBalance: number;
    balances: WalletBalances;
    fiatBalances: FiatBalances;
    totalBalanceUsd: number;
    balanceFor: (token: SupportedToken) => number;
    fiatFor: (token: SupportedToken) => number;
    refreshBalances: () => Promise<void>;
    saveTransactionToDatabase: (transactionData: {
        type: Database["public"]["Enums"]["transaction_type"];
        amount: number;
        currency: Database["public"]["Enums"]["currency_type"];
        transaction_hash?: string;
        description?: string;
        status?: string;
        room_id?: string | null;
    }) => Promise<void>;
    pannaClient: typeof pannaClient;
}