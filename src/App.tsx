import { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, RefreshCw, Layers, Award, Cpu, Flame, CheckCircle2, WifiOff, Keyboard, ShieldAlert } from 'lucide-react';
import Navbar from './components/Navbar.tsx';
import Homepage from './components/Homepage.tsx';
import StudentDashboard from './components/StudentDashboard.tsx';
import CoursePlayer from './components/CoursePlayer.tsx';
import InstructorDashboard from './components/InstructorDashboard.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import AuthModal from './components/AuthModal.tsx';
import PaystackModal from './components/PaystackModal.tsx';
import CartWishlistDrawers from './components/CartWishlistDrawers.tsx';
import CustomCursor from './components/CustomCursor.tsx';
import { Course, Certificate, UserRole, Notification } from './types.ts';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, handleRedirectResult } from './firebase.ts';

export default function App() {
  // Offline & Accessibility States
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);

  // Connection monitoring & keyboard listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      triggerToast('Network connection recovered. System operational.');
    };
    const handleOffline = () => {
      setIsOffline(true);
      triggerToast('Terminal disconnected. Running in offline mode.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+K to scroll to Catalog
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNavigation('catalog-section');
      }
      // Ctrl+Shift+D to open Dashboard
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleNavigation('student-dashboard');
      }
      // Ctrl+Shift+H for shortcut panel toggle
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowKeyboardHints(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Global Session state
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem('glassea_user_role') as UserRole) || 'STUDENT';
  });
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('glassea_user_email') || '');
  const [userName, setUserName] = useState(() => localStorage.getItem('glassea_user_name') || '');
  const [activePage, setActivePage] = useState<string>(() => {
    if (window.location.hash === '#admin') {
      return 'admin-dashboard';
    }
    return localStorage.getItem('glassea_active_page') || 'home';
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(() => localStorage.getItem('glassea_selected_course_id') || null);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;

  useEffect(() => {
    if (selectedCourseId) {
      localStorage.setItem('glassea_selected_course_id', selectedCourseId);
    } else {
      localStorage.removeItem('glassea_selected_course_id');
    }
  }, [selectedCourseId]);

  // Purchased courses list (initially empty)
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        const email = user.email;
        const name = user.displayName || user.email.split('@')[0];
        let role: UserRole = 'STUDENT';
        if (email.includes('admin') || email.includes('mercer')) {
          role = 'ADMIN';
        } else if (email.includes('inst') || email.includes('carter')) {
          role = 'INSTRUCTOR';
        }
        
        setUserEmail(email);
        setUserName(name);
        setCurrentRole(role);
        localStorage.setItem('glassea_user_email', email);
        localStorage.setItem('glassea_user_name', name);
        localStorage.setItem('glassea_user_role', role);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle redirect result from Google Sign-In (for hosts with strict COOP headers like Render)
  useEffect(() => {
    handleRedirectResult().catch(console.error);
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // Modals visibility state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCheckoutCourse, setSelectedCheckoutCourse] = useState<Course | null>(null);
  const [directPaymentPlan, setDirectPaymentPlan] = useState<{ name: string; price: number } | null>(null);
  const [pendingCheckoutCourse, setPendingCheckoutCourse] = useState<Course | null>(null);
  const [pendingCheckoutCart, setPendingCheckoutCart] = useState<boolean>(false);

  // Global Toast HUD banner notifications
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart & Wishlist state synchronized with localStorage
  const [cartCourseIds, setCartCourseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('glassea_cart') || localStorage.getItem('knoova_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const [wishlistCourseIds, setWishlistCourseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('glassea_wishlist') || localStorage.getItem('knoova_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Global Site Config state (colors, hero text)
  const [siteConfig, setSiteConfig] = useState<any>({
    primaryColor: '#00D9FF'
  });

  useEffect(() => {
    const fetchSiteConfig = async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("./firebase.ts");
        const snap = await getDoc(doc(db, "site_config", "main"));
        if (snap.exists()) {
          const data = snap.data();
          setSiteConfig(data);
          if (data.primaryColor) {
            document.documentElement.style.setProperty('--primary', data.primaryColor);
            document.documentElement.style.setProperty('--primary-light', data.primaryColor);
          }
          if (data.accentColor) {
            document.documentElement.style.setProperty('--accent', data.accentColor);
            document.documentElement.style.setProperty('--accent-light', data.accentColor);
          }
          if (data.neutralBg) {
            document.documentElement.style.setProperty('--neutral-bg', data.neutralBg);
          }
        }
      } catch (err) {
        console.error("Error fetching site_config:", err);
      }
    };
    fetchSiteConfig();
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    localStorage.setItem('glassea_theme', 'dark');
  }, []);

  const toggleTheme = () => {};

  const [isOpenCart, setIsOpenCart] = useState(false);
  const [isOpenWishlist, setIsOpenWishlist] = useState(false);
  const [isCheckingOutCart, setIsCheckingOutCart] = useState(false);

  useEffect(() => {
    localStorage.setItem('glassea_cart', JSON.stringify(cartCourseIds));
  }, [cartCourseIds]);

  useEffect(() => {
    localStorage.setItem('glassea_wishlist', JSON.stringify(wishlistCourseIds));
  }, [wishlistCourseIds]);

  // Sync activePage with localStorage and window location hash
  useEffect(() => {
    localStorage.setItem('glassea_active_page', activePage);
    if (activePage === 'admin-dashboard') {
      if (window.location.hash !== '#admin') {
        window.history.pushState(null, '', '#admin');
      }
    } else {
      if (window.location.hash === '#admin') {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [activePage]);

  // Listen for hashchange events to handle back/forward navigation or typing URL hashes manually
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setActivePage('admin-dashboard');
      } else if (activePage === 'admin-dashboard') {
        setActivePage('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activePage]);

  const handleToggleCart = (courseId: string) => {
    const isOwned = purchasedCourseIds.includes(courseId);
    if (isOwned) {
      triggerToast('You already own this course!');
      return;
    }

    setCartCourseIds((prev) => {
      const exists = prev.includes(courseId);
      if (exists) {
        triggerToast('Removed from your staged academic cart.');
        return prev.filter((id) => id !== courseId);
      } else {
        const course = courses.find((c) => c.id === courseId);
        triggerToast(`"${course?.title || 'Course'}" staged in your academic cart!`);
        return [...prev, courseId];
      }
    });
  };

  const handleToggleWishlist = (courseId: string) => {
    setWishlistCourseIds((prev) => {
      const exists = prev.includes(courseId);
      if (exists) {
        triggerToast('Removed from your academic wishlist.');
        return prev.filter((id) => id !== courseId);
      } else {
        const course = courses.find((c) => c.id === courseId);
        triggerToast(`"${course?.title || 'Course'}" added to your academic wishlist!`);
        return [...prev, courseId];
      }
    });
  };

  const handleRemoveFromCart = (courseId: string) => {
    setCartCourseIds((prev) => prev.filter((id) => id !== courseId));
    triggerToast('Course removed from staged cart.');
  };

  const handleRemoveFromWishlist = (courseId: string) => {
    setWishlistCourseIds((prev) => prev.filter((id) => id !== courseId));
    triggerToast('Course removed from wishlist.');
  };

  const handleMoveToCart = (courseId: string) => {
    setWishlistCourseIds((prev) => prev.filter((id) => id !== courseId));
    setCartCourseIds((prev) => {
      if (!prev.includes(courseId)) return [...prev, courseId];
      return prev;
    });
    const course = courses.find((c) => c.id === courseId);
    triggerToast(`"${course?.title || 'Course'}" moved to staged cart!`);
  };

  const handleMoveToWishlist = (courseId: string) => {
    setCartCourseIds((prev) => prev.filter((id) => id !== courseId));
    setWishlistCourseIds((prev) => {
      if (!prev.includes(courseId)) return [...prev, courseId];
      return prev;
    });
    const course = courses.find((c) => c.id === courseId);
    triggerToast(`"${course?.title || 'Course'}" moved to your wishlist!`);
  };

  const handleClearCart = () => {
    setCartCourseIds([]);
    triggerToast('Cleared all items from your staged cart.');
  };

  const handleClearWishlist = () => {
    setWishlistCourseIds([]);
    triggerToast('Cleared all items from your wishlist.');
  };

  const handleCheckoutCart = () => {
    if (!userEmail) {
      setPendingCheckoutCart(true);
      setIsOpenCart(false);
      setShowAuthModal(true);
      triggerToast('Please log in or register to secure checkout of your academic cart.');
      return;
    }
    setIsOpenCart(false);
    setIsCheckingOutCart(true);
  };

  const syncPurchasedCourses = async (email: string) => {
    if (!email) return;
    try {
      const { doc, getDoc, setDoc } = await import("firebase/firestore");
      const { db } = await import("./firebase.ts");
      const docRef = doc(db, "purchasedCourseIds", email);
      const docSnap = await getDoc(docRef);

      let firestoreCourseIds: string[] = [];
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.courseIds)) {
          firestoreCourseIds = data.courseIds;
        }
      }

      // Merge with express stats fallback if they have purchases there
      let expressCourseIds: string[] = [];
      try {
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.purchases) {
            expressCourseIds = statsData.purchases
              .filter((p: any) => p.userId === email && p.status === 'success')
              .map((p: any) => p.courseId);
          }
        }
      } catch (e) {
        console.warn('Could not load fallback stats:', e);
      }

      const merged = Array.from(new Set([...firestoreCourseIds, ...expressCourseIds]));
      setPurchasedCourseIds(merged);

      // If document doesn't exist but we had purchases from express, initialize the document in Firestore
      if (!docSnap.exists() && merged.length > 0) {
        await setDoc(docRef, { courseIds: merged, updatedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.warn("Failed to sync purchased courses with Firestore:", err);
    }
  };

  const addPurchasedCoursesToFirestore = async (email: string, newCourseIds: string[]) => {
    if (!email || newCourseIds.length === 0) return;
    try {
      const { runTransaction, doc } = await import("firebase/firestore");
      const { db } = await import("./firebase.ts");

      const docRef = doc(db, "purchasedCourseIds", email);

      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        let existingIds: string[] = [];
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.courseIds)) {
            existingIds = data.courseIds;
          }
        }

        const merged = Array.from(new Set([...existingIds, ...newCourseIds]));
        transaction.set(docRef, {
          courseIds: merged,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });

      // Update local state and trigger sync
      await syncPurchasedCourses(email);
    } catch (err) {
      console.error("Firestore transaction for purchase failed:", err);
      // Fallback state update
      setPurchasedCourseIds((prev) => Array.from(new Set([...prev, ...newCourseIds])));
      triggerToast("Secure sandbox checkout completed. Cloud synchronization pending.");
    }
  };

  const handleCartPaymentSuccess = async (ref: string) => {
    triggerToast(`Success! Verified multi-item course enrollment. Reference: ${ref}.`);
    setPurchasedCourseIds((prev) => Array.from(new Set([...prev, ...cartCourseIds])));
    if (userEmail) {
      await addPurchasedCoursesToFirestore(userEmail, cartCourseIds);
    }
    setCartCourseIds([]);
    setIsCheckingOutCart(false);
    fetchMainDatabase();
    setActivePage('student-dashboard');
  };

  // Listen to purchasedCourseIds, cartCourseIds and wishlistCourseIds document in Firestore for true real-time synchronization
  useEffect(() => {
    if (!userEmail) {
      setPurchasedCourseIds([]);
      setCartCourseIds([]);
      setWishlistCourseIds([]);
      return;
    }

    let unsubscribePurchased: (() => void) | undefined;
    let unsubscribeCart: (() => void) | undefined;
    let unsubscribeWishlist: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        const { doc, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("./firebase.ts");

        // Sync initial state (existing function already handles purchasing, 
        // I should also fetch cart/wishlist initial state here)
        await syncPurchasedCourses(userEmail);
        
        // Fetch cart/wishlist initial state (could be simpler than syncPurchasedCourses if no express fallback)
        // I'll just load them directly
        const { getDoc } = await import("firebase/firestore");
        const cartRef = doc(db, "carts", userEmail);
        const wishlistRef = doc(db, "wishlists", userEmail);
        
        const cartSnap = await getDoc(cartRef);
        if (cartSnap.exists()) {
          setCartCourseIds(cartSnap.data().courseIds || []);
        }
        
        const wishlistSnap = await getDoc(wishlistRef);
        if (wishlistSnap.exists()) {
          setWishlistCourseIds(wishlistSnap.data().courseIds || []);
        }

        // Setup real-time listeners
        const purchasedRef = doc(db, "purchasedCourseIds", userEmail);
        unsubscribePurchased = onSnapshot(purchasedRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (Array.isArray(data.courseIds)) {
              setPurchasedCourseIds((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(data.courseIds)) return prev;
                return data.courseIds;
              });
            }
          }
        });

        unsubscribeCart = onSnapshot(cartRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (Array.isArray(data.courseIds)) {
              setCartCourseIds((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(data.courseIds)) return prev;
                return data.courseIds;
              });
            }
          }
        });

        unsubscribeWishlist = onSnapshot(wishlistRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (Array.isArray(data.courseIds)) {
              setWishlistCourseIds((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(data.courseIds)) return prev;
                return data.courseIds;
              });
            }
          }
        });

      } catch (err) {
        console.warn("Could not setup real-time firestore listeners:", err);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribePurchased) unsubscribePurchased();
      if (unsubscribeCart) unsubscribeCart();
      if (unsubscribeWishlist) unsubscribeWishlist();
    };
  }, [userEmail]);

  // Sync cart and wishlist changes to Firestore
  useEffect(() => {
    if (!userEmail) return;
    
    const saveCartAndWishlist = async () => {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        const { db } = await import("./firebase.ts");

        const cartRef = doc(db, "carts", userEmail);
        await setDoc(cartRef, { courseIds: cartCourseIds, updatedAt: new Date().toISOString() }, { merge: true });

        const wishlistRef = doc(db, "wishlists", userEmail);
        await setDoc(wishlistRef, { courseIds: wishlistCourseIds, updatedAt: new Date().toISOString() }, { merge: true });
        
      } catch (err) {
        console.warn("Failed to sync cart/wishlist to Firestore:", err);
      }
    };
    
    // Use a small debounce or just sync directly. For now, sync directly as it is small data.
    saveCartAndWishlist();
  }, [cartCourseIds, wishlistCourseIds, userEmail]);

  // On boot load catalog lists
  useEffect(() => {
    fetchMainDatabase();
  }, [activePage]);

  // Fetch real-time notifications for the current role
  useEffect(() => {
    if (!userEmail) {
      setNotifications([]);
      return;
    }
    const userId = userEmail;
    fetch(`/api/notifications?userId=${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Status " + res.status);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(prev => {
            const merged = [...data, ...prev];
            const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
            return unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          });
        }
      })
      .catch((e) => console.warn('Could not load notifications from local API (will retry on navigate):', e));
  }, [userEmail, activePage]);

  const fetchMainDatabase = async () => {
    setLoading(true);

    try {
      const { collection, getDocs, doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("./firebase.ts");

      let coursesData: any[] = [];
      try {
        // Load courses from Firestore
        const querySnapshot = await getDocs(collection(db, "courses"));
        querySnapshot.forEach((doc) => {
          coursesData.push({ id: doc.id, ...doc.data() });
        });
      } catch (firestoreErr) {
        console.warn("Could not read courses from Firestore:", firestoreErr);
      }

      // Fetch counts from Express backend (Firestore-backed counts)
      try {
        const countsRes = await fetch('/api/courses/counts');
        if (countsRes.ok) {
          const countsData = await countsRes.json();
          coursesData = coursesData.map(c => ({
            ...c,
            studentsCount: countsData[c.id] ?? c.studentsCount
          }));
        }
      } catch (countsErr) {
        console.warn("Could not fetch real course counts:", countsErr);
      }

      setCourses(coursesData.filter(c => c !== null));

    } catch (err) {
      console.warn('Unhandled exception in fetchMainDatabase:', err);
    } finally {
      // Also load stats from mock Express backend
      try {
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.purchases) {
            const userPurchased = userEmail
              ? statsData.purchases
                .filter((p: any) => p.userId === userEmail && p.status === 'success')
                .map((p: any) => p.courseId)
              : [];
            setPurchasedCourseIds((prev) => Array.from(new Set([...prev, ...userPurchased])));
          }
          if (Array.isArray(statsData.certificates)) {
            const userCerts = userEmail
              ? statsData.certificates.filter((c: any) => c.userId === userEmail)
              : [];
            setCertificates(userCerts);
          } else {
            setCertificates([]);
          }
        }
      } catch (e) {
        console.warn('Could not load stats fallback data:', e);
      }
      setLoading(false);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setNotifications(prev => [
      {
        id: Date.now().toString() + Math.random().toString(),
        userId: userEmail || 'system',
        title: 'System Telemetry',
        message: msg,
        isRead: false,
        createdAt: new Date().toISOString()
      },
      ...prev
    ].slice(0, 20)); // Keep the 20 most recent alerts
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleAuthSuccess = (email: string, role: UserRole, name?: string) => {
    setUserEmail(email);
    setCurrentRole(role);
    setShowAuthModal(false);
    
    let finalName = '';
    if (name) {
      finalName = name;
    } else {
      if (email === 'amina@premium.lms') {
        finalName = 'Amina Bello';
      } else if (email === 'carter@premium.lms') {
        finalName = 'Dr. Carter';
      } else if (email === 'mercer@premium.lms') {
        finalName = 'Admin David';
      } else {
        finalName = email.split('@')[0];
      }
    }
    setUserName(finalName);
    localStorage.setItem('glassea_user_email', email);
    localStorage.setItem('glassea_user_name', finalName);
    localStorage.setItem('glassea_user_role', role);

    triggerToast(`Authenticated successfully! Active role profile: ${role}`);
    
    if (pendingCheckoutCourse) {
      setSelectedCheckoutCourse(pendingCheckoutCourse);
      setPendingCheckoutCourse(null);
    } else if (pendingCheckoutCart) {
      setIsCheckingOutCart(true);
      setPendingCheckoutCart(false);
    } else {
      // Auto route based on logged-in role
      if (role === 'ADMIN') {
        setActivePage('admin-dashboard');
      } else if (role === 'INSTRUCTOR') {
        setActivePage('instructor-dashboard');
      } else {
        setActivePage('student-dashboard');
      }
    }
  };

  const handleLogout = async () => {
    try {
      const { logout } = await import('./firebase.ts');
      await logout();
    } catch (e) {
      console.warn('Firebase logout failed', e);
    }
    setUserEmail('');
    setUserName('');
    setPurchasedCourseIds([]);
    setCertificates([]);
    localStorage.removeItem('glassea_user_email');
    localStorage.removeItem('glassea_user_name');
    localStorage.removeItem('glassea_user_role');
    triggerToast('Securely disconnected from all virtual academic terminals.');
    setActivePage('home');
  };

  const handleSelectCourseAction = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const isOwned = purchasedCourseIds.includes(courseId);
    if (isOwned) {
      setSelectedCourseId(course.id);
      setActivePage('course-player');
    } else {
      if (!userEmail) {
        setPendingCheckoutCourse(course);
        setShowAuthModal(true);
        triggerToast('Please log in or register to secure your course admission.');
        return;
      }
      // Trigger Paystack secure purchase
      setSelectedCheckoutCourse(course);
    }
  };

  const handlePlanCheckoutAction = (planName: string, price: number) => {
    // Treat pricing plans as direct tuition lock-ins
    setDirectPaymentPlan({ name: planName, price });
  };

  const handlePaymentSuccess = async (reference: string) => {
    if (selectedCheckoutCourse) {
      triggerToast(`Success! Verified lock on course: ${selectedCheckoutCourse.title}. Reference generated.`);
      setPurchasedCourseIds((prev) => Array.from(new Set([...prev, selectedCheckoutCourse.id])));
      if (userEmail) {
        await addPurchasedCoursesToFirestore(userEmail, [selectedCheckoutCourse.id]);
      }
    } else if (directPaymentPlan) {
      triggerToast(`Lifetime ${directPaymentPlan.name} membership initialized correctly.`);
      const allCourseIds = courses.map((c) => c.id);
      setPurchasedCourseIds(allCourseIds);
      if (userEmail) {
        await addPurchasedCoursesToFirestore(userEmail, allCourseIds);
      }
    }

    setSelectedCheckoutCourse(null);
    setDirectPaymentPlan(null);
    fetchMainDatabase();
    setActivePage('student-dashboard');
  };

  const handleNewCertificateGranted = (title: string) => {
    triggerToast(`Congratulations! Verifiable credential dispatched for: ${title}`);
    fetchMainDatabase();
  };

  const handleNavigation = (page: string) => {
    // Role-based navigation restrictions
    if (currentRole === 'ADMIN' && page !== 'admin-dashboard') {
      triggerToast('Access Restricted: Admins are confined to the management terminal.');
      setActivePage('admin-dashboard');
      return;
    }

    const isScrollable = ['why-us-section', 'courses', 'catalog-section'].includes(page);
    if (isScrollable) {
      setActivePage('home');
      setTimeout(() => {
        let targetId = page;
        if (page === 'courses') targetId = 'catalog-section';
        const el = document.getElementById(targetId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setActivePage(page);
    }
  };

  const purchasedCourses = courses.filter((c) => purchasedCourseIds.includes(c.id));

  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-dark flex flex-col relative" id="app-viewport-terminal">
      
      {/* Top sticky navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onNavigate={handleNavigation}
        activePage={activePage}
        userEmail={userEmail}
        userName={userName}
        cartCount={cartCourseIds.length}
        wishlistCount={wishlistCourseIds.length}
        notifications={notifications}
        markNotificationAsRead={markNotificationAsRead}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onOpenCart={() => {
          setIsOpenCart(true);
          setIsOpenWishlist(false);
        }}
        onOpenWishlist={() => {
          setIsOpenWishlist(true);
          setIsOpenCart(false);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Layout Area */}
      <main className="flex-1">
        
        {activePage === 'home' && (
          <Homepage
            courses={courses}
            isLoading={loading}
            onSelectCourse={handleSelectCourseAction}
            onNavigate={handleNavigation}
            purchasedCourseIds={purchasedCourseIds}
            cartCourseIds={cartCourseIds}
            wishlistCourseIds={wishlistCourseIds}
            onToggleCart={handleToggleCart}
            onToggleWishlist={handleToggleWishlist}
            siteConfig={siteConfig}
            currentRole={currentRole}
          />
        )}

        {!loading && activePage === 'student-dashboard' && (
          <StudentDashboard
            purchasedCourses={purchasedCourses}
            purchasedCourseIds={purchasedCourseIds}
            onSelectCourse={handleSelectCourseAction}
            certificates={certificates}
            onNavigate={handleNavigation}
            userEmail={userEmail}
            userName={userName}
            wishlistCourses={courses.filter((c) => wishlistCourseIds.includes(c.id))}
            onMoveWishlistItemToCart={handleMoveToCart}
            onRemoveFromWishlist={handleRemoveFromWishlist}
            loading={loading}
            activities={notifications}
          />
        )}

        {!loading && activePage === 'course-player' && selectedCourse && (
          <CoursePlayer
            course={selectedCourse}
            userEmail={userEmail}
            userName={userName}
            onCertificateEarned={handleNewCertificateGranted}
            onNavigate={handleNavigation}
          />
        )}

        {!loading && activePage === 'instructor-dashboard' && (
          <InstructorDashboard
            courses={courses}
            onCourseCreated={fetchMainDatabase}
            userEmail={userEmail}
            loading={loading}
          />
        )}

        {!loading && activePage === 'admin-dashboard' && (
          currentRole === 'ADMIN' ? (
            <AdminDashboard
              courses={courses}
              onCourseApproved={fetchMainDatabase}
              userEmail={userEmail}
              loading={loading}
            />
          ) : (
            <div className="min-h-[85vh] flex items-center justify-center px-4 py-20 bg-neutral-bg">
              <div className="max-w-md w-full bg-secondary dark:bg-[#151D30] rounded-3xl border border-red-500/20 shadow-2xl p-8 text-center space-y-6 animate-fadeIn">
                <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <ShieldAlert className="h-8 w-8 text-red-500 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-display font-black text-xl text-neutral-dark tracking-tight">Compliance Terminal Restricted</h2>
                  <p className="text-xs text-neutral-medium leading-relaxed">
                    Access to this system area is restricted to authorized administrative compliance officers. Please authenticate using verified credentials to enter the management dashboard.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full py-3 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white font-extrabold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-red-500/20 text-xs"
                    id="admin-auth-btn"
                  >
                    Authenticate as Administrator
                  </button>
                  <button
                    onClick={() => handleNavigation('home')}
                    className="w-full py-3 bg-neutral-light border border-neutral-medium/10 text-neutral-dark font-semibold rounded-xl hover:bg-neutral-light/80 transition-colors cursor-pointer text-xs"
                    id="admin-back-btn"
                  >
                    Return to Student Terminal
                  </button>
                </div>
              </div>
            </div>
          )
        )}

      </main>

      {/* ================= MODAL: SECURE AUTHENTICATION DIALOG ================= */}
      {showAuthModal && (
        <AuthModal
          onAuthComplete={handleAuthSuccess}
          onClose={() => setShowAuthModal(false)}
          adminOnly={activePage === 'admin-dashboard'}
        />
      )}

      {/* ================= MODAL: SECURE PAYSTACK CHECKOUT (COURSE) ================= */}
      {selectedCheckoutCourse && (
        <PaystackModal
          amount={selectedCheckoutCourse.price}
          email={userEmail}
          userName={userName}
          courseTitle={selectedCheckoutCourse.title}
          courseId={selectedCheckoutCourse.id}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentClose={() => setSelectedCheckoutCourse(null)}
        />
      )}

      {/* ================= MODAL: SECURE PAYSTACK CHECKOUT (LIFEPASS PLAN) ================= */}
      {directPaymentPlan && (
        <PaystackModal
          amount={directPaymentPlan.price}
          email={userEmail}
          userName={userName}
          courseTitle={`${directPaymentPlan.name} Admission Membership`}
          courseIds={courses.map((c) => c.id)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentClose={() => setDirectPaymentPlan(null)}
        />
      )}

      {/* ================= DRAWERS: CART & WISHLIST OVERLAYS ================= */}
      <CartWishlistDrawers
        isOpenCart={isOpenCart}
        isOpenWishlist={isOpenWishlist}
        onClose={() => {
          setIsOpenCart(false);
          setIsOpenWishlist(false);
        }}
        courses={courses}
        cartCourseIds={cartCourseIds}
        wishlistCourseIds={wishlistCourseIds}
        purchasedCourseIds={purchasedCourseIds}
        onRemoveFromCart={handleRemoveFromCart}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onMoveToCart={handleMoveToCart}
        onMoveToWishlist={handleMoveToWishlist}
        onClearCart={handleClearCart}
        onClearWishlist={handleClearWishlist}
        onCheckoutCart={handleCheckoutCart}
      />

      {/* ================= MODAL: SECURE CONSOLIDATED CART PAYSTACK CHECKOUT ================= */}
      {isCheckingOutCart && (
        <PaystackModal
          amount={courses.filter((c) => cartCourseIds.includes(c.id)).reduce((sum, c) => sum + c.price, 0) + Math.floor(courses.filter((c) => cartCourseIds.includes(c.id)).reduce((sum, c) => sum + c.price, 0) * 0.05)}
          email={userEmail}
          userName={userName}
          courseTitle="Consolidated Staged Cart"
          courseIds={cartCourseIds}
          onPaymentSuccess={handleCartPaymentSuccess}
          onPaymentClose={() => setIsCheckingOutCart(false)}
        />
      )}

      {/* ================= GLOBAL REAL-TIME HUD TOAST BANNER ================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border border-accent-alt rounded-2xl p-4 flex items-center gap-3 shadow-2xl animate-bounce glow-neon-emerald" id="toast-notif-bar">
          <CheckCircle2 className="h-5 w-5 text-accent-alt animate-pulse shrink-0" />
          <div className="text-xs font-mono text-left">
            <span className="block font-bold text-neutral-dark uppercase tracking-wider">SYSTEM TELEMETRY DISPATCH</span>
            <span className="text-neutral-medium italic block mt-0.5">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ================= OFFLINE PERSISTENCE BANNER ================= */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 z-50 glass-panel border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-2xl glow-neon-pink max-w-sm animate-pulse" id="offline-notif-bar">
          <WifiOff className="h-5 w-5 text-red-500 shrink-0" />
          <div className="text-xs font-mono text-left">
            <span className="block font-bold text-red-500 uppercase tracking-wider">OFFLINE MODE DETECTED</span>
            <span className="text-neutral-medium text-[10px] block mt-0.5">Your changes will sync with local memory fallback automatically.</span>
          </div>
        </div>
      )}

      {/* ================= KEYBOARD ACCESSIBILITY PORTAL ================= */}
      {showKeyboardHints && (
        <div className="fixed inset-0 bg-neutral-bg/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowKeyboardHints(false)}>
          <div className="w-full max-w-md bg-secondary dark:bg-neutral-bg border border-primary/20 rounded-3xl p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-neutral-medium/10 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-neutral-dark font-mono uppercase tracking-wider">Keyboard Shortcuts Portal</h3>
              </div>
              <button onClick={() => setShowKeyboardHints(false)} className="text-xs text-neutral-medium hover:text-neutral-dark font-mono uppercase">Close</button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-medium/10">
                <span className="text-neutral-medium">Go to Course Catalog</span>
                <span className="bg-neutral-light border border-neutral-medium/10 px-2 py-0.5 rounded text-[10px] font-mono text-primary font-bold">Ctrl + Shift + K</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-medium/10">
                <span className="text-neutral-medium">Open Student Dashboard</span>
                <span className="bg-neutral-light border border-neutral-medium/10 px-2 py-0.5 rounded text-[10px] font-mono text-primary font-bold">Ctrl + Shift + D</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-medium/10">
                <span className="text-neutral-medium">Toggle Shortcuts Help</span>
                <span className="bg-neutral-light border border-neutral-medium/10 px-2 py-0.5 rounded text-[10px] font-mono text-primary font-bold">Ctrl + Shift + H</span>
              </div>
            </div>
            <div className="bg-primary/5 rounded-2xl p-3 border border-primary/10 text-[11px] text-neutral-medium leading-relaxed">
              <strong>Tip:</strong> These keys provide keyboard accessibility to navigate our virtual terminals quickly and efficiently without relying solely on cursor clicks.
            </div>
          </div>
        </div>
      )}

      {/* Small subtle shortcuts HUD indicator in bottom-left footer corner */}
      <button 
        onClick={() => setShowKeyboardHints(true)} 
        className="fixed bottom-6 left-6 z-40 p-2 rounded-full glass-panel border border-neutral-medium/10 hover:border-primary/40 text-neutral-medium hover:text-primary transition-all shadow-md group hidden sm:block"
        title="Show Keyboard Shortcuts Portal"
      >
        <Keyboard className="w-4 h-4" />
      </button>

      <CustomCursor />
    </div>
  );
}
