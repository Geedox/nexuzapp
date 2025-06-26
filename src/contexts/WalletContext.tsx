import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Wallet {
  id: string;
  user_id: string | null;
  currency: 'USDC' | 'USDT' | 'NGN';
  balance: number | null;
  wallet_address: string | null;
  is_connected: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface WalletContextType {
  wallets: Wallet[];
  loading: boolean;
  refreshWallets: () => Promise<void>;
  getWalletBalance: (currency: 'USDC' | 'USDT' | 'NGN') => number;
  getTotalBalanceInUSD: () => number;
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
  NGN: 0.0008, // 1 NGN = 0.0008 USD (example rate)
  USDC: 1,
  USDT: 1,
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user wallets
  const fetchWallets = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh wallets
  const refreshWallets = async () => {
    if (!user) return;
    await fetchWallets(user.id);
  };

  // Get balance for specific currency
  const getWalletBalance = (currency: 'USDC' | 'USDT' | 'NGN'): number => {
    const wallet = wallets.find(w => w.currency === currency);
    return wallet?.balance || 0;
  };

  // Get total balance in USD
  const getTotalBalanceInUSD = (): number => {
    return wallets.reduce((total, wallet) => {
      const balance = wallet.balance || 0;
      const rate = EXCHANGE_RATES[wallet.currency];
      return total + (balance * rate);
    }, 0);
  };

  // Load wallets when user changes
  useEffect(() => {
    if (user) {
      fetchWallets(user.id);
    } else {
      setWallets([]);
      setLoading(false);
    }
  }, [user]);

  const value = {
    wallets,
    loading,
    refreshWallets,
    getWalletBalance,
    getTotalBalanceInUSD,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};