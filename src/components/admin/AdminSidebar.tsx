import { Home, Users, Gamepad2, CreditCard, Radio, BarChart3, Settings, LogOut, Shield, Download, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { useToast } from '@/hooks/use-toast';

const sidebarItems = [
  {
    title: "Overview",
    icon: Home,
    id: "overview",
  },
  {
    title: "Users",
    icon: Users,
    id: "users",
  },
  {
    title: "Games",
    icon: Gamepad2,
    id: "games",
  },
  {
    title: "Transactions",
    icon: CreditCard,
    id: "transactions",
  },
  {
    title: "Withdrawals",
    icon: Download,
    id: "withdrawals",
  },
  {
    title: "Rooms",
    icon: Radio,
    id: "rooms",
  },
  {
    title: "Leaderboards",
    icon: Trophy,
    id: "leaderboards",
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

interface AdminSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const AdminSidebar = ({ activeSection, setActiveSection }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    toast({
      title: "Logged out",
      description: "You have been logged out of the admin panel",
    });
    navigate('/admin');
  };

  return (
    <Sidebar className="border-r border-primary/20 bg-gradient-to-b from-card to-secondary/20">
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="font-cyber text-xl font-bold text-primary">Admin Panel</div>
            <div className="text-sm text-muted-foreground font-cyber">Nexus Arena</div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-accent font-cyber font-semibold">Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.id)}
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
          <SidebarGroupLabel className="text-accent font-cyber font-semibold">Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 group font-cyber"
                >
                  <LogOut className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-lg p-3">
          <div className="text-sm font-cyber text-primary">🛡️ Admin Mode</div>
          <div className="text-xs text-muted-foreground font-cyber">System monitoring active</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;