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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
                          } />
                          <Route path="/payment-callback" element={
                            <ProtectedRoute requireAuth={true}>
                              <PaymentCallback />
                            </ProtectedRoute>
                          } />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
    </AuthProvider>
  </QueryClientProvider>
);

export default App;