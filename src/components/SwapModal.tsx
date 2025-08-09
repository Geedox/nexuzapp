import { useState, useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useWallet } from "@/contexts/WalletContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowUpDown,
  AlertTriangle,
  ExternalLink,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { GameTokenManager } from "@/integrations/smartcontracts/gameToken";
import type { Currency } from "@/lib/utils";
import { Swap as CetusSwap } from "@/integrations/swap";

interface SwapModalProps {
  open: boolean;
  onClose: () => void;
  currentBalances: {
    sui: number;
    usdc: number;
    usdt: number;
    gameTokens: number;
  };
  onSwapSuccess: (swapData?: {
    fromAmount: string;
    fromCurrency: string;
    toAmount: string;
    toCurrency: string;
    transactionHash: string;
  }) => void;
  gameTokenManager: GameTokenManager | null;
}

export const SwapModal = ({
  open,
  onClose,
  currentBalances,
  onSwapSuccess,
  gameTokenManager,
}: SwapModalProps) => {
  const [fromCurrency, setFromCurrency] = useState<Currency>("SUI");
  const [toCurrency, setToCurrency] = useState<Currency>("GAME_TOKEN");
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [txDigest, setTxDigest] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<number>(3100); // SUI to GT rate
  const [estimatedGasFee, setEstimatedGasFee] = useState<number>(0);
  const [reserves, setReserves] = useState<{
    sui: number;
    usdc: number;
    usdt: number;
  }>({
    sui: 0,
    usdc: 0,
    usdt: 0,
  });
  const [availableSwapPairs, setAvailableSwapPairs] = useState<string[]>([
    "SUI",
  ]);

  const { profile } = useProfile();
  const { toast } = useToast();
  const { cetusClient } = useWallet();

  // Network configuration
  const NETWORK = "testnet";

  // Create keypair from hex private key
  const createKeyPairFromHexPrivateKey = (
    hexPrivateKey: string
  ): Ed25519Keypair => {
    try {
      const cleanHex = hexPrivateKey.startsWith("0x")
        ? hexPrivateKey.slice(2)
        : hexPrivateKey;

      if (!/^[0-9a-fA-F]{64}$/.test(cleanHex)) {
        throw new Error(`Invalid hex private key format`);
      }

      const privateKeyBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        privateKeyBytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
      }

      return Ed25519Keypair.fromSecretKey(privateKeyBytes);
    } catch (error) {
      throw new Error(`Failed to create keypair: ${error.message}`);
    }
  };

  // Check what swap pairs are actually available
  const checkAvailableSwapPairs = async () => {
    if (!gameTokenManager || !profile?.sui_wallet_data?.address) return;

    try {
      const userAddress = profile.sui_wallet_data.address;
      const available = ["SUI"]; // SUI is always available

      // Check if user has any USDC coins
      try {
        const usdcCoins = await gameTokenManager.suiClient.getCoins({
          owner: userAddress,
          coinType: gameTokenManager.USDC_TYPE,
        });
        if (usdcCoins.data.length > 0) {
          available.push("USDC");
        }
      } catch (error) {
        console.log("USDC not available:", error.message);
      }

      // Check if user has any USDT coins
      try {
        const usdtCoins = await gameTokenManager.suiClient.getCoins({
          owner: userAddress,
          coinType: gameTokenManager.USDT_TYPE,
        });
        if (usdtCoins.data.length > 0) {
          available.push("USDT");
        }
      } catch (error) {
        console.log("USDT not available:", error.message);
      }

      setAvailableSwapPairs(available);
      console.log("Available swap pairs:", available);
    } catch (error) {
      console.error("Error checking available swap pairs:", error);
      setAvailableSwapPairs(["SUI"]); // Fallback to SUI only
    }
  };

  // Fetch exchange rates and reserves
  useEffect(() => {
    const fetchData = async () => {
      if (!gameTokenManager || !open) return;

      try {
        // Check available swap pairs
        await checkAvailableSwapPairs();

        // Get exchange rate
        const rate = await gameTokenManager.getExchangeRate("SUI");
        setExchangeRate(rate || 3100);

        // Get reserves
        const reserveBalances = await gameTokenManager.getReserveBalances();
        if (reserveBalances) {
          setReserves({
            sui: reserveBalances.sui || 0,
            usdc: reserveBalances.usdc || 0,
            usdt: reserveBalances.usdt || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gameTokenManager, profile?.sui_wallet_data?.address]);

  // Gas estimation
  useEffect(() => {
    const estimateGas = () => {
      if (!fromAmount || !profile?.sui_wallet_data) {
        setEstimatedGasFee(0);
        return;
      }

      // Different gas estimates based on swap type
      if (fromCurrency === "GAME_TOKEN") {
        setEstimatedGasFee(0.025); // Selling GT requires more gas
      } else {
        setEstimatedGasFee(0.015); // Buying GT is simpler
      }
    };

    const debounceTimer = setTimeout(estimateGas, 500);
    return () => clearTimeout(debounceTimer);
  }, [fromAmount, fromCurrency, profile]);

  // Calculate exchange rate
  const getExchangeRate = (from: string, to: string) => {
    if (from === to) return 1;

    if (from === "SUI" && to === "GAME_TOKEN") {
      return exchangeRate; // 1 SUI = 3100 GT
    }

    if (from === "GAME_TOKEN" && to === "SUI") {
      return 1 / exchangeRate; // 1 GT = 1/3100 SUI
    }

    return 1;
  };

  // Calculate to amount
  const calculateToAmount = (amount: string, from: string, to: string) => {
    if (!amount || isNaN(Number(amount))) return "";
    const rate = getExchangeRate(from, to);
    const result = Number(amount) * rate;
    return result.toFixed(to === "GAME_TOKEN" ? 0 : 4);
  };

  // Handle amount changes
  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    const calculated = calculateToAmount(value, fromCurrency, toCurrency);
    setToAmount(calculated);
  };

  // Handle currency swap
  const handleCurrencySwap = () => {
    const tempFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempFrom);
    const newToAmount = calculateToAmount(fromAmount, toCurrency, tempFrom);
    setToAmount(newToAmount);
  };

  // Get available balance
  const getAvailableBalance = (currency: string) => {
    switch (currency) {
      case "SUI":
        return currentBalances.sui;
      case "USDC":
        return currentBalances.usdc;
      case "USDT":
        return currentBalances.usdt;
      case "GAME_TOKEN":
        return currentBalances.gameTokens;
      default:
        return 0;
    }
  };

  // Validate swap
  const validateSwap = () => {
    const amount = Number(fromAmount);
    const available = getAvailableBalance(fromCurrency);

    if (!amount || amount <= 0) return "Please enter a valid amount";
    if (amount < 0.01 && fromCurrency !== "GAME_TOKEN")
      return `Minimum swap amount is 0.01 ${fromCurrency}`;
    if (amount < 1 && fromCurrency === "GAME_TOKEN")
      return "Minimum swap amount is 1 GT";

    // Check user balance
    if (fromCurrency === "SUI") {
      const totalNeeded = amount + estimatedGasFee;
      if (totalNeeded > available) {
        return `Insufficient SUI balance (need ${totalNeeded.toFixed(
          4
        )} SUI including gas)`;
      }
    } else if (amount > available) {
      return `Insufficient ${fromCurrency} balance`;
    }

    // Check gas for non-SUI transactions
    if (fromCurrency !== "SUI" && currentBalances.sui < estimatedGasFee) {
      return `Insufficient SUI for gas fees (need ${estimatedGasFee.toFixed(
        4
      )} SUI)`;
    }

    // Check if swapping same currency
    if (fromCurrency === toCurrency) return "Cannot swap same currency";

    // Check if GT is involved (required for all swaps)
    // if (fromCurrency !== "GAME_TOKEN" && toCurrency !== "GAME_TOKEN") {
    //   return "All swaps must involve Game Tokens (GT)";
    // }

    // Check reserves for selling GT
    if (fromCurrency === "GAME_TOKEN") {
      const toAmountNum = Number(toAmount);
      const availableReserves = reserves.sui; // Only SUI reserves matter for now

      if (toAmountNum > availableReserves) {
        return `Insufficient SUI reserves (available: ${availableReserves.toFixed(
          4
        )})`;
      }
    }

    // Check if currency is available
    if (
      fromCurrency !== "GAME_TOKEN" &&
      !availableSwapPairs.includes(fromCurrency)
    ) {
      return `${fromCurrency} not available on testnet`;
    }

    if (!gameTokenManager) return "Game Token manager not available";

    return null;
  };

  // Execute blockchain swap
  const executeBlockchainSwap = async () => {
    if (!profile?.sui_wallet_data || !gameTokenManager) {
      throw new Error("No wallet connected or GameToken manager unavailable");
    }

    try {
      const privateKey = profile.sui_wallet_data.privateKey;
      const walletKeyPair = createKeyPairFromHexPrivateKey(privateKey);
      const swapAmount = Number(fromAmount);

      console.log("🔄 Executing swap:", {
        from: fromCurrency,
        to: toCurrency,
        amount: swapAmount,
        expectedOutput: toAmount,
      });

      // Helper to run a Cetus swap
      const runCetusSwap = async (
        coinA: "SUI" | "USDC" | "USDT",
        coinB: "SUI" | "USDC" | "USDT",
        amount: number
      ) => {
        if (!cetusClient) {
          throw new Error("Cetus client unavailable");
        }
        const cetusSwap = new CetusSwap(cetusClient, gameTokenManager, walletKeyPair);
        await cetusSwap.getPoolDetails(coinA, coinB);
        const pre = await cetusSwap.calculateSwapRates(coinA, coinB, amount);
        const tx = await cetusSwap.swap(coinA, coinB, amount, pre);
        const digest = (tx as any)?.digest || (tx as any)?.effects?.transactionDigest || "";
        return { success: true, digest } as const;
      };

      // 1) Direct SUI ↔ GT
      if (fromCurrency === "SUI" && toCurrency === "GAME_TOKEN") {
        const res = await gameTokenManager.buyGameTokensWithSui(walletKeyPair, swapAmount);
        if (!res.success) throw new Error(res.error || "Swap failed");
        return { success: true, digest: res.digest, events: res.events || [] } as const;
      }

      if (fromCurrency === "GAME_TOKEN" && toCurrency === "SUI") {
        const res = await gameTokenManager.sellGameTokensForSui(walletKeyPair, swapAmount);
        if (!res.success) throw new Error(res.error || "Swap failed");
        return { success: true, digest: res.digest, events: res.events || [] } as const;
      }

      // 2) GT → (USDC)
      if (fromCurrency === "GAME_TOKEN" && (toCurrency === "USDC")) {
        const sellRes = await gameTokenManager.sellGameTokensForUsdc(walletKeyPair, swapAmount);
        if (!sellRes.success) throw new Error(sellRes.error || "GT→SUI leg failed");
        const secondRes = await runCetusSwap("SUI", toCurrency as any, swapAmount);
        return { success: true, digest: secondRes.digest, events: sellRes.events || [] } as const;
      }
      // 2) GT → (USDT)
      if (fromCurrency === "GAME_TOKEN" && (toCurrency === "USDT")) {
        const sellRes = await gameTokenManager.sellGameTokensForUsdt(walletKeyPair, swapAmount);
        if (!sellRes.success) throw new Error(sellRes.error || "GT→SUI leg failed");
        const secondRes = await runCetusSwap("SUI", toCurrency as any, swapAmount);
        return { success: true, digest: secondRes.digest, events: sellRes.events || [] } as const;
      }

      // 3) (USDC) → GT
      if ((fromCurrency === "USDC") && toCurrency === "GAME_TOKEN") {
        const buyRes = await gameTokenManager.buyGameTokensWithUsdc(walletKeyPair, swapAmount);
        if (!buyRes.success) throw new Error(buyRes.error || "SUI→GT leg failed");
        return { success: true, digest: buyRes.digest, events: buyRes.events || [] } as const;
      }

      // 3) (USDT) → GT
      if ((fromCurrency === "USDT") && toCurrency === "GAME_TOKEN") {
        const buyRes = await gameTokenManager.buyGameTokensWithUsdt(walletKeyPair, swapAmount);
        if (!buyRes.success) throw new Error(buyRes.error || "SUI→GT leg failed");
        return { success: true, digest: buyRes.digest, events: buyRes.events || [] } as const;
      }
      // 4) Non-GT pairs via Cetus directly: USDC↔SUI, USDT↔SUI, USDC↔USDT
      if (
        (fromCurrency === "SUI" && (toCurrency === "USDC" || toCurrency === "USDT")) ||
        ((fromCurrency === "USDC" || fromCurrency === "USDT") && toCurrency === "SUI") ||
        ((fromCurrency === "USDC" || fromCurrency === "USDT") && (toCurrency === "USDC" || toCurrency === "USDT"))
      ) {
        const direct = await runCetusSwap(fromCurrency as any, toCurrency as any, swapAmount);
        return { success: true, digest: direct.digest, events: [] } as const;
      }
      throw new Error(`Swap pair ${fromCurrency} → ${toCurrency} not supported`);
    } catch (error) {
      console.error("💥 Error in executeBlockchainSwap:", error);
      throw error;
    }
  };

  // Execute swap
  const executeSwap = async () => {
    const validation = validateSwap();
    if (validation) {
      toast({
        title: "Invalid Swap",
        description: validation,
        variant: "destructive",
      });
      return;
    }

    setIsSwapping(true);
    setTxDigest("");

    try {
      const result = await executeBlockchainSwap();

      if (result.success) {
        setTxDigest(result.digest);
        toast({
          title: "Swap Successful! 🎉",
          description: `Swapped ${fromAmount} ${fromCurrency} for ${toAmount} ${toCurrency}`,
        });

        const swapData = {
          fromAmount,
          fromCurrency,
          toAmount,
          toCurrency,
          transactionHash: result.digest,
        };

        setFromAmount("");
        setToAmount("");
        onSwapSuccess(swapData);

        setTimeout(() => onClose(), 3000);
      } else {
        throw new Error(JSON.stringify(result) || "Swap failed");
      }
    } catch (error) {
      console.error("Swap error:", error);
      toast({
        title: "Swap Failed",
        description:
          error.message || "Failed to execute swap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFromAmount("");
    setToAmount("");
    setFromCurrency("SUI");
    setToCurrency("GAME_TOKEN");
    setTxDigest("");
    setEstimatedGasFee(0);
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Open explorer
  const openExplorer = () => {
    if (txDigest) {
      window.open(
        `https://suivision.xyz/txblock/${txDigest}?network=${NETWORK}`,
        "_blank"
      );
    }
  };

  // Get currency icon
  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case "SUI":
        return "🔵";
      case "USDC":
        return "💎";
      case "USDT":
        return "🟢";
      case "GAME_TOKEN":
        return "🎮";
      default:
        return "🪙";
    }
  };

  // Get currency display name
  const getCurrencyDisplayName = (currency: string) => {
    return currency === "GAME_TOKEN" ? "GT" : currency;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-background via-card to-secondary/20 border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-gaming text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent flex items-center gap-2">
            <ArrowUpDown className="w-7 h-7 text-primary" />
            Token Swap
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-cyber">
            SUI ↔ GT swaps • Rate: 1 SUI = {exchangeRate} GT
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Testnet Notice */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-blue-400 font-cyber">
              <Info className="w-4 h-4" />
              <span>
                Testnet: Only SUI ↔ GT swaps available. USDC/USDT coming soon!
              </span>
            </div>
          </div>

          {txDigest && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-green-400 text-2xl">✅</div>
                <div className="flex-1">
                  <p className="text-green-400 font-cyber font-bold mb-1">
                    Swap Completed Successfully!
                  </p>
                  <p className="text-xs text-green-400/80 font-cyber mb-2">
                    Transaction Hash: {txDigest.slice(0, 20)}...
                  </p>
                  <Button
                    onClick={openExplorer}
                    variant="outline"
                    size="sm"
                    className="border-green-500/50 text-green-400 hover:bg-green-500/20 font-cyber"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View on Explorer
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-black/40 border border-primary/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-cyber text-accent">From</Label>
                <span className="text-xs text-muted-foreground font-cyber">
                  Balance:{" "}
                  {getAvailableBalance(fromCurrency).toFixed(
                    fromCurrency === "GAME_TOKEN" ? 0 : 4
                  )}{" "}
                  {getCurrencyDisplayName(fromCurrency)}
                </span>
              </div>
              <div className="flex gap-3">
                <Select
                  value={fromCurrency}
                  onValueChange={(value: any) => setFromCurrency(value)}
                >
                  <SelectTrigger className="w-32 bg-black/40 border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUI">
                      {getCurrencyIcon("SUI")} SUI
                    </SelectItem>
                    <SelectItem value="GAME_TOKEN">
                      {getCurrencyIcon("GAME_TOKEN")} GT
                    </SelectItem>
                    <SelectItem value="USDT">
                      {getCurrencyIcon("USDT")} USDT
                    </SelectItem>
                    <SelectItem value="USDC">
                      {getCurrencyIcon("USDC")} USDC
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  className="flex-1 font-cyber bg-black/40 border-primary/30 text-lg"
                  step={fromCurrency === "GAME_TOKEN" ? "1" : "0.0001"}
                  min="0"
                  max={getAvailableBalance(fromCurrency)}
                  disabled={isSwapping}
                />
              </div>
              <Button
                onClick={() =>
                  handleFromAmountChange(
                    getAvailableBalance(fromCurrency).toString()
                  )
                }
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-primary hover:text-primary/80 font-cyber"
                disabled={isSwapping}
              >
                Use Max
              </Button>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleCurrencySwap}
                variant="outline"
                size="icon"
                className="rounded-full border-primary/50 hover:bg-primary/20 hover:scale-110 transition-all duration-300"
                disabled={isSwapping}
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-black/40 border border-accent/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-cyber text-accent">To</Label>
                <span className="text-xs text-muted-foreground font-cyber">
                  Balance:{" "}
                  {getAvailableBalance(toCurrency).toFixed(
                    toCurrency === "GAME_TOKEN" ? 0 : 4
                  )}{" "}
                  {getCurrencyDisplayName(toCurrency)}
                </span>
              </div>
              <div className="flex gap-3">
                <Select
                  value={toCurrency}
                  onValueChange={(value: any) => setToCurrency(value)}
                >
                  <SelectTrigger className="w-32 bg-black/40 border-accent/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUI">
                      {getCurrencyIcon("SUI")} SUI
                    </SelectItem>
                    <SelectItem value="GAME_TOKEN">
                      {getCurrencyIcon("GAME_TOKEN")} GT
                    </SelectItem>
                    <SelectItem value="USDT">
                      {getCurrencyIcon("USDT")} USDT
                    </SelectItem>
                    <SelectItem value="USDC">
                      {getCurrencyIcon("USDC")} USDC
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={toAmount}
                  readOnly
                  className="flex-1 font-cyber bg-black/20 border-accent/30 text-lg text-accent"
                />
              </div>
            </div>
          </div>

          {fromAmount && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-blue-400 font-cyber">
                <span>Exchange Rate:</span>
                <span className="font-bold">
                  1 {getCurrencyDisplayName(fromCurrency)} ={" "}
                  {getExchangeRate(fromCurrency, toCurrency).toFixed(
                    fromCurrency === "GAME_TOKEN" ? 8 : 0
                  )}{" "}
                  {getCurrencyDisplayName(toCurrency)}
                </span>
              </div>
            </div>
          )}

          {fromCurrency === "GAME_TOKEN" && toAmount && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm font-cyber">
                <span className="text-yellow-400">SUI Reserve Available:</span>
                <span className="text-yellow-300 font-bold">
                  {reserves.sui.toFixed(4)} SUI
                </span>
              </div>
            </div>
          )}

          {fromAmount && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm font-cyber">
                <span className="text-orange-400">Estimated Gas Fee:</span>
                <span className="text-orange-300 font-bold">
                  {estimatedGasFee.toFixed(4)} SUI
                </span>
              </div>
            </div>
          )}

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-green-400 font-cyber">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>
                Clean testnet implementation • Business-optimized rates • 1000
                GT ≈ $1 gaming value
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-primary/50 text-primary hover:bg-primary/10 font-cyber"
              disabled={isSwapping}
            >
              {txDigest ? "Close" : "Cancel"}
            </Button>
            <Button
              onClick={executeSwap}
              disabled={
                !fromAmount ||
                isSwapping ||
                !!validateSwap() ||
                !!txDigest
              }
              className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-gaming font-bold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSwapping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : txDigest ? (
                "✅ Complete"
              ) : (
                <>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Swap Tokens
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
