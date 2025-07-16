import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { initGameTokenManager } from '@/integrations/smartcontracts/gameToken';

interface WalletContextType {
  // Blockchain balances
  suiBalance: number;
  gameTokenBalance: number;
  usdcBalance: number;
  usdtBalance: number;

  // Loading states
  loading: boolean;
  refreshingBalances: boolean;

  // Functions
  refreshBalances: () => Promise<void>;
  getTotalBalanceInUSD: () => number;
  gameTokenManager: any;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Exchange rates (in production, fetch these from an API)
const EXCHANGE_RATES = {
  SUI: 2.5, // 1 SUI = $2.5 USD (example rate)
  USDC: 1,
  USDT: 1,
  GAME_TOKEN: 0.01, // 1 GT = $0.01 USD (example rate)
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [suiBalance, setSuiBalance] = useState<number>(0);
  const [gameTokenBalance, setGameTokenBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshingBalances, setRefreshingBalances] = useState(false);
  const [gameTokenManager, setGameTokenManager] = useState(null);

  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  // Initialize Sui client and GameToken manager
  const NETWORK = 'testnet';
  const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });

  // CORRECTED USDC and USDT token types on Sui (these are the actual testnet addresses)
  const TOKEN_TYPES = {
    // Testnet USDC - check your actual wallet on Sui explorer for the correct type
    USDC: '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
    // Testnet USDT - check your actual wallet on Sui explorer for the correct type  
    USDT: '0x26b3bc67befc214058ca78ea9a2690298d731a2d4ab88c1474ac44fd8c5b13ee::usdt::USDT',
    // Alternative common testnet tokens - try these if above don't work
    USDC_ALT: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
  };

  // Initialize GameToken manager
  useEffect(() => {
    const manager = initGameTokenManager(suiClient, NETWORK);
    setGameTokenManager(manager);
  }, []);

  // Create wallet record in database when wallet is first created
  const createWalletRecord = async (address: string) => {
    if (!user) return;

    try {
      console.log('🏦 Creating wallet record in database...');

      // Create separate records for each currency type (as per your DB schema)
      const walletRecords = [
        {
          user_id: user.id,
          currency: 'SUI',
          balance: 0,
          wallet_address: address,
          is_connected: true,
          sui_balance: 0,
          game_tokens_balance: 0,
        },
        {
          user_id: user.id,
          currency: 'USDC',
          balance: 0,
          wallet_address: address,
          is_connected: true,
          sui_balance: 0,
          game_tokens_balance: 0,
        },
        {
          user_id: user.id,
          currency: 'USDT',
          balance: 0,
          wallet_address: address,
          is_connected: true,
          sui_balance: 0,
          game_tokens_balance: 0,
        },
        {
          user_id: user.id,
          currency: 'GAME_TOKEN',
          balance: 0,
          wallet_address: address,
          is_connected: true,
          sui_balance: 0,
          game_tokens_balance: 0,
        }
      ];

      const { error } = await supabase
        .from('wallets')
        .upsert(walletRecords, {
          onConflict: 'user_id,currency',
          ignoreDuplicates: false
        });

      if (error) throw error;

      console.log('✅ Wallet records created successfully');
    } catch (error) {
      console.error('❌ Error creating wallet record:', error);
    }
  };

  // Fetch blockchain balances
  const fetchBlockchainBalances = async () => {
    if (!profile?.sui_wallet_data?.address || !gameTokenManager) return;

    try {
      const address = profile.sui_wallet_data.address;
      console.log('🔍 Fetching balances for address:', address);

      // Get SUI balance
      const suiBalanceResult = await suiClient.getBalance({
        owner: address,
      });
      const suiAmount = Number(suiBalanceResult.totalBalance) / 1_000_000_000;
      setSuiBalance(suiAmount);
      console.log('💰 SUI Balance:', suiAmount);

      // Get Game Token balance using our manager
      const gtBalance = await gameTokenManager.getGameTokenBalance(address);
      setGameTokenBalance(gtBalance);
      console.log('🎮 Game Token Balance:', gtBalance);

      // Try multiple USDC token types to find the correct one
      let usdcAmount = 0;
      const usdcTypes = [TOKEN_TYPES.USDC, TOKEN_TYPES.USDC_ALT];

      for (const tokenType of usdcTypes) {
        try {
          console.log('🔍 Trying USDC token type:', tokenType);
          const usdcBalanceResult = await suiClient.getBalance({
            owner: address,
            coinType: tokenType,
          });
          const balance = Number(usdcBalanceResult.totalBalance);
          if (balance > 0) {
            // USDC typically has 6 decimals
            usdcAmount = balance / 1_000_000;
            console.log('💎 Found USDC Balance:', usdcAmount, 'with type:', tokenType);
            break;
          }
        } catch (error) {
          console.log('❌ USDC type failed:', tokenType, error.message);
        }
      }
      setUsdcBalance(usdcAmount);

      // Try to get all coin types to find what user actually has
      try {
        console.log('🔍 Getting all coins for debugging...');
        const allCoins = await suiClient.getAllCoins({ owner: address });
        console.log('📊 All coins found:', allCoins.data.map(coin => ({
          type: coin.coinType,
          balance: coin.balance,
          formatted: Number(coin.balance) / 1_000_000
        })));
      } catch (error) {
        console.log('Debug coin fetch failed:', error);
      }

      // Get USDT balance (try the token type)
      let usdtAmount = 0;
      try {
        const usdtBalanceResult = await suiClient.getBalance({
          owner: address,
          coinType: TOKEN_TYPES.USDT,
        });
        usdtAmount = Number(usdtBalanceResult.totalBalance) / 1_000_000;
        setUsdtBalance(usdtAmount);
        console.log('🟢 USDT Balance:', usdtAmount);
      } catch (error) {
        console.log('❌ USDT not found:', error.message);
        setUsdtBalance(0);
      }

      // Update database with current balances
      await updateDatabaseBalances(suiAmount, gtBalance, usdcAmount, usdtAmount, address);

    } catch (error) {
      console.error('❌ Error fetching blockchain balances:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet balances",
        variant: "destructive",
      });
    }
  };

  // Update database with current balances (FIXED)
  const updateDatabaseBalances = async (
    suiAmount: number,
    gtAmount: number,
    usdcAmount: number,
    usdtAmount: number,
    address: string
  ) => {
    if (!user) return;

    try {
      console.log('🏦 Updating database balances...');

      // Update separate records for each currency (matching your DB schema)
      const updates = [
        {
          user_id: user.id,
          currency: 'SUI',
          balance: suiAmount,
          wallet_address: address,
          is_connected: true,
          sui_balance: suiAmount,
          game_tokens_balance: gtAmount,
          updated_at: new Date().toISOString(),
        },
        {
          user_id: user.id,
          currency: 'USDC',
          balance: usdcAmount,
          wallet_address: address,
          is_connected: true,
          sui_balance: suiAmount,
          game_tokens_balance: gtAmount,
          updated_at: new Date().toISOString(),
        },
        {
          user_id: user.id,
          currency: 'USDT',
          balance: usdtAmount,
          wallet_address: address,
          is_connected: true,
          sui_balance: suiAmount,
          game_tokens_balance: gtAmount,
          updated_at: new Date().toISOString(),
        },
        {
          user_id: user.id,
          currency: 'GAME_TOKEN',
          balance: gtAmount,
          wallet_address: address,
          is_connected: true,
          sui_balance: suiAmount,
          game_tokens_balance: gtAmount,
          updated_at: new Date().toISOString(),
        }
      ];

      const { error } = await supabase
        .from('wallets')
        .upsert(updates, {
          onConflict: 'user_id,currency',
          ignoreDuplicates: false
        });

      if (error) throw error;

      console.log('✅ Database balances updated successfully');
    } catch (error) {
      console.error('❌ Error updating database balances:', error);
    }
  };

  // Save transaction to database
  const saveTransactionToDatabase = async (
    transactionData: {
      type: string;
      amount: number;
      currency: string;
      transaction_hash?: string;
      description?: string;
      status?: string;
    }
  ) => {
    if (!user) return;

    try {
      console.log('💾 Saving transaction to database:', transactionData);

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: transactionData.type,
          amount: transactionData.amount,
          currency: transactionData.currency,
          transaction_hash: transactionData.transaction_hash,
          description: transactionData.description || `${transactionData.type} ${transactionData.currency}`,
          status: transactionData.status || 'completed',
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      console.log('✅ Transaction saved to database');
    } catch (error) {
      console.error('❌ Error saving transaction:', error);
    }
  };

  // Refresh all balances
  const refreshBalances = async () => {
    if (!gameTokenManager) return;

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
      (suiBalance * EXCHANGE_RATES.SUI) +
      (usdcBalance * EXCHANGE_RATES.USDC) +
      (usdtBalance * EXCHANGE_RATES.USDT) +
      (gameTokenBalance * EXCHANGE_RATES.GAME_TOKEN)
    );
  };

  // Load balances when wallet is available
  useEffect(() => {
    if (profile?.sui_wallet_data?.address && gameTokenManager) {
      // Create wallet record if it doesn't exist
      createWalletRecord(profile.sui_wallet_data.address);

      // Fetch current balances
      fetchBlockchainBalances().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [profile?.sui_wallet_data?.address, gameTokenManager]);

  // Expose saveTransactionToDatabase for other components to use
  const value = {
    // Balances
    suiBalance,
    gameTokenBalance,
    usdcBalance,
    usdtBalance,

    // Loading states
    loading,
    refreshingBalances,

    // Functions
    refreshBalances,
    getTotalBalanceInUSD,
    gameTokenManager,

    // New function for saving transactions
    saveTransactionToDatabase,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};