import React, { useState, useEffect } from 'react';
import { BookOpen, Shield, User, ChevronDown, Sparkles, Award, Menu, X, Check, ShoppingCart, Heart, Sun, Moon } from 'lucide-react';
import { UserRole, Notification } from '../types.ts';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigate: (page: string) => void;
  activePage: string;
  userEmail: string;
  userName: string;
  cartCount: number;
  wishlistCount: number;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onLogout?: () => void;
}

export default function Navbar({
  currentRole,
  onRoleChange,
  onNavigate,
  activePage,
  userEmail,
  userName,
  cartCount,
  wishlistCount,
  notifications,
  markNotificationAsRead,
  isDarkMode,
  toggleTheme,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [showMenuDrop, setShowMenuDrop] = useState(false);
  const [showRoleDrop, setShowRoleDrop] = useState(false);
  const [showProfileDrop, setShowProfileDrop] = useState(false);
  const [showSubRoleDrop, setShowSubRoleDrop] = useState(true);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    markNotificationAsRead(id);
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'Compliance Admin';
      case 'INSTRUCTOR':
        return 'Expert Instructor';
      default:
        return 'Premium Student';
    }
  };

  const menuItems = currentRole === 'ADMIN' 
    ? [] 
    : [
        { label: 'Course Catalog', id: 'catalog-section' },
        { label: 'Why Us', id: 'why-us-section' },
      ];

  // Logic to determine if we should show the Simulation Perspective (Demo feature)
  // Usually hidden for a real app, but we can keep it for Students/Instructors if needed.
  // The user said "admin should only login to thier page", implying we should be strict.
  const showRoleSwitcher = false; // Disable demo switcher for cleaner production feel

  return (
    <div className="w-full fixed top-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none" id="navbar-floating-container">
      <div className="w-full max-w-4xl bg-secondary dark:bg-[#151D30] backdrop-blur-xl rounded-full border border-neutral-medium/15 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.05)] px-1.5 sm:px-2.5 py-1.5 sm:py-2 flex items-center justify-between pointer-events-auto relative" id="navbar-floating-inner">
        
        {/* Left: Hamburger [= Menu] button */}
        <button
          onClick={() => {
            setShowMenuDrop(!showMenuDrop);
            setShowRoleDrop(false);
          }}
          className="flex items-center gap-1 sm:gap-2 hover:bg-neutral-medium/10 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-full text-neutral-dark/95 transition text-xs font-semibold select-none cursor-pointer"
          id="menu-trigger-btn"
        >
          {showMenuDrop ? <X className="h-4 w-4 text-neutral-dark" /> : <Menu className="h-4 w-4 text-neutral-dark" />}
          <span className="hidden sm:inline">Menu</span>
          {unreadCount > 0 && (
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse"></span>
          )}
        </button>

        <div
          onClick={() => {
            if (currentRole === 'ADMIN') onNavigate('admin-dashboard');
            else if (currentRole === 'INSTRUCTOR') onNavigate('home');
            else onNavigate('home');
          }}
          className="absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none group"
          id="brand-logo"
        >
          <img
            src="./glassea-logo.png"
            alt="GLASSEA Logo"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover shadow-lg select-none shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fb = document.getElementById('brand-logo-fallback');
              if (fb) fb.style.display = 'flex';
            }}
          />
          <div 
            id="brand-logo-fallback" 
            className="hidden h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-tr from-primary to-accent items-center justify-center text-black font-black text-xs shadow-lg shrink-0"
          >
            G
          </div>
          <span className="font-display font-black text-xs sm:text-lg tracking-[0.2em] text-neutral-dark group-hover:text-primary transition-colors inline">
            GLASSEA
          </span>
        </div>

        {/* Right: Personalization controls & Join Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {userEmail ? (
            <button
              onClick={() => {
                setShowProfileDrop(!showProfileDrop);
                setShowMenuDrop(false);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-full border border-primary/25 bg-gradient-to-r from-primary/10 via-primary-light/10 to-accent/10 hover:from-primary/20 hover:via-primary-light/20 hover:to-accent/20 text-neutral-dark transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer relative shadow-sm"
              id="join-button"
              title="My Profile Account"
            >
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gradient-to-tr from-primary to-[#1d4ed8] text-white flex items-center justify-center font-bold text-[9px] sm:text-[10px]">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs font-semibold max-w-[80px] truncate pb-0.5">
                {userName}
              </span>
              <ChevronDown className={`h-3 w-3 text-neutral-500 transition-transform ${showProfileDrop ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-gradient-to-r from-primary via-primary-light to-accent text-black font-extrabold hover:scale-[1.02] active:scale-[0.98] transition-all rounded-full px-3 sm:px-5 py-1.5 sm:py-2.5 text-[10px] sm:text-xs cursor-pointer select-none shadow-md shadow-primary/20"
              id="join-button"
            >
              <span className="hidden sm:inline">Join us</span>
              <span className="inline sm:hidden">Join</span>
            </button>
          )}
        </div>

        {/* ================= DROPDOWN A: MAIN COMPACT MENU DROPDOWN ================= */}
        {showMenuDrop && (
          <div className="absolute top-[115%] left-1 right-1 sm:right-auto sm:left-2 sm:w-80 bg-secondary/95 dark:bg-[#151D30]/95 backdrop-blur-xl rounded-3xl border border-primary/20 shadow-2xl p-4 z-50 text-neutral-dark space-y-4 animate-fadeIn" id="menu-dropdown-layer">
            
            {/* Navigation links */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">ACADEMIC NAV</span>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setShowMenuDrop(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all ${
                    activePage === item.id 
                      ? 'bg-neutral-light text-primary-dark font-bold' 
                      : 'text-neutral-medium hover:bg-neutral-light hover:text-neutral-dark'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Switch Profile / Perspectives Section inside Menu - REMOVED FOR PRODUCTION STRICTNESS */}
            {showRoleSwitcher && (
              <div className="pt-3 border-t border-neutral-medium/15 space-y-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase block">SIMULATION PERSPECTIVE</span>
                
                <button
                  onClick={() => setShowSubRoleDrop(!showSubRoleDrop)}
                  className="w-full flex items-center justify-between hover:bg-neutral-light px-3 py-2 rounded-xl text-xs text-neutral-dark/95 font-semibold transition cursor-pointer border border-neutral-medium/10 bg-neutral-light/50"
                  id="role-switch-btn"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-primary animate-pulse-slow" />
                    <span className="text-left leading-normal text-[11px] sm:text-xs">
                      Role: <strong className="text-primary font-black uppercase text-[11px]">{currentRole === 'STUDENT' ? `${userName || 'Student'}` : (currentRole === 'INSTRUCTOR' ? 'Instructor' : 'Admin')}</strong>
                    </span>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-neutral-500 transition-transform duration-200 ${showSubRoleDrop ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}

            {/* Notifications panel in Menu */}
            <div className="pt-3 border-t border-neutral-medium/15">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">SYSTEM NOTIFICATIONS</span>
                {unreadCount > 0 && (
                  <span className="text-[9px] bg-red-100 text-red-600 border border-red-200 font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} Alerts
                  </span>
                )}
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-3">
                    <span className="text-[10px] text-neutral-400 font-medium">Notification inbox is empty.</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-colors ${
                        notif.isRead
                          ? 'bg-transparent border-neutral-medium/10'
                          : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1 mb-0.5">
                        <span className="text-[11px] font-bold text-neutral-dark leading-tight">{notif.title}</span>
                        {!notif.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-medium leading-normal">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* ================= DROPDOWN C: USER PROFILE DROPDOWN ================= */}
        {showProfileDrop && userEmail && (
          <div className="absolute top-[115%] right-2 w-72 bg-secondary/95 dark:bg-[#151D30]/95 backdrop-blur-xl rounded-3xl border border-primary/20 shadow-2xl p-4 z-50 text-neutral-dark space-y-4 animate-fadeIn" id="profile-dropdown-layer">
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-medium/15">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-[#1d4ed8] text-white flex items-center justify-center font-bold text-sm">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="text-left overflow-hidden">
                <span className="block font-display font-black text-xs text-neutral-dark truncate">
                  {userName}
                </span>
                <span className="block text-[10px] font-mono text-neutral-medium truncate mt-0.5">{userEmail}</span>
                <span className="inline-block text-[9px] font-mono text-primary font-bold uppercase mt-1 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                  {getRoleLabel(currentRole)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-around pb-3 border-b border-neutral-medium/15">
              {/* Wishlist Trigger */}
              <button
                onClick={onOpenWishlist}
                className="p-2 sm:p-2.5 rounded-full hover:bg-neutral-medium/10 text-neutral-medium hover:text-red-500 transition cursor-pointer relative flex items-center justify-center"
                title="My Wishlist"
                id="navbar-wishlist-trigger-btn"
              >
                <Heart className={`h-4 w-4 sm:h-4.5 sm:w-4.5 transition-all duration-200 ${wishlistCount > 0 ? 'fill-red-500 text-red-500 scale-105' : ''}`} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-3.5 min-w-[14px] px-0.5 bg-red-500 text-[8px] font-bold font-mono text-white rounded-full flex items-center justify-center border border-white/60 leading-none shadow">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart Trigger */}
              <button
                onClick={onOpenCart}
                className="p-2 sm:p-2.5 rounded-full hover:bg-neutral-medium/10 text-neutral-medium hover:text-[#00D9FF] transition cursor-pointer relative flex items-center justify-center"
                title="My Learning Cart"
                id="navbar-cart-trigger-btn"
              >
                <ShoppingCart className={`h-4 w-4 sm:h-4.5 sm:w-4.5 transition-all duration-200 ${cartCount > 0 ? 'text-[#00D9FF] scale-105' : ''}`} />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-3.5 min-w-[14px] px-0.5 bg-[#00D9FF] text-[8px] font-bold font-mono text-neutral-dark rounded-full flex items-center justify-center border border-white/60 leading-none shadow">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase block text-left">SUITE NAVIGATION</span>
              <button
                onClick={() => {
                  if (currentRole === 'STUDENT') onNavigate('student-dashboard');
                  else if (currentRole === 'INSTRUCTOR') onNavigate('instructor-dashboard');
                  else onNavigate('admin-dashboard');
                  setShowProfileDrop(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-neutral-medium hover:bg-neutral-light hover:text-neutral-dark flex items-center gap-2 border border-transparent hover:border-neutral-medium/10 transition cursor-pointer"
              >
                <Award className="h-4 w-4 text-primary animate-pulse shrink-0" />
                Go to Classroom Dashboard
              </button>
            </div>

            <div className="pt-2 border-t border-neutral-medium/15">
              <button
                onClick={() => {
                  setShowProfileDrop(false);
                  if (onLogout) onLogout();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-primary via-primary-light to-accent text-black hover:scale-[1.01] active:scale-[0.99] rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/15"
              >
                <X className="h-3.5 w-3.5" />
                Disconnect Portal
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
