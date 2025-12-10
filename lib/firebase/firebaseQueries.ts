// firebaseQueries.js
import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/firebaseConfig";
import { Category } from "@/types";
import { Product } from "@/types";
import moment from "moment";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User
} from "firebase/auth";

export const fetchProducts = async () => {
  const querySnapshot = await getDocs(collection(db, "products"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Fetch Home Carousel Data
export const fetchHomeCarousel = async () => {
  const snapshot = await getDocs(collection(db, "homeCarousel"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Fetch Gold Rate for Today
export const fetchTodaysGoldRate = async (todayDate: string) => {
  const goldQuery = query(
    collection(db, "goldRates"),
    where("date", "==", todayDate),
    limit(1)
  );

  const goldSnapshot = await getDocs(goldQuery);

  if (goldSnapshot.empty) return null;

  const docData = goldSnapshot.docs[0].data();
  return {
    perGram: docData.perGram,
    perPavan: docData.perPavan,
    date: docData.date,
    id: goldSnapshot.docs[0].id,
  };
};

// Combined Fetch if Needed
export const fetchHomePageData = async (todayDate: string) => {
  const [carouselData, goldRate] = await Promise.all([
    fetchHomeCarousel(),
    fetchTodaysGoldRate(todayDate),
  ]);

  return { carouselData, goldRate };
};

export const fetchCarouselItems = async () => {
  console.log("🔥 Fetching carousel data...");

  try {
    const snapshot = await getDocs(collection(db, "homeCarousel"));
    console.log("📌 Docs fetched count:", snapshot.size);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("❌ Firebase Fetch Error:", error);
    throw error; // important so React Query shows the error
  }
};



export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const snapshot = await getDocs(collection(db, "categories"));

    if (snapshot.empty) {
      console.warn("⚠️ No categories found");
      return []; // Safe empty return
    }

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];

    return data.reverse();;
  } catch (error: unknown) {
    console.error("❌ Category Fetch Error:", error);

    // throw readable error for UI
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch categories"
    );
  }
};


export const fetchProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  try {
    const productsRef = collection(db, "products");

    // try direct category_id
    const directQuery = query(productsRef, where("category_id", "==", categoryId));
    const directSnap = await getDocs(directQuery);
    if (!directSnap.empty) {
      return directSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];
    }

    // try nested category.id
    const nestedQuery = query(productsRef, where("category.id", "==", categoryId));
    const nestedSnap = await getDocs(nestedQuery);
    return nestedSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];
  } catch (error) {
    console.error("❌ Product Fetch Error:", error);
    throw new Error("Failed to fetch products");
  }
};


export const fetchProductById = async (productId: string): Promise<Product | null> => {
  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return null;
    }

    const data = productSnap.data();

    // 👉 Serialize Firestore timestamps (to prevent Next.js client error)
    return {
      id: productSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
    } as Product;
  } catch (error) {
    console.error("❌ Product Fetch Error:", error);
    throw new Error("Failed to fetch product");
  }
};


export const fetchOffers = async () => {
  console.log("🔥 Fetching offers data...");

  try {
    const snapshot = await getDocs(collection(db, "offer"));
    console.log("📌 Docs fetched count:", snapshot.size);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("❌ Firebase Fetch Error (offers):", error);
    throw error; // so React Query or your caller can handle it
  }
};


export const fetchGoldRate = async () => {
  console.log("🔥 Fetching today's gold rate...");

  const todayDate = moment().format("YYYY-MM-DD");

  try {
    const q = query(
      collection(db, "goldRates"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("⚠️ No gold rate found for today");
      return null;
    }

    const docData = snapshot.docs[0].data();
    console.log("📌 Gold rate fetched:", docData);

    return { id: snapshot.docs[0].id, ...docData };
  } catch (error) {
    console.error("❌ Firebase Fetch Error (gold rate):", error);
    throw error;
  }
};



export const signupUser = async (name: string, email: string, mobile: string, password: string) => {
  try {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Update display name
    await updateProfile(user, { displayName: name });

    // 3. Create user document in Firestore with role 'customer'
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      mobile,
      role: "customer",
      createdAt: new Date(),
    });

    return user; // return firebase auth user
  } catch (error) {
    console.error("Signup Error:", error);
    throw error;
  }
};

// Login
export const loginUser = async (identifier: string, password: string) => {
  try {
    let emailToUse = identifier;

    // If identifier is a mobile number, fetch corresponding email from Firestore
    if (/^\d+$/.test(identifier)) {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("mobile", "==", identifier), where("role", "==", "customer"));
      const snap = await getDocs(q);

      if (snap.empty) throw new Error("User not found");

      const userDoc = snap.docs[0];
      emailToUse = userDoc.data().email;
    }

    // Sign in with email & password
    const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
    const user = userCredential.user;

    // Fetch Firestore user document
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) throw new Error("User data not found");

    const userData = userDoc.data();

    if (userData.role !== "customer") throw new Error("Access denied. Not a customer.");

    const token = await user.getIdToken();

    return { token, user: { uid: user.uid, ...userData } };
  } catch (error: any) {
    console.error("Login Error:", error);
    throw new Error(error.message || "Login failed");
  }
};
export const addToCart = async (uid: string, product: any, quantity = 1) => {
  const cartRef = doc(db, "users", uid, "cart", product.id);
  const cartSnap = await getDoc(cartRef);

  if (cartSnap.exists()) {
    // Update quantity if product exists
    const currentQty = cartSnap.data().quantity || 0;
    await updateDoc(cartRef, { quantity: currentQty + quantity });
  } else {
    // Add new product
    await setDoc(cartRef, {
      ...product,
      quantity,
      addedAt: new Date(),
    });
  }
};



export const getUserCart = async (id: string) => {
  console.log('hello ', id)
  if (!id) return [];

  const cartCollectionRef = collection(db, "users", id, "cart");

  try {
    const snapshot = await getDocs(cartCollectionRef);
    const cartItems: any[] = [];

    snapshot.forEach((docItem) => {
      cartItems.push({ id: docItem.id, ...docItem.data() });
    });

    // Save count only in browser
    if (typeof window !== "undefined") {
      localStorage.setItem("siyana-cart-count", String(cartItems.length));
    }

    return cartItems;
  } catch (error) {
    console.error("Error fetching cart:", error);
    return [];
  }
};

export const removeFromCart = async (uid: string, productId: string | number) => {
  await deleteDoc(doc(db, "users", uid, "cart", productId + ""));
};

export const updateCartQuantity = async (
  uid: string,
  productId: string | number,
  newQuantity: number
) => {
  if (newQuantity < 1) return;
  const itemRef = doc(db, "users", uid, "cart", productId + "");
  await updateDoc(itemRef, { quantity: newQuantity });
};
export const clearCart = async (uid: string) => {
  const snapshot = await getDocs(collection(db, "users", uid, "cart"));
  const deleteOps = snapshot.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deleteOps);
};


export const addToWishlist = async (userId: string, product: any) => {
  try {
    const wishlistRef = doc(collection(db, "users", userId, "wishlist"), product.id);
    await setDoc(wishlistRef, {
      ...product,
      addedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return false;
  }
};

// Create order for WhatsApp checkout
export const createOrder = async (
  userId: string,
  userEmail: string,
  userName: string,
  cartItems: any[]
) => {
  try {
    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate total
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    // Create order document
    const orderData = {
      orderId,
      userId,
      userEmail,
      userName,
      items: cartItems,
      totalAmount,
      status: 'whatsapp_sent',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Firestore
    await setDoc(doc(db, "orders", orderId), orderData);

    return { success: true, orderId, totalAmount };
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error("Failed to create order");
  }
};

// Get order by ID
export const getOrderById = async (orderId: string) => {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    if (!orderDoc.exists()) {
      return null;
    }
    return { id: orderDoc.id, ...orderDoc.data() };
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
};
