import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Loader2, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { avatarService } from "@/lib/supabase";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarChange: (avatarUrl: string) => void;
  userId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const AvatarUpload = ({
  currentAvatarUrl,
  onAvatarChange,
  userId,
  size = "md",
  className = "",
}: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    // Upload the file
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    if (!userId || userId === "temp") {
      toast({
        title: "Error",
        description:
          "Please wait for authentication to complete before uploading.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const avatarUrl = await avatarService.updateProfileAvatar(userId, file);
      onAvatarChange(avatarUrl);
      setPreviewUrl(null);

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!userId || userId === "temp") {
      toast({
        title: "Error",
        description:
          "Please wait for authentication to complete before removing avatar.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      await avatarService.deleteAvatar(userId);
      onAvatarChange("");

      toast({
        title: "Success",
        description: "Avatar removed successfully",
      });
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast({
        title: "Error",
        description: "Failed to remove avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-2 border-primary/30`}>
          <AvatarImage
            src={displayUrl || undefined}
            alt="Profile Avatar"
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-gaming text-lg">
            {userId.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-full w-8 h-8 p-0"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="font-cyber"
        >
          <Upload className="w-4 h-4 mr-2" />
          {currentAvatarUrl ? "Change" : "Upload"}
        </Button>

        {currentAvatarUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveAvatar}
            disabled={uploading}
            className="font-cyber text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground text-center max-w-48">
        Upload a JPG, PNG, or GIF file. Max size 2MB.
      </p>
    </div>
  );
};
