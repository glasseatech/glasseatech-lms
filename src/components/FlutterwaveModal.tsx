import React, { useState } from 'react';
import { Loader2, Zap, X, ShieldCheck, Globe, DollarSign, CreditCard } from 'lucide-react';

declare global {
  interface Window {
    FlutterwaveCheckout?: (options: any) => void;
  }
}

interface FlutterwaveModalProps {
  amount: number; // base amount in NGN
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
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('USD'); // Default dollar support as requested
  const [paymentError, setPaymentError] = useState('');

  // Conversion rate: 1 USD = ~1400 NGN
  const usdRate = 1400;
  const usdAmount = Math.max(10, Math.round(amount / usdRate));
  const ngnAmount = amount || 35000;

  const currentAmount = currency === 'USD' ? usdAmount : ngnAmount;

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
      amount: currentAmount,
      currency: currency,
      payment_options: 'card,banktransfer,account,ussd',
      customer: {
        email: customerEmail,
        phone_number: customerPhone,
        name: customerName,
      },
      customizations: {
        title: 'GlasseaTech Academy',
        description: `Enrollment: ${courseTitle.substring(0, 45)}`,
        logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&auto=format&fit=crop&q=80',
      },
      callback: (data: any) => {
        setProcessing(true);
        if (data.status === 'successful' || data.charge_response_code === '00' || data.status === 'completed') {
          setTimeout(() => {
            onPaymentSuccess(data.transaction_id ? String(data.transaction_id) : tx_ref);
            setProcessing(false);
          }, 800);
        } else {
          setProcessing(false);
          setPaymentError(data.message || 'Payment was not completed. Please try again.');
        }
      },
      onclose: () => {
        setProcessing(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl shadow-emerald-500/10">
        <button
          onClick={onPaymentClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Flutterwave Checkout
            </h2>
            <p className="text-xs text-slate-400">Universal Payment Gateway (USD & NGN)</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-6">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Item Details</div>
          <div className="text-sm font-medium text-white line-clamp-1">{courseTitle}</div>

          {/* Currency Toggle */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">Payment Currency:</div>
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  currency === 'USD'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-3 h-3 inline mr-0.5" /> USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('NGN')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  currency === 'NGN'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ₦ NGN
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Payable:</span>
            <span className="text-2xl font-black text-amber-400">
              {currency === 'USD' ? `$${usdAmount}` : `₦${ngnAmount.toLocaleString()}`}
            </span>
          </div>
        </div>

        {paymentError && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {paymentError}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="student@glassea.tech"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="08012345678"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={processing}
          onClick={handleFlutterwavePayment}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing Securely...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Pay {currency === 'USD' ? `$${usdAmount} USD` : `₦${ngnAmount.toLocaleString()} NGN`} with Flutterwave
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>256-bit Encrypted Flutterwave Gateway • USD & NGN Accepted</span>
        </div>
      </div>
    </div>
  );
}
