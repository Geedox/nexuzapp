import { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useTransaction } from '@/contexts/TransactionContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatDistanceToNow } from 'date-fns';
import { DepositModal } from '../DepositModal';
import { Copy, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SwapModal } from '@/components/SwapModal';

const WalletPage = () => {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [suiTransactions, setSuiTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const { profile } = useProfile();
  const { transactions, loading: transactionsLoading, refreshTransactions } = useTransaction();
  const {
    suiBalance,
    gameTokenBalance,
    usdcBalance,
    usdtBalance,
    loading: walletsLoading,
    refreshingBalances,
    refreshBalances,
    getTotalBalanceInUSD,
    gameTokenManager
  } = useWallet();
  const { toast } = useToast();

  // Network configuration
  const NETWORK = 'testnet';

  // Debug gameTokenManager on load
  useEffect(() => {
    if (gameTokenManager) {
      console.log('🔍 === GAME TOKEN MANAGER DEBUG ===');
      console.log('gameTokenManager:', gameTokenManager);
      console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(gameTokenManager)));
      console.log('getTokenHistory exists?', typeof gameTokenManager.getTokenHistory);
      console.log('getTokenPurchaseHistory exists?', typeof gameTokenManager.getTokenPurchaseHistory);
      console.log('Package ID:', gameTokenManager.PACKAGE_ID);
      console.log('Game Token Type:', gameTokenManager.GAME_TOKEN_TYPE);
    }
  }, [gameTokenManager]);

  // Debug Game Token balance
  useEffect(() => {
    const debugGameTokenBalance = async () => {
      if (!profile?.sui_wallet_data?.address || !gameTokenManager) return;

      console.log('🎮 === GAME TOKEN BALANCE DEBUG ===');
      console.log('Address:', profile.sui_wallet_data.address);
      console.log('GameTokenManager available:', !!gameTokenManager);

      try {
        if (typeof gameTokenManager.getGameTokenBalance === 'function') {
          const balance = await gameTokenManager.getGameTokenBalance(profile.sui_wallet_data.address);
          console.log('🎮 GT Balance result:', balance);
        } else {
          console.log('❌ getGameTokenBalance function not available');
        }
      } catch (error) {
        console.error('❌ Error getting GT balance:', error);
      }
    };

    debugGameTokenBalance();
  }, [profile?.sui_wallet_data?.address, gameTokenManager]);

  // Fetch Sui transaction history
  const fetchSuiTransactions = async () => {
    if (!profile?.sui_wallet_data?.address || !gameTokenManager) {
      console.log('❌ Missing requirements for fetchSuiTransactions');
      return;
    }

    setLoadingTransactions(true);
    try {
      console.log('📋 Fetching transaction history...');

      let purchaseHistory = [];

      // Try different function names
      if (typeof gameTokenManager.getTokenHistory === 'function') {
        console.log('✅ Using getTokenHistory');
        purchaseHistory = await gameTokenManager.getTokenHistory(20);
      } else if (typeof gameTokenManager.getTokenPurchaseHistory === 'function') {
        console.log('✅ Using getTokenPurchaseHistory');
        purchaseHistory = await gameTokenManager.getTokenPurchaseHistory(20);
      } else {
        console.log('⚠️ No transaction history function available');
        setSuiTransactions([]);
        return;
      }

      console.log('📋 Raw purchase history:', purchaseHistory);

      if (!purchaseHistory || purchaseHistory.length === 0) {
        console.log('ℹ️ No purchase history found');
        setSuiTransactions([]);
        return;
      }

      const formattedTransactions = purchaseHistory.map((purchase: any) => {
        console.log('🔍 Processing purchase:', purchase);

        // Handle different data structures
        const paymentAmount = purchase.paymentAmount || purchase.amount || 0;
        const gtReceived = purchase.gtReceived || purchase.gtAmount || 0;
        const currency = purchase.currency || 'SUI';

        // Convert amounts based on currency
        let displayAmount = 0;
        let displayGT = 0;

        if (currency === 'SUI') {
          // Convert from MIST to SUI (9 decimals for SUI)
          displayAmount = paymentAmount / 1_000_000_000;
          // GT tokens are already in correct format or need conversion from smallest unit
          displayGT = gtReceived > 1000000 ? gtReceived / 1_000_000 : gtReceived;
        } else {
          // For USDC/USDT (6 decimals)
          displayAmount = paymentAmount / 1_000_000;
          displayGT = gtReceived > 1000000 ? gtReceived / 1_000_000 : gtReceived;
        }

        console.log('💰 Converted amounts:', {
          originalPayment: paymentAmount,
          originalGT: gtReceived,
          displayAmount,
          displayGT,
          currency
        });

        return {
          id: purchase.digest,
          type: purchase.type || 'purchase',
          amount: displayAmount,
          currency: currency,
          status: 'completed',
          description: `Purchased ${displayGT.toLocaleString()} Game Tokens`,
          transaction_hash: purchase.digest,
          created_at: new Date(Number(purchase.timestamp)).toISOString(),
          source: 'blockchain',
          gt_received: displayGT,
        };
      });

      console.log('✅ Formatted transactions:', formattedTransactions);
      setSuiTransactions(formattedTransactions);
    } catch (error) {
      console.error('❌ Error fetching Sui transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch blockchain transaction history",
        variant: "destructive",
      });
      setSuiTransactions([]); // Set empty array on error
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Load data when wallet is available
  useEffect(() => {
    if (profile?.sui_wallet_data?.address && gameTokenManager) {
      fetchSuiTransactions();
    }
  }, [profile?.sui_wallet_data?.address, gameTokenManager]);

  // Handle successful swap
  const handleSwapSuccess = () => {
    refreshBalances();
    refreshTransactions();
    fetchSuiTransactions();
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refreshBalances();
    await fetchSuiTransactions();
  };

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
      case 'swap':
        return '↔️';
      case 'purchase':
        return '🛒';
      case 'sale':
        return '💸';
      case 'loss':
        return '❌';
      case 'transfer':
        return '↔️';
      default:
        return '📝';
    }
  };

  const getTransactionDescription = (transaction: any) => {
    return transaction.description || `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}`;
  };

  const formatAmount = (amount: number, currency: string) => {
    // Handle NaN values
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '0.00 ' + (currency || 'Unknown');
    }

    if (currency === 'GAME_TOKEN' || currency === 'GT') {
      return `${Math.floor(amount).toLocaleString()} GT`;
    }
    return `${amount.toFixed(currency === 'SUI' ? 4 : 2)} ${currency}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const openExplorer = (hash) => {
    // Try multiple explorer URLs for better compatibility
    const explorers = [
      `https://suiscan.xyz/${NETWORK}/tx/${hash}`,
      `https://suivision.xyz/txblock/${hash}?network=${NETWORK}`,
      `https://explorer.sui.io/txblock/${hash}?network=${NETWORK}`
    ];

    // Open the first one (suiscan is usually more reliable)
    window.open(explorers[0], '_blank');
  };

  // Combine and sort all transactions
  const allTransactions = [
    ...transactions.map(tx => ({ ...tx, source: 'platform' })),
    ...suiTransactions
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (!profile?.sui_wallet_data) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="font-cyber text-2xl font-bold text-primary mb-4">
            No Wallet Connected
          </h1>
          <p className="text-muted-foreground mb-6">
            Connect your Sui wallet to view balances and transactions
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Debug Info Panel (Remove in production) */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs">
        <div className="text-yellow-400 font-bold mb-2">🔧 Debug Info:</div>
        <div className="text-yellow-300 space-y-1">
          <div>GameTokenManager: {gameTokenManager ? '✅ Available' : '❌ Missing'}</div>
          <div>GT Balance: {gameTokenBalance}</div>
          <div>SUI Transactions: {suiTransactions.length}</div>
          <div>All Transactions: {allTransactions.length}</div>
        </div>
      </div>

      {/* Header with Sui branding */}
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          {/* Sui Logo */}
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
            SUI
          </div>
          <div className="flex-1">
            <h1 className="font-cyber text-3xl font-bold text-blue-400 glow-text">
              Gaming Wallet
            </h1>
            <p className="text-muted-foreground">Powered by Sui Network • Decentralized Game Tokens</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshingBalances}
            variant="outline"
            size="icon"
            className="border-blue-500/50 hover:bg-blue-500/20"
          >
            <RefreshCw className={`w-4 h-4 ${refreshingBalances ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Wallet Address */}
        <div className="bg-black/40 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-cyber mb-1">WALLET ADDRESS</p>
            <p className="font-mono text-sm text-foreground">
              {profile.sui_wallet_data.address}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => copyToClipboard(profile.sui_wallet_data.address, 'Wallet Address')}
              variant="outline"
              size="icon"
              className="border-blue-500/50 hover:bg-blue-500/20"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => window.open(`https://suivision.xyz/account/${profile.sui_wallet_data.address}?network=${NETWORK}`, '_blank')}
              variant="outline"
              size="icon"
              className="border-blue-500/50 hover:bg-blue-500/20"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* SUI Balance */}
        <div className="bg-black/40 backdrop-blur-lg border border-blue-500/30 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
              SUI
            </div>
            {walletsLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
          </div>
          <div className="text-3xl font-bold text-blue-400 font-cyber">
            {walletsLoading ? '---' : suiBalance.toFixed(4)}
          </div>
          <div className="text-sm text-muted-foreground font-cyber">SUI</div>
        </div>

        {/* USDC Balance */}
        <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="text-2xl">💎</div>
            {walletsLoading && <Loader2 className="w-4 h-4 animate-spin text-green-400" />}
          </div>
          <div className="text-3xl font-bold text-green-400 font-cyber">
            {walletsLoading ? '---' : usdcBalance.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground font-cyber">USDC</div>
        </div>

        {/* USDT Balance */}
        <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="text-2xl">🟢</div>
            {walletsLoading && <Loader2 className="w-4 h-4 animate-spin text-green-400" />}
          </div>
          <div className="text-3xl font-bold text-green-400 font-cyber">
            {walletsLoading ? '---' : usdtBalance.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground font-cyber">USDT</div>
        </div>

        {/* Game Tokens */}
        <div className="bg-black/40 backdrop-blur-lg border border-accent/30 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="text-2xl">🎮</div>
            {walletsLoading && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
          </div>
          <div className="text-3xl font-bold text-accent font-cyber">
            {walletsLoading ? '---' : gameTokenBalance.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground font-cyber">Game Tokens</div>
        </div>
      </div>

      {/* Total Portfolio Value */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-xl p-6 text-center">
        <div className="text-2xl mb-2">💼</div>
        <div className="text-4xl font-bold text-primary font-cyber mb-2">
          ${walletsLoading ? '---' : getTotalBalanceInUSD().toFixed(2)} USD
        </div>
        <div className="text-sm text-muted-foreground font-cyber">Total Portfolio Value</div>
        <div className="text-xs text-blue-400 font-cyber mt-2">Powered by Sui Network • Real-time Blockchain Data</div>
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
        <button
          onClick={() => setShowSwapModal(true)}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-background font-cyber font-bold py-4 px-6 rounded-xl hover:scale-105 transition-all duration-300"
        >
          ↔️ Swap
        </button>
      </div>

      {/* Transaction History */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <h2 className="font-cyber text-xl font-bold text-primary">Transaction History</h2>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                SUI
              </div>
              {loadingTransactions && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </div>
          </div>
        </div>

        <div className="space-y-2 p-6">
          {(transactionsLoading || loadingTransactions) ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading transactions...
            </div>
          ) : allTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-lg mb-2">No transactions yet</div>
              <div className="text-sm">Try making a swap to see transactions here!</div>
            </div>
          ) : (
            allTransactions.map((tx) => (
              <div key={`${tx.source}-${tx.id}`} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getTransactionIcon(tx.type)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-cyber font-bold text-foreground">
                        {getTransactionDescription(tx)}
                      </span>
                      {tx.source === 'blockchain' && (
                        <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          S
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground font-cyber">
                      {tx.created_at ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true }) : 'Unknown time'}
                    </div>
                    {tx.transaction_hash && tx.source === 'blockchain' && (
                      <button
                        onClick={() => openExplorer(tx.transaction_hash)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-cyber flex items-center gap-1 mt-1"
                      >
                        View on Explorer <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    {tx.gt_received && !isNaN(tx.gt_received) && tx.gt_received > 0 && (
                      <div className="text-xs text-accent font-cyber mt-1">
                        +{Math.floor(tx.gt_received).toLocaleString()} GT received
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-cyber font-bold text-lg ${tx.type === 'deposit' || tx.type === 'win' || tx.type === 'purchase' ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {tx.type === 'deposit' || tx.type === 'win' || tx.type === 'purchase' ? '+' : '-'}
                    {formatAmount(tx.amount, tx.currency)}
                  </div>
                  <div className="text-xs text-muted-foreground font-cyber uppercase">{tx.status || 'completed'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        open={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />

      <SwapModal
        open={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        currentBalances={{
          sui: suiBalance,
          usdc: usdcBalance,
          usdt: usdtBalance,
          gameTokens: gameTokenBalance,
        }}
        onSwapSuccess={handleSwapSuccess}
        gameTokenManager={gameTokenManager}
      />
    </div>
  );
};

export default WalletPage;