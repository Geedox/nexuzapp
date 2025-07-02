import { Home, Gamepad2, Trophy, Wallet, Users, Settings, Paintbrush, BarChart3, Radio, HelpCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';

const sidebarItems = [
  {
    title: "Home",
    icon: Home,
    id: "home",
  },
  {
    title: "Games",
    icon: Gamepad2,
    id: "games",
  },
  {
    title: "Leaderboards",
    icon: Trophy,
    id: "leaderboards",
  },
  {
    title: "Wallet",
    icon: Wallet,
    id: "wallet",
  },
  {
    title: "Community",
    icon: Users,
    id: "community",
  },
  {
    title: "Rooms",
    icon: Radio,
    id: "rooms",
  },
  {
    title: "Creators",
    icon: Paintbrush,
    id: "creators",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    id: "analytics",
  },
  {
    title: "Settings",
    icon: Settings,
    id: "settings",
  },
];

const supportItems = [
  {
    title: "Support",
    icon: HelpCircle,
    id: "support",
  },
  {
    title: "Logout",
    icon: LogOut,
    id: "logout",
  },
];

interface DashboardSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const DashboardSidebar = ({ activeSection, setActiveSection }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile } = useProfile();

  const handleItemClick = async (id: string) => {
    if (id === 'logout') {
      // Handle logout
      await signOut();
      navigate('/');
      return;
    }
    setActiveSection(id);
  };

  return (
    <Sidebar className="border-r border-primary/20 bg-gradient-to-b from-card to-secondary/20 z-50">
      <SidebarHeader className="p-6">
        <div className="font-cyber text-2xl font-bold text-primary glow-text">
          NEXUZ ARENA
        </div>
        <div className="text-sm text-muted-foreground font-cyber">Gaming Dashboard</div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-accent font-cyber font-semibold">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handleItemClick(item.id)}
                    isActive={activeSection === item.id}
                    className={`hover:bg-primary/20 hover:text-primary transition-all duration-300 group font-cyber ${
                      activeSection === item.id 
                        ? 'bg-primary/30 text-primary border-r-2 border-primary glow-text' 
                        : ''
                    }`}
                  >
                    <item.icon className="group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-accent font-cyber font-semibold">Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handleItemClick(item.id)}
                    className={`hover:bg-primary/20 hover:text-primary transition-all duration-300 group font-cyber ${
                      item.id === 'logout' ? 'hover:bg-red-500/20 hover:text-red-400' : ''
                    }`}
                  >
                    <item.icon className="group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-lg p-3">
          <div className="flex items-center gap-3">
            {/* User Avatar */}
            {profile?.avatar_url && (() => {
              const match = profile.avatar_url.match(/avatar_(\d+)_(.+)/);
              if (match) {
                const avatarId = parseInt(match[1]);
                const emoji = match[2];
                const avatarColors = [
                  { id: 1, color: 'from-purple-500 to-pink-500' },
                  { id: 2, color: 'from-blue-500 to-cyan-500' },
                  { id: 3, color: 'from-red-500 to-orange-500' },
                  { id: 4, color: 'from-green-500 to-emerald-500' },
                  { id: 5, color: 'from-yellow-500 to-amber-500' },
                  { id: 6, color: 'from-indigo-500 to-purple-500' },
                  { id: 7, color: 'from-gray-600 to-gray-800' },
                  { id: 8, color: 'from-orange-500 to-red-500' },
                  { id: 9, color: 'from-cyan-500 to-blue-500' },
                  { id: 10, color: 'from-yellow-400 to-orange-500' },
                ].find(a => a.id === avatarId);
                
                return (
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatarColors?.color || 'from-primary to-accent'} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {decodeURIComponent(emoji)}
                  </div>
                );
              }
              return null;
            })()}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-cyber text-primary truncate">{profile?.username || 'Gamer'}</div>
              <div className="text-xs text-muted-foreground font-cyber">Level {profile?.level || 1} • Ready!</div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;