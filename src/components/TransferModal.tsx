import { useMemo, useState } from "react";
import { useWallet, type WalletAccount } from "../hooks/wallet";
import { useToast } from "../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Loader2,
  Send,
  Wallet,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import {
  NETWORK,
  TOKEN_ADDRESSES,
  TOKEN_DECIMALS,
  ADMIN_WALLET_ADDRESS,
  type SupportedToken,
} from "../constants";
import { pannaClient } from "../lib/panna";
import { transaction } from "panna-sdk/core";

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onTransferSuccess: (transferData: {
    amount: string;
    currency: string;
    transactionHash: string;
  }) => void;
}

type TransferMode = "external" | "fiat";
type Currency = "LSK" | "ETH" | "USDC" | "USDT";

const TOKEN_DISPLAY: Record<Currency, { icon: string; label: string }> = {
  LSK: { icon: "🔷", label: "LSK" },
  ETH: { icon: "💠", label: "ETH" },
  USDC: { icon: "💎", label: "USDC" },
  USDT: { icon: "🟢", label: "USDT" },
};

const BLOCKSCOUT_BASE_URL = "https://blockscout.lisk.com";

const toBaseUnits = (value: string, decimals: number): bigint => {
  const [whole = "0", frac = ""] = value.split(".");
  const normalizedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  const wholePart = BigInt(whole || "0") * BigInt(10) ** BigInt(decimals);
  const fracPart = normalizedFrac ? BigInt(normalizedFrac) : BigInt(0);
  return wholePart + fracPart;
};

const formatBalance = (balance: number, currency: Currency) => {
  const precision = currency === "USDC" || currency === "USDT" ? 2 : 4;
  return balance.toFixed(precision);
};

const buildTransferTransaction = async (params: {
  account: NonNullable<WalletAccount>;
  amount: string;
  currency: Currency;
  recipient: `0x${string}`;
}) => {
  const { amount, currency, recipient } = params;
  const decimals = TOKEN_DECIMALS[currency as SupportedToken] ?? 18;
  const amountInWei = toBaseUnits(amount, decimals);

  if (currency === "LSK" || currency === "ETH") {
    return transaction.prepareTransaction({
      client: pannaClient,
      chain: NETWORK,
      to: recipient,
      value: amountInWei,
    });
  }

  const tokenAddress = TOKEN_ADDRESSES[currency];

  if (!tokenAddress) {
    throw new Error(`Token ${currency} is not supported on this network.`);
  }

  return transaction.prepareContractCall({
    client: pannaClient,
    chain: NETWORK,
    address: tokenAddress,
    method: "function transfer(address to, uint256 amount)",
    params: [recipient, amountInWei],
  });
};

export const TransferModal = ({
  open,
  onClose,
  onTransferSuccess,
}: TransferModalProps) => {
  const [transferMode, setTransferMode] = useState<TransferMode>("external");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<Currency>("USDC");
  const [recipient, setRecipient] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>("");

  const { toast } = useToast();
  const {
    account,
    lskBalance,
    ethBalance,
    usdcBalance,
    usdtBalance,
    balanceFor,
  } = useWallet();

  const adminWalletAddress = useMemo(() => ADMIN_WALLET_ADDRESS, []);

  const currencyBalanceMap: Record<Currency, number> = {
    LSK: lskBalance ?? balanceFor("LSK"),
    ETH: ethBalance ?? balanceFor("ETH"),
    USDC: usdcBalance ?? balanceFor("USDC"),
    USDT: usdtBalance ?? balanceFor("USDT"),
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // const resetState = () => {
  //   setAmount("");
  //   setRecipient("");
  //   setAccountNumber("");
  //   setAccountName("");
  //   setError("");
  //   setSuccess(false);
  //   setTransactionHash("");
  //   setTransferMode("external");
  // };

  const getCurrentBalance = () => currencyBalanceMap[currency] ?? 0;

  const getCurrencyIcon = (curr: Currency) => TOKEN_DISPLAY[curr].icon;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return false;
    }

    const amountNum = parseFloat(amount);
    const balance = getCurrentBalance();

    if (amountNum > balance) {
      setError(
        `Insufficient balance. Available: ${formatBalance(
          balance,
          currency
        )} ${currency}`
      );
      return false;
    }

    if (transferMode === "external") {
      if (!recipient.trim()) {
        setError("Please enter recipient address");
        return false;
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(recipient.trim())) {
        setError("Please enter a valid Lisk address");
        return false;
      }
    } else {
      if (!accountNumber.trim()) {
        setError("Please enter account number");
        return false;
      }
      if (!accountName.trim()) {
        setError("Please enter account name");
        return false;
      }
      if (!adminWalletAddress) {
        setError("Admin wallet address is not configured");
        return false;
      }
    }

    return true;
  };

  const handleTransfer = async () => {
    if (!validateForm()) return;

    if (!account) {
      setError("Wallet not connected");
      toast({
        title: "Wallet Not Connected",
        description: "Connect your wallet before sending a transfer.",
        variant: "destructive",
      });
      return;
    }

    const targetAddress =
      transferMode === "external"
        ? (recipient.trim() as `0x${string}`)
        : (adminWalletAddress as `0x${string}`);

    setLoading(true);
    setError("");

    try {
      const connectedAccount = account as NonNullable<WalletAccount>;
      const tx = await buildTransferTransaction({
        account: connectedAccount,
        amount,
        currency,
        recipient: targetAddress,
      });

      const result = await transaction.sendTransaction({
        account: connectedAccount,
        transaction: tx,
      });

      const digest = result.transactionHash ?? "";

      onTransferSuccess({
        amount,
        currency,
        transactionHash: digest,
      });

      setSuccess(true);
      setTransactionHash(digest);

      toast({
        title: "Transfer Successful! 🎉",
        description: `${amount} ${currency} transferred successfully`,
      });

      if (transferMode === "fiat") {
        toast({
          title: "Next Steps",
          description:
            "Please notify the admin on Discord with your transaction hash for fiat conversion.",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Transfer failed";
      setError(message);
      toast({
        title: "Transfer Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] bg-gradient-to-br from-background via-card to-secondary/20 border-primary/30 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-cyber text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent flex items-center gap-2">
            <Send className="w-7 h-7 text-primary" />
            Transfer Tokens
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Send tokens to external wallets or initiate fiat conversions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          <div className="space-y-3">
            <Label className="font-cyber font-bold text-foreground">
              Transfer Mode
            </Label>
            <RadioGroup
              value={transferMode}
              onValueChange={(value) => setTransferMode(value as TransferMode)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="external" id="external" />
                <Label
                  htmlFor="external"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  External Wallet
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fiat" id="fiat" />
                <Label
                  htmlFor="fiat"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  Fiat Conversion
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="font-cyber font-bold text-foreground">
              Select Token
            </Label>
            <Select
              value={currency}
              onValueChange={(value) => setCurrency(value as Currency)}
            >
              <SelectTrigger className="bg-black/40 border-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-primary/30">
                {(Object.keys(TOKEN_DISPLAY) as Currency[]).map((token) => (
                  <SelectItem
                    key={token}
                    value={token}
                    className="text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <span>{TOKEN_DISPLAY[token].icon}</span>
                      <span>{TOKEN_DISPLAY[token].label}</span>
                      <span className="text-muted-foreground text-sm">
                        ({formatBalance(currencyBalanceMap[token] ?? 0, token)})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="font-cyber font-bold text-foreground">
              Amount
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.0001"
                placeholder={`Enter amount (Max: ${formatBalance(
                  getCurrentBalance(),
                  currency
                )})`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-black/40 border-primary/30 pr-12"
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-cyber">
                {currency}
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-cyber">
              Available: {formatBalance(getCurrentBalance(), currency)}{" "}
              {currency}
            </div>
          </div>

          {transferMode === "external" && (
            <div className="space-y-3">
              <Label className="font-cyber font-bold text-foreground">
                Recipient Address
              </Label>
              <Input
                placeholder="Enter Lisk wallet address (0x...)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-black/40 border-primary/30 font-mono text-sm"
                disabled={loading}
              />
            </div>
          )}

          {transferMode === "fiat" && (
            <div className="space-y-3">
              <Label className="font-cyber font-bold text-foreground">
                Admin Wallet Address
              </Label>
              <Input
                value={
                  adminWalletAddress || "Admin wallet address not configured"
                }
                className="bg-black/40 border-primary/30 font-mono text-sm"
                disabled
              />
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-500 text-sm">
                  After transfer, notify the admin on Discord with your
                  transaction hash for fiat conversion.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {transferMode === "fiat" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="font-cyber font-bold text-foreground">
                  Account Number
                </Label>
                <Input
                  placeholder="Enter your bank account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="bg-black/40 border-primary/30"
                  disabled={loading}
                />
              </div>
              <div className="space-y-3">
                <Label className="font-cyber font-bold text-foreground">
                  Account Name
                </Label>
                <Input
                  placeholder="Enter account holder name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="bg-black/40 border-primary/30"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {error && (
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-500 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <div className="space-y-4">
              <Alert className="border-green-500/30 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500 text-sm font-bold">
                  Transfer Successful! 🎉
                </AlertDescription>
              </Alert>

              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="font-cyber font-bold text-green-400 text-lg">
                    Transaction Receipt
                  </h3>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-green-500/20">
                    <span className="text-muted-foreground font-cyber">
                      Mode:
                    </span>
                    <span className="text-foreground font-bold">
                      {transferMode === "external"
                        ? "External Wallet"
                        : "Fiat Conversion"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-green-500/20">
                    <span className="text-muted-foreground font-cyber">
                      Amount:
                    </span>
                    <span className="text-foreground font-bold flex items-center gap-2">
                      <span>{getCurrencyIcon(currency)}</span>
                      {amount} {currency}
                    </span>
                  </div>

                  <div className="flex justify-between items-start py-2 border-b border-green-500/20">
                    <span className="text-muted-foreground font-cyber">
                      To:
                    </span>
                    <div className="text-right">
                      <div className="text-foreground font-bold font-mono text-xs break-all">
                        {transferMode === "external"
                          ? recipient
                          : adminWalletAddress}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {transferMode === "external"
                          ? "External Wallet"
                          : "Admin Wallet"}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start py-2">
                    <span className="text-muted-foreground font-cyber">
                      Transaction Hash:
                    </span>
                    <div className="text-right">
                      <div className="text-foreground font-mono text-xs break-all">
                        {transactionHash}
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(transactionHash, "Transaction hash")
                        }
                        className="text-green-400 hover:text-green-300 text-xs font-cyber flex items-center gap-1 mt-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Hash
                      </button>
                    </div>
                  </div>
                </div>

                {transferMode === "fiat" && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="text-yellow-500 text-xs">
                        <div className="font-bold mb-1">Next Steps:</div>
                        <div>
                          1. Notify the admin with this transaction hash
                        </div>
                        <div>
                          2. Provide your account details:{" "}
                          {accountName || "N/A"} - {accountNumber || "N/A"}
                        </div>
                        <div>3. Await fiat conversion confirmation</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() =>
                      window.open(
                        `${BLOCKSCOUT_BASE_URL}/tx/${transactionHash}`,
                        "_blank"
                      )
                    }
                    className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-cyber font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Explorer
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-gradient-to-br from-background via-card to-secondary/20 pb-2">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-primary/30 hover:bg-primary/20"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={
                loading ||
                !amount ||
                parseFloat(amount) <= 0 ||
                (transferMode === "external" && !recipient.trim())
              }
              className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold hover:scale-105 transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Transfer {amount || ""} {currency}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
