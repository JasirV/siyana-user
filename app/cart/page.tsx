"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  CreditCard,
  Shield,
  Truck,
  RotateCcw,
  Heart,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import { CartItem } from "@/types";
import { ReactElement } from "react";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import Image from "next/image";
import { auth } from "@/lib/firebase/firebaseConfig";
import {
  addToWishlist,
  clearCart,
  getUserCart,
  removeFromCart,
  updateCartQuantity,
} from "@/lib/firebase/firebaseQueries";
import { onAuthStateChanged } from "firebase/auth";

export default function CartPage(): ReactElement {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState<boolean>(false)
  const [orderId, setOrderId] = useState<string>('')
  const [removingItem, setRemovingItem] = useState<string | number | null>(
    null
  );
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  useEffect(() => {
    setLoading(true)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      console.log("User Logged In:", firebaseUser.uid);
      const data = await getUserCart(firebaseUser.uid);
      setCart(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedCart = localStorage.getItem("siyana-cart");
    if (savedCart) setCart(JSON.parse(savedCart));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem("siyana-cart", JSON.stringify(cart));
    }
  }, [cart, loading]);

  const changeQuantity = async (productId: string, newQty: number) => {
    if (!user || newQty < 1) return;

    await updateCartQuantity(user.uid, productId, newQty);

    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleRemove = async (productId: string) => {
    if (!user) return;

    await removeFromCart(user.uid, productId);
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleClearCart = async () => {
    if (!user) return;

    await clearCart(user.uid);
    setCart([]);
  };

  const moveToWishlist = async (item: CartItem) => {
    if (!user) return;
    const success = await addToWishlist(user.uid, item);
    if (success) {
      await removeFromCart(user.uid, item.id);
      setCart((prev) => prev.filter((p) => p.id !== item.id));
    }
  };

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 10000 ? 0 : 200;
  const tax = subtotal * 0.18;
  const grandTotal = subtotal + shipping + tax;
  const savings = cart.reduce((total, item) => {
    if (item.originalPrice) {
      return total + (item.originalPrice - item.price) * item.quantity;
    }
    return total;
  }, 0);

  const generateOrderMessage = (): string => {
    const itemsText = cart
      .map(
        (item) =>
          `• ${item.name} - ${item.quantity
          } x ₹${item.price.toLocaleString()} = ₹${(
            item.price * item.quantity
          ).toLocaleString()}`
      )
      .join("\n");

    return `Hello! I would like to place an order:\n\n${itemsText}\n\nSubtotal: ₹${subtotal.toLocaleString()}\nShipping: ${shipping === 0 ? "Free" : `₹${shipping}`
      }\nTax: ₹${Math.round(tax).toLocaleString()}\nTotal: ₹${Math.round(
        grandTotal
      ).toLocaleString()}\n\nPlease confirm my order.`;
  };

  const handleWhatsAppCheckout = async (): Promise<void> => {
    if (!user) {
      alert("Please log in to checkout");
      return;
    }

    setIsCheckingOut(true);

    try {
      // Call checkout API
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || "Customer",
        }),
      });


      const data = await response.json();
      console.log(data, 'hello')
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Checkout failed");
      }

      // Clear local cart state
      setCart([]);

      // Open WhatsApp with the generated URL
      window.open(data.whatsappUrl, "_blank");

      // Show success message
      setOrderId(data.orderId)
      setOpen(true)
      localStorage.removeItem('siyana-cart-count')
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(error.message || "Failed to process checkout. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {open && <SuccessModal orderId={orderId} onClose={() => setOpen(false)} />}
      <NavbarWrapper />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#196b7a] rounded-lg">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Shopping Cart
                </h1>
                <p className="text-gray-600">
                  {totalItems}{" "}
                  {totalItems === 1 ? "precious item" : "precious items"} in
                  your collection
                </p>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-all duration-300"
              >
                Clear All Items
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            {!loading && cart.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-32 h-32 bg-linear-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-16 h-16 text-amber-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Your Cart Feels Light
                  </h2>
                  <p className="text-gray-600 mb-8 text-lg">
                    Discover our exquisite collection of jewelry and add some
                    sparkle to your cart
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/category/rings"
                      className="inline-flex items-center px-8 py-4 bg-[#196b7a] text-white font-semibold rounded-xl hover:bg-[#196b7a]/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      <Sparkles className="mr-3 w-5 h-5" />
                      Explore Collections
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                    <Link
                      href="/category/featured"
                      className="inline-flex items-center px-8 py-4 border-2 border-[#196b7a] text-[#196b7a] font-semibold rounded-xl hover:bg-[#196b7a] hover:text-white transition-all duration-300"
                    >
                      Featured Items
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${removingItem === item.id
                      ? "opacity-0 scale-95"
                      : "opacity-100 scale-100"
                      }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-6">
                        {/* Product Image */}
                        <div className="relative">
                          <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                            <Image
                              src={
                                typeof item?.images?.[0] === "string"
                                  ? item.images[0]
                                  : item?.images?.[0]?.url || "/images/placeholder.jpg"
                              }
                              alt={item.name}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {item.isNew && (
                            <span className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                {item.name}
                              </h3>
                              <p className="text-gray-600 text-sm mb-2">
                                {item?.category?.name ?? ""}
                              </p>
                              <div className="flex items-center gap-4">
                                <p className="text-amber-600 font-bold text-xl">
                                  ₹{item.price.toLocaleString()}
                                </p>
                                {item.originalPrice &&
                                  item.originalPrice > item.price && (
                                    <p className="text-gray-500 line-through text-sm">
                                      ₹{item.originalPrice.toLocaleString()}
                                    </p>
                                  )}
                              </div>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-700">
                                Quantity:
                              </span>
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() =>
                                    changeQuantity(item.id, item.quantity - 1)
                                  }
                                  className="p-2 text-gray-600 hover:bg-gray-50 transition-colors rounded-l-lg"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="px-4 py-2 font-medium min-w-12 text-center bg-white border-x border-gray-300">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    changeQuantity(item.id, item.quantity + 1)
                                  }
                                  className="p-2 text-gray-600 hover:bg-gray-50 transition-colors rounded-r-lg"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => moveToWishlist(item)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                title="Move to Wishlist"
                              >
                                <Heart className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemove(item.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                title="Remove from Cart"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Item Total:</span>
                        <span className="font-bold text-lg text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cart.length > 0 && (
            <div className="lg:w-1/3">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#196b7a]" />
                  Order Summary
                </h2>

                {/* Price Breakdown */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Subtotal ({totalItems} items)
                    </span>
                    <span className="font-medium">
                      ₹{subtotal.toLocaleString()}
                    </span>
                  </div>

                  {savings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>You Save</span>
                      <span className="font-medium">
                        ₹{Math.round(savings).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `₹${shipping}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (GST)</span>
                    <span className="font-medium">
                      ₹{Math.round(tax).toLocaleString()}
                    </span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount</span>
                      <span className="text-[#196b7a]">
                        ₹{Math.round(grandTotal).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <Truck className="w-6 h-6 text-[#196b7a] mx-auto mb-1" />
                    <p className="text-xs font-medium text-gray-900">
                      Free Shipping
                    </p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-6 h-6 text-[#196b7a] mx-auto mb-1" />
                    <p className="text-xs font-medium text-gray-900">
                      Secure Payment
                    </p>
                  </div>
                  <div className="text-center">
                    <RotateCcw className="w-6 h-6 text-[#196b7a] mx-auto mb-1" />
                    <p className="text-xs font-medium text-gray-900">
                      Easy Returns
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleWhatsAppCheckout}
                    disabled={isCheckingOut}
                    className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                  >
                    {isCheckingOut ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Preparing...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        Checkout via WhatsApp
                      </>
                    )}
                  </button>

                  <Link
                    href="/"
                    className="w-full text-center block text-[#196b7a] border-2 border-[#196b7a] py-4 rounded-xl font-semibold hover:bg-[#196b7a] hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Continue Shopping
                  </Link>
                </div>

                {/* WhatsApp Checkout Info */}
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800 mb-1">
                        WhatsApp Checkout
                      </p>
                      <p className="text-xs text-green-700">
                        Your order details will be automatically sent to our
                        team via WhatsApp for quick confirmation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Note */}
                <p className="text-center text-xs text-gray-500 mt-4">
                  🔒 Your order information is secure
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}


import { motion, AnimatePresence } from "framer-motion";
import Loading from "@/components/ui/Loading";


type Props = {
  orderId: string | number;
  onClose: () => void;
  isReturning?: boolean; // Add this prop to trigger animation when returning
};

// Confetti particle type
type ConfettiParticle = {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
  duration: number;
  color: string;
  type: "circle" | "rectangle" | "star" | "streamer";
  velocity: number;
};

function SuccessModal({
  orderId,
  onClose,
  isReturning = false, // Default to false
}: Props) {
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [showMassiveAnimation, setShowMassiveAnimation] = useState(false);

  // Trigger massive animation when returning
  useEffect(() => {
    if (isReturning) {
      setShowMassiveAnimation(true);
      generateMassiveConfetti();

      // Auto-hide massive animation after 5 seconds
      const timer = setTimeout(() => {
        setShowMassiveAnimation(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isReturning]);

  // Generate massive confetti particles
  const generateMassiveConfetti = () => {
    const particles: ConfettiParticle[] = [];
    const colors = [
      "#FF6B6B", "#4ECDC4", "#FFD166", "#06D6A0",
      "#118AB2", "#EF476F", "#FF9A00", "#B388FF",
      "#7C4DFF", "#00E5FF", "#FF4081", "#64FFDA"
    ];

    // Generate 200 particles for massive effect
    for (let i = 0; i < 200; i++) {
      const side = i < 100 ? "left" : "right";
      const baseX = side === "left" ? -50 : 150;

      particles.push({
        id: i,
        x: baseX + Math.random() * 100 - 50,
        y: -50 - Math.random() * 100,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 1.5,
        delay: Math.random() * 1.5,
        duration: 1.5 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: ["circle", "rectangle", "star", "streamer"][Math.floor(Math.random() * 4)] as any,
        velocity: 2 + Math.random() * 3,
      });
    }

    setConfetti(particles);
  };

  // Confetti particle component with different shapes
  const ConfettiParticle = ({ particle }: { particle: ConfettiParticle }) => {
    const getShapeStyle = () => {
      switch (particle.type) {
        case "circle":
          return { borderRadius: "50%" };
        case "rectangle":
          return { borderRadius: "2px" };
        case "star":
          return {
            clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          };
        case "streamer":
          return {
            width: "40px",
            height: "4px",
            borderRadius: "2px",
          };
        default:
          return { borderRadius: "2px" };
      }
    };

    return (
      <motion.div
        key={particle.id}
        className="absolute z-0 pointer-events-none"
        initial={{
          x: `${particle.x}%`,
          y: `${particle.y}%`,
          rotate: 0,
          scale: 0,
          opacity: 0,
        }}
        animate={{
          x: [
            `${particle.x}%`,
            `${particle.x + (Math.random() - 0.5) * 100}%`,
            `${particle.x + (Math.random() - 0.5) * 150}%`,
          ],
          y: [
            `${particle.y}%`,
            "120%",
            "200%",
          ],
          rotate: particle.rotation * 5,
          scale: [0, particle.scale, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          delay: particle.delay,
          duration: particle.duration,
          ease: "easeOut",
          times: [0, 0.5, 1],
        }}
        style={{
          width: particle.type === "streamer" ? "40px" : "12px",
          height: particle.type === "streamer" ? "4px" : "12px",
          backgroundColor: particle.color,
          filter: "brightness(1.2)",
          ...getShapeStyle(),
        }}
      />
    );
  };

  // Massive celebratory overlay for returning users
  const MassiveCelebration = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 pointer-events-none"
    >
      {/* Giant animated emojis */}
      <motion.div
        initial={{ scale: 0, y: -100 }}
        animate={{ scale: [0, 1.5, 1], y: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="absolute top-1/4 left-1/4 text-6xl"
      >
        🎉
      </motion.div>
      <motion.div
        initial={{ scale: 0, y: -100 }}
        animate={{ scale: [0, 1.5, 1], y: 0 }}
        transition={{ duration: 0.8, type: "spring", delay: 0.1 }}
        className="absolute top-1/3 right-1/4 text-7xl"
      >
        🎊
      </motion.div>
      <motion.div
        initial={{ scale: 0, y: -100 }}
        animate={{ scale: [0, 1.5, 1], y: 0 }}
        transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
        className="absolute bottom-1/3 left-1/3 text-8xl"
      >
        ✨
      </motion.div>

      {/* Celebration text */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-10 left-0 right-0 text-center"
      >
        <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full shadow-2xl">
          <h2 className="text-3xl font-bold">WELCOME BACK! 🎉</h2>
          <p className="text-lg opacity-90">Your order is being prepared!</p>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showMassiveAnimation ? 0.6 : 0.45 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 bg-black z-40"
        />

        {/* Massive confetti container - only when returning */}
        {showMassiveAnimation && (
          <div className="fixed inset-0 z-45 overflow-hidden pointer-events-none">
            {confetti.map((particle) => (
              <ConfettiParticle key={particle.id} particle={particle} />
            ))}
          </div>
        )}

        {/* Massive celebration overlay */}
        {showMassiveAnimation && <MassiveCelebration />}

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{
            scale: showMassiveAnimation ? 1.02 : 1,
            opacity: 1,
            y: showMassiveAnimation ? [0, -20, 0] : 0
          }}
          transition={{
            duration: 0.18,
            y: showMassiveAnimation ? {
              duration: 0.5,
              repeat: 3,
              repeatType: "reverse"
            } : undefined
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600"
            >
              ✕
            </button>

            {/* Animated border for celebration */}
            {showMassiveAnimation && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 border-4 border-transparent rounded-2xl pointer-events-none"
                style={{
                  background: "linear-gradient(45deg, #FF6B6B, #4ECDC4, #FFD166, #06D6A0, #118AB2, #EF476F)",
                  backgroundSize: "400% 400%",
                  animation: "gradient 3s ease infinite",
                }}
              />
            )}

            <div className="flex flex-col md:flex-row relative z-10 bg-white">
              {/* Left animated panel */}
              <motion.div
                initial={{ x: -120, opacity: 0 }}
                animate={{
                  x: 0,
                  opacity: 1,
                  scale: showMassiveAnimation ? [1, 1.05, 1] : 1
                }}
                transition={{
                  duration: 0.32,
                  ease: "easeOut",
                  scale: showMassiveAnimation ? {
                    duration: 0.5,
                    repeat: 2,
                    repeatType: "reverse"
                  } : undefined
                }}
                className="w-full md:w-1/2 p-6 bg-gradient-to-br from-emerald-50 to-white"
              >
                <div className="flex flex-col h-full justify-between">
                  <div>
                    {/* Success icon with celebration */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{
                        scale: 1,
                        rotate: showMassiveAnimation ? [0, 360] : 0
                      }}
                      transition={{
                        delay: 0.4,
                        type: "spring",
                        rotate: showMassiveAnimation ? {
                          duration: 1,
                          repeat: 2,
                          ease: "linear"
                        } : undefined
                      }}
                      className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 mx-auto relative"
                    >
                      <svg
                        className="w-10 h-10 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>

                      {/* Sparkles around checkmark */}
                      {showMassiveAnimation && (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0"
                          >
                            {[0, 90, 180, 270].map((angle) => (
                              <motion.div
                                key={angle}
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1, 0] }}
                                transition={{ duration: 1, repeat: Infinity, delay: angle * 0.01 }}
                                className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                                style={{
                                  left: `${35 + 30 * Math.cos((angle * Math.PI) / 180)}px`,
                                  top: `${35 + 30 * Math.sin((angle * Math.PI) / 180)}px`,
                                }}
                              />
                            ))}
                          </motion.div>
                        </>
                      )}
                    </motion.div>

                    <h3 className="text-2xl font-bold text-emerald-700 text-center mb-2">
                      {showMassiveAnimation ? "🎉 ORDER CONFIRMED! 🎉" : "Order Created"}
                    </h3>
                    <p className="mt-2 text-base text-gray-600 text-center">
                      Order <span className="font-bold text-lg">#{orderId}</span>{" "}
                      {showMassiveAnimation ? "is now being prepared!" : "created successfully."}
                    </p>
                    <p className="mt-4 text-sm text-gray-500 text-center">
                      {showMassiveAnimation
                        ? "Our team is working on your order right now! Thank you for your patience."
                        : "We'll prepare your order now. You can view order details or notify us via WhatsApp."
                      }
                    </p>

                    {/* Celebration message */}
                    {showMassiveAnimation && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-6 p-3 bg-gradient-to-r from-yellow-100 to-emerald-100 rounded-lg border border-yellow-200"
                      >
                        <p className="text-center text-emerald-800 font-medium">
                          ⚡ Estimated Preparation Time: <span className="font-bold">15-20 minutes</span>
                        </p>
                      </motion.div>
                    )}
                  </div>

                </div>
              </motion.div>

              {/* Right animated panel */}
              <motion.div
                initial={{ x: 120, opacity: 0 }}
                animate={{
                  x: 0,
                  opacity: 1,
                  scale: showMassiveAnimation ? [1, 1.05, 1] : 1
                }}
                transition={{
                  duration: 0.32,
                  ease: "easeOut",
                  scale: showMassiveAnimation ? {
                    duration: 0.5,
                    repeat: 2,
                    repeatType: "reverse"
                  } : undefined
                }}
                className="w-full md:w-1/2 p-6 bg-gradient-to-br from-sky-50 to-white flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-2xl font-bold text-sky-700 mb-4">
                    {showMassiveAnimation ? "📱 Still Need Help?" : "Need Help?"}
                  </h3>
                  <p className="text-base text-gray-600">
                    {showMassiveAnimation
                      ? "We're here to help! Message us on WhatsApp for any questions or updates about your order."
                      : "Want to confirm details or message us about the order? Use WhatsApp to contact support instantly."
                    }
                  </p>

                  <div className="mt-6 p-4 bg-white rounded-xl border border-sky-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={showMassiveAnimation ? {
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        } : {}}
                        transition={showMassiveAnimation ? {
                          duration: 0.5,
                          repeat: 3,
                          repeatType: "reverse"
                        } : {}}
                        className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="w-8 h-8 text-green-600"
                          fill="currentColor"
                        >
                          <path d="M20.52 3.48A11.88 11.88 0 0012 0C5.373 0 0 5.373 0 12c0 2.114.55 4.09 1.6 5.84L0 24l6.48-1.6A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12 0-3.2-1.25-6.16-3.48-8.52zM12 21.8c-1.34 0-2.66-.34-3.82-.98l-.27-.16-3.84.96.94-3.74-.17-.3A9.66 9.66 0 012.4 12c0-5.23 4.25-9.48 9.48-9.48 2.54 0 4.92.99 6.72 2.78 1.79 1.8 2.78 4.18 2.78 6.72 0 5.23-4.25 9.48-9.48 9.48z" />
                          <path d="M17.44 14.11c-.3-.15-1.75-.86-2.02-.96-.27-.1-.46-.15-.65.15-.18.3-.7.96-.86 1.16-.16.2-.32.22-.62.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.31-.02-.48.13-.63.13-.13.3-.33.45-.5.15-.17.2-.28.3-.47.1-.18.05-.33-.02-.48-.07-.15-.65-1.57-.89-2.16-.23-.57-.47-.49-.65-.5l-.55-.01c-.18 0-.47.07-.72.33-.25.27-.95.93-.95 2.26s.97 2.62 1.1 2.8c.13.18 1.88 2.9 4.56 3.96 3.2 1.22 3.2.81 3.78.76.58-.06 1.86-.76 2.12-1.5.26-.74.26-1.37.18-1.5-.08-.12-.3-.19-.6-.34z" />
                        </svg>
                      </motion.div>

                      <div className="flex-1">
                        <p className="text-lg font-bold text-green-700">
                          WhatsApp Support
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Instant messaging with our support team
                        </p>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(34, 197, 94, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(`https://wa.me/919876543210?text=Order%20${orderId}`, '_blank')}
                    className="mt-6 w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    <span>💬</span>
                    <span>Chat on WhatsApp</span>
                  </motion.button>
                </div>

                {/* Order status */}
                <div className="mt-8 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Order Status</span>
                    <motion.span
                      animate={showMassiveAnimation ? {
                        scale: [1, 1.1, 1],
                        color: ["#059669", "#10b981", "#34d399"]
                      } : {}}
                      transition={showMassiveAnimation ? {
                        duration: 0.5,
                        repeat: 3
                      } : {}}
                      className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold"
                    >
                      ⚡ Preparing
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
