import { useState, useMemo } from "react";
import { useProfile } from "@/hooks/profile";
import { useTransaction } from "@/contexts/TransactionContext";
import { useWallet } from "@/hooks/wallet";
import { formatDistanceToNow } from "date-fns";
import { DepositModal } from "../DepositModal";
import { Copy, Loader2, RefreshCw, DollarSign, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TransferModal } from "@/components/TransferModal";

const CurrencyLabels = [
  { key: "LSK" as const, icon: "🔷", label: "LSK" },
  { key: "ETH" as const, icon: "💠", label: "ETH" },
  { key: "USDC" as const, icon: "💎", label: "USDC" },
  { key: "USDT" as const, icon: "🟢", label: "USDT" },
];

const WalletPage = () => {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const { profile } = useProfile();
  const {
    transactions: platformTransactions,
    loading: transactionsLoading,
    refreshTransactions,
  } = useTransaction();
  const {
    loading: walletLoading,
    refreshingBalances,
    refreshBalances,
    getTotalBalanceInUSD,
    lskBalance,
    ethBalance,
    usdcBalance,
    usdtBalance,
  } = useWallet();
  const { toast } = useToast();

  const balances = useMemo(
    () => ({
      LSK: lskBalance ?? 0,
      ETH: ethBalance ?? 0,
      USDC: usdcBalance ?? 0,
      USDT: usdtBalance ?? 0,
    }),
    [lskBalance, ethBalance, usdcBalance, usdtBalance]
  );

  const handleRefresh = async () => {
    await refreshBalances();
    await refreshTransactions();
    toast({ title: "Balances refreshed" });
  };

  const handleTransferSuccess = async () => {
    await refreshBalances();
    await refreshTransactions();
  };

  const totalBalance = getTotalBalanceInUSD();

  const formatAmount = (value: number, currency: keyof typeof balances) => {
    const precision = currency === "USDC" || currency === "USDT" ? 2 : 4;
    return `${value.toFixed(precision)} ${currency}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const isWalletConnected = Boolean(profile?.sui_wallet_data?.address);

  const transactions = useMemo(
    () => platformTransactions || [],
    [platformTransactions]
  );

  if (!profile?.sui_wallet_data && !isWalletConnected) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="font-cyber text-2xl font-bold text-primary mb-4">
            No Wallet Connected
          </h1>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to view balances and transactions.
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

  const walletAddress = profile?.sui_wallet_data?.address ?? "";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
            LSK
          </div>
          <div className="flex-1">
            <h1 className="font-cyber text-3xl font-bold text-blue-400 glow-text">
              Lisk Wallet
            </h1>
            <p className="text-muted-foreground">
              Lisk Network • Panna SDK Integration
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshingBalances || walletLoading}
            variant="outline"
            size="icon"
            className="border-blue-500/50 hover:bg-blue-500/20"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshingBalances || walletLoading ? "animate-spin" : ""
              }`}
            />
          </Button>
        </div>

        <div className="bg-black/40 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-cyber mb-1">
              WALLET ADDRESS
            </p>
            <p className="font-mono text-sm text-foreground break-all">
              {walletAddress}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => copyToClipboard(walletAddress, "Wallet Address")}
              variant="outline"
              size="icon"
              className="border-blue-500/50 hover:bg-blue-500/20"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CurrencyLabels.map(({ key, icon, label }) => (
          <div
            key={key}
            className="bg-black/40 backdrop-blur-lg border border-blue-500/30 rounded-xl p-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {icon}
              </div>
              {walletLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              )}
            </div>
            <div className="text-3xl font-bold text-blue-400 font-cyber">
              {walletLoading ? "---" : formatAmount(balances[key], key)}
            </div>
            <div className="text-sm text-muted-foreground font-cyber">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-xl p-6 text-center">
        <div className="text-2xl mb-2">💼</div>
        <div className="text-4xl font-bold text-primary font-cyber mb-2">
          ${walletLoading ? "---" : totalBalance.toFixed(2)} USD
        </div>
        <div className="text-sm text-muted-foreground font-cyber">
          Total Portfolio Value
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Button
          className="bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-4 px-6 rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
          onClick={() => setShowTransferModal(true)}
        >
          <Send className="w-5 h-5" />
          <span>Transfer</span>
        </Button>
        <Button
          onClick={() => setShowDepositModal(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-background font-cyber font-bold py-4 px-6 rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <DollarSign className="w-5 h-5" />
          <span>Buy/Sell</span>
        </Button>
      </div>

      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <h2 className="font-cyber text-xl font-bold text-primary">
              Transaction History
            </h2>
            {transactionsLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
          </div>
        </div>

        <div className="space-y-2 p-6">
          {transactionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-lg mb-2">No transactions yet</div>
              <div className="text-sm">
                Start trading to see your transaction history!
              </div>
            </div>
          ) : (
            <>
              {transactions.map((tx) => (
                <div
                  key={`platform-${tx.id}`}
                  className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">📝</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-cyber font-bold text-foreground">
                          {tx.description || tx.type}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground font-cyber">
                        {tx.created_at
                          ? formatDistanceToNow(new Date(tx.created_at), {
                              addSuffix: true,
                            })
                          : "Unknown time"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-cyber font-bold text-lg ${
                        tx.type === "deposit" || tx.type === "win"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {tx.type === "deposit" || tx.type === "win" ? "+" : "-"}
                      {Number(tx.amount).toFixed(2)} {tx.currency}
                    </div>
                    <div className="text-xs text-muted-foreground font-cyber uppercase">
                      {tx.status || "completed"}
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center pt-2 text-xs text-muted-foreground font-cyber">
                Showing {transactions.length} transaction
                {transactions.length === 1 ? "" : "s"}
              </div>
            </>
          )}
        </div>
      </div>

      <DepositModal
        open={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />

      <TransferModal
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransferSuccess={handleTransferSuccess}
      />
    </div>
  );
};

export default WalletPage;
