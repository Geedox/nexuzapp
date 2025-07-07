import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import AdminOverview from '@/components/admin/pages/AdminOverview';
import AdminUsers from '@/components/admin/pages/AdminUsers';
import AdminGames from '@/components/admin/pages/AdminGames';
import AdminTransactions from '@/components/admin/pages/AdminTransactions';
import AdminWithdrawals from '@/components/admin/pages/AdminWithdrawals';
import AdminRooms from '@/components/admin/pages/AdminRooms';
import AdminAnalytics from '@/components/admin/pages/AdminAnalytics';
import AdminSettings from '@/components/admin/pages/AdminSettings';
import LeaderboardSidebar from '@/components/admin/LeaderboardSidebar';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isAdminAuth = localStorage.getItem('adminAuth');
    if (!isAdminAuth) {
      navigate('/admin');
    }
  }, [navigate]);

  // Handle leaderboards section by opening the sidebar
  useEffect(() => {
    if (activeSection === 'leaderboards') {
      setIsLeaderboardOpen(true);
      // Reset to overview to avoid staying on leaderboards section
      setActiveSection('overview');
    }
  }, [activeSection]);

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminOverview onOpenLeaderboard={() => setIsLeaderboardOpen(true)} />;
      case 'users':
        return <AdminUsers />;
      case 'games':
        return <AdminGames />;
      case 'transactions':
        return <AdminTransactions />;
      case 'withdrawals':
        return <AdminWithdrawals />;
      case 'rooms':
        return <AdminRooms />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminOverview onOpenLeaderboard={() => setIsLeaderboardOpen(true)} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection} 
        />
        <div className="flex-1 flex flex-col">
          <AdminTopbar activeSection={activeSection}/>
          <main className="flex-1 p-2 md:p-6">
            {renderContent()}
          </main>
        </div>
        
        <LeaderboardSidebar
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;