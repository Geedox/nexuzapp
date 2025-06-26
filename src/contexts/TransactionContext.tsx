import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  user_id: string | null;
  room_id: string | null;
  type: 'deposit' | 'withdrawal' | 'win' | 'loss' | 'conversion';
  amount: number;
  currency: 'USDC' | 'USDT' | 'NGN';
  status: string | null;
  description: string | null;
  transaction_hash: string | null;
  created_at: string | null;
}

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  refreshTransactions: () => Promise<void>;
  initiateNGNDeposit: (amount: number) => Promise<string>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransaction = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
};

export const TransactionProvider = ({ children }: { children: React.ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user transactions
  const fetchTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transaction history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh transactions
  const refreshTransactions = async () => {
    if (!user) return;
    await fetchTransactions(user.id);
  };

  // Initiate NGN deposit with Flutterwave
  const initiateNGNDeposit = async (amount: number): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Call Supabase Edge Function to create Flutterwave payment
      const { data, error } = await supabase.functions.invoke('create-payment-endpoint', {
        body: {
          amount,
          currency: 'NGN',
          userId: user.id,
          email: user.email,
        },
      });

      if (error) throw error;
      if (!data?.payment_link) throw new Error('No payment link received');

      return data.payment_link;
    } catch (error) {
      console.error('Error initiating deposit:', error);
      toast({
        title: "Error",
        description: "Failed to initiate deposit",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Load transactions when user changes
  useEffect(() => {
    if (user) {
      fetchTransactions(user.id);
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  const value = {
    transactions,
    loading,
    refreshTransactions,
    initiateNGNDeposit,
  };

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};