import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useTransaction } from '@/contexts/TransactionContext';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshWallets } = useWallet();
  const { refreshTransactions } = useTransaction();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'pending'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentStatus = searchParams.get('status');
      const txRef = searchParams.get('tx_ref');
      const transactionId = searchParams.get('transaction_id');

      // Check if we're in a popup window
      const isPopup = window.opener !== null;

      if (!txRef || !transactionId) {
        setStatus('failed');
        setMessage('Invalid payment reference');
        return;
      }

      if (paymentStatus === 'successful') {
        try {
          // Wait a bit for webhook to process
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Check transaction status directly from database
          const { data: transaction, error: dbError } = await supabase
            .from('transactions')
            .select('*')
            .eq('transaction_hash', txRef)
            .single();

          if (dbError) throw dbError;

          if (transaction.status === 'completed') {
            // Transaction already processed by webhook - don't call verification
            setStatus('success');
            setMessage('Payment successful! Your wallet has been credited.');
            
            // If in popup, close after showing success
            if (isPopup) {
              setTimeout(() => {
                window.close();
              }, 3000);
            }
          } else if (transaction.status === 'pending') {
            // Only call verification if still pending (webhook hasn't processed yet)
            const { data, error } = await supabase.functions.invoke('verify-payment-handler', {
              body: {
                transaction_id: transactionId,
                tx_ref: txRef,
              },
            });

            if (error) throw error;

            if (data.success) {
              if (data.message === 'Transaction already processed') {
                // Webhook processed it between our checks
                setStatus('success');
                setMessage('Payment successful! Your wallet has been credited.');
                
                if (isPopup) {
                  setTimeout(() => {
                    window.close();
                  }, 3000);
                }
              } else if (data.status === 'completed') {
                // Manual verification succeeded
                setStatus('success');
                setMessage('Payment successful! Your wallet has been credited.');
                
                if (isPopup) {
                  setTimeout(() => {
                    window.close();
                  }, 3000);
                }
              } else {
                setStatus('pending');
                setMessage('Payment is being processed. Please check back in a few moments.');
              }
            } else {
              setStatus('failed');
              setMessage('Payment verification failed. Please contact support if money was debited.');
            }
          } else if (transaction.status === 'failed') {
            setStatus('failed');
            setMessage('Payment failed. Please try again.');
          } else {
            // Handle any other status
            setStatus('pending');
            setMessage('Payment is being processed. Please check back in a few moments.');
          }

          // Refresh data only after processing
          await refreshWallets();
          await refreshTransactions();
        } catch (error) {
          console.error('Verification error:', error);
          setStatus('failed');
          setMessage('An error occurred while verifying your payment. Please contact support if money was debited.');
        }
      } else if (paymentStatus === 'cancelled') {
        setStatus('failed');
        setMessage('Payment was cancelled');
        
        if (isPopup) {
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      } else {
        setStatus('pending');
        setMessage('Payment is still being processed. Please check back later.');
      }
    };

    verifyPayment();
  }, [searchParams, refreshWallets, refreshTransactions]);

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <Loader2 className="w-16 h-16 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'pending':
        return <AlertCircle className="w-16 h-16 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'verifying':
        return 'from-primary/20 to-accent/20 border-primary/30';
      case 'success':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'failed':
        return 'from-red-500/20 to-red-600/20 border-red-500/30';
      case 'pending':
        return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    }
  };

  const isPopup = window.opener !== null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className={`max-w-md w-full bg-gradient-to-br ${getStatusColor()} border rounded-2xl p-8 text-center`}>
        <div className="mb-6">{getStatusIcon()}</div>
        
        <h1 className="font-gaming text-3xl font-bold text-primary mb-4">
          {status === 'verifying' && 'Verifying Payment...'}
          {status === 'success' && 'Payment Successful!'}
          {status === 'failed' && 'Payment Failed'}
          {status === 'pending' && 'Payment Pending'}
        </h1>
        
        <p className="text-muted-foreground mb-8 font-cyber">{message}</p>
        
        {status === 'success' && isPopup && (
          <p className="text-sm text-muted-foreground mb-4 font-cyber">
            This window will close automatically...
          </p>
        )}
        
        <div className="space-y-3">
          {status !== 'verifying' && (
            <>
              {!isPopup && (
                <>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold"
                  >
                    Go to Dashboard
                  </Button>
                  {status === 'success' && (
                    <Button
                      onClick={() => navigate('/dashboard', { state: { activeSection: 'wallet' } })}
                      variant="outline"
                      className="w-full font-cyber"
                    >
                      View Wallet
                    </Button>
                  )}
                </>
              )}
              {isPopup && (
                <Button
                  onClick={() => window.close()}
                  className="w-full bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold"
                >
                  Close Window
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;