import React, { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';

interface FooterProps {
  siteConfig: any;
  currentRole?: string;
}

export function Footer({ siteConfig, currentRole }: FooterProps) {
  const isAdmin = currentRole === 'ADMIN';
  const [isEditing, setIsEditing] = useState(false);
  const [editConfig, setEditConfig] = useState(siteConfig || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      await setDoc(doc(db, "site_config", "main"), editConfig, { merge: true });
      setIsEditing(false);
      // Wait for parent to pick up changes or reload
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditConfig(siteConfig || {});
    setIsEditing(false);
  };

  return (
    <footer className="bg-[#0b0f19] pt-24 pb-12 px-6 sm:px-12 lg:px-20 text-neutral-medium font-sans tracking-wide border-t border-neutral-medium/10 relative" id="footer-main">
      
      {isAdmin && (
        <div className="absolute top-4 right-4 z-10">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-bold hover:bg-primary hover:text-black transition"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Footer
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-black/80 p-2 rounded-xl border border-white/10 backdrop-blur-md">
              <span className="text-xs text-white/70 px-2 font-mono">EDITING</span>
              <button 
                onClick={handleCancel}
                className="p-1.5 bg-white/10 text-white rounded hover:bg-white/20 transition"
                disabled={isSaving}
              >
                <X className="w-4 h-4" />
              </button>
              <button 
                onClick={handleSave}
                className="p-1.5 bg-primary text-black rounded hover:opacity-90 transition flex items-center gap-1"
                disabled={isSaving}
              >
                <Save className="w-4 h-4" /> {isSaving ? '...' : ''}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto" id="footer-inner-wrapper">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 pb-16" id="footer-cols">
          
          {/* Left Column */}
          <div className="md:col-span-3 space-y-6 text-left" id="footer-contact-block">
            <div className="space-y-3">
              <span className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wide">Contact</span>
              {isEditing ? (
                <input 
                  type="text"
                  value={editConfig.footerContactEmail ?? ''}
                  onChange={e => setEditConfig({...editConfig, footerContactEmail: e.target.value})}
                  className="w-full bg-white/5 border border-white/20 rounded p-1 text-sm text-white"
                  placeholder="Email address"
                />
              ) : (
                <a href={`mailto:${siteConfig?.contactEmail || siteConfig?.footerContactEmail || 'glasseatech@gmail.com'}`} className="block text-sm font-medium text-neutral-dark hover:text-primary transition underline decoration-neutral-200 decoration-1">
                  {siteConfig?.contactEmail || siteConfig?.footerContactEmail || 'glasseatech@gmail.com'}
                </a>
              )}
              {siteConfig?.contactPhone && (
                <a href={`tel:${siteConfig.contactPhone}`} className="block text-xs text-neutral-medium hover:text-primary transition">
                  📞 {siteConfig.contactPhone}
                </a>
              )}
              {siteConfig?.contactAddress && (
                <p className="text-xs text-neutral-medium leading-relaxed">
                  📍 {siteConfig.contactAddress}
                </p>
              )}
              {siteConfig?.contactHours && (
                <p className="text-xs text-neutral-medium">
                  🕐 {siteConfig.contactHours}
                </p>
              )}
            </div>
            
            <div className="space-y-1.5 pt-2">
              <span className="block text-[10px] uppercase font-mono tracking-wider text-neutral-500 mb-1">Social Channels</span>
              {isEditing ? (
                <div className="space-y-2">
                  <input type="text" value={editConfig.footerSocial1 ?? 'Instagram'} onChange={e => setEditConfig({...editConfig, footerSocial1: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded p-1 text-xs text-white" />
                  <input type="text" value={editConfig.footerSocial2 ?? 'LinkedIn'} onChange={e => setEditConfig({...editConfig, footerSocial2: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded p-1 text-xs text-white" />
                  <input type="text" value={editConfig.footerSocial3 ?? 'Behance'} onChange={e => setEditConfig({...editConfig, footerSocial3: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded p-1 text-xs text-white" />
                  <input type="text" value={editConfig.footerSocial4 ?? 'Dribbble'} onChange={e => setEditConfig({...editConfig, footerSocial4: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded p-1 text-xs text-white" />
                </div>
              ) : (
                <>
                  {siteConfig?.socialTwitter && <a href={siteConfig.socialTwitter} target="_blank" rel="noopener noreferrer" className="block text-xs text-neutral-medium hover:text-neutral-dark transition">𝕏 Twitter / X</a>}
                  {siteConfig?.socialLinkedin && <a href={siteConfig.socialLinkedin} target="_blank" rel="noopener noreferrer" className="block text-xs text-neutral-medium hover:text-neutral-dark transition">in LinkedIn</a>}
                  {siteConfig?.socialYoutube && <a href={siteConfig.socialYoutube} target="_blank" rel="noopener noreferrer" className="block text-xs text-neutral-medium hover:text-neutral-dark transition">▶ YouTube</a>}
                  {siteConfig?.socialInstagram && <a href={siteConfig.socialInstagram} target="_blank" rel="noopener noreferrer" className="block text-xs text-neutral-medium hover:text-neutral-dark transition">📷 Instagram</a>}
                  {siteConfig?.socialWhatsapp && <a href={siteConfig.socialWhatsapp} target="_blank" rel="noopener noreferrer" className="block text-xs text-neutral-medium hover:text-neutral-dark transition">💬 WhatsApp</a>}
                  {!siteConfig?.socialTwitter && !siteConfig?.socialLinkedin && (
                    <>
                      <a href={siteConfig?.footerSocial1 ? '#' : '#instagram'} className="block text-xs text-neutral-medium hover:text-neutral-dark transition">{siteConfig?.footerSocial1 || 'Instagram'}</a>
                      <a href="#linkedin" className="block text-xs text-neutral-medium hover:text-neutral-dark transition">{siteConfig?.footerSocial2 || 'LinkedIn'}</a>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Middle Column */}
          <div className="md:col-span-4 text-left" id="footer-navigation-block">
          </div>
          
          {/* Right Column */}
          <div className="md:col-span-5 flex flex-col justify-between text-left space-y-8 md:space-y-0 text-xs" id="footer-statement-block">
            <div className="space-y-4">
              {isEditing ? (
                <input 
                  type="text"
                  value={editConfig.footerAboutTitle ?? ''}
                  onChange={e => setEditConfig({...editConfig, footerAboutTitle: e.target.value})}
                  className="w-full bg-white/5 border border-white/20 rounded p-1 text-xs font-semibold text-white uppercase"
                  placeholder="About Title"
                />
              ) : (
                <span className="block font-semibold text-neutral-400 mb-2 uppercase tracking-wide">
                  {siteConfig?.footerAboutTitle || 'About GLASSEA'}
                </span>
              )}

              {isEditing ? (
                <textarea 
                  value={editConfig.footerAboutText ?? ''}
                  onChange={e => setEditConfig({...editConfig, footerAboutText: e.target.value})}
                  className="w-full bg-white/5 border border-white/20 rounded p-2 text-xs text-white h-24"
                  placeholder="About Text"
                />
              ) : (
                <p className="text-neutral-500 leading-relaxed text-left text-xs max-w-md">
                  {siteConfig?.footerAboutText || 'GLASSEA is a high-performance learning platform tailored for engineers, designers, and web architects. We focus on practical, advanced curriculum that builds real-world mastery.'}
                </p>
              )}
            </div>
            
            <div className="pt-6 md:pt-12 space-y-3">
              <div className="flex gap-4 text-neutral-500">
                <a href="#terms" className="hover:text-neutral-dark transition">Terms & Conditions</a>
                <a href="#privacy" className="hover:text-neutral-dark transition">Privacy Policy</a>
              </div>
              <div className="text-[10px] text-neutral-500 font-mono tracking-wider leading-relaxed">
                {isEditing ? (
                  <input 
                    type="text"
                    value={editConfig.footerCopyright ?? ''}
                    onChange={e => setEditConfig({...editConfig, footerCopyright: e.target.value})}
                    className="w-full bg-white/5 border border-white/20 rounded p-1 text-[10px] text-white font-mono"
                    placeholder="Copyright Notice"
                  />
                ) : (
                  siteConfig?.footerCopyright || '© 2026 GLASSEA TECH LTD. ALL RIGHTS RESERVED'
                )}
                <span className="block text-[9px] text-neutral-400 mt-1">
                  Security Protocol Verified • Flutterwave Secured
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
