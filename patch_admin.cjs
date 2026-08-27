const fs = require('fs');

let content = fs.readFileSync('src/components/AdminHomepageContent.tsx', 'utf8');

// 1. Add fields to initial state
const initialStateReplacement = `    faqTitle: '',
    faqSubtitle: '',
    heroButtonText: 'Get Started Free',
    bento1Stat: '90%',
    bento1Title: 'Alumni Success Ratio',
    bento1Desc: 'Students report faster job upgrades',
    bento2Tag: 'WORKSPACE',
    bento2Title: 'Active Implementation Lab',
    bento3Tag: 'Collaborative',
    bento3Title: 'Collaborative Learning Environment',
    bento3Desc: 'A learning environment facilitating faster teamwork, active peer review, and shared knowledge.',
    bento4Stat: '20K+',
    bento4Title: 'Happy Alumni Developer Profiles',
    catalogTag: 'NEXUS ACTIVE CURRICULA',
    catalogTitle: 'Premium Learning Pathways',
    footerContactEmail: 'glasseatech@gmail.com',
    footerAboutTitle: 'About Luminary',
    footerAboutText: 'Luminary is a high-performance learning platform tailored for engineers, designers, and web architects.',
    footerCopyright: '© 2026 LUMINARY ACADEMY GROUP LTD. ALL RIGHTS PRESERVED',`;

content = content.replace(/faqTitle: '',\s+faqSubtitle: '',/, initialStateReplacement);

// 2. Add input fields to config tab
const newInputs = `
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
`;

content = content.replace('            <div className="pt-4">', newInputs + '\n            <div className="pt-4">');

fs.writeFileSync('src/components/AdminHomepageContent.tsx', content);
