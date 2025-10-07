import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotification";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, Smartphone, Save, RotateCcw } from "lucide-react";

const NotificationSettings: React.FC = () => {
  const { preferences, updatePreferences } = useNotifications();
  const { toast } = useToast();
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handlePreferenceChange = (
    category: "email" | "in_app",
    key: string,
    value: boolean
  ) => {
    if (!localPreferences) return;

    const newPreferences = {
      ...localPreferences,
      [category]: {
        ...localPreferences[category],
        [key]: value,
      },
    };

    setLocalPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localPreferences) return;

    try {
      await updatePreferences(localPreferences);
      setHasChanges(false);
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification preferences.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };

  if (!localPreferences) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const notificationCategories = [
    {
      title: "Friend Events",
      icon: "👥",
      items: [
        {
          key: "friend_request",
          label: "Friend Requests",
          description: "When someone sends you a friend request",
        },
        {
          key: "friend_request_accepted",
          label: "Friend Request Accepted",
          description: "When someone accepts your friend request",
        },
        {
          key: "friend_request_declined",
          label: "Friend Request Declined",
          description: "When someone declines your friend request",
        },
      ],
    },
    {
      title: "Room Events",
      icon: "🎮",
      items: [
        {
          key: "room_created",
          label: "Room Created",
          description: "When someone creates a new room",
        },
        {
          key: "player_joined",
          label: "Player Joined",
          description: "When someone joins a room you're in",
        },
        {
          key: "player_left",
          label: "Player Left",
          description: "When someone leaves a room you're in",
        },
        {
          key: "room_start",
          label: "Room Started",
          description: "When a room you're in starts",
        },
        {
          key: "room_completed",
          label: "Room Completed",
          description: "When a room you're in is completed",
        },
        {
          key: "room_cancelled",
          label: "Room Cancelled",
          description: "When a room you're in is cancelled",
        },
        {
          key: "room_reminder",
          label: "Room Reminders",
          description: "Reminders before a room starts",
        },
      ],
    },
    {
      title: "Game Events",
      icon: "🏆",
      items: [
        {
          key: "game_won",
          label: "Game Won",
          description: "When you win a game",
        },
        {
          key: "highscore_beaten",
          label: "Highscore Beaten",
          description: "When someone beats your highscore",
        },
        {
          key: "prize_distributed",
          label: "Prize Distributed",
          description: "When you receive a prize",
        },
      ],
    },
    {
      title: "Tournament Events",
      icon: "🏅",
      items: [
        {
          key: "tournament_advance",
          label: "Tournament Advance",
          description: "When you advance in a tournament",
        },
        {
          key: "tournament_elimination",
          label: "Tournament Elimination",
          description: "When you're eliminated from a tournament",
        },
      ],
    },
    {
      title: "System Events",
      icon: "⚙️",
      items: [
        {
          key: "payment",
          label: "Payment Updates",
          description: "Payment and transaction notifications",
        },
        {
          key: "achievement",
          label: "Achievements",
          description: "When you unlock new achievements",
        },
        {
          key: "wallet_connect",
          label: "Wallet Events",
          description: "Wallet connection and security updates",
        },
        {
          key: "game_invite",
          label: "Game Invitations",
          description: "When someone invites you to play",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationCategories.map((category, categoryIndex) => (
            <div key={category.title}>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">{category.icon}</span>
                <h3 className="text-lg font-semibold">{category.title}</h3>
              </div>

              <div className="space-y-4">
                {category.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card/50"
                  >
                    <div className="flex-1">
                      <Label className="text-sm font-medium">
                        {item.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* In-App Notification */}
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          checked={localPreferences.in_app[item.key] || false}
                          onCheckedChange={(checked) =>
                            handlePreferenceChange("in_app", item.key, checked)
                          }
                        />
                      </div>

                      {/* Email Notification */}
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          checked={localPreferences.email[item.key] || false}
                          onCheckedChange={(checked) =>
                            handlePreferenceChange("email", item.key, checked)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {categoryIndex < notificationCategories.length - 1 && (
                <Separator className="my-6" />
              )}
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
