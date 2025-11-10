/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Users, Lock, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCommunityChatContext } from '@/contexts/CommunityChatContext';
import { createClient } from '@supabase/supabase-js';
import { GAMING_AVATARS } from '@/integrations/supabase/types';

interface CreateChatRoomModalProps {
  open: boolean;
  onClose: () => void;
  supabase: ReturnType<typeof createClient>;
}

interface Game {
  id: string;
  name: string;
  image_url: string | null;
  is_active: boolean;
}

export const CreateChatRoomModal = ({ open, onClose, supabase }: CreateChatRoomModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(GAMING_AVATARS[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [processing, setProcessing] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const { createChatRoom } = useCommunityChatContext();
  const { toast } = useToast();

  // Load available games
  useEffect(() => {
    const loadGames = async () => {
      setLoadingGames(true);
      try {
        const { data, error } = await supabase
          .from('games')
          .select('id, name, image_url, is_active')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setGames(data as Game[] || []);
      } catch (error) {
        console.error('Error loading games:', error);
      } finally {
        setLoadingGames(false);
      }
    };

    if (open) {
      loadGames();
    }
  }, [open, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a room name",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      await createChatRoom({
        name: name.trim(),
        description: description.trim() || undefined,
        avatar_emoji: selectedAvatar.emoji,
        avatar_color: selectedAvatar.color,
        is_private: isPrivate,
        game_id: selectedGame?.id,
      });

      // Reset form
      setName('');
      setDescription('');
      setSelectedAvatar(GAMING_AVATARS[0]);
      setIsPrivate(false);
      setSelectedGame(null);
      onClose();
    } catch (error: any) {
      console.error('Error creating chat room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create chat room",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      setName('');
      setDescription('');
      setSelectedAvatar(GAMING_AVATARS[0]);
      setIsPrivate(false);
      setSelectedGame(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-background via-card to-secondary/20 border-primary/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-gaming text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            🎮 Create Gaming Room
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-cyber">
            Set up your own gaming community chat room
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-cyber text-primary">
              Room Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter room name (e.g., Cyber Warriors HQ)"
              className="font-cyber bg-black/40 border-primary/30 focus:border-primary"
              disabled={processing}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/50 characters
            </p>
          </div>

          {/* Room Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-cyber text-primary">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your room is about..."
              className="font-cyber bg-black/40 border-primary/30 focus:border-primary min-h-[80px]"
              disabled={processing}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/200 characters
            </p>
          </div>

          {/* Avatar Selection */}
          <div className="space-y-3">
            <Label className="font-cyber text-primary">Room Avatar</Label>
            <div className="grid grid-cols-5 gap-3">
              {GAMING_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar as typeof selectedAvatar)}
                  disabled={processing}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 ${selectedAvatar.id === avatar.id
                      ? 'border-primary bg-primary/20 scale-105'
                      : 'border-secondary/30 bg-black/40 hover:border-primary/50 hover:scale-105'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{avatar.emoji}</div>
                    <div className="text-xs font-cyber text-muted-foreground">
                      {avatar.name.split(' ')[0]}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 p-3 bg-black/40 rounded-lg border border-primary/20">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${selectedAvatar.color} flex items-center justify-center text-lg`}>
                {selectedAvatar.emoji}
              </div>
              <div>
                <p className="font-cyber text-sm text-primary">{selectedAvatar.name}</p>
                <p className="text-xs text-muted-foreground">Selected avatar theme</p>
              </div>
            </div>
          </div>

          {/* Game Selection */}
          <div className="space-y-3">
            <Label className="font-cyber text-primary">Associated Game (Optional)</Label>
            {loadingGames ? (
              <div className="flex items-center justify-center p-4 bg-black/40 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="font-cyber text-sm">Loading games...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedGame(null)}
                  disabled={processing}
                  className={`w-full p-3 rounded-lg border transition-all duration-300 ${!selectedGame
                      ? 'border-primary bg-primary/20'
                      : 'border-secondary/30 bg-black/40 hover:border-primary/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                      🎮
                    </div>
                    <div className="text-left">
                      <p className="font-cyber text-sm">No specific game</p>
                      <p className="text-xs text-muted-foreground">General gaming room</p>
                    </div>
                  </div>
                </button>

                <div className="max-h-40 overflow-y-auto space-y-2">
                  {games.map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => setSelectedGame(game)}
                      disabled={processing}
                      className={`w-full p-3 rounded-lg border transition-all duration-300 ${selectedGame?.id === game.id
                          ? 'border-primary bg-primary/20'
                          : 'border-secondary/30 bg-black/40 hover:border-primary/50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          {game.image_url ? (
                            <img
                              src={game.image_url}
                              alt={game.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            '🎯'
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-cyber text-sm">{game.name}</p>
                          <p className="text-xs text-muted-foreground">Game-specific room</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3">
            <Label className="font-cyber text-primary">Room Privacy</Label>
            <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                {isPrivate ? (
                  <Lock className="w-5 h-5 text-red-400" />
                ) : (
                  <Globe className="w-5 h-5 text-green-400" />
                )}
                <div>
                  <p className="font-cyber text-sm">
                    {isPrivate ? 'Private Room' : 'Public Room'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPrivate
                      ? 'Only invited members can join'
                      : 'Anyone can discover and join'
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
                disabled={processing}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={processing}
              className="flex-1 font-cyber"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || processing}
              className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Create Room
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};