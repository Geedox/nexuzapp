
import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import DashboardRightPanel from '@/components/dashboard/DashboardRightPanel';
import MarketplaceCartSidebar, { CartItem } from '@/components/dashboard/MarketCartSidebar';
import { useToast } from '@/hooks/use-toast';
import { MarketPlaceItem } from '@/lib/utils';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  const getActiveSection = () => {
    const pathSegments = location.pathname.split('/')

    // check if we are at /dashboard
    if (pathSegments.length === 2 && pathSegments[1] === 'dashboard') {
      return 'home';
    }

    return pathSegments[pathSegments.length - 1] || 'home';
  }

  const activeSection = getActiveSection()

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      handleRemoveItem(itemId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));

    toast({
      title: "Item Removed",
      description: "Item has been removed from your cart.",
    });
  };

  const handleCheckout = () => {
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    toast({
      title: "Checkout",
      description: `Processing payment of ${totalPrice} SUI coins...`,
    });

    // Here you would integrate with actual payment processing
    setCartItems([]);
    setIsCartOpen(false);
  };

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
          <ScrollArea className='gaming-scrollbar'>
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
          </ScrollArea>

          <div className="flex-1 flex flex-col min-w-0">
            <DashboardTopbar />

            <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)]">
              <main className="flex-1 min-w-0 pt-20">
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

      <MarketplaceCartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

export default Dashboard;
