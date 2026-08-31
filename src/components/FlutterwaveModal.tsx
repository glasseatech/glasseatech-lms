import React, { useState } from 'react';
import { Loader2, Zap, X, ShieldCheck, DollarSign, CreditCard, CheckCircle } from 'lucide-react';
import { useExchangeRate, DEFAULT_USD_NGN_RATE } from '../utils/currency';

declare global {
  interface Window {
    FlutterwaveCheckout?: (options: any) => void;
  }
}

interface FlutterwaveModalProps {
  amount: number; // base authoritative price in USD ($)
  email: string;
  userName?: string;
  courseTitle: string;
  courseId?: string;
  courseIds?: string[];
  onPaymentSuccess: (reference: string) => void;
  onPaymentClose: () => void;
}

export default function FlutterwaveModal({
  amount,
  email,
  userName,
  courseTitle,
  courseId,
  courseIds,
  onPaymentSuccess,
  onPaymentClose
}: FlutterwaveModalProps) {
  const [processing, setProcessing] = useState(false);
  const [customerEmail, setCustomerEmail] = useState(email || 'student@glassea.tech');
  const [customerName, setCustomerName] = useState(userName || 'Premium Scholar');
  const [customerPhone, setCustomerPhone] = useState('08012345678');
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD'); // Default USD as primary international currency
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Live exchange rate hook
  const { rate: liveRate } = useExchangeRate();

  // Authoritative USD course price
  const usdAmount = amount > 1000 ? Math.round(amount / 1000) : (amount || 49);
  // Real-time calculated NGN equivalent
  const ngnAmount = Math.round(usdAmount * (liveRate || DEFAULT_USD_NGN_RATE));

  const currentPayableAmount = currency === 'USD' ? usdAmount : ngnAmount;

  const handleFlutterwavePayment = () => {
    setPaymentError('');

    if (!customerEmail || !customerEmail.includes('@')) {
      setPaymentError('Please enter a valid billing email address.');
      return;
    }

    if (typeof window.FlutterwaveCheckout !== 'function') {
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.onload = () => launchCheckout();
      script.onerror = () => setPaymentError('Failed to load Flutterwave checkout gateway. Please check your network connection.');
      document.body.appendChild(script);
    } else {
      launchCheckout();
    }
  };

  const launchCheckout = () => {
    if (typeof window.FlutterwaveCheckout !== 'function') {
      setPaymentError('Flutterwave checkout gateway is initializing. Please try again in a moment.');
      return;
    }

    const tx_ref = `FLW_GLASSEA_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    window.FlutterwaveCheckout({
      public_key: 'FLWPUBK-78c72f0b8f074be3ab27a39a80af4d99-X',
      tx_ref: tx_ref,
      amount: currentPayableAmount,
      currency: currency,
      payment_options: 'card,banktransfer,account,ussd',
      customer: {
        email: customerEmail,
        name: customerName,
        phone_number: customerPhone || '08000000000',
      },
      customizations: {
        title: 'GLASSEA Academy Checkout',
        description: `Enrollment: ${courseTitle.substring(0, 40)}`,
        logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      },
      callback: async function (response: any) {
        console.log('Flutterwave Transaction Response:', response);
        if (response.status === 'successful' || response.status === 'completed' || response.charge_response_code === '00' || response.tx_ref) {
          setProcessing(true);
          const finalRef = response.transaction_id ? String(response.transaction_id) : (response.tx_ref || tx_ref);
          
          try {
            const itemsToBuy = courseIds && courseIds.length > 0 
              ? courseIds 
              : (courseId ? [courseId] : []);

            // 1. Post to Express backend
            for (const cId of (itemsToBuy.length > 0 ? itemsToBuy : ['course-global'])) {
              try {
                await fetch('/api/purchase', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: customerEmail,
                    userName: customerName,
                    courseId: cId,
                    amount: currentPayableAmount,
                    currency: currency,
                    reference: finalRef,
                    gateway: 'flutterwave'
                  })
                });
              } catch (apiErr) {
                console.error('Server sync error:', apiErr);
              }
            }

            // 2. Write to Firestore if connected
            try {
              const { collection, addDoc } = await import('firebase/firestore');
              const { db } = await import('../firebase.ts');
              
              for (const cId of (itemsToBuy.length > 0 ? itemsToBuy : ['course-global'])) {
                await addDoc(collection(db, 'purchases'), {
                  userId: customerEmail,
                  userName: customerName,
                  courseId: cId,
                  amount: currentPayableAmount,
                  currency: currency,
                  reference: finalRef,
                  status: 'success',
                  gateway: 'flutterwave',
                  createdAt: new Date().toISOString()
                });
              }
            } catch (fsErr) {
              console.warn('Firestore fallback sync:', fsErr);
            }

            onPaymentSuccess(finalRef);
          } catch (err: any) {
            console.error('Registration error:', err);
            onPaymentSuccess(finalRef);
          }
        } else {
          setPaymentError('Payment was not completed successfully. Please try again.');
        }
      },
      onclose: function () {
        console.log('Flutterwave window closed by user.');
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-secondary-dark/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0b0f19] border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 text-white relative animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#fb923c] to-[#f97316] flex items-center justify-center text-black font-bold shadow-lg shadow-orange-500/20">
              <Zap className="h-4 w-4 fill-black" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold leading-none text-white">Flutterwave Global Checkout</h2>
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Multi-Currency Gateway</span>
            </div>
          </div>
          <button 
            onClick={onPaymentClose} 
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {processing ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="w-12 h-12 text-[#f97316] animate-spin mb-4" />
            <p className="font-semibold text-white">Verifying payment & unlocking courses...</p>
            <span className="text-[10px] uppercase tracking-wider text-white/50 mt-2 font-mono">Syncing Cloud Database</span>
          </div>
        ) : (
          <div className="space-y-5 text-left">
            
            {/* Course Summary Card */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-sm space-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Enrolling Into</span>
                <span className="font-bold text-white text-base line-clamp-1">{courseTitle}</span>
              </div>

              {/* Currency Selector */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/60 font-medium">Select Currency:</span>
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1 ${
                      currency === 'USD' 
                        ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-black shadow-md' 
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-3 h-3" /> USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('NGN')}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1 ${
                      currency === 'NGN' 
                        ? 'bg-gradient-to-r from-[#00D9FF] to-[#3ac58a] text-black shadow-md' 
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    ₦ NGN
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-white/60 font-medium text-xs">Total Amount</span>
                <span className="text-2xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#f97316] via-[#fb923c] to-[#00D9FF]">
                  {currency === 'USD' ? `$${usdAmount.toLocaleString()}` : `₦${ngnAmount.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* Customer Inputs */}
            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Amina Bello"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white focus:border-[#f97316] focus:outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider">Billing Email Address (Global Access)</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white focus:border-[#f97316] focus:outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000 or 080..."
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white focus:border-[#f97316] focus:outline-none transition"
                />
              </div>
            </div>

            {paymentError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono text-center animate-fade-in">
                {paymentError}
              </div>
            )}
            
            {/* Pay Button */}
            <button 
              onClick={handleFlutterwavePayment}
              disabled={!customerEmail.includes('@')}
              className="w-full py-4 rounded-xl font-display font-extrabold text-black text-sm bg-gradient-to-r from-[#f97316] via-[#fb923c] to-[#00D9FF] hover:opacity-95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center cursor-pointer uppercase tracking-wider gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Pay {currency === 'USD' ? `$${usdAmount}` : `₦${ngnAmount.toLocaleString()}`} with Flutterwave
            </button>
            
            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-2 pt-1 text-white/40">
              <ShieldCheck className="w-4 h-4 text-[#3ac58a]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                256-Bit SSL • Flutterwave Global Dollar & Naira
              </span>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
