import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { NETWORK, COIN_TYPES } from "@/constants";

interface WalletContextType {
  // Blockchain balances
  suiBalance: number;
  usdcBalance: number;
  usdtBalance: number;

  // Loading states
  loading: boolean;
  refreshingBalances: boolean;

  // Functions
  refreshBalances: () => Promise<void>;
  getTotalBalanceInUSD: () => number;
  suiClient: SuiClient;
  saveTransactionToDatabase: (transactionData: any) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

// Exchange rates (in production, fetch these from an API)
const EXCHANGE_RATES = {
  SUI: 2.5, // 1 SUI = $2.5 USD (example rate)
  USDC: 1,
  USDT: 1,
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [suiBalance, setSuiBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshingBalances, setRefreshingBalances] = useState(false);

  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });

  // Token types for Sui testnet
  const TOKEN_TYPES = COIN_TYPES;

  // Create wallet record in database
  const createWalletRecord = async (address: string) => {
    if (!user) return;

    try {
      console.log("🏦 Creating wallet record in database...");

      const walletRecords = [
        {
          user_id: user.id,
          currency: "SUI",
          balance: 0,
          wallet_address: address,
          is_connected: true,
        },
        {
          user_id: user.id,
          currency: "USDC",
          balance: 0,
          wallet_address: address,
          is_connected: true,
        },
        {
          user_id: user.id,
          currency: "USDT",
          balance: 0,
          wallet_address: address,
          is_connected: true,
        },
      ];

      const { error } = await supabase.from("wallets").upsert(walletRecords, {
        onConflict: "user_id,currency",
        ignoreDuplicates: false,
      });

      if (error) throw error;
      console.log("✅ Wallet records created successfully");
    } catch (error) {
      console.error("❌ Error creating wallet record:", error);
    }
  };

  // Fetch blockchain balances
  const fetchBlockchainBalances = async () => {
    if (!profile?.sui_wallet_data?.address) return;

    try {
      const address = profile.sui_wallet_data.address;
      console.log("🔍 Fetching balances for address:", address);

      // Get SUI balance
      const suiBalanceResult = await suiClient.getBalance({
        owner: address,
      });
      const suiAmount = Number(suiBalanceResult.totalBalance) / 1_000_000_000;
      setSuiBalance(suiAmount);
      console.log("💰 SUI Balance:", suiAmount);

      // Get USDC balance
      let usdcAmount = 0;
      try {
        const usdcBalanceResult = await suiClient.getBalance({
          owner: address,
          coinType: TOKEN_TYPES.USDC,
        });
        usdcAmount = Number(usdcBalanceResult.totalBalance) / 1_000_000;
        console.log("💎 USDC Balance:", usdcAmount);
      } catch (error) {
        console.log("❌ USDC not found:", error.message);
      }
      setUsdcBalance(usdcAmount);

      // Get USDT balance
      let usdtAmount = 0;
      try {
        const usdtBalanceResult = await suiClient.getBalance({
          owner: address,
          coinType: TOKEN_TYPES.USDT,
        });
        usdtAmount = Number(usdtBalanceResult.totalBalance) / 1_000_000;
        console.log("🟢 USDT Balance:", usdtAmount);
      } catch (error) {
        console.log("❌ USDT not found:", error.message);
      }
      setUsdtBalance(usdtAmount);

      // Update database with current balances
      await updateDatabaseBalances(suiAmount, usdcAmount, usdtAmount, address);
    } catch (error) {
      console.error("❌ Error fetching blockchain balances:", error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet balances",
        variant: "destructive",
      });
    }
  };

  // Update database with current balances
  const updateDatabaseBalances = async (
    suiAmount: number,
    usdcAmount: number,
    usdtAmount: number,
    address: string
  ) => {
    if (!user) return;

    try {
      console.log("🏦 Updating database balances...");

      const updates = [
        {
          user_id: user.id,
          currency: "SUI",
          balance: suiAmount,
          wallet_address: address,
          is_connected: true,
          updated_at: new Date().toISOString(),
        },
        {
          user_id: user.id,
          currency: "USDC",
          balance: usdcAmount,
          wallet_address: address,
          is_connected: true,
          updated_at: new Date().toISOString(),
        },
        {
          user_id: user.id,
          currency: "USDT",
          balance: usdtAmount,
          wallet_address: address,
          is_connected: true,
          updated_at: new Date().toISOString(),
        },
      ];

      const { error } = await supabase.from("wallets").upsert(updates, {
        onConflict: "user_id,currency",
        ignoreDuplicates: false,
      });

      if (error) throw error;
      console.log("✅ Database balances updated successfully");
    } catch (error) {
      console.error("❌ Error updating database balances:", error);
    }
  };

  // Save transaction to database
  const saveTransactionToDatabase = async (transactionData: {
    type: string;
    amount: number;
    currency: string;
    transaction_hash?: string;
    description?: string;
    status?: string;
  }) => {
    if (!user) return;

    try {
      console.log("💾 Saving transaction to database:", transactionData);

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: transactionData.type,
        amount: transactionData.amount,
        currency: transactionData.currency,
        transaction_hash: transactionData.transaction_hash,
        description:
          transactionData.description ||
          `${transactionData.type} ${transactionData.currency}`,
        status: transactionData.status || "completed",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      console.log("✅ Transaction saved to database");
    } catch (error) {
      console.error("❌ Error saving transaction:", error);
    }
  };

  // Refresh all balances
  const refreshBalances = async () => {
    setRefreshingBalances(true);
    try {
      await fetchBlockchainBalances();
    } finally {
      setRefreshingBalances(false);
    }
  };

  // Get total balance in USD
  const getTotalBalanceInUSD = (): number => {
    return (
      suiBalance * EXCHANGE_RATES.SUI +
      usdcBalance * EXCHANGE_RATES.USDC +
      usdtBalance * EXCHANGE_RATES.USDT
    );
  };

  // Load balances when wallet is available
  useEffect(() => {
    if (profile?.sui_wallet_data?.address) {
      createWalletRecord(profile.sui_wallet_data.address);
      fetchBlockchainBalances().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.sui_wallet_data?.address]);

  const value = {
    // Balances
    suiBalance,
    usdcBalance,
    usdtBalance,

    // Loading states
    loading,
    refreshingBalances,

    // Functions
    refreshBalances,
    getTotalBalanceInUSD,
    suiClient,
    saveTransactionToDatabase,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
