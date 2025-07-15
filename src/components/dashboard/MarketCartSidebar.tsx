import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Trash2, Minus, Plus } from 'lucide-react';
import { MarketPlaceItem } from '@/lib/utils';

export interface CartItem extends MarketPlaceItem {
  quantity: number;
}

interface MarketplaceCartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

const MarketplaceCartSidebar = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: MarketplaceCartSidebarProps) => {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-card border-primary/20">
        <SheetHeader>
          <SheetTitle className="font-cyber text-primary glow-text">Shopping Cart</SheetTitle>
          <SheetDescription>
            {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {cartItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-4">🛒</div>
                <p className="font-cyber">Your cart is empty</p>
                <p className="text-sm">Add some items from the marketplace!</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-6 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-primary/20 rounded-lg bg-gradient-to-r from-card to-secondary/10">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-cyber text-primary font-semibold truncate">{item.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-cyber text-accent font-bold">{item.price} SUI</span>
                        {item.rarity && (
                          <Badge variant="outline" className="text-xs">
                            {item.rarity}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-cyber">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onRemoveItem(item.id)}
                        className="w-8 h-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-primary/20 pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-cyber text-lg">Total:</span>
                  <span className="font-cyber text-2xl font-bold text-accent">{totalPrice} SUI</span>
                </div>

                <Button
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all duration-300 font-cyber text-lg py-6"
                  disabled={cartItems.length === 0}
                >
                  Checkout ({totalItems} items)
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MarketplaceCartSidebar;