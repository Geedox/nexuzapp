import { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
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
import { Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Pre-defined crypto gaming avatars
const GAMING_AVATARS = [
  { id: 1, name: 'Cyber Warrior', emoji: '🤖', color: 'from-purple-500 to-pink-500' },
  { id: 2, name: 'Space Pilot', emoji: '🚀', color: 'from-blue-500 to-cyan-500' },
  { id: 3, name: 'Dragon Master', emoji: '🐉', color: 'from-red-500 to-orange-500' },
  { id: 4, name: 'Neon Ninja', emoji: '🥷', color: 'from-green-500 to-emerald-500' },
  { id: 5, name: 'Crypto King', emoji: '👑', color: 'from-yellow-500 to-amber-500' },
  { id: 6, name: 'Alien Hunter', emoji: '👽', color: 'from-indigo-500 to-purple-500' },
  { id: 7, name: 'Mech Pilot', emoji: '🎮', color: 'from-gray-600 to-gray-800' },
  { id: 8, name: 'Phoenix Rider', emoji: '🔥', color: 'from-orange-500 to-red-500' },
  { id: 9, name: 'Ice Mage', emoji: '❄️', color: 'from-cyan-500 to-blue-500' },
  { id: 10, name: 'Thunder God', emoji: '⚡', color: 'from-yellow-400 to-orange-500' },
];

interface UsernameModalProps {
  open: boolean;
  onClose?: () => void;
}

export const UsernameModal = ({ open, onClose }: UsernameModalProps) => {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<typeof GAMING_AVATARS[0] | null>(null);
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const { checkUsernameAvailability, updateProfile } = useProfile();
  const { toast } = useToast();

  // Debounced username check
  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const available = await checkUsernameAvailability(username);
        setIsAvailable(available);
      } catch (error) {
        setIsAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || username.length < 3 || !isAvailable || !selectedAvatar) {
      if (!selectedAvatar) {
        toast({
          title: "Select an Avatar",
          description: "Please choose your gaming avatar",
          variant: "destructive",
        });
      }
      return;
    }

    setSaving(true);
    try {
      // Create avatar URL (in a real app, you might upload to storage)
      const avatarUrl = `avatar_${selectedAvatar.id}_${selectedAvatar.emoji}`;
      
      await updateProfile({ 
        username,
        avatar_url: avatarUrl,
        display_name: username
      });
      
      onClose?.();
    } catch (error) {
      // Error is handled in the context
    } finally {
      setSaving(false);
    }
  };

  const getValidationMessage = () => {
    if (checking) {
      return (
        <div className="flex items-center text-muted-foreground text-sm mt-1">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Checking availability...
        </div>
      );
    }

    if (username.length > 0 && username.length < 3) {
      return (
        <p className="text-sm text-muted-foreground mt-1">
          Username must be at least 3 characters long
        </p>
      );
    }

    if (isAvailable === true) {
      return (
        <div className="flex items-center text-green-400 text-sm mt-1 font-cyber">
          <CheckCircle className="w-3 h-3 mr-1" />
          Username is available!
        </div>
      );
    }

    if (isAvailable === false) {
      return (
        <div className="flex items-center text-red-400 text-sm mt-1 font-cyber">
          <XCircle className="w-3 h-3 mr-1" />
          Username is already taken
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[600px] bg-gradient-to-br from-background via-card to-secondary/20 border-primary/30" 
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-gaming text-3xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            Create Your Identity
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-cyber">
            Choose your unique username and gaming avatar to enter the arena
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Username Input */}
          <div className="space-y-2">
            <Label htmlFor="username" className="font-cyber text-accent">
              Gaming Username
            </Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="enter_your_username"
                className="font-cyber bg-black/40 border-primary/30 focus:border-primary text-lg pl-4 pr-10"
                disabled={saving}
                autoFocus
                maxLength={20}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                {!checking && isAvailable === true && <CheckCircle className="w-4 h-4 text-green-400" />}
                {!checking && isAvailable === false && <XCircle className="w-4 h-4 text-red-400" />}
              </div>
            </div>
            {getValidationMessage()}
          </div>

          {/* Avatar Selection */}
          <div className="space-y-3">
            <Label className="font-cyber text-accent">
              Choose Your Avatar
            </Label>
            <div className="grid grid-cols-5 gap-3">
              {GAMING_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`
                    relative group transition-all duration-300 transform hover:scale-110
                    ${selectedAvatar?.id === avatar.id ? 'scale-110' : ''}
                  `}
                  disabled={saving}
                >
                  <div className={`
                    w-full aspect-square rounded-xl bg-gradient-to-br ${avatar.color} 
                    flex items-center justify-center text-4xl
                    border-2 transition-all duration-300
                    ${selectedAvatar?.id === avatar.id 
                      ? 'border-primary shadow-lg shadow-primary/50' 
                      : 'border-transparent hover:border-primary/50'
                    }
                  `}>
                    <span className="drop-shadow-lg">{avatar.emoji}</span>
                  </div>
                  {selectedAvatar?.id === avatar.id && (
                    <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                      <CheckCircle className="w-4 h-4 text-background" />
                    </div>
                  )}
                  <p className="text-xs text-center mt-1 font-cyber text-muted-foreground group-hover:text-primary transition-colors">
                    {avatar.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Section */}
          {username && selectedAvatar && (
            <div className="bg-black/40 border border-primary/30 rounded-lg p-4">
              <p className="text-xs font-cyber text-muted-foreground mb-2">PREVIEW</p>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${selectedAvatar.color} flex items-center justify-center text-2xl`}>
                  {selectedAvatar.emoji}
                </div>
                <div>
                  <p className="font-gaming text-lg text-primary">{username}</p>
                  <p className="text-xs font-cyber text-muted-foreground">{selectedAvatar.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!username || username.length < 3 || !isAvailable || !selectedAvatar || saving}
            className="w-full bg-gradient-to-r from-primary to-accent text-background font-gaming font-bold text-lg py-6 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Enter The Arena
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};