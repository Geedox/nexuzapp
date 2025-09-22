import React, { useState } from "react";
import { GameRoomParticipant, GameRoom } from "@/types/gameroom";
import { useGameRoom } from "@/hooks/gameroom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ApprovalSectionProps {
  room: GameRoom;
  participants: GameRoomParticipant[];
  signaturesAndStatus: {
    collected: number;
    required: number;
    hasCreatorSignature: boolean;
    hasParticipantSignature: boolean;
    signers: {
      id: string;
      participant_id: string | null;
      room_id: string | null;
      created_at: string;
    }[];
  } | null;
  onApprovalSubmitted: () => void;
  completionInitiated: boolean; // New prop to track if admin has initiated completion
}

export const ApprovalSection: React.FC<ApprovalSectionProps> = ({
  room,
  participants,
  signaturesAndStatus,
  onApprovalSubmitted,
  completionInitiated,
}) => {
  const { approveGameRoomCompletion } = useGameRoom();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const isCreator = room.creator_id === user?.id;
  const isParticipant = participants.some(
    (p) => p.user_id === user?.id && p.is_active
  );

  // Check if current user has already approved
  const currentUserSigner = signaturesAndStatus?.signers?.find((signer) => {
    const participant = participants.find(
      (p) => p.id === signer.participant_id
    );
    return participant?.user_id === user?.id;
  });

  const hasCurrentUserApproved = !!currentUserSigner;

  const handleApprovalSubmit = async () => {
    setIsSubmittingApproval(true);
    try {
      await approveGameRoomCompletion(room.id);
      onApprovalSubmitted();

      toast({
        title: "Success",
        description: "Approval submitted successfully",
      });
    } catch (error) {
      console.error("Error submitting approval:", error);
      toast({
        title: "Error",
        description: "Failed to submit approval",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Don't show the component if user is not creator or participant
  if (!isCreator && !isParticipant) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-card to-secondary/20 border-2 border-primary/30 rounded-2xl p-6 cyber-border">
      <h2 className="font-cyber text-xl font-bold text-primary mb-4">
        📝 Game Completion Approval
      </h2>

      {/* Signature Status Display */}
      <div
        className={`border rounded-lg p-4 mb-4 ${
          isCreator
            ? "bg-purple-500/20 border-purple-500/30"
            : "bg-blue-500/20 border-blue-500/30"
        }`}
      >
        <h3
          className={`font-cyber text-lg font-bold mb-2 ${
            isCreator ? "text-purple-400" : "text-blue-400"
          }`}
        >
          Signature Status
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p
              className={`text-sm font-cyber ${
                isCreator ? "text-purple-300" : "text-blue-300"
              }`}
            >
              Signatures Collected: {signaturesAndStatus?.collected || 0} /{" "}
              {signaturesAndStatus?.required || 2}
            </p>
            <div
              className={`w-full rounded-full h-2 mt-1 ${
                isCreator ? "bg-purple-900/30" : "bg-blue-900/30"
              }`}
            >
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCreator ? "bg-purple-400" : "bg-blue-400"
                }`}
                style={{
                  width: `${
                    ((signaturesAndStatus?.collected || 0) /
                      (signaturesAndStatus?.required || 2)) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>
          <div>
            <p
              className={`text-sm font-cyber ${
                isCreator ? "text-purple-300" : "text-blue-300"
              }`}
            >
              Status:{" "}
              {signaturesAndStatus?.hasCreatorSignature &&
              signaturesAndStatus?.hasParticipantSignature
                ? "✅ Ready to Complete"
                : "⏳ Pending Signatures"}
            </p>
          </div>
        </div>

        {/* Signers List */}
        {signaturesAndStatus &&
          signaturesAndStatus.signers &&
          signaturesAndStatus.signers.length > 0 && (
            <div className="mt-4">
              <h4
                className={`font-cyber text-sm font-bold mb-2 ${
                  isCreator ? "text-purple-300" : "text-blue-300"
                }`}
              >
                Signers ({signaturesAndStatus.signers.length})
              </h4>
              <div className="space-y-2">
                {signaturesAndStatus.signers.map((signer) => {
                  const participant = participants.find(
                    (p) => p.id === signer.participant_id
                  );
                  const isSignerCreator =
                    participant?.user_id === room?.creator_id;
                  return (
                    <div
                      key={signer.id}
                      className={`flex items-center justify-between rounded-lg p-3 border ${
                        isCreator
                          ? "bg-purple-900/20 border-purple-500/20"
                          : "bg-blue-900/20 border-blue-500/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={
                            isCreator ? "text-purple-400" : "text-blue-400"
                          }
                        >
                          {isSignerCreator ? "👑" : "👤"}
                        </div>
                        <div>
                          <p
                            className={`font-cyber text-sm ${
                              isCreator ? "text-purple-200" : "text-blue-200"
                            }`}
                          >
                            {participant?.user?.username || "Unknown User"}
                            {isSignerCreator && (
                              <span className="text-xs text-yellow-400 ml-2">
                                (Creator)
                              </span>
                            )}
                          </p>
                          <p
                            className={`text-xs font-cyber ${
                              isCreator ? "text-purple-400" : "text-blue-400"
                            }`}
                          >
                            Signed:{" "}
                            {signer.created_at
                              ? new Date(signer.created_at).toLocaleString()
                              : "Unknown time"}
                          </p>
                        </div>
                      </div>
                      <div className="text-green-400">✅</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>

      {/* Approval Instructions */}
      <div className="bg-secondary/30 rounded-lg p-4 mb-4">
        <p className="text-sm font-cyber text-muted-foreground">
          {isCreator ? (
            <>
              As the room creator, you can approve the game completion at any
              time. Once you approve, participants will be able to provide their
              approval as well.
            </>
          ) : (
            <>
              As a participant, you can approve the game completion only after
              the room creator has initiated the completion process. Both
              creator and participant approvals are required.
            </>
          )}
        </p>
      </div>

      {/* Approval Button */}
      <div className="space-y-3">
        {isCreator ? (
          // Admin Approval Button
          <button
            onClick={handleApprovalSubmit}
            disabled={
              isSubmittingApproval ||
              signaturesAndStatus.hasCreatorSignature ||
              room.admin_has_approved ||
              hasCurrentUserApproved ||
              !room.start_signing
            }
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-lg font-cyber font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmittingApproval ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Submitting...
              </span>
            ) : hasCurrentUserApproved ? (
              "✅ Admin Approval Submitted"
            ) : (
              "👑 Submit Admin Approval"
            )}
          </button>
        ) : (
          // Participant Approval Button
          <button
            onClick={handleApprovalSubmit}
            disabled={
              isSubmittingApproval ||
              hasCurrentUserApproved ||
              !completionInitiated ||
              !signaturesAndStatus?.hasCreatorSignature ||
              room.participant_has_approved ||
              !room.start_signing
            }
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg font-cyber font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmittingApproval ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Submitting...
              </span>
            ) : hasCurrentUserApproved ? (
              "✅ Participant Approval Submitted"
            ) : !completionInitiated ? (
              "⏳ Waiting for Admin to Initiate Completion"
            ) : !signaturesAndStatus?.hasCreatorSignature ? (
              "⏳ Waiting for Admin Approval First"
            ) : (
              "👤 Submit Participant Approval"
            )}
          </button>
        )}

        {/* Status Information */}
        {!completionInitiated && !isCreator && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-sm font-cyber text-yellow-400">
              ⏳ The room creator must initiate the completion process before
              participants can approve.
            </p>
          </div>
        )}

        {completionInitiated &&
          !isCreator &&
          !signaturesAndStatus?.hasCreatorSignature && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm font-cyber text-blue-400">
                ⏳ Waiting for the room creator to submit their approval first.
              </p>
            </div>
          )}
      </div>
    </div>
  );
};
