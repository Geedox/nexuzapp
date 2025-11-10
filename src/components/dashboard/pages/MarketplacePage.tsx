import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus } from "lucide-react";
import { MarketPlaceItem } from "@/lib/utils";

interface MarketplacePageProps {
  onOpenCart: () => void;
  onAddToCart: (item: MarketPlaceItem) => void;
  cartItemsCount: number;
}

const MarketplacePage = ({
  onOpenCart,
  onAddToCart,
  cartItemsCount,
}: MarketplacePageProps) => {
  const [activeTab, setActiveTab] = useState("nfts");

  const mockItems: MarketPlaceItem[] = [
    // NFTs
    {
      id: "1",
      name: "Cyber Dragon NFT",
      description: "Rare digital dragon with flame abilities",
      price: 150,
      image: "/placeholder.svg",
      category: "nfts",
      rarity: "Legendary",
    },
    {
      id: "2",
      name: "Space Warrior",
      description: "Galactic fighter from the future",
      price: 89,
      image: "/placeholder.svg",
      category: "nfts",
      rarity: "Epic",
    },
    {
      id: "3",
      name: "Crystal Phoenix",
      description: "Mystical bird with healing powers",
      price: 200,
      image: "/placeholder.svg",
      category: "nfts",
      rarity: "Mythic",
    },

    // Gaming
    {
      id: "4",
      name: "Legendary Sword",
      description: "Powerful weapon for warriors",
      price: 75,
      image: "/placeholder.svg",
      category: "gaming",
    },
    {
      id: "5",
      name: "Magic Shield",
      description: "Protection against dark magic",
      price: 45,
      image: "/placeholder.svg",
      category: "gaming",
    },
    {
      id: "6",
      name: "Speed Boots",
      description: "Increases movement speed by 50%",
      price: 60,
      image: "/placeholder.svg",
      category: "gaming",
    },

    // Arts
    {
      id: "7",
      name: "Digital Landscape",
      description: "Beautiful cyberpunk cityscape",
      price: 120,
      image: "/placeholder.svg",
      category: "arts",
    },
    {
      id: "8",
      name: "Abstract Geometry",
      description: "Modern geometric art piece",
      price: 95,
      image: "/placeholder.svg",
      category: "arts",
    },

    // Assets
    {
      id: "9",
      name: "3D Character Model",
      description: "High-quality game character",
      price: 180,
      image: "/placeholder.svg",
      category: "assets",
    },
    {
      id: "10",
      name: "Sound Pack",
      description: "100+ game sound effects",
      price: 35,
      image: "/placeholder.svg",
      category: "assets",
    },

    // General
    {
      id: "11",
      name: "Premium Theme",
      description: "Dark cyberpunk UI theme",
      price: 25,
      image: "/placeholder.svg",
      category: "general",
    },
    {
      id: "12",
      name: "Icon Pack",
      description: "500+ gaming icons",
      price: 15,
      image: "/placeholder.svg",
      category: "general",
    },
  ];

  const filteredItems = mockItems.filter((item) => item.category === activeTab);

  return (
    <div className="relative p-6 space-y-6">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center space-y-4 p-8 bg-card border border-primary/20 rounded-lg shadow-2xl">
          <div className="text-6xl font-bold font-cyber text-primary glow-text mb-4">
            Coming Soon
          </div>
          <p className="text-xl text-muted-foreground max-w-md">
            The marketplace is currently under development. Stay tuned for
            exciting features and exclusive items!
          </p>
          <div className="flex justify-center mt-6">
            <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:gap-0 text-center md:text-start items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-cyber text-primary glow-text">
            Marketplace
          </h1>
          <p className="text-muted-foreground mt-2">
            Buy exclusive items with SUI coins
          </p>
        </div>

        <Button
          onClick={onOpenCart}
          className="relative bg-primary hover:bg-primary/80 font-cyber"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Cart
          {cartItemsCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs">
              {cartItemsCount}
            </Badge>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-card border border-primary/20">
          <TabsTrigger value="nfts" className="font-cyber">
            NFTs
          </TabsTrigger>
          <TabsTrigger value="gaming" className="font-cyber">
            Gaming
          </TabsTrigger>
          <TabsTrigger value="arts" className="font-cyber">
            Arts
          </TabsTrigger>
          <TabsTrigger value="assets" className="font-cyber">
            Assets
          </TabsTrigger>
          <TabsTrigger value="general" className="font-cyber">
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="bg-card border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105"
              >
                <CardHeader className="p-4">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-3 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <CardTitle className="font-cyber text-primary">
                    {item.name}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {item.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold font-cyber text-accent">
                      {item.price} SUI
                    </div>
                    {item.rarity && (
                      <Badge
                        variant="outline"
                        className={`font-cyber ${
                          item.rarity === "Mythic"
                            ? "border-purple-500 text-purple-400"
                            : item.rarity === "Legendary"
                            ? "border-orange-500 text-orange-400"
                            : item.rarity === "Epic"
                            ? "border-blue-500 text-blue-400"
                            : "border-green-500 text-green-400"
                        }`}
                      >
                        {item.rarity}
                      </Badge>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <Button
                    onClick={() => onAddToCart(item)}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all duration-300 font-cyber"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketplacePage;
