import Banner from "@/components/Banner";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/lib/supabase";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Check, X } from "lucide-react";

const SettingsPage = () => {
  const { profile, setUsername, checkUsernameAvailability } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || "");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUsernameEdit = async () => {
    if (!newUsername.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (newUsername === profile?.username) {
      setIsEditingUsername(false);
      return;
    }

    setUsernameLoading(true);
    try {
      const available = await checkUsernameAvailability(newUsername);
      if (!available) {
        toast({
          title: "Failed",
          description: "Username is already in use",
        });
        return;
      }
      await setUsername(newUsername);
      setIsEditingUsername(false);
      toast({
        title: "Success",
        description: "Username updated successfully",
      });
    } catch (error) {
      console.error("Error updating username:", error);
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No user found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(true);
    try {
      // Call the actual account deletion function
      await profileService.deleteAccount(user.id);

      toast({
        title: "Account Deleted",
        description:
          "Your account has been permanently deleted. You will be redirected to the home page.",
      });

      setDeleteModalOpen(false);

      // Redirect to home page after successful deletion
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description:
          "Failed to delete account. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <Banner pathname="settings" />

      {/* Profile Settings */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl p-6">
        <h2 className="font-cyber text-xl font-bold text-primary mb-6">
          👤 Profile Settings
        </h2>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-cyber text-muted-foreground mb-2">
              Username
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                disabled={!isEditingUsername}
                className="flex-1"
                placeholder="Enter username"
              />
              {isEditingUsername ? (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={handleUsernameEdit}
                    disabled={usernameLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {usernameLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setNewUsername(profile?.username || "");
                      setIsEditingUsername(false);
                    }}
                    disabled={usernameLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsEditingUsername(true)}
                  className="bg-primary hover:bg-primary/80"
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Preferences */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl p-6">
        <h2 className="font-cyber text-xl font-bold text-primary mb-6">
          🎮 Game Preferences
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-cyber text-foreground">
                Push Notifications
                <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>
              <div className="text-sm text-muted-foreground font-cyber">
                Get notified about game events
              </div>
            </div>
            <button
              className="bg-gray-600 border-2 border-gray-600 rounded-full w-12 h-6 relative transition-all duration-300 cursor-not-allowed opacity-50"
              disabled
            >
              <div className="bg-background w-4 h-4 rounded-full absolute top-0.5 left-0.5 transition-all duration-300"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl p-6">
        <h2 className="font-cyber text-xl font-bold text-primary mb-6">
          🔒 Security
        </h2>
        <div className="space-y-4">
          <button
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-background font-cyber font-bold py-3 px-6 rounded-xl cursor-not-allowed opacity-50"
            disabled
          >
            🛡️ Enable 2FA
            <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
              Coming Soon
            </span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
        <h2 className="font-cyber text-xl font-bold text-red-400 mb-6">
          ⚠️ Danger Zone
        </h2>
        <div className="space-y-4">
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-cyber font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300"
          >
            🗑️ Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-background border-red-500/30">
          <DialogHeader>
            <DialogTitle className="font-cyber text-red-400">
              ⚠️ Delete Account
            </DialogTitle>
            <DialogDescription className="font-cyber text-muted-foreground">
              Are you absolutely sure you want to delete your account? This
              action cannot be undone.
              <br />
              <br />
              <strong className="text-foreground">
                This will permanently delete:
              </strong>
              <ul className="mt-2 list-disc list-inside text-sm">
                <li>Your profile and all personal data</li>
                <li>Your game history and statistics</li>
                <li>Your wallet data and transactions</li>
                <li>Your chat history and messages</li>
              </ul>
              <br />
              <strong className="text-yellow-400">⚠️ Game Room Impact:</strong>
              <ul className="mt-1 list-disc list-inside text-sm text-yellow-300">
                <li>You will be removed from all rooms you joined</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteLoading}
              className="font-cyber"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="font-cyber bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
