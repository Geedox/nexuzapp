import React, { useState, useEffect } from "react";
import { TournamentMatch } from "@/types/tournament";
import { tournamentService } from "@/services/tournamentService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/auth";
import { supabase } from "@/integrations/supabase/client";

interface AdminScoreSubmissionDialogProps {
  match: TournamentMatch;
  isOpen: boolean;
  onClose: () => void;
  onScoresSubmitted: () => void;
}

interface ParticipantScore {
  userId: string;
  username: string;
  score: number;
}

export const AdminScoreSubmissionDialog: React.FC<
  AdminScoreSubmissionDialogProps
> = ({ match, isOpen, onClose, onScoresSubmitted }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [participants, setParticipants] = useState<ParticipantScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get participant details
  useEffect(() => {
    if (isOpen && match) {
      loadParticipantDetails();
    }
  }, [isOpen, match]);

  const loadParticipantDetails = async () => {
    try {
      setLoading(true);

      // Get participant IDs from match
      const participantIds = [
        match.player1_id,
        match.player2_id,
        match.player3_id,
        match.player4_id,
      ].filter(Boolean) as string[];

      if (participantIds.length === 0) {
        toast({
          title: "Error",
          description: "No participants found for this match",
          variant: "destructive",
        });
        return;
      }

      // Get participant details from profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", participantIds);

      if (error) throw error;

      // Initialize participants with scores from 0
      const participantScores: ParticipantScore[] = participantIds.map(
        (userId) => {
          const profile = profiles?.find((p) => p.id === userId);
          return {
            userId,
            username:
              profile?.display_name || profile?.username || "Unknown Player",
            score: 0,
          };
        }
      );

      setParticipants(participantScores);
    } catch (error) {
      console.error("Error loading participant details:", error);
      toast({
        title: "Error",
        description: "Failed to load participant details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (userId: string, score: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, score } : p))
    );
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Validate scores
      const scores: Record<string, number> = {};
      let hasValidScore = false;

      participants.forEach((participant) => {
        const score = Math.max(0, participant.score); // Ensure non-negative
        scores[participant.userId] = score;
        if (score > 0) hasValidScore = true;
      });

      if (!hasValidScore) {
        toast({
          title: "Invalid Scores",
          description:
            "At least one participant must have a score greater than 0",
          variant: "destructive",
        });
        return;
      }

      // Check for duplicate scores
      const scoreValues = Object.values(scores);
      const uniqueScores = new Set(scoreValues);
      if (
        uniqueScores.size !== scoreValues.length &&
        scoreValues.some((s) => s > 0)
      ) {
        toast({
          title: "Duplicate Scores",
          description:
            "All participants must have unique scores to determine a winner",
          variant: "destructive",
        });
        return;
      }

      // Submit scores using existing submitMultiplayerScore function
      await tournamentService.submitMultiplayerScore(
        match.room_id,
        match.id,
        scores,
        false
      );

      toast({
        title: "Success",
        description:
          "Scores submitted successfully. Participants will be notified to approve.",
      });

      onScoresSubmitted();
      onClose();
    } catch (error) {
      console.error("Error submitting scores:", error);
      toast({
        title: "Error",
        description: "Failed to submit scores. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border-2 border-primary/50 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-cyber text-xl font-bold text-primary">
            📊 Submit Match Scores
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-cyber text-muted-foreground mb-1">
              Match Details
            </p>
            <p className="font-cyber text-foreground">
              Round {match.round_number} - Match {match.match_number}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-cyber text-lg font-bold text-foreground">
                Participant Scores
              </h4>
              {participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between bg-secondary/30 rounded-lg p-4 border border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="font-cyber text-sm text-primary">
                        {participants.indexOf(participant) + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-cyber text-foreground">
                        {participant.username}
                        {participant.userId === user?.id && (
                          <span className="text-xs text-accent ml-2">
                            (You)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-cyber text-muted-foreground">
                      Score:
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={participant.score}
                      onChange={(e) =>
                        handleScoreChange(
                          participant.userId,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-20 px-3 py-1 bg-background border border-primary/30 rounded text-center font-cyber text-foreground focus:border-primary focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background"></div>
                Submitting...
              </span>
            ) : (
              "Submit Scores"
            )}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 bg-secondary border border-primary/30 font-cyber font-bold py-3 rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
