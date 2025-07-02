
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import DashboardHome from '@/components/dashboard/DashboardHome';
import DashboardRightPanel from '@/components/dashboard/DashboardRightPanel';
import GamesPage from '@/components/dashboard/pages/GamesPage';
import LeaderboardsPage from '@/components/dashboard/pages/LeaderboardsPage';
import WalletPage from '@/components/dashboard/pages/WalletPage';
import CommunityPage from '@/components/dashboard/pages/CommunityPage';
import RoomsPage from '@/components/dashboard/pages/RoomsPage';
import CreatorsPage from '@/components/dashboard/pages/CreatorsPage';
import AnalyticsPage from '@/components/dashboard/pages/AnalyticsPage';
import SettingsPage from '@/components/dashboard/pages/SettingsPage';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('home');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="font-gaming text-2xl font-bold text-primary glow-text mb-4">
            NEXUZ ARENA
          </div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'games':
        return <GamesPage />;
      case 'leaderboards':
        return <LeaderboardsPage />;
      case 'wallet':
        return <WalletPage />;
      case 'community':
        return <CommunityPage />;
      case 'rooms':
        return <RoomsPage />;
      case 'creators':
        return <CreatorsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'support':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6">
              <h1 className="font-cyber text-3xl font-bold text-blue-400 mb-2 glow-text">
                🎧 Support Center
              </h1>
              <p className="text-muted-foreground">Get help with your gaming experience</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-6">
                <h3 className="font-cyber text-xl font-bold text-primary mb-4">📚 Help Articles</h3>
                <p className="text-muted-foreground">Browse our comprehensive help documentation</p>
              </div>
              <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-6">
                <h3 className="font-cyber text-xl font-bold text-primary mb-4">💬 Live Chat</h3>
                <p className="text-muted-foreground">Chat with our support team in real-time</p>
              </div>
            </div>
          </div>
        );
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background text-foreground">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <DashboardSidebar 
            activeSection={activeSection} 
            setActiveSection={setActiveSection}
          />
          
          <div className="flex-1 flex flex-col min-w-0">
            <DashboardTopbar />
            
            <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)] pt-20">
              <main className="flex-1 min-w-0">
                <ScrollArea className="h-full gaming-scrollbar">
                  <div className="p-2 sm:p-4 md:p-6">
                    {renderContent()}
                  </div>
                </ScrollArea>
              </main>
              
              <div className="w-64 xl:w-80 hidden lg:block border-l border-primary/20">
                <ScrollArea className="h-full gaming-scrollbar">
                  <DashboardRightPanel />
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Dashboard;
