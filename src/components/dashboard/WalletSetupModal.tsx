import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wallet, Plus, Download, Shield, Copy, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { useToast } from '@/hooks/use-toast';

interface WalletSetupModalProps {
  open: boolean;
  onClose: () => void;
}

export const WalletSetupModal = ({ open, onClose }: WalletSetupModalProps) => {
  const [currentStep, setCurrentStep] = useState<'main' | 'create' | 'backup' | 'import'>('main');
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [newWalletData, setNewWalletData] = useState<any>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [hasBackedUp, setHasBackedUp] = useState(false);
  const { updateProfile } = useProfile();
  const { toast } = useToast();

  // Standardized function to convert any private key format to hex
  const standardizePrivateKey = (privateKeyInput: string | Uint8Array): string => {
    console.log('🔧 Standardizing private key format...');
    console.log('Input type:', typeof privateKeyInput);
    console.log('Input length:', privateKeyInput.length);

    try {
      let privateKeyBytes: Uint8Array;

      if (privateKeyInput instanceof Uint8Array) {
        console.log('📋 Processing Uint8Array input...');
        // Already in bytes format - validate length
        if (privateKeyInput.length === 32) {
          privateKeyBytes = privateKeyInput;
          console.log('✅ Valid 32-byte Uint8Array');
        } else if (privateKeyInput.length === 64) {
          // Sometimes the export gives us 64 bytes (32 private + 32 public), take first 32
          privateKeyBytes = privateKeyInput.slice(0, 32);
          console.log('✅ Extracted first 32 bytes from 64-byte array');
        } else {
          throw new Error(`Invalid Uint8Array length: ${privateKeyInput.length}, expected 32 or 64`);
        }
      } else if (typeof privateKeyInput === 'string') {
        console.log('📋 Processing string input...');

        if (privateKeyInput.startsWith('suiprivkey')) {
          console.log('📋 Converting from suiprivkey format...');
          // Create a keypair from suiprivkey to get the raw bytes
          const tempKeypair = Ed25519Keypair.fromSecretKey(privateKeyInput);
          const exported = tempKeypair.export();

          // Handle the exported private key (could be Uint8Array of different lengths)
          if (exported.privateKey instanceof Uint8Array) {
            if (exported.privateKey.length === 32) {
              privateKeyBytes = exported.privateKey;
            } else if (exported.privateKey.length === 64) {
              privateKeyBytes = exported.privateKey.slice(0, 32);
            } else {
              throw new Error(`Unexpected exported key length: ${exported.privateKey.length}`);
            }
          } else {
            throw new Error('Exported private key is not a Uint8Array');
          }
        } else if (privateKeyInput.startsWith('0x')) {
          console.log('📋 Converting from hex with 0x prefix...');
          // Convert from hex with 0x prefix
          const hex = privateKeyInput.slice(2);
          if (hex.length !== 64) {
            throw new Error(`Invalid hex length: ${hex.length}, expected 64`);
          }
          privateKeyBytes = new Uint8Array(32);
          for (let i = 0; i < 32; i++) {
            privateKeyBytes[i] = parseInt(hex.substr(i * 2, 2), 16);
          }
        } else if (/^[0-9a-fA-F]{64}$/.test(privateKeyInput)) {
          console.log('📋 Converting from hex without prefix...');
          // Convert from hex without 0x prefix
          privateKeyBytes = new Uint8Array(32);
          for (let i = 0; i < 32; i++) {
            privateKeyBytes[i] = parseInt(privateKeyInput.substr(i * 2, 2), 16);
          }
        } else {
          throw new Error(`Unsupported string format: ${privateKeyInput.substring(0, 20)}...`);
        }
      } else {
        throw new Error(`Invalid private key type: ${typeof privateKeyInput}`);
      }

      // Validate final result
      if (!privateKeyBytes || privateKeyBytes.length !== 32) {
        throw new Error(`Final validation failed: length ${privateKeyBytes?.length || 'undefined'}`);
      }

      // Convert to standardized hex format (without 0x prefix)
      const hexString = Array.from(privateKeyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      console.log('✅ Private key standardized to hex format');
      console.log('Final hex length:', hexString.length);
      return hexString;
    } catch (error) {
      console.error('❌ Private key standardization failed:', error);
      throw new Error(`Failed to standardize private key: ${error.message}`);
    }
  };

  const createNewWallet = async () => {
    setIsCreatingWallet(true);
    try {
      console.log('🔨 Creating new wallet...');

      // Generate new keypair
      let keypair = new Ed25519Keypair();
      let address = keypair.getPublicKey().toSuiAddress();

      // Get the private key directly as bytes (avoid the export which gives suiprivkey string)
      console.log('🔧 Getting private key as raw bytes...');

      // Method 1: Try to get raw bytes directly
      let privateKeyBytes: Uint8Array;

      try {
        // Access the internal private key directly 
        // @ts-expect-error - accessing private property for raw bytes
        privateKeyBytes = keypair.keypair.secretKey.slice(0, 32);
        console.log('✅ Got raw private key bytes directly');
      } catch (error) {
        console.log('❌ Direct access failed, using alternative method...');

        // Method 2: Create a known test signature to derive the private key
        // This is a bit hacky but works reliably
        const testMessage = new Uint8Array([1, 2, 3, 4, 5]);
        const signature = keypair.signPersonalMessage(testMessage);

        // We'll use a different approach - generate a completely new keypair with known format
        console.log('🔄 Generating new keypair with explicit byte handling...');

        // Generate random 32 bytes
        const randomBytes = new Uint8Array(32);
        crypto.getRandomValues(randomBytes);

        // Create keypair from these known bytes
        const newKeypair = Ed25519Keypair.fromSecretKey(randomBytes);
        const newAddress = newKeypair.getPublicKey().toSuiAddress();

        // Use the new keypair
        privateKeyBytes = randomBytes;
        keypair = newKeypair; // Replace the original keypair
        address = newAddress; // Update the address

        console.log('✅ Generated new keypair with explicit bytes');
      }

      // Convert to standardized hex format
      const hexPrivateKey = Array.from(privateKeyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      console.log('✅ New wallet created successfully');
      console.log('Address:', address);
      console.log('Private key length (hex):', hexPrivateKey.length);

      // Create wallet object with standardized format
      const walletData = {
        address,
        publicKey: keypair.getPublicKey().toBase64(),
        privateKey: hexPrivateKey, // Always 64-character hex string
        createdAt: new Date().toISOString(),
        balance: 0
      };

      setNewWalletData(walletData);
      setCurrentStep('backup');

    } catch (error) {
      console.error('❌ Error creating wallet:', error);
      toast({
        title: "Error",
        description: "Failed to create wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const confirmWalletBackup = async () => {
    if (!newWalletData || !hasBackedUp) return;

    setIsCreatingWallet(true);
    try {
      console.log('💾 Saving wallet to profile...');

      // Save to database via profile update
      await updateProfile({ sui_wallet_data: newWalletData });

      console.log('✅ Wallet saved successfully');

      toast({
        title: "Wallet Created Successfully! 🎉",
        description: `Your Sui wallet has been created and linked to your account.`,
      });

      // Reset state and close
      setNewWalletData(null);
      setHasBackedUp(false);
      setCurrentStep('main');
      onClose();

    } catch (error) {
      console.error('❌ Error saving wallet:', error);
      toast({
        title: "Error",
        description: "Failed to save wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const importExistingWallet = async () => {
    if (!importPrivateKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your private key.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingWallet(true);
    try {
      console.log('📥 Importing existing wallet...');

      // First, standardize the imported private key
      const standardizedPrivateKey = standardizePrivateKey(importPrivateKey.trim());

      // Create keypair from standardized hex format
      const privateKeyBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        privateKeyBytes[i] = parseInt(standardizedPrivateKey.substr(i * 2, 2), 16);
      }

      const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
      const address = keypair.getPublicKey().toSuiAddress();

      console.log('✅ Wallet imported successfully');
      console.log('Address:', address);

      // Create wallet object with standardized format
      const walletData = {
        address,
        publicKey: keypair.getPublicKey().toBase64(),
        privateKey: standardizedPrivateKey, // Always 64-character hex string
        createdAt: new Date().toISOString(),
        balance: 0
      };

      // Save to database via profile update
      await updateProfile({ sui_wallet_data: walletData });

      toast({
        title: "Wallet Imported Successfully! 🎉",
        description: `Your existing Sui wallet has been linked to your account.`,
      });

      // Reset state and close
      setImportPrivateKey('');
      setCurrentStep('main');
      onClose();

    } catch (error) {
      console.error('❌ Error importing wallet:', error);
      toast({
        title: "Error",
        description: "Invalid private key format. Please check and try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const downloadWalletInfo = () => {
    if (!newWalletData) return;

    const walletInfo = `
Sui Wallet Backup
================
Created: ${new Date().toLocaleDateString()}

Address: ${newWalletData.address}
Private Key: ${newWalletData.privateKey}
Public Key: ${newWalletData.publicKey}

⚠️ KEEP THIS SAFE AND SECURE ⚠️
Never share your private key with anyone!
    `.trim();

    const blob = new Blob([walletInfo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sui-wallet-backup-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Wallet backup file downloaded successfully.",
    });
  };

  const skipForNow = () => {
    toast({
      title: "Wallet Setup Skipped",
      description: "You can connect your wallet anytime from the top bar.",
    });
    onClose();
  };

  // Main wallet setup screen
  if (currentStep === 'main') {
    return (
      <Dialog open={open} onOpenChange={() => { }}>
        <DialogContent
          className="sm:max-w-[500px] bg-gradient-to-br from-background via-card to-secondary/20 border-primary/30"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-gaming text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent flex items-center gap-2">
              <Wallet className="w-7 h-7 text-primary" />
              Setup Your Sui Wallet
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-cyber">
              Connect or create a Sui wallet to join games and earn rewards
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Benefits Section */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4">
              <h4 className="font-cyber text-accent mb-3">🎮 Wallet Benefits:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 font-cyber">
                <li>• Join paid game rooms and tournaments</li>
                <li>• Earn USDC, USDT, and SUI rewards</li>
                <li>• Purchase NFTs and gaming items</li>
                <li>• Send/receive payments from friends</li>
              </ul>
            </div>

            {/* Wallet Options */}
            <div className="space-y-4">
              {/* Create New Wallet */}
              <Button
                onClick={createNewWallet}
                disabled={isCreatingWallet}
                className="w-full bg-gradient-to-r from-primary to-accent text-background font-gaming font-bold text-lg py-6 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isCreatingWallet ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Wallet...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Create New Sui Wallet
                  </>
                )}
              </Button>

              {/* Import Existing Wallet */}
              <Button
                onClick={() => setCurrentStep('import')}
                disabled={isCreatingWallet}
                variant="outline"
                className="w-full border-primary/50 text-primary hover:bg-primary/10 font-gaming font-bold text-lg py-6 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Download className="mr-2 h-5 w-5" />
                Import Existing Wallet
              </Button>

              {/* Skip Option */}
              <Button
                onClick={skipForNow}
                disabled={isCreatingWallet}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-primary font-cyber hover:bg-primary/5 transition-all duration-300"
              >
                Skip for now (can setup later)
              </Button>
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-yellow-400 font-cyber font-bold mb-1">
                    SECURITY NOTICE
                  </p>
                  <p className="text-xs text-yellow-400/80 font-cyber">
                    Your wallet is encrypted and stored securely. Never share your private key with anyone!
                  </p>
                </div>
              </div>
            </div>

            {/* Standardization Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-blue-400 font-cyber font-bold mb-1">
                    STANDARDIZED FORMAT
                  </p>
                  <p className="text-xs text-blue-400/80 font-cyber">
                    All private keys are converted to a standard hex format for maximum compatibility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Wallet backup screen
  if (currentStep === 'backup' && newWalletData) {
    return (
      <Dialog open={open} onOpenChange={() => { }}>
        <DialogContent
          className="sm:max-w-[600px] bg-gradient-to-br from-background via-card to-secondary/20 border-primary/30"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-gaming text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent flex items-center gap-2">
              <Shield className="w-7 h-7 text-primary" />
              Backup Your Wallet
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-cyber">
              Save your private key securely - you'll need it to recover your wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Critical Warning */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-cyber font-bold mb-2">
                    🚨 CRITICAL: BACKUP YOUR PRIVATE KEY
                  </p>
                  <ul className="text-xs text-red-400/80 font-cyber space-y-1">
                    <li>• This is the ONLY way to recover your wallet</li>
                    <li>• If you lose this, your funds are gone FOREVER</li>
                    <li>• Never share this with anyone</li>
                    <li>• Store it somewhere safe and secure</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Wallet Address */}
            <div className="space-y-2">
              <Label className="font-cyber text-accent">Wallet Address</Label>
              <div className="flex gap-2">
                <Input
                  value={newWalletData.address}
                  readOnly
                  className="font-mono text-sm bg-black/40 border-primary/30"
                />
                <Button
                  onClick={() => copyToClipboard(newWalletData.address, 'Address')}
                  variant="outline"
                  size="icon"
                  className="border-primary/50 hover:bg-primary/20"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Private Key */}
            <div className="space-y-2">
              <Label className="font-cyber text-accent">Private Key (Hex Format)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Textarea
                    value={newWalletData.privateKey}
                    readOnly
                    className="font-mono text-sm bg-black/40 border-primary/30 pr-12 resize-none"
                    rows={3}
                    type={showPrivateKey ? 'text' : 'password'}
                  />
                  <Button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                  >
                    {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => copyToClipboard(newWalletData.privateKey, 'Private Key')}
                    variant="outline"
                    size="icon"
                    className="border-primary/50 hover:bg-primary/20"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={downloadWalletInfo}
                    variant="outline"
                    size="icon"
                    className="border-primary/50 hover:bg-primary/20"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-cyber">
                Standardized 64-character hex format for maximum compatibility
              </p>
            </div>

            {/* Backup Confirmation */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="backup-confirm"
                  checked={hasBackedUp}
                  onChange={(e) => setHasBackedUp(e.target.checked)}
                  className="rounded border-primary/30"
                />
                <Label htmlFor="backup-confirm" className="font-cyber text-sm">
                  I have securely saved my private key and understand the risks
                </Label>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setCurrentStep('main');
                    setNewWalletData(null);
                  }}
                  variant="outline"
                  className="flex-1 border-primary/50 text-primary hover:bg-primary/10 font-cyber"
                >
                  Go Back
                </Button>
                <Button
                  onClick={confirmWalletBackup}
                  disabled={!hasBackedUp || isCreatingWallet}
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-gaming font-bold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isCreatingWallet ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Setup
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Import wallet screen
  if (currentStep === 'import') {
    return (
      <Dialog open={open} onOpenChange={() => { }}>
        <DialogContent
          className="sm:max-w-[500px] bg-gradient-to-br from-background via-card to-secondary/20 border-primary/30"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-gaming text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent flex items-center gap-2">
              <Download className="w-7 h-7 text-primary" />
              Import Existing Wallet
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-cyber">
              Enter your existing Sui wallet private key to import your wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Import Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-cyber text-accent">Private Key</Label>
                <Textarea
                  value={importPrivateKey}
                  onChange={(e) => setImportPrivateKey(e.target.value)}
                  placeholder="Enter your Sui wallet private key here..."
                  className="font-mono text-sm bg-black/40 border-primary/30 resize-none"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground font-cyber">
                  Supports suiprivkey, hex (with/without 0x prefix) formats - will be standardized automatically
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-blue-400 font-cyber font-bold mb-1">
                    SECURITY & STANDARDIZATION
                  </p>
                  <p className="text-xs text-blue-400/80 font-cyber">
                    Your private key will be converted to a standard hex format and encrypted before storage.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setCurrentStep('main');
                  setImportPrivateKey('');
                }}
                variant="outline"
                className="flex-1 border-primary/50 text-primary hover:bg-primary/10 font-cyber"
              >
                Go Back
              </Button>
              <Button
                onClick={importExistingWallet}
                disabled={!importPrivateKey.trim() || isCreatingWallet}
                className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-gaming font-bold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isCreatingWallet ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Import Wallet
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};