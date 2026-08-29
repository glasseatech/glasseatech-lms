import React, { useState } from 'react';
import { Loader2, Zap, X, ShieldCheck } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';

interface PaystackModalProps {
  amount: number;
  email: string;
  userName?: string;
  courseTitle: string;
  courseId?: string;
  courseIds?: string[];
  onPaymentSuccess: (reference: string) => void;
  onPaymentClose: () => void;
}

export default function PaystackModal({
  amount,
  email,
  userName,
  courseTitle,
  courseId,
  courseIds,
  onPaymentSuccess,
  onPaymentClose
}: PaystackModalProps) {
  const [processing, setProcessing] = useState(false);
  const [paystackEmail, setPaystackEmail] = useState(email || 'student@domain.com');
  const [paymentError, setPaymentError] = useState('');

  const config = {
    reference: (new Date()).getTime().toString() + Math.floor(Math.random() * 1000000000),
    email: paystackEmail || 'student@domain.com',
    amount: amount * 100, // Paystack takes amount in kobo
    publicKey: 'pk_live_42a1191b8c074eab66c38cac26c3877970a0060a',
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference: any) => {
    setProcessing(true);
    setPaymentError('');
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      
      const itemsToBuy = courseIds && courseIds.length > 0 
        ? courseIds 
        : (courseId ? [courseId] : []);

      if (itemsToBuy.length > 0) {
        for (const cId of itemsToBuy) {
          try {
            await addDoc(collection(db, "purchases"), {
              userId: paystackEmail || email || 'student-guest',
              userName: userName || (paystackEmail || email)?.split('@')[0] || 'Premium Scholar',
              courseId: cId,
              amount: Math.floor(amount / itemsToBuy.length),
              reference: reference.reference,
              status: "success",
              createdAt: new Date().toISOString()
            });
          } catch (firestoreErr) {
            console.error('Failed to write purchase to Firestore.', firestoreErr);
          }
        }
      }
      onPaymentSuccess(reference.reference);
    } catch (e: any) {
      console.error(e);
      setPaymentError('Failed to register payment on our servers.');
      setProcessing(false);
    }
  };

  const onClose = () => {
    // User closed Paystack modal, they can retry or close our modal
  };

  const handlePay = () => {
    initializePayment({ onSuccess, onClose });
  };

  return (
    <div className="fixed inset-0 bg-secondary-dark/95 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-neutral-bg border border-neutral-medium/10 rounded-2xl shadow-2xl p-6 text-neutral-dark">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-neutral-dark leading-none">Checkout</h2>
          <button onClick={onPaymentClose} className="p-1 rounded-full hover:bg-neutral-light transition">
            <X className="w-5 h-5 text-neutral-medium" />
          </button>
        </div>
        
        {processing ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-dark">
            <Loader2 className="w-12 h-12 text-[#0ea5e9] animate-spin mb-4" />
            <p className="font-semibold">Verifying secure payment...</p>
            <span className="text-[10px] uppercase tracking-wider text-neutral-medium mt-2 font-mono">Syncing Database</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-neutral-light border border-neutral-medium/15 rounded-xl p-4 text-sm text-neutral-medium space-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-neutral-medium uppercase tracking-widest font-mono">Order</span>
                <span className="font-bold text-neutral-dark text-base">{courseTitle}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-neutral-medium/10 flex justify-between items-center">
                <span className="text-neutral-medium font-medium">Total</span>
                <span className="text-2xl font-extrabold text-[#09a5db] tracking-tight">₦{(amount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-neutral-medium uppercase tracking-wider font-mono">Billing Email Address</label>
              <input
                type="email"
                required
                value={paystackEmail}
                onChange={(e) => setPaystackEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full px-3.5 py-2.5 bg-neutral-light border border-neutral-medium/20 rounded-xl text-xs text-neutral-dark focus:outline-none focus:ring-2 focus:ring-[#09a5db] focus:border-transparent transition-all"
              />
            </div>

            {paymentError && (
              <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-[10px] font-mono text-center animate-fade-in">
                {paymentError}
              </div>
            )}
            
            <button 
              onClick={handlePay}
              disabled={!paystackEmail.includes('@')}
              className="w-full py-4 rounded-xl font-extrabold text-white text-sm bg-[#09a5db] hover:bg-[#078bb9] disabled:opacity-40 disabled:bg-[#09a5db] disabled:cursor-not-allowed shadow-lg transition-colors flex items-center justify-center cursor-pointer uppercase tracking-wider"
            >
              <Zap className="w-4 h-4 mr-2" />
              Pay with Paystack
            </button>
            
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <ShieldCheck className="w-4 h-4 text-[#3ac58a]" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-neutral-medium">Secured Processing</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
