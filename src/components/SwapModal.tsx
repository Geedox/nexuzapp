import { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowUpDown, ExternalLink, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient } from '@mysten/sui.js/client';
import BN from 'bn.js';

// Import Cetus SDK with correct exports
import { CetusClmmSDK, SdkOptions } from '@cetusprotocol/sui-clmm-sdk';
import Percentage from "@cetusprotocol/sui-clmm-sdk";
import adjustForSlippage from "@cetusprotocol/sui-clmm-sdk";
import d from "@cetusprotocol/sui-clmm-sdk";

interface CetusSwapModalProps {
  open: boolean;
  onClose: () => void;
  currentBalances: {
    sui: number;
    usdc: number;
    usdt: number;
  };
  onSwapSuccess: (swapData: {
    fromAmount: string;
    fromCurrency: string;
    toAmount: string;
    toCurrency: string;
    transactionHash: string;
    type: 'cetus';
  }) => void;
  suiClient: SuiClient;
}

export const CetusSwapModal = ({
  open,
  onClose,
  currentBalances,
  onSwapSuccess,
  suiClient
}: CetusSwapModalProps) => {
  const [fromCurrency, setFromCurrency] = useState<'SUI' | 'USDC' | 'USDT'>('SUI');
  const [toCurrency, setToCurrency] = useState<'SUI' | 'USDC' | 'USDT'>('USDC');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [txDigest, setTxDigest] = useState<string>('');
  const [slippage, setSlippage] = useState<string>('0.5');
  const [cetusSDK, setCetusSDK] = useState<CetusClmmSDK | null>(null);
  const [poolInfo, setPoolInfo] = useState<any>(null);
  const [preSwapResult, setPreSwapResult] = useState<any>(null);

  const { profile } = useProfile();
  const { toast } = useToast();

  // Network configuration
  const NETWORK = 'testnet';

  // Token addresses for Sui testnet
  const TOKEN_ADDRESSES = {
    SUI: '0x2::sui::SUI',
    USDC: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    USDT: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
  };

  // Initialize Cetus SDK for testnet
  useEffect(() => {
    if (!open) return;

    const initCetusSDK = async () => {
      try {
        console.log('🐋 Initializing Cetus SDK for testnet...');

        const sdkOptions: SdkOptions = {
          full_rpc_url: suiClient.transport.url,
          simulation_account: {
            address: '0x0000000000000000000000000000000000000000000000000000000000000000',
          },
        };

        const sdk = new CetusClmmSDK(sdkOptions);
        await sdk.initialize();

        setCetusSDK(sdk);
        console.log('✅ Cetus SDK initialized successfully for testnet');
      } catch (error) {
        console.error('❌ Failed to initialize Cetus SDK:', error);
        toast({
          title: "SDK Initialization Failed",
          description: "Failed to connect to Cetus protocol on testnet. Please try again.",
          variant: "destructive",
        });
      }
    };

    initCetusSDK();
  }, [open, suiClient]);

  // Get decimals for currency
  const getDecimals = (currency: string): number => {
    switch (currency) {
      case 'SUI': return 9;
      case 'USDC':
      case 'USDT': return 6;
      default: return 9;
    }
  };

  // Find pool and calculate swap using real Cetus preSwap API
  const calculateSwapAmount = async (amount: string, from: string, to: string) => {
    if (!amount || !cetusSDK || isNaN(Number(amount)) || Number(amount) <= 0) {
      setToAmount('');
      setPoolInfo(null);
      setPreSwapResult(null);
      return;
    }

    if (from === to) {
      setToAmount('');
      setPoolInfo(null);
      setPreSwapResult(null);
      return;
    }

    setIsCalculating(true);
    try {
      console.log(`🔄 Calculating real testnet swap: ${amount} ${from} → ${to}`);

      const fromTokenAddress = TOKEN_ADDRESSES[from as keyof typeof TOKEN_ADDRESSES];
      const toTokenAddress = TOKEN_ADDRESSES[to as keyof typeof TOKEN_ADDRESSES];

      // You need to provide actual pool IDs for testnet pairs
      // These are example pool IDs - replace with real ones from Cetus testnet
      const TESTNET_POOL_IDS: Record<string, string> = {
        'SUI_USDC': '0x6fd4915e6d8d3e2ba6d81787046eb948ae36fdfc75dad2e24f0d4aaa2417a416',
        'SUI_USDT': '0x53d70570db4f4d8ebc20aa1b67dc6f5d061d318d371e5de50ff64525d7dd5bca',
        'USDC_USDT': '0x4038aea2341070550e9c1f723315624c539788d0ca9212dca7eb4b36147c0fcb',
        'USDC_SUI': '0x6fd4915e6d8d3e2ba6d81787046eb948ae36fdfc75dad2e24f0d4aaa2417a416',
        'USDT_SUI': '0x53d70570db4f4d8ebc20aa1b67dc6f5d061d318d371e5de50ff64525d7dd5bca',
        'USDT_USDC': '0x4038aea2341070550e9c1f723315624c539788d0ca9212dca7eb4b36147c0fcb',
      };

      // Get pool ID for this pair
      const pairKey = `${from}_${to}`;
      const poolId = TESTNET_POOL_IDS[pairKey];

      if (!poolId) {
        console.log('❌ No pool ID found for this pair on testnet');
        setToAmount('');
        setPoolInfo(null);
        setPreSwapResult(null);
        toast({
          title: "Pool Not Found",
          description: `No pool ID configured for ${from}/${to} pair on testnet`,
          variant: "destructive",
        });
        return;
      }

      console.log('📊 Using pool ID:', poolId);

      // Get pool data using exact method from docs
      const pool = await cetusSDK.Pool.getPool(poolId);

      setPoolInfo(pool);
      console.log('📊 Found testnet pool:', pool.id);

      // Determine swap direction following docs exactly
      const a2b = fromTokenAddress.toLowerCase() === pool.coin_type_a.toLowerCase();

      // Convert amount to BN with proper decimals
      const fromDecimals = getDecimals(from);
      const toDecimals = getDecimals(to);
      const inputAmount = new BN(Number(amount) * Math.pow(10, fromDecimals));

      console.log('💰 Input amount (BN):', inputAmount.toString());
      console.log('🔄 Swap direction (a2b):', a2b);

      // Use preSwap exactly as shown in Cetus documentation
      const res = await cetusSDK.Swap.preSwap({
        pool,
        current_sqrt_price: pool.current_sqrt_price,
        coin_type_a: pool.coin_type_a,
        coin_type_b: pool.coin_type_b,
        decimals_a: a2b ? fromDecimals : toDecimals,
        decimals_b: a2b ? toDecimals : fromDecimals,
        a2b,
        by_amount_in: true,
        amount: inputAmount,
      });

      if (res && res.estimated_amount_out) {
        const outputAmount = Number(res.estimated_amount_out) / Math.pow(10, toDecimals);

        setToAmount(outputAmount.toFixed(toDecimals === 9 ? 6 : 2));
        setPreSwapResult(res);

        console.log('✅ PreSwap calculated output:', outputAmount);
        console.log('📊 Full PreSwap result:', res);
      } else {
        setToAmount('');
        setPreSwapResult(null);
        console.log('❌ Failed to calculate preSwap - no estimated_amount_out');
        toast({
          title: "Calculation Failed",
          description: "Unable to calculate swap rates. Pool may have insufficient liquidity.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Error calculating swap:', error);
      setToAmount('');
      setPoolInfo(null);
      setPreSwapResult(null);
      toast({
        title: "Calculation Error",
        description: error.message || "Failed to calculate swap amount. Please check if pool IDs are correct.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle amount change with debouncing for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount && cetusSDK) {
        calculateSwapAmount(fromAmount, fromCurrency, toCurrency);
      }
    }, 1000); // 1 second debounce for API calls

    return () => clearTimeout(timer);
  }, [fromAmount, fromCurrency, toCurrency, cetusSDK]);

  // Create keypair from hex private key
  const createKeyPairFromHexPrivateKey = (hexPrivateKey: string): Ed25519Keypair => {
    try {
      let cleanHex = hexPrivateKey.startsWith('0x') ? hexPrivateKey.slice(2) : hexPrivateKey;
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

  // Execute real Cetus swap transaction following documentation exactly
  const executeSwap = async () => {
    if (!profile?.sui_wallet_data || !cetusSDK || !poolInfo || !preSwapResult) {
      throw new Error('Missing requirements for swap');
    }

    setIsSwapping(true);
    try {
      console.log('🚀 Executing real Cetus swap on testnet...');

      const privateKey = profile.sui_wallet_data.privateKey;
      const walletKeyPair = createKeyPairFromHexPrivateKey(privateKey);
      const userAddress = walletKeyPair.getPublicKey().toSuiAddress();

      const fromTokenAddress = TOKEN_ADDRESSES[fromCurrency as keyof typeof TOKEN_ADDRESSES];
      const a2b = fromTokenAddress.toLowerCase() === poolInfo.coin_type_a.toLowerCase();

      console.log('📝 Creating swap transaction following Cetus docs...');
      console.log('Pool ID:', poolInfo.id);
      console.log('User address:', userAddress);
      console.log('Swap direction (a2b):', a2b);

      // Calculate slippage protection exactly as shown in Cetus documentation
      const slippageValue = Percentage.fromDecimal(d(Number(slippage)));
      const by_amount_in = true;
      const to_amount = by_amount_in ? preSwapResult.estimated_amount_out : preSwapResult.estimated_amount_in;
      const amount_limit = adjustForSlippage(to_amount, slippageValue, !by_amount_in);

      console.log('💊 Slippage protection:', `${slippage}%`);
      console.log('📊 Amount limit:', amount_limit.toString());

      // Create swap payload exactly as shown in Cetus documentation
      const swap_payload = await cetusSDK.Swap.createSwapPayload({
        pool_id: poolInfo.id,
        coin_type_a: poolInfo.coin_type_a,
        coin_type_b: poolInfo.coin_type_b,
        a2b: a2b,
        by_amount_in,
        amount: preSwapResult.amount.toString(),
        amount_limit: amount_limit.toString(),
        swap_partner: undefined, // No partner as shown in docs
      });

      console.log('✍️ Signing and executing transaction...');

      // Execute transaction using fullClient as shown in Cetus documentation
      const result = await cetusSDK.FullClient.sendTransaction(walletKeyPair, swap_payload);

      console.log('📋 Transaction result:', result);

      if (result.effects?.status?.status === 'success') {
        console.log('✅ Cetus testnet swap successful:', result.digest);
        setTxDigest(result.digest);

        toast({
          title: "Cetus Swap Successful! 🎉",
          description: `Swapped ${fromAmount} ${fromCurrency} for ~${toAmount} ${toCurrency}`,
        });

        onSwapSuccess({
          fromAmount,
          fromCurrency,
          toAmount: toAmount || 'Unknown',
          toCurrency,
          transactionHash: result.digest,
          type: 'cetus',
        });

        setTimeout(() => onClose(), 2000);
      } else {
        const errorMessage = result.effects?.status?.error || 'Transaction failed';
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('❌ Cetus swap error:', error);
      let errorMessage = 'Swap failed. Please try again.';

      if (error.message.includes('Insufficient')) {
        errorMessage = `Insufficient ${fromCurrency} balance for this swap.`;
      } else if (error.message.includes('slippage')) {
        errorMessage = 'Price moved too much. Try increasing slippage tolerance.';
      } else if (error.message.includes('liquidity')) {
        errorMessage = 'Insufficient liquidity in the pool. Try a smaller amount.';
      } else if (error.message.includes('RPC')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      toast({
        title: "Swap Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  // Get available balance for currency
  const getAvailableBalance = (currency: string) => {
    switch (currency) {
      case 'SUI': return currentBalances.sui;
      case 'USDC': return currentBalances.usdc;
      case 'USDT': return currentBalances.usdt;
      default: return 0;
    }
  };

  // Validate swap requirements
  const validateSwap = () => {
    const amount = Number(fromAmount);
    const available = getAvailableBalance(fromCurrency);

    if (!amount || amount <= 0) return 'Please enter a valid amount';
    if (fromCurrency === toCurrency) return 'Cannot swap same currency';
    if (!cetusSDK) return 'Cetus protocol not ready';
    if (!poolInfo) return 'No liquidity pool found';
    if (amount > available) return `Insufficient ${fromCurrency} balance`;
    if (!toAmount || Number(toAmount) <= 0) return 'Invalid output amount';
    if (isCalculating) return 'Calculating rates...';

    return null;
  };

  // Handle currency swap direction
  const handleCurrencySwap = () => {
    const tempFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempFrom);

    // Clear amounts to trigger recalculation
    setFromAmount('');
    setToAmount('');
    setPoolInfo(null);
    setPreSwapResult(null);
  };

  // Reset form state
  const resetForm = () => {
    setFromAmount('');
    setToAmount('');
    setTxDigest('');
    setPoolInfo(null);
    setPreSwapResult(null);
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Get currency display icon
  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'SUI': return '🔵';
      case 'USDC': return '💎';
      case 'USDT': return '🟢';
      default: return '🪙';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-background via-card to-secondary/20 border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-gaming text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent flex items-center gap-2">
            <ArrowUpDown className="w-7 h-7 text-primary" />
            Cetus Swap
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-cyber">
            Real testnet trading with Cetus protocol • Live pools • Actual liquidity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* SDK Status */}
          {!cetusSDK && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                <p className="text-yellow-400 text-sm font-cyber">Connecting to Cetus testnet...</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {txDigest && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-400 font-cyber font-bold mb-1">Testnet Swap Completed!</p>
                  <Button
                    onClick={() => window.open(`https://suivision.xyz/txblock/${txDigest}?network=${NETWORK}`, '_blank')}
                    variant="outline"
                    size="sm"
                    className="border-green-500/50 text-green-400 hover:bg-green-500/20 font-cyber"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View on Testnet Explorer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* From Section */}
          <div className="bg-black/40 border border-primary/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="font-cyber text-accent">From</Label>
              <span className="text-xs text-muted-foreground font-cyber">
                Balance: {getAvailableBalance(fromCurrency).toFixed(fromCurrency === 'SUI' ? 4 : 2)} {fromCurrency}
              </span>
            </div>
            <div className="flex gap-3">
              <Select value={fromCurrency} onValueChange={(value: any) => setFromCurrency(value)}>
                <SelectTrigger className="w-32 bg-black/40 border-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUI">{getCurrencyIcon('SUI')} SUI</SelectItem>
                  <SelectItem value="USDC">{getCurrencyIcon('USDC')} USDC</SelectItem>
                  <SelectItem value="USDT">{getCurrencyIcon('USDT')} USDT</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="flex-1 font-cyber bg-black/40 border-primary/30 text-lg"
                step={fromCurrency === 'SUI' ? '0.0001' : '0.01'}
                disabled={isSwapping || !cetusSDK}
              />
            </div>
            <Button
              onClick={() => setFromAmount(getAvailableBalance(fromCurrency).toString())}
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-primary hover:text-primary/80 font-cyber"
              disabled={isSwapping || !cetusSDK}
            >
              Use Max
            </Button>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleCurrencySwap}
              variant="outline"
              size="icon"
              className="rounded-full border-primary/50 hover:bg-primary/20 hover:scale-110 transition-all duration-300"
              disabled={isSwapping || isCalculating || !cetusSDK}
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>

          {/* To Section */}
          <div className="bg-black/40 border border-accent/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="font-cyber text-accent">To</Label>
              <span className="text-xs text-muted-foreground font-cyber">
                Balance: {getAvailableBalance(toCurrency).toFixed(toCurrency === 'SUI' ? 4 : 2)} {toCurrency}
              </span>
            </div>
            <div className="flex gap-3">
              <Select value={toCurrency} onValueChange={(value: any) => setToCurrency(value)}>
                <SelectTrigger className="w-32 bg-black/40 border-accent/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUI">{getCurrencyIcon('SUI')} SUI</SelectItem>
                  <SelectItem value="USDC">{getCurrencyIcon('USDC')} USDC</SelectItem>
                  <SelectItem value="USDT">{getCurrencyIcon('USDT')} USDT</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={toAmount}
                  readOnly
                  className="flex-1 font-cyber bg-black/20 border-accent/30 text-lg text-accent pr-10"
                />
                {isCalculating && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-accent" />
                )}
              </div>
            </div>
          </div>

          {/* Live Pool Information */}
          {poolInfo && preSwapResult && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-blue-400 font-cyber font-bold">Live Testnet Pool Data</h4>
                <Button
                  onClick={() => calculateSwapAmount(fromAmount, fromCurrency, toCurrency)}
                  variant="ghost"
                  size="sm"
                  disabled={isCalculating || !cetusSDK}
                >
                  <RefreshCw className={`w-3 h-3 ${isCalculating ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm font-cyber">
                <div className="flex justify-between">
                  <span className="text-blue-400">Pool:</span>
                  <span className="text-blue-300">{poolInfo.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-400">Fee:</span>
                  <span className="text-blue-300">{(Number(poolInfo.fee_rate || 0) / 10000).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-400">Rate:</span>
                  <span className="text-blue-300">1 {fromCurrency} = {(Number(toAmount) / Number(fromAmount)).toFixed(4)} {toCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-400">Est. Out:</span>
                  <span className="text-blue-300">{Number(preSwapResult.estimated_amount_out / Math.pow(10, getDecimals(toCurrency))).toFixed(4)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Slippage Settings */}
          <div className="bg-black/40 border border-primary/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="font-cyber text-accent">Slippage Tolerance</Label>
              <span className="text-xs text-muted-foreground font-cyber">
                Max price movement
              </span>
            </div>
            <div className="flex gap-2">
              {['0.1', '0.5', '1.0'].map((preset) => (
                <Button
                  key={preset}
                  onClick={() => setSlippage(preset)}
                  variant={slippage === preset ? "default" : "outline"}
                  size="sm"
                  className="font-cyber text-xs"
                  disabled={isSwapping}
                >
                  {preset}%
                </Button>
              ))}
              <Input
                type="number"
                placeholder="Custom"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="w-20 text-xs font-cyber bg-black/40 border-primary/30"
                step="0.1"
                min="0.1"
                max="50"
                disabled={isSwapping}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-primary/50 text-primary hover:bg-primary/10 font-cyber"
              disabled={isSwapping}
            >
              {txDigest ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={executeSwap}
              disabled={!fromAmount || !toAmount || isSwapping || isCalculating || !!validateSwap() || !!txDigest}
              className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-gaming font-bold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSwapping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Swapping...
                </>
              ) : txDigest ? (
                '✅ Complete'
              ) : isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Quote...
                </>
              ) : (
                <>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Execute Testnet Swap
                </>
              )}
            </Button>
          </div>

          {/* Validation Error */}
          {validateSwap() && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-sm font-cyber">{validateSwap()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Information */}
        <div className="space-y-3 mt-6">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-green-400 font-cyber">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Live Cetus Testnet • Real pools • Actual testnet liquidity</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground font-cyber">
            <div className="bg-black/20 rounded-lg p-2 text-center">
              <div className="text-primary font-bold">SUI</div>
              <div>{currentBalances.sui.toFixed(4)}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-2 text-center">
              <div className="text-accent font-bold">USDC</div>
              <div>{currentBalances.usdc.toFixed(2)}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-2 text-center">
              <div className="text-accent font-bold">USDT</div>
              <div>{currentBalances.usdt.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Powered by</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://www.cetus.zone', '_blank')}
                className="text-xs p-0 h-auto hover:text-primary"
              >
                Cetus Protocol <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="text-primary font-cyber">
              Network: Sui Testnet
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};