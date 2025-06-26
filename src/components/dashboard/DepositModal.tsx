import { useState } from 'react';
import { useTransaction } from '@/contexts/TransactionContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Coins, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
}

type DepositMethod = 'select' | 'NGN' | 'USDC' | 'USDT';

export const DepositModal = ({ open, onClose }: DepositModalProps) => {
  const [method, setMethod] = useState<DepositMethod>('select');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const { initiateNGNDeposit } = useTransaction();
  const { toast } = useToast();

  const handleMethodSelect = (selectedMethod: DepositMethod) => {
    setMethod(selectedMethod);
    setAmount('');
  };

  const handleBack = () => {
    setMethod('select');
    setAmount('');
  };

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (method === 'NGN') {
      // Minimum NGN deposit
      if (numAmount < 1000) {
        toast({
          title: "Minimum Deposit",
          description: "Minimum deposit amount is ₦1,000",
          variant: "destructive",
        });
        return;
      }

      setProcessing(true);
      try {
        const paymentLink = await initiateNGNDeposit(numAmount);
        
        // Open payment in new window
        const paymentWindow = window.open(
          paymentLink,
          'FlutterwavePayment',
          'width=800,height=600,top=100,left=100,scrollbars=yes,resizable=yes'
        );

        // Check if window was blocked
        if (!paymentWindow) {
          toast({
            title: "Popup Blocked",
            description: "Please allow popups for this site to complete payment",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }

        // Poll to check if window is closed
        const pollTimer = setInterval(() => {
          if (paymentWindow.closed) {
            clearInterval(pollTimer);
            setProcessing(false);
            onClose();
            
            // Refresh wallet and transactions after a delay
            setTimeout(async () => {
              toast({
                title: "Payment Complete",
                description: "Checking payment status...",
              });
              
              // Refresh data
              window.location.reload();
            }, 1000);
          }
        }, 1000);

      } catch (error) {
        // Error is handled in the context
        setProcessing(false);
      }
    } else {
      // Handle crypto deposits (USDC/USDT) - implement later
      toast({
        title: "Coming Soon",
        description: `${method} deposits will be available soon`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => !processing && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-background via-card to-secondary/20 border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-gaming text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            {method === 'select' ? '💰 Select Deposit Method' : `💸 Deposit ${method}`}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-cyber">
            {method === 'select' 
              ? 'Choose your preferred deposit method'
              : `Enter the amount to deposit in ${method}`
            }
          </DialogDescription>
        </DialogHeader>

        {method === 'select' ? (
          <div className="space-y-3 mt-4">
            <button
              onClick={() => handleMethodSelect('NGN')}
              className="w-full p-4 bg-black/40 border border-green-500/30 rounded-xl hover:border-green-500/60 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-2xl">
                    🇳🇬
                  </div>
                  <div className="text-left">
                    <p className="font-cyber text-lg text-green-400">Nigerian Naira (NGN)</p>
                    <p className="text-xs text-muted-foreground">Deposit via Flutterwave</p>
                  </div>
                </div>
                <DollarSign className="w-5 h-5 text-green-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => handleMethodSelect('USDC')}
              className="w-full p-4 bg-black/40 border border-blue-500/30 rounded-xl hover:border-blue-500/60 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-2xl">
                    💎
                  </div>
                  <div className="text-left">
                    <p className="font-cyber text-lg text-blue-400">USD Coin (USDC)</p>
                    <p className="text-xs text-muted-foreground">Deposit crypto directly</p>
                  </div>
                </div>
                <Coins className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => handleMethodSelect('USDT')}
              className="w-full p-4 bg-black/40 border border-accent/30 rounded-xl hover:border-accent/60 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-2xl">
                    🟢
                  </div>
                  <div className="text-left">
                    <p className="font-cyber text-lg text-accent">Tether (USDT)</p>
                    <p className="text-xs text-muted-foreground">Deposit stablecoin</p>
                  </div>
                </div>
                <Coins className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleDeposit(); }} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="font-cyber text-primary">
                Amount {method === 'NGN' ? '(₦)' : `(${method})`}
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={method === 'NGN' ? 'Enter amount (min ₦1,000)' : `Enter ${method} amount`}
                  className="font-cyber bg-black/40 border-primary/30 focus:border-primary text-lg pl-12"
                  disabled={processing}
                  autoFocus
                  step={method === 'NGN' ? '100' : '0.01'}
                  min={method === 'NGN' ? '1000' : '1'}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl">
                  {method === 'NGN' ? '₦' : method === 'USDC' ? '💎' : '🟢'}
                </div>
              </div>
              {method === 'NGN' && (
                <p className="text-xs text-muted-foreground">
                  Minimum deposit: ₦1,000 • Fee: 1.4%
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={processing}
                className="flex-1 font-cyber"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={!amount || processing}
                className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Deposit
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};