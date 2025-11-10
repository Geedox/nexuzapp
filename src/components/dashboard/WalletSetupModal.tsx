import { useEffect, useMemo, useState } from "react";
import { useProfile } from "@/hooks/profile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Wallet,
  Shield,
  CheckCircle,
  Copy,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConnectButton, useActiveAccount, useLogout } from "panna-sdk/react";
import { CHAIN_ID, ecosystemPartnerId, NETWORK } from "@/constants";
import { formatDistanceToNow } from "date-fns";
import { Account } from "panna-sdk/core";

interface WalletSetupModalProps {
  open: boolean;
  onClose: () => void;
}

const getExplorerUrl = (address: string) =>
  `https://blockscout.lisk.com/address/${address}`;

const createWalletPayload = (
  account: Account,
  existingCreatedAt?: string | null
) => ({
  address: account.getAccount().address,
  chainId: account.getChain().id,
  provider: "panna" as const,
  partnerId: ecosystemPartnerId ?? null,
  createdAt: existingCreatedAt ?? new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const WalletSetupModal = ({ open, onClose }: WalletSetupModalProps) => {
  const { profile, updateProfile } = useProfile();
  const account = useActiveAccount();
  const { disconnect } = useLogout();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [hasLinked, setHasLinked] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const existingWallet = profile?.sui_wallet_data;

  useEffect(() => {
    if (!open) {
      setIsSaving(false);
      setHasLinked(false);
    }
  }, [open]);

  const isAlreadyLinked = useMemo(() => {
    if (!existingWallet?.address || !account?.address) return false;
    return (
      existingWallet.address.toLowerCase() === account.address.toLowerCase()
    );
  }, [existingWallet?.address, account?.address]);

  const handleSaveWallet = async () => {
    if (!account?.address) {
      toast({
        title: "Wallet not connected",
        description: "Connect a wallet first to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        sui_wallet_data: createWalletPayload(
          account.getAccount(),
          existingWallet?.createdAt
        ),
      });
      setHasLinked(true);
      toast({
        title: "Wallet linked! 🎉",
        description: "Your Panna wallet is now connected to your account.",
      });
      onClose();
    } catch (error) {
      console.error("Failed to save wallet", error);
      toast({
        title: "Failed to link wallet",
        description:
          "We couldn't link your wallet right now. Please try again shortly.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await disconnect(account);
      toast({
        title: "Wallet disconnected",
        description: "You can reconnect your wallet anytime.",
      });
    } catch (error) {
      console.error("Failed to disconnect wallet", error);
      toast({
        title: "Disconnect failed",
        description: "We couldn't disconnect your wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const linkedAtLabel = existingWallet?.createdAt
    ? formatDistanceToNow(new Date(existingWallet.createdAt), {
        addSuffix: true,
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (!isOpen ? onClose() : null)}>
      <DialogContent className="sm:max-w-[520px] bg-gradient-to-br from-background via-card to-secondary/20 border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-gaming text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary" />
            Connect Your Lisk Wallet
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-cyber">
            Link a Panna wallet to join tournaments, receive prizes, and manage
            on-chain assets on Lisk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4">
            <h4 className="font-cyber text-accent mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Powered by Panna Wallet
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2 font-cyber">
              <li>• Non-custodial wallet secured by Panna</li>
              <li>• Supports LSK, ETH, USDC, and USDT on Lisk</li>
              <li>• Seamless integration with Nexuz tournaments</li>
              <li>• No private key management required</li>
            </ul>
          </div>

          <div className="space-y-4">
            {!account ? (
              <div className="bg-black/40 border border-primary/30 rounded-lg p-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground font-cyber">
                  Connect your wallet using your preferred login method (email,
                  phone, or social) to continue.
                </p>
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              </div>
            ) : (
              <div className="bg-black/40 border border-primary/30 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-cyber">
                      CONNECTED ADDRESS
                    </p>
                    <p className="font-mono text-sm text-foreground">
                      {account.address}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-primary/40 hover:bg-primary/20"
                      onClick={() =>
                        handleCopy(account.address, "Wallet address")
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-primary/40 hover:bg-primary/20"
                      onClick={() =>
                        window.open(getExplorerUrl(account.address), "_blank")
                      }
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm font-cyber text-muted-foreground">
                  <span>
                    Chain ID: {account.chainId ?? CHAIN_ID} • Network:{" "}
                    {NETWORK.id}
                  </span>
                  {account.connectorName && (
                    <Badge variant="outline" className="border-primary/40">
                      {account.connectorName}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleDisconnect}
                    variant="ghost"
                    className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                    disabled={isDisconnecting || isSaving}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                  </Button>
                  <div className="flex-1" />
                  <Button
                    onClick={handleSaveWallet}
                    disabled={isSaving || isAlreadyLinked}
                    className="bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold hover:scale-105 transition-all duration-300 disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Linking...
                      </>
                    ) : isAlreadyLinked ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Wallet Linked
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Link Wallet
                      </>
                    )}
                  </Button>
                </div>

                {isAlreadyLinked && (
                  <p className="text-xs text-green-400 font-cyber">
                    This wallet is already linked to your Nexuz account.
                  </p>
                )}
              </div>
            )}
          </div>

          {existingWallet?.address && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-400 font-cyber font-bold">
                <CheckCircle className="w-4 h-4" />
                Currently linked wallet
              </div>
              <div className="text-sm text-green-200 font-mono break-all">
                {existingWallet.address}
              </div>
              <div className="text-xs text-green-300 font-cyber">
                Linked {linkedAtLabel ?? "recently"} via Panna wallet.
              </div>
            </div>
          )}

          {hasLinked && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm text-primary font-cyber">
              Wallet linked successfully. You can now manage funds directly in
              the dashboard.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
