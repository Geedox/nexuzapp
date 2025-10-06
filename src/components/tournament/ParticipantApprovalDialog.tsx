import React, { useState, useEffect } from "react";
import { TournamentMatch, MatchApprovalStatus } from "@/types/tournament";
import { tournamentService } from "@/services/tournamentService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ParticipantApprovalDialogProps {
  match: TournamentMatch;
  isOpen: boolean;
  onClose: () => void;
  onApprovalSubmitted: () => void;
}

interface ParticipantInfo {
  userId: string;
  username: string;
  score: number;
  hasApproved: boolean;
  hasRejected: boolean;
}

export const ParticipantApprovalDialog: React.FC<
  ParticipantApprovalDialogProps
> = ({ match, isOpen, onClose, onApprovalSubmitted }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [approvalStatus, setApprovalStatus] =
    useState<MatchApprovalStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (isOpen && match) {
      loadApprovalData();
    }
  }, [isOpen, match]);

  const loadApprovalData = async () => {
    try {
      setLoading(true);

      // Check if scores have been submitted
      if (!match.match_data?.admin_submitted_at) {
        toast({
          title: "No Scores Submitted",
          description: "Admin has not submitted scores for this match yet",
          variant: "destructive",
        });
        onClose();
        return;
      }

      // Get approval status
      const status = await tournamentService.getMatchApprovalStatus(match.id);
      setApprovalStatus(status);

      // Get participant details
      const participantIds = [
        match.player1_id,
        match.player2_id,
        match.player3_id,
        match.player4_id,
      ].filter(Boolean) as string[];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", participantIds);

      if (error) throw error;

      // Build participant info with scores and approval status
      const participantInfo: ParticipantInfo[] = participantIds.map(
        (userId) => {
          const profile = profiles?.find((p) => p.id === userId);
          const score = match.match_data?.scores?.[userId] || 0;
          const hasApproved = status?.approved_by.includes(userId) || false;
          const hasRejected = status?.rejected_by.includes(userId) || false;

          return {
            userId,
            username:
              profile?.display_name || profile?.username || "Unknown Player",
            score,
            hasApproved,
            hasRejected,
          };
        }
      );

      setParticipants(participantInfo);
    } catch (error) {
      console.error("Error loading approval data:", error);
      toast({
        title: "Error",
        description: "Failed to load approval data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await tournamentService.approveMatchScores(match.id);

      toast({
        title: "Success",
        description: "Scores approved successfully",
      });

      onApprovalSubmitted();
      onClose();
    } catch (error) {
      console.error("Error approving scores:", error);
      toast({
        title: "Error",
        description: "Failed to approve scores. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      await tournamentService.rejectMatchScores(match.id, rejectionReason);

      toast({
        title: "Success",
        description: "Scores rejected successfully",
      });

      onApprovalSubmitted();
      onClose();
    } catch (error) {
      console.error("Error rejecting scores:", error);
      toast({
        title: "Error",
        description: "Failed to reject scores. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canUserApprove = () => {
    if (!user || !approvalStatus) return false;

    // Check if user is a participant and hasn't approved/rejected yet
    const userParticipant = participants.find((p) => p.userId === user.id);
    return (
      userParticipant &&
      !userParticipant.hasApproved &&
      !userParticipant.hasRejected
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border-2 border-primary/50 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-cyber text-xl font-bold text-primary">
            ✅ Approve Match Scores
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
            {match.match_data?.admin_submitted_at && (
              <p className="text-xs font-cyber text-muted-foreground mt-1">
                Scores submitted:{" "}
                {new Date(match.match_data.admin_submitted_at).toLocaleString()}
              </p>
            )}
          </div>

          {approvalStatus && (
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm font-cyber text-blue-400 mb-2">
                Approval Status
              </p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-cyber font-bold text-blue-300">
                    {approvalStatus.collected_approvals}
                  </p>
                  <p className="text-xs font-cyber text-blue-400">Approved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-cyber font-bold text-orange-300">
                    {approvalStatus.required_approvals}
                  </p>
                  <p className="text-xs font-cyber text-orange-400">Required</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-cyber font-bold text-gray-300">
                    {approvalStatus.pending_approvals.length}
                  </p>
                  <p className="text-xs font-cyber text-gray-400">Pending</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-cyber text-lg font-bold text-foreground">
                Submitted Scores
              </h4>
              {participants.map((participant) => (
                <div
                  key={participant.userId}
                  className={`flex items-center justify-between rounded-lg p-4 border ${
                    participant.hasApproved
                      ? "bg-green-500/20 border-green-500/30"
                      : participant.hasRejected
                      ? "bg-red-500/20 border-red-500/30"
                      : "bg-secondary/30 border-primary/20"
                  }`}
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
                      {participant.hasApproved && (
                        <p className="text-xs font-cyber text-green-400">
                          ✅ Approved
                        </p>
                      )}
                      {participant.hasRejected && (
                        <p className="text-xs font-cyber text-red-400">
                          ❌ Rejected
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-cyber text-lg text-accent">
                      {participant.score.toLocaleString()}
                    </p>
                    <p className="text-xs font-cyber text-muted-foreground">
                      Score
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {canUserApprove() && (
          <div className="space-y-4">
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-sm font-cyber text-yellow-400 mb-2">
                Rejection Reason (Optional)
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection (optional)..."
                className="w-full px-3 py-2 bg-background border border-primary/30 rounded text-sm font-cyber text-foreground focus:border-primary focus:outline-none resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Approving...
                  </span>
                ) : (
                  "✅ Approve Scores"
                )}
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Rejecting...
                  </span>
                ) : (
                  "❌ Reject Scores"
                )}
              </button>
            </div>
          </div>
        )}

        {!canUserApprove() && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-secondary border border-primary/30 font-cyber font-bold py-3 rounded-xl hover:bg-secondary/80 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
