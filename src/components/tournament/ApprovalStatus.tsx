import { tournamentService } from "@/services/tournamentService";
import { TournamentMatch, MatchApprovalStatus } from "@/types/tournament";
import { useState, useCallback, useEffect } from "react";

// Approval Status Display Component
interface ApprovalStatusDisplayProps {
  match: TournamentMatch;
  currentUserId?: string;
  onApprovalClick: () => void;
}

export const ApprovalStatusDisplay: React.FC<ApprovalStatusDisplayProps> = ({
  match,
  currentUserId,
  onApprovalClick,
}) => {
  const [approvalStatus, setApprovalStatus] =
    useState<MatchApprovalStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadApprovalStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await tournamentService.getMatchApprovalStatus(match.id);
      setApprovalStatus(status);
    } catch (error) {
      console.error("Error loading approval status:", error);
    } finally {
      setLoading(false);
    }
  }, [match.id]);

  useEffect(() => {
    loadApprovalStatus();
  }, [loadApprovalStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!approvalStatus) return null;

  const isCurrentUserParticipant =
    currentUserId &&
    [
      match.player1_id,
      match.player2_id,
      match.player3_id,
      match.player4_id,
    ].includes(currentUserId);

  const canUserApprove =
    isCurrentUserParticipant &&
    !approvalStatus.approved_by.includes(currentUserId!) &&
    !approvalStatus.rejected_by.includes(currentUserId!);

  const getStatusColor = () => {
    if (approvalStatus.is_fully_approved)
      return "bg-green-500/20 border-green-500/30 text-green-400";
    if (approvalStatus.rejected_by.length > 0)
      return "bg-red-500/20 border-red-500/30 text-red-400";
    return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
  };

  const getStatusText = () => {
    if (approvalStatus.is_fully_approved) return "✅ Fully Approved";
    if (approvalStatus.rejected_by.length > 0) return "❌ Rejected";
    return `⏳ ${approvalStatus.collected_approvals}/${approvalStatus.required_approvals} Approved`;
  };

  return (
    <div className={`rounded-lg p-2 border ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-cyber font-bold">
            {getStatusText()}
          </span>
          {canUserApprove && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
              Action Required
            </span>
          )}
        </div>
        <button
          onClick={onApprovalClick}
          className="text-xs font-cyber font-bold hover:underline"
        >
          View Details
        </button>
      </div>
    </div>
  );
};
