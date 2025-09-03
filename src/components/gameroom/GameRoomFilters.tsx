import React, { useState, useEffect } from "react";
import { useGameRoom, GameRoomFilters } from "@/contexts/GameRoomContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";

interface GameRoomFiltersProps {
  className?: string;
}

const GameRoomFiltersComponent: React.FC<GameRoomFiltersProps> = ({
  className = "",
}) => {
  const { filters, setFilters, clearFilters, applyFilters } = useGameRoom();
  const [isExpanded, setIsExpanded] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  // Fetch available games for filtering
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data } = await supabase
          .from("games")
          .select("id, name")
          .eq("is_active", true)
          .order("name");
        setGames(data || []);
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoadingGames(false);
      }
    };
    fetchGames();
  }, []);

  const statusOptions = [
    { value: "waiting", label: "Waiting", color: "text-yellow-400" },
    { value: "ongoing", label: "Ongoing", color: "text-green-400" },
    { value: "completed", label: "Completed", color: "text-gray-400" },
    { value: "cancelled", label: "Cancelled", color: "text-red-400" },
  ];

  const currencyOptions = [
    { value: "USDC", label: "USDC" },
    { value: "USDT", label: "USDT" },
    { value: "SUI", label: "SUI" },
  ];

  const sortOptions = [
    { value: "created_at", label: "Creation Date" },
    { value: "start_time", label: "Start Time" },
    { value: "end_time", label: "End Time" },
    { value: "entry_fee", label: "Entry Fee" },
    { value: "total_prize_pool", label: "Prize Pool" },
    { value: "current_players", label: "Players" },
  ];

  const handleFilterChange = (key: keyof GameRoomFilters, value: any) => {
    setFilters({ [key]: value });
  };

  const handleArrayFilterChange = (
    key: keyof GameRoomFilters,
    value: string,
    checked: boolean
  ) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter((item) => item !== value);
    setFilters({ [key]: newArray });
  };

  const handleClearFilters = () => {
    clearFilters();
    applyFilters();
  };

  const hasActiveFilters = () => {
    return (
      (filters.status && filters.status.length > 0) ||
      (filters.currency && filters.currency.length > 0) ||
      filters.isPrivate !== undefined ||
      filters.isSponsored !== undefined ||
      filters.minEntryFee !== undefined ||
      filters.maxEntryFee !== undefined ||
      filters.minPlayers !== undefined ||
      filters.maxPlayers !== undefined ||
      filters.gameId ||
      filters.searchQuery ||
      (filters.sortBy && filters.sortBy !== "created_at") ||
      (filters.sortOrder && filters.sortOrder !== "desc")
    );
  };

  return (
    <div
      className={`bg-gradient-to-br from-card to-secondary/20 border border-primary/30 rounded-xl p-4 ${className}`}
    >
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-cyber text-lg font-bold text-primary">Filters</h3>
          {hasActiveFilters() && (
            <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-bold">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters() && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-cyber hover:bg-red-500/30 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1 bg-secondary/50 text-foreground rounded-lg text-sm font-cyber hover:bg-secondary/70 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* Search Bar - Always Visible */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search rooms and games..."
            value={filters.searchQuery || ""}
            onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-primary/30 rounded-lg font-cyber text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div>
            <label className="text-sm font-cyber text-primary mb-2 block">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <label
                  key={status.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(filters.status || []).includes(
                      status.value as any
                    )}
                    onChange={(e) =>
                      handleArrayFilterChange(
                        "status",
                        status.value,
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary"
                  />
                  <span className={`text-sm font-cyber ${status.color}`}>
                    {status.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Currency Filter */}
          <div>
            <label className="text-sm font-cyber text-primary mb-2 block">
              Currency
            </label>
            <div className="flex flex-wrap gap-2">
              {currencyOptions.map((currency) => (
                <label
                  key={currency.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(filters.currency || []).includes(
                      currency.value as any
                    )}
                    onChange={(e) =>
                      handleArrayFilterChange(
                        "currency",
                        currency.value,
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-cyber text-foreground">
                    {currency.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Room Type Filters */}
          <div>
            <label className="text-sm font-cyber text-primary mb-2 block">
              Room Type
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isPrivate === true}
                  onChange={(e) =>
                    handleFilterChange(
                      "isPrivate",
                      e.target.checked ? true : undefined
                    )
                  }
                  className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary"
                />
                <span className="text-sm font-cyber text-foreground">
                  Private Rooms
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isSponsored === true}
                  onChange={(e) =>
                    handleFilterChange(
                      "isSponsored",
                      e.target.checked ? true : undefined
                    )
                  }
                  className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary"
                />
                <span className="text-sm font-cyber text-foreground">
                  Sponsored Rooms
                </span>
              </label>
            </div>
          </div>

          {/* Entry Fee Range */}
          <div>
            <label className="text-sm font-cyber text-primary mb-2 block">
              Entry Fee Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minEntryFee || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "minEntryFee",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-2 bg-secondary/50 border border-primary/30 rounded-lg font-cyber text-foreground focus:border-primary focus:outline-none"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxEntryFee || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "maxEntryFee",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-2 bg-secondary/50 border border-primary/30 rounded-lg font-cyber text-foreground focus:border-primary focus:outline-none"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Player Count Range */}
          <div>
            <label className="text-sm font-cyber text-primary mb-2 block">
              Player Count
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  placeholder="Min Players"
                  value={filters.minPlayers || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "minPlayers",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-2 bg-secondary/50 border border-primary/30 rounded-lg font-cyber text-foreground focus:border-primary focus:outline-none"
                  min="1"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max Players"
                  value={filters.maxPlayers || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "maxPlayers",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-2 bg-secondary/50 border border-primary/30 rounded-lg font-cyber text-foreground focus:border-primary focus:outline-none"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Game Filter */}
          <div>
            <label className="text-sm font-cyber text-primary mb-2 block">
              Game
            </label>
            <select
              value={filters.gameId || ""}
              onChange={(e) =>
                handleFilterChange("gameId", e.target.value || undefined)
              }
              className="w-full px-3 py-2 bg-secondary/50 border border-primary/30 rounded-lg font-cyber text-foreground focus:border-primary focus:outline-none"
              disabled={loadingGames}
            >
              <option value="">All Games</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="text-sm font-cyber text-primary mb-2 block">
              Sort By
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={filters.sortBy || "created_at"}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="px-3 py-2 bg-secondary/50 border border-primary/30 rounded-lg font-cyber text-foreground focus:border-primary focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.sortOrder || "desc"}
                onChange={(e) =>
                  handleFilterChange("sortOrder", e.target.value)
                }
                className="px-3 py-2 bg-secondary/50 border border-primary/30 rounded-lg font-cyber text-foreground focus:border-primary focus:outline-none"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Apply Filters Button */}
      <div className="mt-4 pt-4 border-t border-primary/20">
        <button
          onClick={applyFilters}
          className="w-full bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-2 rounded-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary/50"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default GameRoomFiltersComponent;
