import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, ArrowUp, ArrowDown, Eye, EyeOff, Check, Sparkles } from 'lucide-react';
import { FAQItem, WhyChooseUsItem } from '../types.ts';

export function AdminHomepageContent() {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'features' | 'faqs' | 'contact'>('config');
  
  const [features, setFeatures] = useState<WhyChooseUsItem[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({
    heroTitle: 'Master the Architecture of',
    heroTitleHighlight: 'Futuristic SaaS',
    heroTitleSuffix: 'Solutions',
    heroSubtitle: 'GLASSEA is a premier learning platform designed for programmers, software engineers, and digital architects. Master real-world tech skills with hands-on courses.',
    featuresTitle: 'Why Learners Choose GLASSEA',
    featuresSubtitle: 'Beyond simple videos, we provide interactive workspaces and project-driven learning for mastering modern software development.',
    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'Find answers to common questions regarding our courses, certificates, and enrollment.',
    heroButtonText: 'Get Started Free',
    bento1Stat: '90%',
    bento1Title: 'Alumni Career Growth',
    bento1Desc: 'Graduates report faster promotions and career upgrades',
    bento2Tag: 'WORKSPACE',
    bento2Title: 'Hands-on Learning Lab',
    bento3Tag: 'Collaborative',
    bento3Title: 'Interactive Community',
    bento3Desc: 'A vibrant learning environment facilitating teamwork, peer reviews, and mentorship.',
    bento4Stat: '20K+',
    bento4Title: 'Enrolled Students Worldwide',
    catalogTag: 'FEATURED COURSES',
    catalogTitle: 'Explore Learning Pathways',
    footerContactEmail: 'glasseatech@gmail.com',
    footerAboutTitle: 'About GLASSEA',
    footerAboutText: 'GLASSEA is a high-performance learning platform tailored for engineers, designers, and web developers.',
    footerCopyright: '© 2026 GLASSEA TECH LTD. ALL RIGHTS RESERVED',
    primaryColor: '#00D9FF',
    accentColor: '#FF0099',
    neutralBg: '#0B0F19',
    // Contact section
    contactPhone: '+234 800 000 0000',
    contactEmail: 'glasseatech@gmail.com',
    contactAddress: '14 Digital Avenue, Lagos Tech Hub, Lagos, Nigeria',
    contactHours: 'Monday – Friday: 9am – 6pm WAT',
    contactMapEmbedUrl: '',
    socialTwitter: 'https://twitter.com/glasseatech',
    socialLinkedin: '',
    socialYoutube: '',
    socialInstagram: '',
    socialWhatsapp: ''
  });
  const [loading, setLoading] = useState(false);

  // Edit states for Features
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editFeatureTitle, setEditFeatureTitle] = useState('');
  const [editFeatureDesc, setEditFeatureDesc] = useState('');
  const [editFeatureIcon, setEditFeatureIcon] = useState('Sparkles');
  const [editFeatureActive, setEditFeatureActive] = useState(true);
  
  // Edit states for FAQs
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [editFaqQuestion, setEditFaqQuestion] = useState('');
  const [editFaqAnswer, setEditFaqAnswer] = useState('');
  const [editFaqPublished, setEditFaqPublished] = useState(true);

  const fetchSiteConfig = async () => {
    try {
      setLoading(true);
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      const snap = await getDoc(doc(db, "site_config", "main"));
      if (snap.exists()) {
        const data = snap.data();
        const merged = { ...siteConfig };
        for (const key in data) {
          if (data[key]) {
            merged[key] = data[key];
          }
        }
        setSiteConfig(merged);
      }
    } catch (err) {
      console.warn("Using local site config", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      // Try backend first
      const res = await fetch('/api/features').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFeatures(data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
          return;
        }
      }

      // Fallback to Firestore
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      const snap = await getDocs(collection(db, "homepage_features"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setFeatures(data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
    } catch (err) {
      console.error("Failed to fetch features", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      // Try backend first
      const res = await fetch('/api/faqs').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFaqs(data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
          return;
        }
      }

      // Fallback to Firestore
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      const snap = await getDocs(collection(db, "homepage_faqs"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setFaqs(data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
    } catch (err) {
      console.error("Failed to fetch FAQs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'config') fetchSiteConfig();
    if (activeSubTab === 'features') fetchFeatures();
    if (activeSubTab === 'faqs') fetchFaqs();
    if (activeSubTab === 'contact') fetchSiteConfig();
  }, [activeSubTab]);

  const handleSaveConfig = async () => {
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await setDoc(doc(db, "site_config", "main"), siteConfig, { merge: true });
      alert("Configuration saved!");
    } catch (err) {
      console.error(err);
      alert("Config saved locally.");
    }
  };

  // ================= FEATURES / WHY US CRUD =================
  const handleAddFeature = async () => {
    const newFeature = {
      title: "New Why Choose Us Card",
      description: "Explain key student benefits and technical platform advantages.",
      icon: "Sparkles",
      order: features.length + 1,
      isActive: true
    };

    try {
      await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFeature)
      });

      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await addDoc(collection(db, "homepage_features"), newFeature);
    } catch (err) {
      console.warn(err);
    }
    fetchFeatures();
  };

  const handleSaveFeature = async (id: string) => {
    const updated = {
      title: editFeatureTitle,
      description: editFeatureDesc,
      icon: editFeatureIcon,
      isActive: editFeatureActive
    };

    try {
      await fetch(`/api/features/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await updateDoc(doc(db, "homepage_features", id), updated);
    } catch (err) {
      console.warn(err);
    }
    setEditingFeatureId(null);
    fetchFeatures();
  };

  const handleToggleActiveFeature = async (feature: WhyChooseUsItem) => {
    const nextStatus = feature.isActive === false ? true : false;
    try {
      await fetch(`/api/features/${feature.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus })
      });

      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await updateDoc(doc(db, "homepage_features", feature.id), { isActive: nextStatus });
    } catch (err) {}
    fetchFeatures();
  };

  const handleMoveFeature = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= features.length) return;

    const currentItem = features[index];
    const targetItem = features[targetIdx];

    const currentOrder = currentItem.order || (index + 1);
    const targetOrder = targetItem.order || (targetIdx + 1);

    try {
      await fetch(`/api/features/${currentItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: targetOrder })
      });
      await fetch(`/api/features/${targetItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: currentOrder })
      });
    } catch (e) {}
    fetchFeatures();
  };

  const handleDeleteFeature = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Why Choose Us item?")) return;
    try {
      await fetch(`/api/features/${id}`, { method: 'DELETE' });
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await deleteDoc(doc(db, "homepage_features", id));
    } catch (err) {
      console.warn(err);
    }
    fetchFeatures();
  };

  // ================= FAQS CRUD =================
  const handleAddFaq = async () => {
    const newFaq = {
      question: "New Clarification Question?",
      answer: "Provide the detailed answer and technical solution here.",
      order: faqs.length + 1,
      isPublished: true
    };

    try {
      await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFaq)
      });

      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await addDoc(collection(db, "homepage_faqs"), newFaq);
    } catch (err) {
      console.warn(err);
    }
    fetchFaqs();
  };

  const handleSaveFaq = async (id: string) => {
    const updated = {
      question: editFaqQuestion,
      answer: editFaqAnswer,
      isPublished: editFaqPublished
    };

    try {
      await fetch(`/api/faqs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await updateDoc(doc(db, "homepage_faqs", id), updated);
    } catch (err) {
      console.warn(err);
    }
    setEditingFaqId(null);
    fetchFaqs();
  };

  const handleTogglePublishFaq = async (faq: FAQItem) => {
    const nextStatus = faq.isPublished === false ? true : false;
    try {
      await fetch(`/api/faqs/${faq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextStatus })
      });

      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await updateDoc(doc(db, "homepage_faqs", faq.id), { isPublished: nextStatus });
    } catch (err) {}
    fetchFaqs();
  };

  const handleMoveFaq = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= faqs.length) return;

    const currentItem = faqs[index];
    const targetItem = faqs[targetIdx];

    const currentOrder = currentItem.order || (index + 1);
    const targetOrder = targetItem.order || (targetIdx + 1);

    try {
      await fetch(`/api/faqs/${currentItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: targetOrder })
      });
      await fetch(`/api/faqs/${targetItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: currentOrder })
      });
    } catch (e) {}
    fetchFaqs();
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await fetch(`/api/faqs/${id}`, { method: 'DELETE' });
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await deleteDoc(doc(db, "homepage_faqs", id));
    } catch (err) {
      console.warn(err);
    }
    fetchFaqs();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveSubTab('config')}
          className={`px-4 py-2 font-display font-bold text-xs rounded-xl transition ${activeSubTab === 'config' ? 'bg-primary text-black' : 'bg-white/5 text-neutral-medium hover:text-white'}`}
        >
          General Settings
        </button>
        <button
          onClick={() => setActiveSubTab('features')}
          className={`px-4 py-2 font-display font-bold text-xs rounded-xl transition ${activeSubTab === 'features' ? 'bg-primary text-black' : 'bg-white/5 text-neutral-medium hover:text-white'}`}
        >
          Features
        </button>
        <button
          onClick={() => setActiveSubTab('faqs')}
          className={`px-4 py-2 font-display font-bold text-xs rounded-xl transition ${activeSubTab === 'faqs' ? 'bg-primary text-black' : 'bg-white/5 text-neutral-medium hover:text-white'}`}
        >
          FAQs
        </button>
        <button
          onClick={() => setActiveSubTab('contact')}
          className={`px-4 py-2 font-display font-bold text-xs rounded-xl transition ${activeSubTab === 'contact' ? 'bg-primary text-black' : 'bg-white/5 text-neutral-medium hover:text-white'}`}
        >
          Contact Info
        </button>
      </div>

      {loading && <div className="text-white text-xs">Loading...</div>}

      {activeSubTab === 'config' && (
        <div className="space-y-4">
          <div className="p-4 bg-secondary-dark rounded-xl border border-white/10 space-y-4">
            <h3 className="text-lg font-display font-bold text-white mb-2">Global Settings (Hero & Colors)</h3>
            
            
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white border-b border-white/10 pb-2">Hero Typography</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-neutral-medium mb-1">Prefix Text</label>
                  <input 
                    type="text" 
                    value={siteConfig.heroTitle || ''} 
                    onChange={(e) => setSiteConfig({...siteConfig, heroTitle: e.target.value})}
                    placeholder="Master the Architecture of"
                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-medium mb-1">Gradient Highlight Text</label>
                  <input 
                    type="text" 
                    value={siteConfig.heroTitleHighlight || ''} 
                    onChange={(e) => setSiteConfig({...siteConfig, heroTitleHighlight: e.target.value})}
                    placeholder="Futuristic SaaS"
                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-medium mb-1">Suffix Text</label>
                  <input 
                    type="text" 
                    value={siteConfig.heroTitleSuffix || ''} 
                    onChange={(e) => setSiteConfig({...siteConfig, heroTitleSuffix: e.target.value})}
                    placeholder="Solutions"
                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" 
                  />
                </div>
              </div>
            </div>
  

            <div>
              <label className="block text-xs text-neutral-medium mb-1">Hero Subtitle</label>
              <textarea 
                value={siteConfig.heroSubtitle || ''} 
                onChange={(e) => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})}
                placeholder="Subtitle text..."
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm h-20" 
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-medium mb-1">Features Section Title</label>
              <input 
                type="text" 
                value={siteConfig.featuresTitle || ''} 
                onChange={(e) => setSiteConfig({...siteConfig, featuresTitle: e.target.value})}
                placeholder="E.g., System Architecture"
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-medium mb-1">Features Section Subtitle</label>
              <textarea 
                value={siteConfig.featuresSubtitle || ''} 
                onChange={(e) => setSiteConfig({...siteConfig, featuresSubtitle: e.target.value})}
                placeholder="Features subtitle text..."
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm h-20" 
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-medium mb-1">FAQ Section Title</label>
              <input 
                type="text" 
                value={siteConfig.faqTitle || ''} 
                onChange={(e) => setSiteConfig({...siteConfig, faqTitle: e.target.value})}
                placeholder="E.g., Technical Clarifications"
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-medium mb-1">FAQ Section Subtitle</label>
              <textarea 
                value={siteConfig.faqSubtitle || ''} 
                onChange={(e) => setSiteConfig({...siteConfig, faqSubtitle: e.target.value})}
                placeholder="FAQ subtitle text..."
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm h-20" 
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-medium mb-1">Primary Color (Hex)</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={siteConfig.primaryColor || '#00D9FF'} 
                  onChange={(e) => setSiteConfig({...siteConfig, primaryColor: e.target.value})}
                  className="h-10 w-10 bg-black/40 border border-white/10 rounded p-1 cursor-pointer" 
                />
                <input 
                  type="text" 
                  value={siteConfig.primaryColor || '#00D9FF'} 
                  onChange={(e) => setSiteConfig({...siteConfig, primaryColor: e.target.value})}
                  className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white text-sm" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-medium mb-1">Accent Color (Hex)</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={siteConfig.accentColor || '#FF0099'} 
                  onChange={(e) => setSiteConfig({...siteConfig, accentColor: e.target.value})}
                  className="h-10 w-10 bg-black/40 border border-white/10 rounded p-1 cursor-pointer" 
                />
                <input 
                  type="text" 
                  value={siteConfig.accentColor || '#FF0099'} 
                  onChange={(e) => setSiteConfig({...siteConfig, accentColor: e.target.value})}
                  className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white text-sm" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-medium mb-1">Background Color (Hex)</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={siteConfig.neutralBg || '#0B0F19'} 
                  onChange={(e) => setSiteConfig({...siteConfig, neutralBg: e.target.value})}
                  className="h-10 w-10 bg-black/40 border border-white/10 rounded p-1 cursor-pointer" 
                />
                <input 
                  type="text" 
                  value={siteConfig.neutralBg || '#0B0F19'} 
                  onChange={(e) => setSiteConfig({...siteConfig, neutralBg: e.target.value})}
                  className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white text-sm" 
                />
              </div>
            </div>


            {/* NEW BENTO GRID TEXTS */}
            <div className="pt-4 border-t border-white/10 mt-4">
              <h4 className="text-md font-bold text-white mb-4">Hero & Bento Config</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-neutral-medium mb-1">Hero Button Text</label>
                  <input type="text" value={siteConfig.heroButtonText || ''} onChange={(e) => setSiteConfig({...siteConfig, heroButtonText: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-medium mb-1">Bento 1 Stat</label>
                    <input type="text" value={siteConfig.bento1Stat || ''} onChange={(e) => setSiteConfig({...siteConfig, bento1Stat: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-medium mb-1">Bento 1 Title</label>
                    <input type="text" value={siteConfig.bento1Title || ''} onChange={(e) => setSiteConfig({...siteConfig, bento1Title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-neutral-medium mb-1">Bento 1 Desc</label>
                  <input type="text" value={siteConfig.bento1Desc || ''} onChange={(e) => setSiteConfig({...siteConfig, bento1Desc: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-medium mb-1">Bento 2 Tag</label>
                    <input type="text" value={siteConfig.bento2Tag || ''} onChange={(e) => setSiteConfig({...siteConfig, bento2Tag: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-medium mb-1">Bento 2 Title</label>
                    <input type="text" value={siteConfig.bento2Title || ''} onChange={(e) => setSiteConfig({...siteConfig, bento2Title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-medium mb-1">Bento 3 Tag</label>
                    <input type="text" value={siteConfig.bento3Tag || ''} onChange={(e) => setSiteConfig({...siteConfig, bento3Tag: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-medium mb-1">Bento 3 Title</label>
                    <input type="text" value={siteConfig.bento3Title || ''} onChange={(e) => setSiteConfig({...siteConfig, bento3Title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-neutral-medium mb-1">Bento 3 Desc</label>
                  <input type="text" value={siteConfig.bento3Desc || ''} onChange={(e) => setSiteConfig({...siteConfig, bento3Desc: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-medium mb-1">Bento 4 Stat</label>
                    <input type="text" value={siteConfig.bento4Stat || ''} onChange={(e) => setSiteConfig({...siteConfig, bento4Stat: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-medium mb-1">Bento 4 Title</label>
                    <input type="text" value={siteConfig.bento4Title || ''} onChange={(e) => setSiteConfig({...siteConfig, bento4Title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* NEW CATALOG & FOOTER TEXTS */}
            <div className="pt-4 border-t border-white/10 mt-4">
              <h4 className="text-md font-bold text-white mb-4">Catalog & Footer Config</h4>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-medium mb-1">Catalog Tag</label>
                    <input type="text" value={siteConfig.catalogTag || ''} onChange={(e) => setSiteConfig({...siteConfig, catalogTag: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-medium mb-1">Catalog Title</label>
                    <input type="text" value={siteConfig.catalogTitle || ''} onChange={(e) => setSiteConfig({...siteConfig, catalogTitle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-medium mb-1">Footer Contact Email</label>
                  <input type="text" value={siteConfig.footerContactEmail || ''} onChange={(e) => setSiteConfig({...siteConfig, footerContactEmail: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                </div>

                <div>
                  <label className="block text-xs text-neutral-medium mb-1">Footer About Title</label>
                  <input type="text" value={siteConfig.footerAboutTitle || ''} onChange={(e) => setSiteConfig({...siteConfig, footerAboutTitle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                </div>

                <div>
                  <label className="block text-xs text-neutral-medium mb-1">Footer About Text</label>
                  <textarea value={siteConfig.footerAboutText || ''} onChange={(e) => setSiteConfig({...siteConfig, footerAboutText: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm h-20" />
                </div>

                <div>
                  <label className="block text-xs text-neutral-medium mb-1">Footer Copyright</label>
                  <input type="text" value={siteConfig.footerCopyright || ''} onChange={(e) => setSiteConfig({...siteConfig, footerCopyright: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button onClick={handleSaveConfig} className="bg-primary text-black px-4 py-2 font-bold rounded hover:opacity-90">
                Save Global Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: WHY CHOOSE US (FEATURES) CRUD ================= */}
      {activeSubTab === 'features' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-secondary-dark/60 p-4 rounded-xl border border-white/10">
            <div>
              <h3 className="text-lg font-display font-bold text-white">Why Choose Us (Features) Management</h3>
              <p className="text-xs text-neutral-medium">Create, edit, reorder, and activate/deactivate Why Choose Us cards displayed on the homepage.</p>
            </div>
            <button onClick={handleAddFeature} className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition shadow-md shadow-primary/20">
              <Plus className="w-4 h-4" /> Add Why Us Card
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {features.length === 0 ? (
              <div className="p-8 text-center bg-secondary-dark rounded-xl border border-white/10 text-neutral-medium text-sm">
                No Why Choose Us items found. Click "Add Why Us Card" to create one.
              </div>
            ) : (
              features.map((f, index) => (
                <div key={f.id} className={`p-4 bg-secondary-dark rounded-xl border transition-all ${f.isActive !== false ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                  {editingFeatureId === f.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-primary">Editing Why Choose Us Item #{index + 1}</span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-neutral-medium flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editFeatureActive} 
                              onChange={(e) => setEditFeatureActive(e.target.checked)} 
                              className="rounded bg-black border-white/20 text-primary"
                            />
                            Active on Public Homepage
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-medium uppercase mb-1">Feature Title</label>
                        <input 
                          className="w-full bg-black/40 border border-white/15 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-primary" 
                          value={editFeatureTitle} 
                          onChange={e => setEditFeatureTitle(e.target.value)} 
                          placeholder="Feature Title..." 
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-medium uppercase mb-1">Description</label>
                        <textarea 
                          className="w-full bg-black/40 border border-white/15 rounded-lg p-2.5 text-white text-sm h-24 focus:outline-none focus:border-primary" 
                          value={editFeatureDesc} 
                          onChange={e => setEditFeatureDesc(e.target.value)} 
                          placeholder="Detailed feature description..." 
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                        <button onClick={() => setEditingFeatureId(null)} className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20 transition flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                        <button onClick={() => handleSaveFeature(f.id)} className="px-4 py-1.5 bg-primary text-black rounded-lg text-xs font-bold hover:bg-primary/90 transition flex items-center gap-1">
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-white/60">
                            #{index + 1}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${f.isActive !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                            {f.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                          <h4 className="text-white font-bold text-base">{f.title}</h4>
                        </div>
                        <p className="text-neutral-medium text-xs leading-relaxed pl-8">{f.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                        {/* Reorder Buttons */}
                        <button 
                          disabled={index === 0}
                          onClick={() => handleMoveFeature(index, 'up')}
                          className="p-2 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white rounded-lg transition disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          disabled={index === features.length - 1}
                          onClick={() => handleMoveFeature(index, 'down')}
                          className="p-2 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white rounded-lg transition disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Active Toggle Button */}
                        <button 
                          onClick={() => handleToggleActiveFeature(f)}
                          className={`p-2 rounded-lg transition ${f.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-neutral-medium/20 text-neutral-medium hover:bg-neutral-medium/30'}`}
                          title={f.isActive !== false ? "Deactivate" : "Activate"}
                        >
                          {f.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        {/* Edit Button */}
                        <button 
                          onClick={() => { 
                            setEditingFeatureId(f.id); 
                            setEditFeatureTitle(f.title); 
                            setEditFeatureDesc(f.description);
                            setEditFeatureIcon(f.icon || 'Sparkles');
                            setEditFeatureActive(f.isActive !== false);
                          }} 
                          className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition"
                          title="Edit Feature"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button 
                          onClick={() => handleDeleteFeature(f.id)} 
                          className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                          title="Delete Feature"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: FAQS CRUD ================= */}
      {activeSubTab === 'faqs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-secondary-dark/60 p-4 rounded-xl border border-white/10">
            <div>
              <h3 className="text-lg font-display font-bold text-white">Homepage FAQs Management</h3>
              <p className="text-xs text-neutral-medium">Create, edit, reorder, and publish/unpublish technical clarification FAQs.</p>
            </div>
            <button onClick={handleAddFaq} className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition shadow-md shadow-primary/20">
              <Plus className="w-4 h-4" /> Add FAQ
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {faqs.length === 0 ? (
              <div className="p-8 text-center bg-secondary-dark rounded-xl border border-white/10 text-neutral-medium text-sm">
                No FAQ items found. Click "Add FAQ" to create one.
              </div>
            ) : (
              faqs.map((f, index) => (
                <div key={f.id} className={`p-4 bg-secondary-dark rounded-xl border transition-all ${f.isPublished !== false ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                  {editingFaqId === f.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-primary">Editing FAQ Item #{index + 1}</span>
                        <label className="text-xs text-neutral-medium flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={editFaqPublished} 
                            onChange={(e) => setEditFaqPublished(e.target.checked)} 
                            className="rounded bg-black border-white/20 text-primary"
                          />
                          Published on Homepage
                        </label>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-medium uppercase mb-1">Question</label>
                        <input 
                          className="w-full bg-black/40 border border-white/15 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-primary" 
                          value={editFaqQuestion} 
                          onChange={e => setEditFaqQuestion(e.target.value)} 
                          placeholder="Frequently Asked Question..." 
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-medium uppercase mb-1">Answer</label>
                        <textarea 
                          className="w-full bg-black/40 border border-white/15 rounded-lg p-2.5 text-white text-sm h-24 focus:outline-none focus:border-primary" 
                          value={editFaqAnswer} 
                          onChange={e => setEditFaqAnswer(e.target.value)} 
                          placeholder="Comprehensive response..." 
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                        <button onClick={() => setEditingFaqId(null)} className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20 transition flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                        <button onClick={() => handleSaveFaq(f.id)} className="px-4 py-1.5 bg-primary text-black rounded-lg text-xs font-bold hover:bg-primary/90 transition flex items-center gap-1">
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-white/60">
                            #{index + 1}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${f.isPublished !== false ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-neutral-500/20 text-neutral-400 border border-neutral-500/30'}`}>
                            {f.isPublished !== false ? 'Published' : 'Draft'}
                          </span>
                          <h4 className="text-white font-bold text-base">{f.question}</h4>
                        </div>
                        <p className="text-neutral-medium text-xs leading-relaxed pl-8">{f.answer}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                        {/* Reorder Buttons */}
                        <button 
                          disabled={index === 0}
                          onClick={() => handleMoveFaq(index, 'up')}
                          className="p-2 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white rounded-lg transition disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          disabled={index === faqs.length - 1}
                          onClick={() => handleMoveFaq(index, 'down')}
                          className="p-2 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white rounded-lg transition disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Publish/Unpublish Toggle */}
                        <button 
                          onClick={() => handleTogglePublishFaq(f)}
                          className={`p-2 rounded-lg transition ${f.isPublished !== false ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' : 'bg-neutral-medium/20 text-neutral-medium hover:bg-neutral-medium/30'}`}
                          title={f.isPublished !== false ? "Unpublish" : "Publish"}
                        >
                          {f.isPublished !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        {/* Edit Button */}
                        <button 
                          onClick={() => { 
                            setEditingFaqId(f.id); 
                            setEditFaqQuestion(f.question); 
                            setEditFaqAnswer(f.answer);
                            setEditFaqPublished(f.isPublished !== false);
                          }} 
                          className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition"
                          title="Edit FAQ"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button 
                          onClick={() => handleDeleteFaq(f.id)} 
                          className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'contact' && (
        <div className="space-y-6">
          <div className="p-5 bg-secondary-dark rounded-xl border border-white/10 space-y-5">
            <h3 className="text-lg font-display font-bold text-white mb-1">Contact Information</h3>
            <p className="text-xs text-neutral-medium">This information is displayed on the homepage Contact section and footer.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-medium mb-1">📞 Phone Number</label>
                <input type="text" value={siteConfig.contactPhone || ''} onChange={(e) => setSiteConfig({...siteConfig, contactPhone: e.target.value})} placeholder="+234 800 000 0000" className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-neutral-medium mb-1">✉️ Contact Email</label>
                <input type="email" value={siteConfig.contactEmail || ''} onChange={(e) => setSiteConfig({...siteConfig, contactEmail: e.target.value})} placeholder="hello@glassea.com" className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-medium mb-1">📍 Office Address</label>
              <textarea value={siteConfig.contactAddress || ''} onChange={(e) => setSiteConfig({...siteConfig, contactAddress: e.target.value})} placeholder="14 Digital Avenue, Lagos Tech Hub" className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm h-16" />
            </div>

            <div>
              <label className="block text-xs text-neutral-medium mb-1">🕐 Office Hours</label>
              <input type="text" value={siteConfig.contactHours || ''} onChange={(e) => setSiteConfig({...siteConfig, contactHours: e.target.value})} placeholder="Monday – Friday: 9am – 6pm WAT" className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
            </div>

            <div>
              <label className="block text-xs text-neutral-medium mb-1">🗺️ Google Maps Embed URL (optional)</label>
              <input type="text" value={siteConfig.contactMapEmbedUrl || ''} onChange={(e) => setSiteConfig({...siteConfig, contactMapEmbedUrl: e.target.value})} placeholder="https://maps.google.com/embed?..." className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
            </div>
          </div>

          <div className="p-5 bg-secondary-dark rounded-xl border border-white/10 space-y-4">
            <h3 className="text-md font-display font-bold text-white">Social Media Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-medium mb-1">𝕏 Twitter / X URL</label>
                <input type="url" value={siteConfig.socialTwitter || ''} onChange={(e) => setSiteConfig({...siteConfig, socialTwitter: e.target.value})} placeholder="https://twitter.com/..." className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-neutral-medium mb-1">in LinkedIn URL</label>
                <input type="url" value={siteConfig.socialLinkedin || ''} onChange={(e) => setSiteConfig({...siteConfig, socialLinkedin: e.target.value})} placeholder="https://linkedin.com/company/..." className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-neutral-medium mb-1">▶ YouTube URL</label>
                <input type="url" value={siteConfig.socialYoutube || ''} onChange={(e) => setSiteConfig({...siteConfig, socialYoutube: e.target.value})} placeholder="https://youtube.com/@..." className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-neutral-medium mb-1">📷 Instagram URL</label>
                <input type="url" value={siteConfig.socialInstagram || ''} onChange={(e) => setSiteConfig({...siteConfig, socialInstagram: e.target.value})} placeholder="https://instagram.com/..." className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-neutral-medium mb-1">💬 WhatsApp Link</label>
                <input type="url" value={siteConfig.socialWhatsapp || ''} onChange={(e) => setSiteConfig({...siteConfig, socialWhatsapp: e.target.value})} placeholder="https://wa.me/234..." className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button onClick={handleSaveConfig} className="bg-primary text-black px-5 py-2.5 font-bold rounded-xl hover:opacity-90 transition">
              Save Contact Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHomepageContent;
