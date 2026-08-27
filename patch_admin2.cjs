const fs = require('fs');

let content = fs.readFileSync('src/components/AdminHomepageContent.tsx', 'utf8');

content = content.replace(
  /heroTitle: '',/,
  `heroTitle: '',
    heroTitleHighlight: '',
    heroTitleSuffix: '',`
);

content = content.replace(
  /<div>\s*<label className="block text-xs text-neutral-medium mb-1">Hero Title<\/label>\s*<input\s*type="text"\s*value=\{siteConfig.heroTitle \|\| ''\}\s*onChange=\{\(e\) => setSiteConfig\(\{\.\.\.siteConfig, heroTitle: e.target.value\}\)\}\s*placeholder="E\.g\., Engineering the Future"\s*className="w-full bg-black\/40 border border-white\/10 rounded p-2 text-white text-sm"\s*\/>\s*<\/div>/,
  `
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
  `
);

fs.writeFileSync('src/components/AdminHomepageContent.tsx', content);
