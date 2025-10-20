import { Profile, useProfile } from "@/contexts/ProfileContext";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import {
  GameRoom,
  TransferCurrency,
} from "@/integrations/smartcontracts/gameRoom";
import { useEffect, useState } from "react";
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
import { NETWORK } from "@/constants";

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
type Currency = "SUI" | "USDC" | "USDT";

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
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);

  const { suiClient, suiBalance, usdcBalance, usdtBalance } = useWallet();
  const { profile } = useProfile();
  const { toast } = useToast();

  useEffect(() => {
    if (suiClient && profile) {
      setGameRoom(new GameRoom(suiClient));
    }
  }, [suiClient, profile]);

  const adminWalletAddress = gameRoom?.getSponsorAddress();
  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setAmount("");
      setRecipient("");
      setAccountNumber("");
      setAccountName("");
      setError("");
      setSuccess(false);
      setTransactionHash("");
      setTransferMode("external");
    }
  }, [open]);

  const getCurrentBalance = () => {
    switch (currency) {
      case "SUI":
        return suiBalance;
      case "USDC":
        return usdcBalance;
      case "USDT":
        return usdtBalance;
      default:
        return 0;
    }
  };

  const getCurrencyIcon = (curr: Currency) => {
    switch (curr) {
      case "USDC":
        return "💎";
      case "USDT":
        return "🟢";
      case "SUI":
        return "🔵";
      default:
        return "💰";
    }
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
        `Insufficient balance. Available: ${balance.toFixed(
          currency === "SUI" ? 4 : 2
        )} ${currency}`
      );
      return false;
    }

    if (transferMode === "external") {
      if (!recipient.trim()) {
        setError("Please enter recipient address");
        return false;
      }
      // Basic address validation
      if (recipient.length < 20) {
        setError("Please enter a valid Sui address");
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
    }

    return true;
  };

  const handleTransfer = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      if (!gameRoom) {
        throw new Error("GameRoom not properly initialized");
      }

      const wallet = profile.sui_wallet_data as Profile["sui_wallet_data"];
      if (!wallet) throw new Error("Wallet not found");

      const keypair = gameRoom?.getWalletKeypair(wallet.privateKey);
      if (!keypair) {
        throw new Error("Wallet keypair not available");
      }

      const amountNum = parseFloat(amount);
      const targetAddress =
        transferMode === "external" ? recipient : adminWalletAddress;

      if (!targetAddress) {
        throw new Error("Target address not found");
      }

      const result = await gameRoom.transfer(
        keypair,
        targetAddress,
        amountNum,
        currency as TransferCurrency
      );

      if (result.success) {
        onTransferSuccess({
          amount,
          currency,
          transactionHash: result.digest || "",
        });

        setSuccess(true);
        setTransactionHash(result.digest || "");

        toast({
          title: "Transfer Successful! 🎉",
          description: `${amount} ${currency} transferred successfully`,
        });

        // Show different messages based on transfer mode
        if (transferMode === "fiat") {
          toast({
            title: "Next Steps",
            description:
              "Please notify the admin on Discord with your transaction digest for fiat conversion",
            variant: "default",
          });
        }

        // Reset form after successful transfer
        setTimeout(() => {
          onClose();
        }, 6000);
      } else {
        throw new Error(result.error || "Transfer failed");
      }
    } catch (error) {
      console.error("Transfer error:", error);
      setError(error.message || "Transfer failed");
      toast({
        title: "Transfer Failed",
        description: error.message || "An error occurred during transfer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
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
            Send tokens to external wallets or convert to fiat currency
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Transfer Mode Selection */}
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

          {/* Currency Selection */}
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
                <SelectItem value="USDC" className="text-foreground">
                  <div className="flex items-center gap-2">
                    <span>💎</span>
                    <span>USDC</span>
                    <span className="text-muted-foreground text-sm">
                      ({usdcBalance.toFixed(2)})
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="USDT" className="text-foreground">
                  <div className="flex items-center gap-2">
                    <span>🟢</span>
                    <span>USDT</span>
                    <span className="text-muted-foreground text-sm">
                      ({usdtBalance.toFixed(2)})
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="SUI" className="text-foreground">
                  <div className="flex items-center gap-2">
                    <span>🔵</span>
                    <span>SUI</span>
                    <span className="text-muted-foreground text-sm">
                      ({suiBalance.toFixed(4)})
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label className="font-cyber font-bold text-foreground">
              Amount
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.0001"
                placeholder={`Enter amount (Max: ${getCurrentBalance().toFixed(
                  currency === "SUI" ? 4 : 2
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
              Available:{" "}
              {getCurrentBalance().toFixed(currency === "SUI" ? 4 : 2)}{" "}
              {currency}
            </div>
          </div>

          {/* Recipient Address (External Mode) */}
          {transferMode === "external" && (
            <div className="space-y-3">
              <Label className="font-cyber font-bold text-foreground">
                Recipient Address
              </Label>
              <Input
                placeholder="Enter Sui wallet address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-black/40 border-primary/30 font-mono text-sm"
                disabled={loading}
              />
            </div>
          )}

          {/* Admin Address (Fiat Mode) */}
          {transferMode === "fiat" && (
            <div className="space-y-3">
              <Label className="font-cyber font-bold text-foreground">
                Admin Wallet Address
              </Label>
              <Input
                value={adminWalletAddress || "Admin address not configured"}
                className="bg-black/40 border-primary/30 font-mono text-sm"
                disabled
              />
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-500 text-sm">
                  After transfer, notify the admin on Discord with your
                  transaction digest for fiat conversion.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Account Details (Fiat Mode) */}
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

          {/* Error Display */}
          {error && (
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-500 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Display - Transaction Receipt */}
          {success && (
            <div className="space-y-4">
              <Alert className="border-green-500/30 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500 text-sm font-bold">
                  Transfer Successful! 🎉
                </AlertDescription>
              </Alert>

              {/* Transaction Receipt */}
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
                  {/* Transfer Mode */}
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

                  {/* Amount */}
                  <div className="flex justify-between items-center py-2 border-b border-green-500/20">
                    <span className="text-muted-foreground font-cyber">
                      Amount:
                    </span>
                    <span className="text-foreground font-bold flex items-center gap-2">
                      <span>{getCurrencyIcon(currency)}</span>
                      {amount} {currency}
                    </span>
                  </div>

                  {/* Recipient */}
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

                  {/* Transaction Hash */}
                  <div className="flex justify-between items-start py-2">
                    <span className="text-muted-foreground font-cyber">
                      Transaction Hash:
                    </span>
                    <div className="text-right">
                      <div className="text-foreground font-mono text-xs break-all">
                        {transactionHash}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(transactionHash);
                          toast({
                            title: "Copied!",
                            description: "Transaction hash copied to clipboard",
                          });
                        }}
                        className="text-green-400 hover:text-green-300 text-xs font-cyber mt-1 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Hash
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Info for Fiat Conversion */}
                {transferMode === "fiat" && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="text-yellow-500 text-xs">
                        <div className="font-bold mb-1">Next Steps:</div>
                        <div>
                          1. Notify the admin on Discord with this transaction
                          hash
                        </div>
                        <div>
                          2. Provide your account details: {accountName} -{" "}
                          {accountNumber}
                        </div>
                        <div>3. Wait for fiat conversion confirmation</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* View on Explorer Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const explorers = [
                        `https://suiscan.xyz/${NETWORK}/tx/${transactionHash}`,
                        `https://suivision.xyz/txblock/${transactionHash}?network=${NETWORK}`,
                        `https://explorer.sui.io/txblock/${transactionHash}?network=${NETWORK}`,
                      ];
                      window.open(explorers[0], "_blank");
                    }}
                    className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-cyber font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Explorer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
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
              disabled={loading || !amount || parseFloat(amount) <= 0}
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
                  Transfer {amount} {currency}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
