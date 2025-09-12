import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Plus,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Wallet,
  Copy,
  ExternalLink,
} from "lucide-react";
import { NETWORK } from "@/constants";

import { WalletSetupModal } from "./WalletSetupModal";

const DashboardTopbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [suiWallet, setSuiWallet] = useState(null);
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { profile, updateProfile } = useProfile();

  // Load wallet from profile data
  useEffect(() => {
    if (profile?.sui_wallet_data) {
      setSuiWallet(profile.sui_wallet_data);
    }
  }, [profile]);

  const getPageTitle = () => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];

    if (!lastSegment || lastSegment === "dashboard") {
      return "Dashboard";
    }

    const titleMap = {
      games: "Games",
      leaderboards: "Leaderboards",
      wallet: "Wallet",
      community: "Community",
      rooms: "Rooms",
      creators: "Creators",
      analytics: "Analytics",
      settings: "Settings",
      support: "Support",
    };

    return (
      titleMap[lastSegment] ||
      lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
    );
  };

  // Remove the old wallet creation and import functions since they're now in WalletSetupModal

  const disconnectWallet = async () => {
    try {
      // Remove wallet from database
      await updateProfile({ sui_wallet_data: null });
      setSuiWallet(null);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const totalBalance = profile?.total_earnings || 0;

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here
  };

  return (
    <header
      className={`border-b border-primary/20 bg-card/50 backdrop-blur-lg p-2 sm:p-4 fixed top-0 left-0 right-0 z-40 transition-all shadow-lg`}
    >
      <div
        className={`${
          sidebarOpen ? "md:pl-64 transition-all" : ""
        } flex items-center justify-between`}
      >
        <div className="flex items-center space-x-2 sm:space-x-4">
          <SidebarTrigger
            onToggle={(isOpen) => {
              setSidebarOpen(isOpen);
              console.log("Sidebar is now:", isOpen ? "open" : "closed");
            }}
          />
          <div className="text-base sm:text-lg font-cyber text-primary">
            {getPageTitle()}
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
          {/* User Balance - Hidden on mobile */}
          <div className="hidden lg:block bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg px-2 lg:px-4 py-1 lg:py-1.5">
            <div className="text-sm lg:text-lg font-bold text-green-300 font-cyber">
              Earnings: ${totalBalance.toFixed(2)}
            </div>
          </div>

          {/* Create Room Button */}
          <Button
            variant="neumorphic"
            onClick={() => navigate("/dashboard/rooms")}
            className="bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all duration-300 font-cyber text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Create Room</span>
          </Button>

          {/* Sui Wallet Connection */}
          <div className="flex items-center">
            {suiWallet ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="neumorphic"
                    className="border-green-500/50 text-green-400 font-cyber text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 hover:bg-green-500/20"
                  >
                    <Wallet className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">
                      {formatAddress(suiWallet.address)}
                    </span>
                    <span className="sm:hidden">✓</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 bg-card border-primary/20"
                  align="end"
                >
                  <DropdownMenuLabel className="font-cyber">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-medium text-green-400">
                        Sui Wallet Connected
                      </p>
                      <div className="bg-muted/20 rounded p-2">
                        <p className="text-xs text-muted-foreground font-mono break-all">
                          {suiWallet.address}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-primary/20" />
                  <DropdownMenuItem
                    onClick={() => copyToClipboard(suiWallet.address)}
                    className="hover:bg-primary/20 font-cyber cursor-pointer"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Copy Address</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(
                        `https://suivision.xyz/account/${suiWallet.address}?network=${NETWORK}`,
                        "_blank"
                      )
                    }
                    className="hover:bg-primary/20 font-cyber cursor-pointer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    <span>View on Explorer</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary/20" />
                  <DropdownMenuItem
                    onClick={disconnectWallet}
                    className="hover:bg-red-500/20 text-red-400 font-cyber cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setShowWalletSetup(true)}
                className="bg-primary/80 hover:bg-primary font-cyber text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </Button>
            )}
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-primary/20 w-8 h-8 sm:w-10 sm:h-10"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -top-1 -right-1 bg-accent text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-cyber text-[10px] sm:text-xs">
              3
            </span>
          </Button>

          {/* User Dropdown with Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-primary/20 w-8 h-8 sm:w-10 sm:h-10"
              >
                {profile?.avatar_url ? (
                  (() => {
                    const match = profile.avatar_url.match(/avatar_(\d+)_(.+)/);
                    if (match) {
                      const avatarId = parseInt(match[1]);
                      const emoji = match[2];
                      const avatarColors = [
                        { id: 1, color: "from-purple-500 to-pink-500" },
                        { id: 2, color: "from-blue-500 to-cyan-500" },
                        { id: 3, color: "from-red-500 to-orange-500" },
                        { id: 4, color: "from-green-500 to-emerald-500" },
                        { id: 5, color: "from-yellow-500 to-amber-500" },
                        { id: 6, color: "from-indigo-500 to-purple-500" },
                        { id: 7, color: "from-gray-600 to-gray-800" },
                        { id: 8, color: "from-orange-500 to-red-500" },
                        { id: 9, color: "from-cyan-500 to-blue-500" },
                        { id: 10, color: "from-yellow-400 to-orange-500" },
                      ].find((a) => a.id === avatarId);

                      return (
                        <div
                          className={`w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r ${
                            avatarColors?.color || "from-primary to-accent"
                          } rounded-full flex items-center justify-center text-lg sm:text-xl`}
                        >
                          {decodeURIComponent(emoji)}
                        </div>
                      );
                    }
                    return (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                    );
                  })()
                ) : (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 bg-card border-primary/20"
              align="end"
            >
              <DropdownMenuLabel className="font-cyber">
                <div className="flex items-center gap-3">
                  {profile?.avatar_url &&
                    (() => {
                      const match =
                        profile.avatar_url.match(/avatar_(\d+)_(.+)/);
                      if (match) {
                        const avatarId = parseInt(match[1]);
                        const emoji = match[2];
                        const avatarColors = [
                          { id: 1, color: "from-purple-500 to-pink-500" },
                          { id: 2, color: "from-blue-500 to-cyan-500" },
                          { id: 3, color: "from-red-500 to-orange-500" },
                          { id: 4, color: "from-green-500 to-emerald-500" },
                          { id: 5, color: "from-yellow-500 to-amber-500" },
                          { id: 6, color: "from-indigo-500 to-purple-500" },
                          { id: 7, color: "from-gray-600 to-gray-800" },
                          { id: 8, color: "from-orange-500 to-red-500" },
                          { id: 9, color: "from-cyan-500 to-blue-500" },
                          { id: 10, color: "from-yellow-400 to-orange-500" },
                        ].find((a) => a.id === avatarId);

                        return (
                          <div
                            className={`w-10 h-10 bg-gradient-to-r ${
                              avatarColors?.color || "from-primary to-accent"
                            } rounded-lg flex items-center justify-center text-2xl flex-shrink-0`}
                          >
                            {decodeURIComponent(emoji)}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-primary">
                      {profile?.username || "Gamer"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Level {profile?.level || 1} •{" "}
                      {profile?.current_rank || "Junior"}
                    </p>
                    {suiWallet && (
                      <p className="text-xs text-green-400">
                        Sui: {formatAddress(suiWallet.address)}
                      </p>
                    )}
                    <div className="md:hidden text-xs text-green-400">
                      Balance: ${totalBalance.toFixed(2)}
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-primary/20" />
              <DropdownMenuItem className="hover:bg-primary/20 font-cyber cursor-pointer">
                <Link to="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-primary/20 font-cyber cursor-pointer"
              >
                <Link to="/dashboard/support">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Support</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-primary/20" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="hover:bg-red-500/20 text-red-400 font-cyber cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Wallet Setup Modal */}
      <WalletSetupModal
        open={showWalletSetup}
        onClose={() => setShowWalletSetup(false)}
      />
    </header>
  );
};

export default DashboardTopbar;
