import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

export default function AdminHomepageContent() {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'features' | 'faqs'>('config');
  
  const [features, setFeatures] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
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
    neutralBg: '#0B0F19'
  });
  const [loading, setLoading] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      const snap = await getDocs(collection(db, "homepage_features"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeatures(data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      const snap = await getDocs(collection(db, "homepage_faqs"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFaqs(data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'config') fetchSiteConfig();
    if (activeSubTab === 'features') fetchFeatures();
    if (activeSubTab === 'faqs') fetchFaqs();
  }, [activeSubTab]);

  const handleSaveConfig = async () => {
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await setDoc(doc(db, "site_config", "main"), siteConfig, { merge: true });
      alert("Configuration saved!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFeature = async () => {
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await addDoc(collection(db, "homepage_features"), {
        title: "New Feature",
        description: "Description here",
        order: features.length
      });
      fetchFeatures();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFeature = async (id: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await updateDoc(doc(db, "homepage_features", id), {
        title: editTitle,
        description: editDesc
      });
      setEditingId(null);
      fetchFeatures();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFeature = async (id: string) => {
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await deleteDoc(doc(db, "homepage_features", id));
      fetchFeatures();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFaq = async () => {
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await addDoc(collection(db, "homepage_faqs"), {
        question: "New Question?",
        answer: "Answer here",
        order: faqs.length
      });
      fetchFaqs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFaq = async (id: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await updateDoc(doc(db, "homepage_faqs", id), {
        question: editQuestion,
        answer: editAnswer
      });
      setEditingId(null);
      fetchFaqs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await deleteDoc(doc(db, "homepage_faqs", id));
      fetchFaqs();
    } catch (err) {
      console.error(err);
    }
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

      {activeSubTab === 'features' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-display font-bold text-white">Homepage Features</h3>
            <button onClick={handleAddFeature} className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary hover:text-black transition">
              <Plus className="w-4 h-4" /> Add Feature
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {features.map(f => (
              <div key={f.id} className="p-4 bg-secondary-dark rounded-xl border border-white/10 flex flex-col space-y-3">
                {editingId === f.id ? (
                  <>
                    <input className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" />
                    <textarea className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm h-20" value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setEditingId(null)} className="p-2 bg-white/10 text-white rounded"><X className="w-4 h-4" /></button>
                      <button onClick={() => handleSaveFeature(f.id)} className="p-2 bg-primary text-black rounded"><Save className="w-4 h-4" /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="text-white font-bold">{f.title}</h4>
                    <p className="text-neutral-medium text-sm">{f.description}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => { setEditingId(f.id); setEditTitle(f.title); setEditDesc(f.description); }} className="p-2 bg-white/10 text-white rounded hover:bg-white/20"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteFeature(f.id)} className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500/40"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'faqs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-display font-bold text-white">Homepage FAQs</h3>
            <button onClick={handleAddFaq} className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary hover:text-black transition">
              <Plus className="w-4 h-4" /> Add FAQ
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {faqs.map(f => (
              <div key={f.id} className="p-4 bg-secondary-dark rounded-xl border border-white/10 flex flex-col space-y-3">
                {editingId === f.id ? (
                  <>
                    <input className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" value={editQuestion} onChange={e => setEditQuestion(e.target.value)} placeholder="Question" />
                    <textarea className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm h-20" value={editAnswer} onChange={e => setEditAnswer(e.target.value)} placeholder="Answer" />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setEditingId(null)} className="p-2 bg-white/10 text-white rounded"><X className="w-4 h-4" /></button>
                      <button onClick={() => handleSaveFaq(f.id)} className="p-2 bg-primary text-black rounded"><Save className="w-4 h-4" /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="text-white font-bold">{f.question}</h4>
                    <p className="text-neutral-medium text-sm">{f.answer}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => { setEditingId(f.id); setEditQuestion(f.question); setEditAnswer(f.answer); }} className="p-2 bg-white/10 text-white rounded hover:bg-white/20"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteFaq(f.id)} className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500/40"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
