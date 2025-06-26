import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useTransaction } from '@/contexts/TransactionContext';
import { formatDistanceToNow } from 'date-fns';
import { DepositModal } from '../DepositModal';

const WalletPage = () => {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const { wallets, loading: walletsLoading, getWalletBalance, getTotalBalanceInUSD } = useWallet();
  const { transactions, loading: transactionsLoading } = useTransaction();

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'win':
        return '🏆';
      case 'deposit':
        return '💰';
      case 'withdrawal':
        return '💸';
      case 'conversion':
        return '🔄';
      case 'loss':
        return '❌';
      default:
        return '📝';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTransactionDescription = (transaction: any) => {
    return transaction.description || `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}`;
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString()}`;
    }
    return `${amount.toFixed(2)} ${currency}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6">
        <h1 className="font-cyber text-3xl font-bold text-green-400 mb-2 glow-text">
          💰 My Wallet
        </h1>
        <p className="text-muted-foreground">Manage your crypto earnings and transactions</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">💎</div>
          <div className="text-3xl font-bold text-green-400 font-cyber">
            {getWalletBalance('USDC').toFixed(2)} USDC
          </div>
          <div className="text-sm text-muted-foreground font-cyber">USD Coin Balance</div>
        </div>
        <div className="bg-black/40 backdrop-blur-lg border border-blue-500/30 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">🟢</div>
          <div className="text-3xl font-bold text-blue-400 font-cyber">
            {getWalletBalance('USDT').toFixed(2)} USDT
          </div>
          <div className="text-sm text-muted-foreground font-cyber">Tether Balance</div>
        </div>
        <div className="bg-black/40 backdrop-blur-lg border border-accent/30 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">🇳🇬</div>
          <div className="text-3xl font-bold text-accent font-cyber">
            ₦{getWalletBalance('NGN').toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground font-cyber">Nigerian Naira</div>
        </div>
      </div>

      {/* Total Portfolio Value */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-xl p-6 text-center">
        <div className="text-2xl mb-2">💼</div>
        <div className="text-4xl font-bold text-primary font-cyber mb-2">
          ${getTotalBalanceInUSD().toFixed(2)} USD
        </div>
        <div className="text-sm text-muted-foreground font-cyber">Total Portfolio Value</div>
        <div className="text-sm text-green-400 font-cyber mt-2">+12.5% This Month</div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-4 px-6 rounded-xl hover:scale-105 transition-all duration-300">
          💸 Withdraw Funds
        </button>
        <button 
          onClick={() => setShowDepositModal(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-background font-cyber font-bold py-4 px-6 rounded-xl hover:scale-105 transition-all duration-300"
        >
          💰 Deposit
        </button>
        <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-background font-cyber font-bold py-4 px-6 rounded-xl hover:scale-105 transition-all duration-300">
          🔄 Convert Currency
        </button>
      </div>

      {/* Transaction History */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-primary/20">
          <h2 className="font-cyber text-xl font-bold text-primary">Recent Transactions</h2>
        </div>
        
        <div className="space-y-2 p-6">
          {transactionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getTransactionIcon(tx.type)}</div>
                  <div>
                    <div className="font-cyber font-bold text-foreground">{getTransactionDescription(tx)}</div>
                    <div className="text-sm text-muted-foreground font-cyber">
                      {tx.created_at ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true }) : 'Unknown time'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-cyber font-bold text-lg ${
                    tx.type === 'deposit' || tx.type === 'win' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'win' ? '+' : '-'}
                    {formatAmount(tx.amount, tx.currency)}
                  </div>
                  <div className="text-xs text-muted-foreground font-cyber uppercase">{tx.status || 'completed'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      <DepositModal
        open={showDepositModal} 
        onClose={() => setShowDepositModal(false)} 
      />
    </div>
  );
};

export default WalletPage;