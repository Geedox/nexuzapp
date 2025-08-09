import { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useTransaction } from '@/contexts/TransactionContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatDistanceToNow } from 'date-fns';
import { DepositModal } from '../DepositModal';
import { Copy, ExternalLink, Loader2, RefreshCw, DollarSign, Zap, TrendingUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CetusSwapModal } from '@/components/SwapModal';

const WalletPage = () => {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [blockchainTransactions, setBlockchainTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const { profile } = useProfile();
  const { transactions: platformTransactions, loading: transactionsLoading, refreshTransactions } = useTransaction();
  const {
    suiBalance,
    usdcBalance,
    usdtBalance,
    loading: walletsLoading,
    refreshingBalances,
    refreshBalances,
    getTotalBalanceInUSD,
    suiClient,
    saveTransactionToDatabase
  } = useWallet();
  const { toast } = useToast();

  // Network configuration
  const NETWORK = 'testnet';

  // Token types mapping
  const getTokenTypes = () => ({
    SUI: '0x2::sui::SUI',
    USDC: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    USDT: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
  });

  // Get currency from coin type
  const getCurrencyFromCoinType = (coinType: string): string => {
    if (coinType.includes('sui::SUI')) return 'SUI';
    if (coinType.toLowerCase().includes('usdc')) return 'USDC';
    if (coinType.toLowerCase().includes('usdt')) return 'USDT';
    return 'UNKNOWN';
  };

  // Format amount based on currency
  const formatTokenAmount = (amount: string, currency: string): number => {
    const decimals = currency === 'SUI' ? 9 : 6;
    return Number(amount) / Math.pow(10, decimals);
  };

  // Fetch blockchain transaction history
  const fetchTransactionHistory = async () => {
    if (!profile?.sui_wallet_data?.address || !suiClient) {
      console.log('❌ Missing requirements for transaction fetch');
      return;
    }

    setLoadingTransactions(true);
    try {
      console.log('📋 Fetching wallet transaction history...');
      const address = profile.sui_wallet_data.address;

      // Get transactions where user is sender
      const sentTxResponse = await suiClient.queryTransactionBlocks({
        filter: { FromAddress: address },
        limit: 25,
        order: 'descending',
      });

      // Get transactions where user received tokens
      const receivedTxResponse = await suiClient.queryTransactionBlocks({
        filter: { ToAddress: address },
        limit: 25,
        order: 'descending',
      });

      // Combine and deduplicate
      const allTxDigests = new Set([
        ...sentTxResponse.data.map(tx => tx.digest),
        ...receivedTxResponse.data.map(tx => tx.digest),
      ]);

      console.log('📊 Found', allTxDigests.size, 'unique transactions');

      // Process each transaction
      const processedTransactions = await Promise.all(
        Array.from(allTxDigests).map(async (digest) => {
          try {
            const txDetails = await suiClient.getTransactionBlock({
              digest: digest,
              options: {
                showBalanceChanges: true,
                showEffects: true,
                showEvents: true,
                showInput: true,
              },
            });

            if (!txDetails.effects) return null;

            const isSuccess = txDetails.effects.status.status === 'success';
            const timestamp = txDetails.timestampMs ? Number(txDetails.timestampMs) : Date.now();
            const events = txDetails.events || [];
            const balanceChanges = txDetails.balanceChanges || [];

            // Calculate gas used
            let gasUsed = 0;
            if (txDetails.effects.gasUsed) {
              gasUsed = (
                Number(txDetails.effects.gasUsed.computationCost) +
                Number(txDetails.effects.gasUsed.storageCost) -
                Number(txDetails.effects.gasUsed.storageRebate)
              ) / 1_000_000_000;
            }

            // Check if it's a swap (look for multiple balance changes)
            const userBalanceChanges = balanceChanges.filter(change =>
              change.owner?.AddressOwner === address
            );

            let transactionType = 'transfer';
            let amount = 0;
            let currency = 'SUI';
            let description = 'Transaction';

            // Detect swap transactions
            if (userBalanceChanges.length >= 2) {
              const outgoingChange = userBalanceChanges.find(change => Number(change.amount) < 0);
              const incomingChange = userBalanceChanges.find(change => Number(change.amount) > 0);

              if (outgoingChange && incomingChange) {
                transactionType = 'swap';
                const fromCurrency = getCurrencyFromCoinType(outgoingChange.coinType);
                const toCurrency = getCurrencyFromCoinType(incomingChange.coinType);
                const fromAmount = formatTokenAmount(Math.abs(Number(outgoingChange.amount)).toString(), fromCurrency);
                const toAmount = formatTokenAmount(incomingChange.amount, toCurrency);

                currency = fromCurrency;
                amount = fromAmount;
                description = `Swapped ${fromAmount.toFixed(fromCurrency === 'SUI' ? 4 : 2)} ${fromCurrency} for ${toAmount.toFixed(toCurrency === 'SUI' ? 4 : 2)} ${toCurrency}`;
              }
            } else if (userBalanceChanges.length === 1) {
              // Single balance change - deposit or withdrawal
              const change = userBalanceChanges[0];
              currency = getCurrencyFromCoinType(change.coinType);
              const changeAmount = Number(change.amount);
              amount = formatTokenAmount(Math.abs(changeAmount).toString(), currency);

              if (changeAmount > 0) {
                transactionType = 'deposit';
                description = `Received ${amount.toFixed(currency === 'SUI' ? 4 : 2)} ${currency}`;
              } else {
                transactionType = 'withdrawal';
                description = `Sent ${amount.toFixed(currency === 'SUI' ? 4 : 2)} ${currency}`;
              }
            }

            return {
              id: digest,
              type: transactionType,
              amount: amount,
              currency: currency,
              status: isSuccess ? 'completed' : 'failed',
              description: description,
              transaction_hash: digest,
              created_at: new Date(timestamp).toISOString(),
              source: 'blockchain',
              gas_used: gasUsed,
            };

          } catch (error) {
            console.error('Error processing transaction:', digest, error);
            return null;
          }
        })
      );

      // Filter out null results and sort by date
      const validTransactions = processedTransactions
        .filter((tx): tx is NonNullable<typeof tx> => tx !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('✅ Processed', validTransactions.length, 'valid transactions');
      setBlockchainTransactions(validTransactions);

    } catch (error) {
      console.error('❌ Error fetching transaction history:', error);
      setBlockchainTransactions([]);
      toast({
        title: "Error",
        description: "Failed to fetch transaction history",
        variant: "destructive",
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Load transaction history when wallet is available
  useEffect(() => {
    if (profile?.sui_wallet_data?.address && suiClient) {
      fetchTransactionHistory();
    }
  }, [profile?.sui_wallet_data?.address, suiClient]);

  // Handle successful swap
  const handleSwapSuccess = async (swapData) => {
    console.log('Swap completed:', swapData);

    // Save to database
    await saveTransactionToDatabase({
      type: 'swap',
      amount: Number(swapData.fromAmount),
      currency: swapData.fromCurrency,
      transaction_hash: swapData.transactionHash,
      description: `${swapData.type === 'cetus' ? 'Cetus' : 'Direct'} Swap: ${swapData.fromAmount} ${swapData.fromCurrency} → ${swapData.toAmount} ${swapData.toCurrency}`,
      status: 'completed',
    });

    // Refresh data
    refreshBalances();
    refreshTransactions();
    fetchTransactionHistory();

    toast({
      title: "Swap Successful! 🎉",
      description: `${swapData.fromAmount} ${swapData.fromCurrency} → ${swapData.toAmount} ${swapData.toCurrency}`,
    });
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refreshBalances();
    await fetchTransactionHistory();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return '💰';
      case 'withdrawal': return '💸';
      case 'swap': return '🔄';
      case 'transfer': return '↔️';
      case 'win': return '🏆';
      case 'loss': return '❌';
      default: return '📝';
    }
  };

  const getTransactionDescription = (transaction: any) => {
    return transaction.description || `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}`;
  };

  const formatAmount = (amount: number, currency: string) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '0.00 ' + (currency || 'Unknown');
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
    const explorers = [
      `https://suiscan.xyz/${NETWORK}/tx/${hash}`,
      `https://suivision.xyz/txblock/${hash}?network=${NETWORK}`,
      `https://explorer.sui.io/txblock/${hash}?network=${NETWORK}`
    ];
    window.open(explorers[0], '_blank');
  };

  // Combine all transactions
  const allTransactions = [
    ...platformTransactions.map(tx => ({ ...tx, source: 'platform' })),
    ...blockchainTransactions
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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
            SUI
          </div>
          <div className="flex-1">
            <h1 className="font-cyber text-3xl font-bold text-blue-400 glow-text">
              Sui Wallet
            </h1>
            <p className="text-muted-foreground">Sui Network • Cetus DEX • Multi-token Support</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      {/* Total Portfolio Value */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-xl p-6 text-center">
        <div className="text-2xl mb-2">💼</div>
        <div className="text-4xl font-bold text-primary font-cyber mb-2">
          ${walletsLoading ? '---' : getTotalBalanceInUSD().toFixed(2)} USD
        </div>
        <div className="text-sm text-muted-foreground font-cyber">Total Portfolio Value</div>
        <div className="text-xs text-blue-400 font-cyber mt-2">Powered by Cetus Protocol • Deep Liquidity</div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-4 px-6 rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
          <Send className="w-5 h-5" />
          <span>Send Tokens</span>
        </button>
        <button
          onClick={() => setShowDepositModal(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-background font-cyber font-bold py-4 px-6 rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <DollarSign className="w-5 h-5" />
          <span>Receive</span>
        </button>
        <button
          onClick={() => setShowSwapModal(true)}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-background font-cyber font-bold py-4 px-6 rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Zap className="w-5 h-5" />
          <span>Cetus Swap</span>
          <TrendingUp className="w-5 h-5" />
        </button>
      </div>

      {/* Transaction History */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <h2 className="font-cyber text-xl font-bold text-primary">Transaction History</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  C
                </div>
                <span className="text-xs text-blue-400 font-cyber">Cetus</span>
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
              <div className="text-sm">Start trading to see your transaction history!</div>
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
                        <div className="w-4 h-4 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold text-white">
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
                    {tx.gas_used && tx.gas_used > 0 && (
                      <div className="text-xs text-orange-400 font-cyber mt-1">
                        Gas: {tx.gas_used.toFixed(6)} SUI
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-cyber font-bold text-lg ${tx.type === 'deposit' || tx.type === 'win' ? 'text-green-400' : 'text-red-400'}`}>
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

      {/* Modals */}
      <DepositModal
        open={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />

      {/* Cetus Swap Modal */}
      <CetusSwapModal
        open={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        currentBalances={{
          sui: suiBalance,
          usdc: usdcBalance,
          usdt: usdtBalance,
        }}
        onSwapSuccess={handleSwapSuccess}
        suiClient={suiClient}
      />
    </div>
  );
};

export default WalletPage;