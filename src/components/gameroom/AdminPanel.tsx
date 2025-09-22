import React, { useState } from "react";
import { GameRoomParticipant, GameRoom } from "@/types/gameroom";
import { useGameRoom } from "@/hooks/gameroom";
import { useToast } from "@/hooks/use-toast";

interface AdminPanelProps {
  room: GameRoom;
  participants: GameRoomParticipant[];
  onParticipantsUpdate: () => void;
  onInitiateCompletion: () => void;
  isCompletingRoom: boolean;
  setShowCompletionConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  room,
  participants,
  onParticipantsUpdate,
  onInitiateCompletion,
  isCompletingRoom,
  setShowCompletionConfirmation,
}) => {
  const { updateParticipantScore } = useGameRoom();
  const { toast } = useToast();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [localParticipants, setLocalParticipants] = useState(participants);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmittingScores, setIsSubmittingScores] = useState(false);

  // Calculate positions automatically based on scores
  const calculatePositions = (participantsList: GameRoomParticipant[]) => {
    const sortedByScore = [...participantsList].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );
    return sortedByScore.map((participant, index) => ({
      ...participant,
      final_position: index + 1,
    }));
  };

  // Update local participant score (without saving to database)
  const handleScoreChange = (participantId: string, newScore: number) => {
    if (newScore < 0) {
      toast({
        title: "Invalid Score",
        description: "Score cannot be negative",
        variant: "destructive",
      });
      return;
    }

    // Update local state with new score and recalculate positions
    const updatedParticipants = localParticipants.map((p) =>
      p.id === participantId ? { ...p, score: newScore } : p
    );
    const participantsWithPositions = calculatePositions(updatedParticipants);
    setLocalParticipants(participantsWithPositions);

    // Check if there are unsaved changes
    const hasChanges = participantsWithPositions.some((p) => {
      const originalParticipant = participants.find((orig) => orig.id === p.id);
      return originalParticipant && originalParticipant.score !== p.score;
    });
    setHasUnsavedChanges(hasChanges);
  };

  // Submit all score changes to database
  const handleSubmitScores = async () => {
    setIsSubmittingScores(true);
    const changedParticipants: {
      participantId: string;
      newScore: number;
    }[] = [];

    // Find participants with changed scores
    for (const localParticipant of localParticipants) {
      const originalParticipant = participants.find(
        (p) => p.id === localParticipant.id
      );
      if (
        originalParticipant &&
        originalParticipant.score !== localParticipant.score
      ) {
        changedParticipants.push({
          participantId: localParticipant.id,
          newScore: localParticipant.score,
        });
      }
    }
    try {
      await updateParticipantScore(room.id, changedParticipants);
      setHasUnsavedChanges(false);
      onParticipantsUpdate();
      toast({
        title: "Scores Updated",
        description: `Successfully updated ${changedParticipants.length} participant scores`,
      });
    } catch (error) {
      console.error("Error submitting scores:", error);
      toast({
        title: "Error",
        description: "Failed to update some scores. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingScores(false);
    }
  };

  // Check if all participants have valid scores and positions
  const canInitiateCompletion = () => {
    return (
      localParticipants.every(
        (p) => p.score !== null && p.score !== undefined && p.score >= 0
      ) &&
      localParticipants.length > 0 &&
      !hasUnsavedChanges // Cannot initiate if there are unsaved changes
    );
  };

  React.useEffect(() => {
    setLocalParticipants(calculatePositions(participants));
  }, [participants]);

  return (
    <div className="bg-gradient-to-br from-card to-secondary/20 border-2 border-primary/30 rounded-2xl p-6 cyber-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-cyber text-xl font-bold text-primary">
          ⭐ Special Room Admin Panel
        </h2>
        <button
          onClick={() => setShowAdminPanel(!showAdminPanel)}
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-cyber font-bold hover:scale-105 transition-all"
        >
          {showAdminPanel ? "Hide Admin Panel" : "Manage Scores"}
        </button>
      </div>

      {showAdminPanel && (
        <div className="space-y-4">
          <p className="text-sm font-cyber text-muted-foreground">
            Update participant scores below. Positions are automatically
            calculated based on scores.
          </p>

          {/* Score Management Section */}
          <div className="space-y-3">
            <h3 className="font-cyber text-lg font-bold text-purple-400">
              📊 Score Management
            </h3>
            {localParticipants
              .sort(
                (a, b) => (a.final_position || 999) - (b.final_position || 999)
              )
              .map((participant, index) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between bg-secondary/30 rounded-lg p-4 border border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <span className="font-cyber text-lg text-primary">
                        #{participant.final_position || index + 1}
                      </span>
                      <span className="text-xs font-cyber text-muted-foreground">
                        Position
                      </span>
                    </div>
                    <div>
                      <p className="font-cyber text-foreground">
                        {participant.user?.username || "Unknown Player"}
                        {participant.user_id === room.creator_id && (
                          <span className="text-xs text-yellow-400 ml-2">
                            (Host)
                          </span>
                        )}
                      </p>
                      <p className="text-xs font-cyber text-muted-foreground">
                        Joined:{" "}
                        {new Date(participant.joined_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-cyber text-muted-foreground">
                        Score:
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={participant.score || ""}
                        onChange={(e) => {
                          const newScore = parseInt(e.target.value) || 0;
                          handleScoreChange(participant.id, newScore);
                        }}
                        disabled={isSubmittingScores}
                        className={`w-24 px-2 py-1 rounded text-center text-sm font-cyber text-foreground focus:outline-none disabled:opacity-50 ${
                          // Check if this participant's score has been changed
                          participants.find((p) => p.id === participant.id)
                            ?.score !== participant.score
                            ? "bg-blue-500/30 border-blue-400 focus:border-blue-300" // Changed score styling
                            : "bg-secondary/50 border-primary/30 focus:border-primary" // Default styling
                        } border-2`}
                        placeholder="0"
                      />
                      {/* Visual indicator for changed scores */}
                      {participants.find((p) => p.id === participant.id)
                        ?.score !== participant.score && (
                        <div
                          className="text-blue-400 text-xs"
                          title="Score changed"
                        >
                          ✏️
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Submit Scores Button */}
          {hasUnsavedChanges && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-cyber text-sm font-bold text-blue-400 mb-1">
                    💾 Unsaved Changes
                  </h4>
                  <p className="text-xs font-cyber text-blue-300">
                    You have unsaved score changes. Submit them to save to the
                    database.
                  </p>
                </div>
                <button
                  onClick={handleSubmitScores}
                  disabled={isSubmittingScores}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-cyber font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmittingScores ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Saving...
                    </span>
                  ) : (
                    "💾 Submit Scores"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Completion Initiation Section */}
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 mt-6">
            <h3 className="font-cyber text-lg font-bold text-purple-400 mb-3">
              🏁 Initiate Room Completion
            </h3>
            <p className="text-sm font-cyber text-purple-300 mb-4">
              Once you initiate completion, participants will be able to approve
              the final results. Make sure all scores are correct before
              proceeding.
            </p>

            {!canInitiateCompletion() && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <p className="text-sm font-cyber text-yellow-400">
                  ⚠️ Requirements to initiate completion:
                </p>
                <ul className="text-xs font-cyber text-yellow-300 mt-2 space-y-1">
                  {!localParticipants.every(
                    (p) =>
                      p.score !== null && p.score !== undefined && p.score >= 0
                  ) && <li>• All participants must have valid scores (≥ 0)</li>}
                  {hasUnsavedChanges && (
                    <li>
                      • Submit all score changes before initiating completion
                    </li>
                  )}
                  {localParticipants.length === 0 && (
                    <li>• At least one participant is required</li>
                  )}
                  {room.start_signing && (
                    <li>• Room completion has already been initiated</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              {room.admin_has_approved && room.participant_has_approved ? (
                <button
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:hover:scale-100"
                  onClick={() => setShowCompletionConfirmation(true)}
                >
                  {" "}
                  {isCompletingRoom ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    "Complete Room"
                  )}
                </button>
              ) : (
                <button
                  onClick={onInitiateCompletion}
                  disabled={
                    !canInitiateCompletion() ||
                    isCompletingRoom ||
                    room.start_signing
                  }
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isCompletingRoom ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    "🚀 Initiate Room Completion"
                  )}
                </button>
              )}
              <button
                onClick={() => setShowAdminPanel(false)}
                disabled={isCompletingRoom}
                className="px-6 bg-secondary border-2 border-primary/30 font-cyber font-bold py-3 rounded-xl hover:bg-secondary/80 hover:border-primary/50 transition-all disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
