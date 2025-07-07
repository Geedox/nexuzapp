import { Bell, Search, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';


const AdminTopbar = ({ activeSection }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  console.log(activeSection)

  const displayHeader = () => {
    switch (activeSection) {
      case "overview":
        return "Dashboard";
      case "users":
        return "Users";
      case "games":
        return "Games";
      case "transactions":
        return "Transactions";
      case "withdrawals":
        return "Withdrawals";
      case "rooms":
        return "Rooms";
      case "analytics":
        return "Analytics";
      case "settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  }

  return (
    <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm py-4 px-2 md:p-4 w-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2 md:space-x-4">
          <SidebarTrigger
            onToggle={(isOpen) => {
              setSidebarOpen(isOpen)
              console.log("Sidebar is now:", isOpen ? "open" : "closed")
            }}
          />
          <h1 className="text-2xl font-cyber font-bold text-primary">{displayHeader()}</h1>
          <Badge variant="outline" className="text-accent border-accent/30">
            Live
          </Badge>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search..."
              className="pl-10 w-64 bg-background/50"
            />
          </div>

          <div className="space-x-1 md:space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-red-500" />
            </Button>

            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;