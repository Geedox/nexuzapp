import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../hooks/auth";
import { useProfile } from "../hooks/profile";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "../hooks/use-toast";
import type { Database } from "../integrations/supabase/types";
import { getTokenBalancesInFiat, pannaClient } from "../lib/panna";
import {
  useActiveAccount,
  useTokenBalances,
  useTotalFiatBalance,
} from "panna-sdk/react";
import { SUPPORTED_TOKENS, type SupportedToken } from "../constants";
import { FiatBalances, WalletBalances } from "@/types/wallet";
import { WalletContextType } from "@/types/wallet";
import { WalletContext } from "@/hooks/wallet";

const EMPTY_BALANCES: WalletBalances = SUPPORTED_TOKENS.reduce(
  (acc, token) => ({ ...acc, [token]: 0 }),
  {} as WalletBalances
);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const activeAccount = useActiveAccount();
  const [refreshingBalances, setRefreshingBalances] = useState(false);
  const [fiatBalances, setFiatBalances] =
    useState<FiatBalances>(EMPTY_BALANCES);

  const address =
    activeAccount?.address ?? profile?.sui_wallet_data?.address ?? null;

  const {
    data: balancesData,
    isLoading: balancesLoading,
    refetch: refetchBalances,
  } = useTokenBalances(
    { address: address ?? "" },
    {
      enabled: Boolean(address),
      staleTime: 30_000,
    }
  );

  const { data: totalFiatValue } = useTotalFiatBalance(
    { address: address ?? "" },
    {
      enabled: Boolean(address),
    }
  );

  const balances = useMemo(() => {
    if (!balancesData) {
      return EMPTY_BALANCES;
    }

    const balanceMap: WalletBalances = { ...EMPTY_BALANCES };
    balancesData.forEach((tokenBalance: any) => {
      const symbol = tokenBalance.token?.symbol as SupportedToken | undefined;
      if (!symbol || !SUPPORTED_TOKENS.includes(symbol)) {
        return;
      }
      const value = Number(tokenBalance.displayValue ?? 0);
      balanceMap[symbol] = Number.isFinite(value) ? value : 0;
    });
    return balanceMap;
  }, [balancesData]);

  const refreshFiatBalances = useCallback(async () => {
    if (!address) {
      setFiatBalances(EMPTY_BALANCES);
      return;
    }
    try {
      const portfolio = await getTokenBalancesInFiat(address);
      const nextFiat: FiatBalances = { ...EMPTY_BALANCES };
      const balancesArray = Array.isArray(portfolio)
        ? portfolio
        : portfolio.tokenBalances ?? [];
      balancesArray.forEach((token) => {
        const symbol = token.token.symbol as SupportedToken | undefined;
        if (!symbol || !SUPPORTED_TOKENS.includes(symbol)) return;
        const fiat = Number(token.fiatBalance?.amount ?? 0);
        nextFiat[symbol] = Number.isFinite(fiat) ? fiat : 0;
      });
      setFiatBalances(nextFiat);
    } catch (error) {
      console.error("Failed to refresh fiat balances", error);
    }
  }, [address]);

  useEffect(() => {
    refreshFiatBalances();
  }, [refreshFiatBalances, balancesData]);

  const refreshBalances = useCallback(async () => {
    if (!address) return;
    setRefreshingBalances(true);
    try {
      await Promise.all([refetchBalances(), refreshFiatBalances()]);
    } finally {
      setRefreshingBalances(false);
    }
  }, [address, refetchBalances, refreshFiatBalances]);

  const saveTransactionToDatabase = async (transactionData: {
    type: Database["public"]["Enums"]["transaction_type"];
    amount: number;
    currency: Database["public"]["Enums"]["currency_type"];
    transaction_hash?: string;
    description?: string;
    status?: string;
    room_id?: string | null;
  }) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("transactions").insert([
        {
          user_id: user.id,
          type: transactionData.type,
          amount: transactionData.amount,
          currency: transactionData.currency,
          transaction_hash: transactionData.transaction_hash,
          description:
            transactionData.description ||
            `${transactionData.type} ${transactionData.currency}`,
          status: transactionData.status || "completed",
          room_id: transactionData.room_id ?? null,
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast({
        title: "Unable to save transaction",
        description: "We couldn't sync this transaction to your profile.",
        variant: "destructive",
      });
    }
  };

  const contextValue: WalletContextType = {
    address,
    account: activeAccount,
    loading: balancesLoading && Boolean(address),
    refreshingBalances,
    getTotalBalanceInUSD: () => totalFiatValue ?? 0,
    suiClient: null,
    lskBalance: balances.LSK,
    ethBalance: balances.ETH,
    usdcBalance: balances.USDC,
    usdtBalance: balances.USDT,
    suiBalance: balances.LSK,
    balances,
    fiatBalances,
    totalBalanceUsd: totalFiatValue ?? 0,
    balanceFor: (token: SupportedToken) => balances[token] ?? 0,
    fiatFor: (token: SupportedToken) => fiatBalances[token] ?? 0,
    refreshBalances,
    saveTransactionToDatabase,
    pannaClient,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};
