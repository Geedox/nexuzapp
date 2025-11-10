import React, { useCallback, useState, useMemo } from "react";
import { useTournament } from "@/hooks/tournament";
import { useAuth } from "@/hooks/auth";
import type { GameRoom } from "@/types/gameroom";
import type {
  TournamentBracket,
  TournamentParticipant,
  TournamentStats,
  TournamentMatch,
} from "@/types/tournament";
import { logger } from "@/utils";
import { toast } from "@/hooks/use-toast";
import { TournamentBracketDisplay } from "./TournamentBracketDisplay";
import { ChevronDown, Trophy, Medal, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface RoundRobinProps {
  room: GameRoom;
  tournament: TournamentBracket;
  participants: TournamentParticipant[];
  stats: TournamentStats;
}

interface PlayerStanding {
  participant: TournamentParticipant;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  gamesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export const RoundRobin: React.FC<RoundRobinProps> = ({
  room,
  tournament,
  participants,
  stats,
}) => {
  const { completeMatch, completing, startTournament, starting } =
    useTournament();
  const { user } = useAuth();
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [matchesDisplayed, setMatchesDisplayed] = useState(10);

  // Get participant by ID
  const getParticipant = (id: string | null) => {
    if (!id) return null;
    return participants.find((p) => p.user_id === id);
  };

  // Get current user's participant
  const getCurrentUserParticipant = useCallback(() => {
    if (!user) return null;
    return participants.find((p) => p.user_id === user.id);
  }, [user, participants]);

  const currentUserParticipant = useMemo(
    () => getCurrentUserParticipant(),
    [getCurrentUserParticipant]
  );

  // Get current user's active match
  const getCurrentUserActiveMatch = useCallback(() => {
    if (!user || !tournament.rounds.length) return null;
    for (const round of tournament.rounds) {
      for (const match of round.matches) {
        if (
          match.status === "active" &&
          (match.player1_id === user.id ||
            match.player2_id === user.id ||
            match.player3_id === user.id ||
            match.player4_id === user.id)
        ) {
          return match;
        }
      }
    }
    logger.debug("No current user active match found");
    return null;
  }, [user, tournament.rounds]);

  const currentUserActiveMatch = useMemo(
    () => getCurrentUserActiveMatch(),
    [getCurrentUserActiveMatch]
  );

  // Calculate standings for round robin
  const standings = useMemo((): PlayerStanding[] => {
    const standingsMap = new Map<string, PlayerStanding>();

    // Initialize standings for all participants
    participants.forEach((participant) => {
      standingsMap.set(participant.user_id, {
        participant,
        points: participant.tournament_points,
        wins: participant.tournament_wins,
        draws: participant.tournament_draws,
        losses: participant.tournament_losses,
        gamesPlayed: participant.tournament_matches_played,
        goalsFor: participant.tournament_goals_for,
        goalsAgainst: participant.tournament_goals_against,
        goalDifference: participant.tournament_goal_difference,
      });
    });

    // Sort by points (descending), then goal difference (descending), then wins (descending)
    return Array.from(standingsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.wins - a.wins;
    });
  }, [participants]);

  // Check if user is admin/creator of the room
  const isAdmin = useMemo(
    () => user?.id === room.creator_id,
    [user?.id, room.creator_id]
  );

  // Check if tournament matches exist
  const hasTournamentMatches = useMemo(
    () => tournament.rounds.length > 0,
    [tournament.rounds.length]
  );

  // Handle starting tournament
  const handleStartTournament = async () => {
    if (!isAdmin) return;

    try {
      await startTournament(room.id);
    } catch (error) {
      console.error("Error starting tournament:", error);
      toast({
        title: "Failed to start tournament",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle match completion
  const handleCompleteMatch = async (
    match: TournamentMatch,
    winnerId: string
  ) => {
    try {
      // Get the loser ID
      const loserId =
        [
          match.player1_id,
          match.player2_id,
          match.player3_id,
          match.player4_id,
        ].find((id) => id && id !== winnerId) || "";

      await completeMatch(match.id, winnerId, loserId, room.name);
      setSelectedWinner(null);
    } catch (error) {
      console.error("Error completing match:", error);
    }
  };

  // Render start tournament button for admins
  const renderStartTournamentButton = () => {
    if (isAdmin && !hasTournamentMatches && room.status !== "waiting")
      return (
        <div className="bg-gradient-to-br from-card to-secondary border border-primary/20 rounded-xl p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-lg font-cyber font-bold text-primary mb-2">
              Tournament Not Started
            </h3>
            <p className="text-muted-foreground mb-4">
              As the room creator, you can manually start the tournament when
              you're ready.
            </p>
            <button
              onClick={handleStartTournament}
              disabled={starting}
              className="bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all cyber-button shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:hover:scale-100"
            >
              {starting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background"></div>
                  Starting Tournament...
                </span>
              ) : (
                "Start Tournament"
              )}
            </button>
          </div>
        </div>
      );
  };

  // Render tournament progress
  const renderProgress = () => {
    const progress = (stats.completedMatches / stats.totalMatches) * 100;

    return (
      <div className="bg-gradient-to-br from-card to-secondary border border-primary/20 rounded-xl p-6">
        <h3 className="text-lg font-cyber font-bold text-primary mb-4">
          Tournament Progress
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-cyber text-muted-foreground">
              Match Progress
            </span>
            <span className="text-sm font-cyber font-bold text-primary">
              {stats.completedMatches} of {stats.totalMatches} matches
            </span>
          </div>

          <div className="w-full bg-secondary/50 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    );
  };

  // Render match fixtures
  const renderMatchFixtures = () => {
    const allMatches = tournament.rounds.flatMap((round) =>
      round.matches.map((match) => ({
        ...match,
        roundNumber: round.roundNumber,
      }))
    );

    const displayedMatches = allMatches.slice(0, matchesDisplayed);
    const hasMoreMatches = allMatches.length > matchesDisplayed;

    return (
      <div className="bg-gradient-to-br from-card to-secondary border border-primary/20 rounded-xl p-6">
        <h3 className="text-lg font-cyber font-bold text-primary mb-4">
          Match Fixtures
        </h3>

        {displayedMatches.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⚽</div>
            <h4 className="text-lg font-cyber font-bold text-primary mb-2">
              No Matches Yet
            </h4>
            <p className="text-muted-foreground">
              Matches will appear here once the tournament starts.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayedMatches.map((match, index) => {
                const player1 = getParticipant(match.player1_id);
                const player2 = getParticipant(match.player2_id);
                const scores = match.match_data?.scores || {};
                const player1Score = scores[match.player1_id || ""] || 0;
                const player2Score = scores[match.player2_id || ""] || 0;

                return (
                  <div
                    key={match.id}
                    className={`p-4 rounded-lg border transition-all ${
                      match.status === "completed"
                        ? "bg-green-500/10 border-green-500/30"
                        : match.status === "active"
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "bg-secondary/50 border-primary/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Player 1 */}
                      <div className="flex-1 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-background font-cyber font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-cyber font-bold text-foreground">
                            {player1?.user?.display_name ||
                              player1?.user?.username ||
                              "TBD"}
                          </div>
                          {match.status === "completed" && (
                            <div className="text-xs text-muted-foreground">
                              Round {match.roundNumber}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* VS Section */}
                      <div className="flex items-center gap-4 px-4">
                        <div className="text-center">
                          <div className="font-cyber font-bold text-lg text-primary">
                            {match.status === "completed" ? player1Score : "?"}
                          </div>
                        </div>
                        <div className="text-muted-foreground font-cyber font-bold">
                          VS
                        </div>
                        <div className="text-center">
                          <div className="font-cyber font-bold text-lg text-primary">
                            {match.status === "completed" ? player2Score : "?"}
                          </div>
                        </div>
                      </div>

                      {/* Player 2 */}
                      <div className="flex-1 flex items-center gap-3 justify-end">
                        <div className="flex-1 text-right">
                          <div className="font-cyber font-bold text-foreground">
                            {player2?.user?.display_name ||
                              player2?.user?.username ||
                              "TBD"}
                          </div>
                          {match.status === "completed" && (
                            <div className="text-xs text-muted-foreground">
                              Round {match.roundNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Match Status */}
                    <div className="mt-2 flex justify-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-cyber font-bold ${
                          match.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : match.status === "active"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {match.status === "completed"
                          ? "Completed"
                          : match.status === "active"
                          ? "Live"
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {hasMoreMatches && (
              <div className="mt-4 text-center">
                <button
                  onClick={() =>
                    setMatchesDisplayed((prev) =>
                      Math.min(prev + 10, allMatches.length)
                    )
                  }
                  className="bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold px-6 py-2 rounded-lg hover:scale-105 transition-all cyber-button shadow-lg hover:shadow-primary/50 flex items-center gap-2 mx-auto"
                >
                  Load More Matches
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Render standings table
  const renderStandings = () => {
    return (
      <div className="bg-gradient-to-br from-card to-secondary border border-primary/20 rounded-xl p-6">
        <h3 className="text-lg font-cyber font-bold text-primary mb-4">
          Standings
        </h3>

        {standings.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏆</div>
            <h4 className="text-lg font-cyber font-bold text-primary mb-2">
              No Standings Yet
            </h4>
            <p className="text-muted-foreground">
              Standings will appear here once matches are completed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left py-3 px-2 font-cyber font-bold text-primary">
                    Pos
                  </th>
                  <th className="text-left py-3 px-2 font-cyber font-bold text-primary">
                    Player
                  </th>
                  <th className="text-center py-3 px-2 font-cyber font-bold text-primary">
                    P
                  </th>
                  <th className="text-center py-3 px-2 font-cyber font-bold text-primary">
                    W
                  </th>
                  <th className="text-center py-3 px-2 font-cyber font-bold text-primary">
                    D
                  </th>
                  <th className="text-center py-3 px-2 font-cyber font-bold text-primary">
                    L
                  </th>
                  <th className="text-center py-3 px-2 font-cyber font-bold text-primary">
                    Pts
                  </th>
                  <th className="text-center py-3 px-2 font-cyber font-bold text-primary">
                    SF
                  </th>
                  <th className="text-center py-3 px-2 font-cyber font-bold text-primary">
                    SA
                  </th>
                  <th className="text-center py-3 px-2 font-cyber font-bold text-primary">
                    SD
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => {
                  const getPositionIcon = (position: number) => {
                    switch (position) {
                      case 1:
                        return <Trophy className="w-4 h-4 text-yellow-400" />;
                      case 2:
                        return <Medal className="w-4 h-4 text-gray-400" />;
                      case 3:
                        return <Award className="w-4 h-4 text-amber-600" />;
                      default:
                        return (
                          <span className="text-sm font-cyber font-bold">
                            {position}
                          </span>
                        );
                    }
                  };

                  return (
                    <tr
                      key={standing.participant.user_id}
                      className={`border-b border-primary/10 hover:bg-primary/5 transition-colors ${
                        standing.participant.user_id === user?.id
                          ? "bg-primary/10"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {getPositionIcon(index + 1)}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-background font-cyber font-bold text-sm">
                            {standing.participant.user?.display_name?.[0] ||
                              standing.participant.user?.username?.[0] ||
                              "?"}
                          </div>
                          <div>
                            <div className="font-cyber font-bold text-foreground">
                              {standing.participant.user?.display_name ||
                                standing.participant.user?.username ||
                                "Unknown"}
                            </div>
                            {standing.participant.user_id === user?.id && (
                              <div className="text-xs text-primary">(You)</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-cyber font-bold text-foreground">
                        {standing.gamesPlayed}
                      </td>
                      <td className="py-3 px-2 text-center font-cyber font-bold text-green-400">
                        {standing.wins}
                      </td>
                      <td className="py-3 px-2 text-center font-cyber font-bold text-yellow-400">
                        {standing.draws}
                      </td>
                      <td className="py-3 px-2 text-center font-cyber font-bold text-red-400">
                        {standing.losses}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold px-3 py-1 rounded-lg text-sm">
                          {standing.points}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-cyber font-bold text-green-400">
                        {standing.goalsFor}
                      </td>
                      <td className="py-3 px-2 text-center font-cyber font-bold text-red-400">
                        {standing.goalsAgainst}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div
                          className={`font-cyber font-bold px-2 py-1 rounded text-sm ${
                            standing.goalDifference > 0
                              ? "bg-green-500/20 text-green-400"
                              : standing.goalDifference < 0
                              ? "bg-red-500/20 text-red-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {standing.goalDifference > 0 ? "+" : ""}
                          {standing.goalDifference}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Points Legend */}
        <div className="mt-4 pt-4 border-t border-primary/20">
          <div className="flex items-center justify-center gap-6 text-xs font-cyber text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span>Win = 2 pts</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span>Draw = 1 pt</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span>Loss = 0 pts</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render match completion interface
  const renderMatchCompletion = () => {
    if (!currentUserParticipant) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👤</div>
          <h3 className="text-lg font-cyber font-bold text-primary mb-2">
            Not Participating
          </h3>
          <p className="text-muted-foreground">
            You are not participating in this tournament.
          </p>
        </div>
      );
    }

    if (
      !currentUserActiveMatch &&
      room.status !== "completed" &&
      room.status !== "cancelled"
    ) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⏳</div>
          <h3 className="text-lg font-cyber font-bold text-primary mb-2">
            Waiting for Your Match
          </h3>
          <p className="text-muted-foreground">
            You don't have an active match right now. Check back when your match
            is ready.
          </p>
        </div>
      );
    }

    // If user has an active match, show match completion interface
    if (currentUserActiveMatch) {
      const match = currentUserActiveMatch;
      const player1 = getParticipant(match.player1_id);
      const player2 = getParticipant(match.player2_id);
      const player3 = getParticipant(match.player3_id);
      const player4 = getParticipant(match.player4_id);
      const players = [player1, player2, player3, player4].filter(Boolean);

      return (
        <div className="bg-gradient-to-br from-card to-secondary border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-cyber font-bold text-primary mb-4">
            Complete Your Match
          </h3>

          <div className="space-y-3">
            {players.map((player, index) => {
              if (!player) return null;

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-background font-cyber font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-cyber font-bold text-foreground">
                        {player.user?.display_name ||
                          player.user?.username ||
                          "Unknown Player"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Seed #{player.seed}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedWinner(player.user_id)}
                    className={`px-3 py-1 rounded-lg text-xs font-cyber font-bold transition-all ${
                      selectedWinner === player.user_id
                        ? "bg-accent text-background"
                        : "bg-primary/20 text-primary hover:bg-primary/30"
                    }`}
                  >
                    Select Winner
                  </button>
                </div>
              );
            })}
          </div>

          {selectedWinner && (
            <div className="mt-4 pt-4 border-t border-primary/20">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Complete match with winner:{" "}
                  <span className="font-cyber font-bold text-primary">
                    {getParticipant(selectedWinner)?.user?.display_name ||
                      getParticipant(selectedWinner)?.user?.username}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedWinner(null)}
                    className="px-3 py-1 bg-secondary text-foreground text-xs font-cyber rounded-lg hover:bg-secondary/80 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCompleteMatch(match, selectedWinner!)}
                    disabled={completing}
                    className="px-4 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-cyber font-bold rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {completing ? "Completing..." : "Complete Match"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Start Tournament Button */}
      {renderStartTournamentButton()}

      {/* Tournament Progress */}
      {renderProgress()}
      {hasTournamentMatches && (
        <Tabs defaultValue="brackets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="brackets">Brackets</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
          </TabsList>
          <TabsContent value="standings">{renderStandings()}</TabsContent>
          <TabsContent value="fixtures">{renderMatchFixtures()}</TabsContent>
          <TabsContent value="brackets">
            <TournamentBracketDisplay
              tournament={tournament}
              participants={participants}
              currentUserId={user?.id}
              room={room}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Match Completion Interface */}
      {renderMatchCompletion()}

      {/* Tournament Complete */}
      {stats.isComplete && stats.winner && (
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-cyber font-bold text-green-400 mb-2">
              Tournament Complete!
            </h3>
            <p className="text-green-300 mb-4">
              Winner:{" "}
              <span className="font-cyber font-bold">
                {getParticipant(stats.winner!)?.user?.display_name ||
                  getParticipant(stats.winner!)?.user?.username}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Add CSS styles for the cyber theme
const cyberStyles = `
  .cyber-button {
    position: relative;
    overflow: hidden;
  }

  .cyber-button::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  .cyber-button:hover::after {
    width: 300px;
    height: 300px;
  }

  .glow-text {
    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
  }

  .glow-text-subtle {
    text-shadow: 0 0 5px currentColor;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = cyberStyles;
  document.head.appendChild(styleSheet);
}
