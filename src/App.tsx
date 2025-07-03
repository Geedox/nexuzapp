import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { TransactionProvider } from "@/contexts/TransactionContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./pages/ProtectedRoute";
import PaymentCallback from "./components/PaymentCallback";
import { CommunityChatProvider } from "./contexts/CommunityChatContext";
import { LeaderboardProvider } from "./contexts/LeaderboardContext";
import { GameProvider } from "./contexts/GameContext";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { GameRoomProvider } from "./contexts/GameRoomContext";
import WinnerCelebrationProvider from "./hooks/WinnerCelebration";
import DashboardHome from '@/components/dashboard/DashboardHome';
import GamesPage from '@/components/dashboard/pages/GamesPage';
import LeaderboardsPage from '@/components/dashboard/pages/LeaderboardsPage';
import WalletPage from '@/components/dashboard/pages/WalletPage';
import CommunityPage from '@/components/dashboard/pages/CommunityPage';
import RoomsPage from '@/components/dashboard/pages/RoomsPage';
import CreatorsPage from '@/components/dashboard/pages/CreatorsPage';
import AnalyticsPage from '@/components/dashboard/pages/AnalyticsPage';
import SettingsPage from '@/components/dashboard/pages/SettingsPage';
import SupportPage from "@/components/dashboard/pages/SupportPage";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WinnerCelebrationProvider>
        <CommunityChatProvider>
          <ProfileProvider>
            <WalletProvider>
              <TransactionProvider>
                <LeaderboardProvider>
                  <GameProvider>
                    <GameRoomProvider>
                      <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>
                          <Routes>
                            <Route path="/" element={
                              <ProtectedRoute requireAuth={false}>
                                <Index />
                              </ProtectedRoute>
                            } />
                            <Route path="/dashboard" element={
                              <ProtectedRoute requireAuth={true}>
                                <Dashboard />
                              </ProtectedRoute>
                            }>
                              <Route index element={<DashboardHome />} />
                              <Route path="games" element={<GamesPage />} />
                              <Route path="leaderboards" element={<LeaderboardsPage />} />
                              <Route path="wallet" element={<WalletPage />} />
                              <Route path="community" element={<CommunityPage />} />
                              <Route path="rooms" element={<RoomsPage />} />
                              <Route path="creators" element={<CreatorsPage />} />
                              <Route path="analytics" element={<AnalyticsPage />} />
                              <Route path="settings" element={<SettingsPage />} />
                              <Route path="support" element={<SupportPage />} />
                            </Route>
                            <Route path="/payment-callback" element={
                              <ProtectedRoute requireAuth={true}>
                                <PaymentCallback />
                              </ProtectedRoute>
                            } />
                            <Route path="*" element={<NotFound />} />
                            <Route path="/admin" element={<AdminLogin />} />
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                          </Routes>
                        </BrowserRouter>
                      </TooltipProvider>
                    </GameRoomProvider>
                  </GameProvider>
                </LeaderboardProvider>
              </TransactionProvider>
            </WalletProvider>
          </ProfileProvider>
        </CommunityChatProvider>
      </WinnerCelebrationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;