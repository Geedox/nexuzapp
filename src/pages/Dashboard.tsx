
import { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import DashboardRightPanel from '@/components/dashboard/DashboardRightPanel';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveSection = () => {
    const pathSegments = location.pathname.split('/')

    // check if we are at /dashboard
    if (pathSegments.length === 2 && pathSegments[1] === 'dashboard') {
      return 'home';
    }

    return pathSegments[pathSegments.length - 1] || 'home';
  }

  const activeSection = getActiveSection()

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


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background text-foreground">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <DashboardSidebar
            activeSection={activeSection}
            setActiveSection={(section) => {
              if (section === 'home') {
                navigate("dashboard")
              } else {
                navigate(`/dashboard/${section}`);
              }
            }}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <DashboardTopbar />

            <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)] pt-20">
              <main className="flex-1 min-w-0">
                <ScrollArea className="h-full gaming-scrollbar">
                  <div className="p-2 sm:p-4 md:p-6">
                    <Outlet />
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
