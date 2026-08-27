import React from 'react';
import { X, Trash2, ArrowRight, ShoppingCart, Heart, Sparkles, ShieldCheck, Plus, Check } from 'lucide-react';
import { Course } from '../types.ts';

interface CartWishlistDrawersProps {
  isOpenCart: boolean;
  isOpenWishlist: boolean;
  onClose: () => void;
  courses: Course[];
  cartCourseIds: string[];
  wishlistCourseIds: string[];
  purchasedCourseIds: string[];
  onRemoveFromCart: (courseId: string) => void;
  onRemoveFromWishlist: (courseId: string) => void;
  onMoveToCart: (courseId: string) => void;
  onMoveToWishlist: (courseId: string) => void;
  onClearCart: () => void;
  onClearWishlist: () => void;
  onCheckoutCart: () => void;
}

export default function CartWishlistDrawers({
  isOpenCart,
  isOpenWishlist,
  onClose,
  courses,
  cartCourseIds,
  wishlistCourseIds,
  purchasedCourseIds,
  onRemoveFromCart,
  onRemoveFromWishlist,
  onMoveToCart,
  onMoveToWishlist,
  onClearCart,
  onClearWishlist,
  onCheckoutCart
}: CartWishlistDrawersProps) {
  if (!isOpenCart && !isOpenWishlist) return null;

  const currentDrawer = isOpenCart ? 'cart' : 'wishlist';
  const itemIds = currentDrawer === 'cart' ? cartCourseIds : wishlistCourseIds;
  
  // Get matching course objects, filtering out any that are now purchased
  const drawerCourses = courses.filter(c => itemIds.includes(c.id));

  // Cart financial summary calculations
  const subtotal = drawerCourses.reduce((sum, course) => sum + course.price, 0);
  const tax = subtotal > 0 ? Math.floor(subtotal * 0.05) : 0; // 5% mock academic vat/levy
  const total = subtotal + tax;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" id="drawers-modal-overlay">
      {/* Backdrop blur */}
      <div 
        className="absolute inset-0 bg-secondary-dark/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body Container */}
      <div 
        className="relative w-full max-w-md h-full bg-neutral-bg/95 backdrop-blur-2xl border-l border-neutral-medium/10 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft z-10"
        id="drawer-surface"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-neutral-medium/10 flex items-center justify-between bg-neutral-light">
          <div className="flex items-center gap-2 text-left">
            {currentDrawer === 'cart' ? (
              <>
                <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <ShoppingCart className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-neutral-dark">Your Academic Cart</h3>
                  <p className="text-[10px] font-mono text-neutral-medium uppercase tracking-wider">{cartCourseIds.length} Syllabi Staged</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-9 w-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Heart className="h-4.5 w-4.5 text-red-500 fill-red-500" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-neutral-dark">My Academic Wishlist</h3>
                  <p className="text-[10px] font-mono text-neutral-medium uppercase tracking-wider">{wishlistCourseIds.length} Pathways Desired</p>
                </div>
              </>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-medium/10 text-neutral-medium hover:text-neutral-dark cursor-pointer transition"
            id="drawer-close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-medium/5">
            <span className="text-[10px] font-mono font-bold text-neutral-medium uppercase tracking-widest leading-none">Registered Curriculum Items</span>
            {drawerCourses.length > 0 && (
              <button 
                onClick={currentDrawer === 'cart' ? onClearCart : onClearWishlist}
                className="text-[10px] font-mono font-semibold text-red-500 hover:text-red-600 transition flex items-center gap-1 cursor-pointer"
                id="drawer-clear-all"
              >
                <Trash2 className="h-3 w-3" />
                Clear All
              </button>
            )}
          </div>

          {drawerCourses.length === 0 ? (
            <div className="py-24 text-center space-y-4 border border-dashed border-neutral-medium/15 bg-neutral-light/50 rounded-2xl p-6 flex flex-col items-center justify-center">
              {currentDrawer === 'cart' ? (
                <>
                  <ShoppingCart className="h-10 w-10 text-neutral-300 animate-pulse" />
                  <span className="block text-xs text-neutral-medium font-medium">Your course cart is currently empty!</span>
                  <p className="text-[10px] text-neutral-medium max-w-[200px] leading-normal">Browse through GLASSEA's certified advanced syllabus courses and stage multiple tracks for consolidated enrollment.</p>
                </>
              ) : (
                <>
                  <Heart className="h-10 w-10 text-neutral-300 animate-pulse" />
                  <span className="block text-xs text-neutral-medium font-medium">Your wishlist has no tracks!</span>
                  <p className="text-[10px] text-neutral-medium max-w-[200px] leading-normal">Keep a close eye on modules that capture your interest. Easily move them to your live staged cart at any time.</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4" id="drawer-items-list">
              {drawerCourses.map((course) => {
                const isOwned = purchasedCourseIds.includes(course.id);
                return (
                  <div 
                    key={course.id}
                    className="flex gap-4 p-3.5 bg-neutral-light border border-neutral-medium/10 rounded-xl relative hover:border-neutral-medium/20 transition-all group text-left"
                    id={`drawer-item-${course.id}`}
                  >
                    {/* Tiny Thumbnail */}
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="h-14 w-14 rounded-lg object-cover bg-neutral-medium/20 border border-neutral-medium/10 shadow-sm shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between space-y-1">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-mono text-primary font-bold uppercase truncate max-w-[120px]">
                            {course.category}
                          </span>
                          <span className="text-xs font-mono font-bold text-neutral-medium">
                            {course.price === 0 ? 'Free' : `₦${course.price.toLocaleString()}`}
                          </span>
                        </div>
                        <h4 className="font-display font-semibold text-xs text-neutral-dark truncate leading-snug mt-0.5">
                          {course.title}
                        </h4>
                        <p className="text-[10px] text-neutral-medium truncate">By {course.instructorName}</p>
                      </div>

                      {/* Micro actions buttons */}
                      <div className="flex items-center gap-4 pt-1 text-[10px] font-mono">
                        {currentDrawer === 'cart' ? (
                          <>
                            <button
                              onClick={() => onRemoveFromCart(course.id)}
                              className="text-neutral-medium hover:text-red-500 transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                            <button
                              onClick={() => {
                                onMoveToWishlist(course.id);
                              }}
                              className="text-neutral-medium hover:text-primary transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Heart className="h-3 w-3 fill-none text-neutral-medium group-hover:text-red-400" />
                              Wishlist
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => onRemoveFromWishlist(course.id)}
                              className="text-neutral-medium hover:text-red-500 transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Drop
                            </button>
                            {isOwned ? (
                              <span className="text-green-600 font-bold flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Owned
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  onMoveToCart(course.id);
                                }}
                                className="text-primary hover:text-primary-dark font-bold transition cursor-pointer flex items-center gap-1.5"
                              >
                                <ShoppingCart className="h-3 w-3 text-primary" />
                                Move to Cart
                              </button>
                            )}
                          </>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer footer (Checkout summaries for Cart / explore for Wishlist) */}
        {drawerCourses.length > 0 && (
          <div className="p-6 border-t border-neutral-medium/10 bg-neutral-light space-y-4">
            {currentDrawer === 'cart' ? (
              <div className="space-y-4">
                {/* Invoice breakdown */}
                <div className="space-y-1.5 text-xs text-neutral-medium">
                  <div className="flex justify-between">
                    <span>Academics Subtotal</span>
                    <span className="font-mono text-neutral-dark">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="flex items-center gap-1">
                      Academic Processing Fee
                      <span className="px-1.5 py-0.2 bg-primary/10 text-primary uppercase text-[8px] font-mono rounded font-bold">5% VAT</span>
                    </span>
                    <span className="font-mono text-neutral-dark">₦{tax.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-neutral-medium/15 my-2" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-neutral-dark">Grand Tuition Locked</span>
                    <span className="font-mono font-black text-primary text-base">₦{total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={onCheckoutCart}
                  className="w-full py-3.5 bg-gradient-to-r from-primary via-primary-light to-accent text-black font-extrabold font-display text-xs rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow active:scale-[0.99] hover:scale-[1.01]"
                  id="checkout-consolidated-btn"
                >
                  <ShieldCheck className="h-4.5 w-4.5" />
                  Consolidated Secure Checkout
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="text-[9px] text-neutral-medium font-mono text-center uppercase tracking-wider">
                  Verified security powered by Paystack Sandbox Gateway
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-center">
                <button
                  onClick={() => {
                    // Move all remaining non-owned wishlisted items to cart
                    drawerCourses
                      .filter(c => !purchasedCourseIds.includes(c.id) && !cartCourseIds.includes(c.id))
                      .forEach(c => onMoveToCart(c.id));
                    onClose();
                  }}
                  className="w-full py-3 bg-[#1d4ed8]/10 hover:bg-[#1d4ed8]/20 text-[#1d4ed8] border border-[#1d4ed8]/30 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                  id="wishlist-move-all-btn"
                >
                  <Plus className="h-4 w-4" />
                  Move All Staged Elements to Cart
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
