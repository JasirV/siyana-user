"use client";
import React, { SyntheticEvent, useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, User, Heart } from "lucide-react";
import { User as UserType } from "@/types";

interface NavbarProps {
  cartItemsCount?: number;
  user?: UserType | null;
  onLoginClick?: () => void;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  user = null,
  onLoginClick,
  onLogout,
}) => {
  const [cartCount, setCartCount] = useState<number>(0);
  const [userName, setUserName] = useState<string>('')
  const pathname = usePathname();

  const hideBadge = pathname === "/cart";
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCount: any = localStorage.getItem("siyana-cart-count") || 0

      const name: any = localStorage.getItem('siyana-user-name')
      setUserName(name)
      setCartCount(storedCount);
    }
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      setCartCount(Number(localStorage.getItem("siyana-cart-count") || 0));
    }, 500); // live update

    return () => clearInterval(interval);
  }, []);
  const router = useRouter();

  const handleImageError = (e: SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = "none";
    const fallback = target.nextElementSibling as HTMLElement | null;
    if (fallback) fallback.style.display = "block";
  };

  const handleCartClick = () => {
    router.push("/cart"); // 👈 navigates to your cart page (e.g., /cart)
  };
  console.log(userName, 'username')

  return (
    <header className="sticky top-0 z-50 bg-[#278899] shadow-md overflow-hidden rounded-3xl m-4 ">
      <div className="relative flex items-center justify-between px-4 py-2 h-20">
        {/* Logo */}
        <div
          className="shrink-0 relative h-full flex items-center cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/images/web logo.png"
            alt="Siyana Gold & Diamonds"
            width={200}
            height={80}
            className="h-64 w-auto object-contain"
            onError={handleImageError}
            priority
          />
          <div
            className="hidden text-2xl font-bold text-gray-800 bg-yellow-100 px-4 py-2 rounded"
            style={{ display: "none" }}
          >
            Siyana Gold & Diamonds
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden lg:flex items-center w-full max-w-lg mx-8 border border-gray-300 rounded-full px-4 py-2 bg-white">
          <input
            type="text"
            placeholder="DIAMOND GOLD EARRINGS PENDANT RING EARRINGS BANGLES BRACELET STUD"
            className="w-full text-sm outline-none"
          />
          <Search size={20} className="text-gray-500 ml-2 cursor-pointer" />
        </div>

        {/* Icons Section */}
        <div className="flex items-center space-x-4 text-gray-700">
          <Heart
            size={24}
            className="cursor-pointer hover:text-teal-700 text-white"
            onClick={() => router.push("/wishlist")}
          />

          <div
            className="relative cursor-pointer hover:text-teal-700"
            onClick={handleCartClick}
          >
            <ShoppingCart size={24} className="text-white" />
            {!hideBadge && cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <button
            onClick={user ? onLogout : onLoginClick}
            className="cursor-pointer hover:text-teal-700"
          >
            <User size={24} className="text-white" />{userName}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
