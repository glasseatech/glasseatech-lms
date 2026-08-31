import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Plus, Minus, HelpCircle } from 'lucide-react';
import { FAQS as initialFAQS } from '../data.ts';

export function FAQ({ siteConfig }: { siteConfig?: any }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<any[]>(initialFAQS);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        // Try Express backend first
        const apiRes = await fetch('/api/faqs').catch(() => null);
        if (apiRes && apiRes.ok) {
          const apiData = await apiRes.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            const published = apiData
              .filter((f: any) => f.isPublished !== false)
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            setFaqs(published);
            return;
          }
        }

        // Fallback to Firestore
        const { collection, getDocs } = await import("firebase/firestore");
        const { db } = await import("../firebase.ts");
        const snap = await getDocs(collection(db, "homepage_faqs"));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (data.length > 0) {
          const published = data
            .filter((f: any) => f.isPublished !== false)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          setFaqs(published);
        }
      } catch (err) {
        console.warn("Using fallback initial FAQs", err);
      }
    };
    fetchFaqs();
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-neutral-bg" id="faq-section">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <HelpCircle className="h-3 w-3" />
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Frequently Asked</span>
          </div>
          <h2 className="text-4xl font-display font-medium text-neutral-dark tracking-tight">
            {siteConfig?.faqTitle || 'Technical Clarifications'}
          </h2>
          <p className="text-sm text-neutral-medium max-w-xl mx-auto font-sans">
            {siteConfig?.faqSubtitle || 'Addressing common inquiries regarding certification, access protocols, and curriculum mastery.'}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx} 
                className={`border rounded-2xl transition-all duration-300 ${
                  isOpen 
                    ? 'border-primary/30 bg-primary/[0.02] shadow-sm' 
                    : 'border-neutral-medium/10 hover:border-primary/20'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none group"
                >
                  <span className={`font-display font-bold text-sm transition-colors ${isOpen ? 'text-primary' : 'text-neutral-dark group-hover:text-primary'}`}>
                    {faq.question}
                  </span>
                  <div className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    {isOpen ? (
                      <Minus className="h-4 w-4 text-primary" />
                    ) : (
                      <Plus className="h-4 w-4 text-neutral-medium group-hover:text-primary" />
                    )}
                  </div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0">
                        <div className="h-px bg-neutral-medium/5 mb-4" />
                        <p className="text-xs text-neutral-medium leading-relaxed font-sans">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-[#0b0f19] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-white text-sm font-display font-bold">Still have questions?</h4>
            <p className="text-[10px] text-neutral-medium font-mono uppercase tracking-wider">Contact our academic advisors for a deep dive.</p>
          </div>
          <button 
            onClick={() => window.location.href = 'mailto:glasseatech@gmail.com'}
            className="px-6 py-2 bg-gradient-to-r from-primary to-accent text-white text-xs font-mono font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            OPEN SUPPORT CHANNEL
          </button>
        </div>
      </div>
    </section>
  );
}
