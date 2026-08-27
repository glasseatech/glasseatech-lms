const fs = require('fs');

let content = fs.readFileSync('src/components/Homepage.tsx', 'utf8');

// Hero button
content = content.replace(
  />\s*Get Started Free\s*<ArrowRight/g,
  `>
                {siteConfig?.heroButtonText || 'Get Started Free'}
                <ArrowRight`
);

// Bento 1 Stat & Title & Desc
content = content.replace(
  /<span className="text-4xl font-extrabold text-neutral-dark tracking-tight font-display">90%<\/span>/,
  `<span className="text-4xl font-extrabold text-neutral-dark tracking-tight font-display">{siteConfig?.bento1Stat || '90%'}</span>`
);
content = content.replace(
  /<p className="text-xs text-neutral-medium uppercase tracking-wider font-mono">Alumni Success Ratio<\/p>/,
  `<p className="text-xs text-neutral-medium uppercase tracking-wider font-mono">{siteConfig?.bento1Title || 'Alumni Success Ratio'}</p>`
);
content = content.replace(
  /<p className="text-xs text-neutral-medium italic mt-0\.5">Students report faster job upgrades<\/p>/,
  `<p className="text-xs text-neutral-medium italic mt-0.5">{siteConfig?.bento1Desc || 'Students report faster job upgrades'}</p>`
);

// Bento 2 Tag & Title
content = content.replace(
  /<span className="font-mono text-\[9px\] uppercase tracking-widest font-bold px-2 py-0\.5 rounded bg-primary\/20 text-primary-light border border-primary\/20">WORKSPACE<\/span>/,
  `<span className="font-mono text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-primary/20 text-primary-light border border-primary/20">{siteConfig?.bento2Tag || 'WORKSPACE'}</span>`
);
content = content.replace(
  /<h4 className="text-sm font-bold text-white mt-2">Active Implementation Lab<\/h4>/,
  `<h4 className="text-sm font-bold text-white mt-2">{siteConfig?.bento2Title || 'Active Implementation Lab'}</h4>`
);

// Bento 3 Tag & Title & Desc
content = content.replace(
  /<span className="font-mono text-\[9px\] uppercase tracking-widest font-bold px-2 py-0\.5 rounded bg-accent\/10 text-accent border border-accent\/20">Collaborative<\/span>/,
  `<span className="font-mono text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">{siteConfig?.bento3Tag || 'Collaborative'}</span>`
);
content = content.replace(
  /<h3 className="font-display font-bold text-lg text-neutral-dark mt-4 tracking-tight">\s*Collaborative Learning Environment\s*<\/h3>/,
  `<h3 className="font-display font-bold text-lg text-neutral-dark mt-4 tracking-tight">{siteConfig?.bento3Title || 'Collaborative Learning Environment'}</h3>`
);
content = content.replace(
  /<p className="text-xs text-neutral-medium leading-relaxed">\s*A learning environment facilitating faster teamwork, active peer review, and shared knowledge\.\s*<\/p>/,
  `<p className="text-xs text-neutral-medium leading-relaxed">{siteConfig?.bento3Desc || 'A learning environment facilitating faster teamwork, active peer review, and shared knowledge.'}</p>`
);

// Bento 4 Stat & Title
content = content.replace(
  /<span className="text-3xl font-extrabold font-mono text-white tracking-tight">20K\+<\/span>/,
  `<span className="text-3xl font-extrabold font-mono text-white tracking-tight">{siteConfig?.bento4Stat || '20K+'}</span>`
);
content = content.replace(
  /<p className="text-xs text-neutral-medium uppercase tracking-wider font-mono font-medium mt-1">Happy Alumni Developer Profiles<\/p>/,
  `<p className="text-xs text-neutral-medium uppercase tracking-wider font-mono font-medium mt-1">{siteConfig?.bento4Title || 'Happy Alumni Developer Profiles'}</p>`
);

// Catalog Tag & Title
content = content.replace(
  /<span className="text-xs uppercase tracking-widest font-mono text-primary font-bold">NEXUS ACTIVE CURRICULA<\/span>/,
  `<span className="text-xs uppercase tracking-widest font-mono text-primary font-bold">{siteConfig?.catalogTag || 'NEXUS ACTIVE CURRICULA'}</span>`
);
content = content.replace(
  /<h2 className="font-display font-extrabold text-3xl sm:text-4xl text-neutral-dark tracking-tight mt-\[12px\] -mb-\[48px\] ml-0">\s*Premium Learning Pathways\s*<\/h2>/,
  `<h2 className="font-display font-extrabold text-3xl sm:text-4xl text-neutral-dark tracking-tight mt-[12px] -mb-[48px] ml-0">{siteConfig?.catalogTitle || 'Premium Learning Pathways'}</h2>`
);

// Footer
content = content.replace(
  />\s*glasseatech@gmail\.com\s*<\/a>/,
  `>{siteConfig?.footerContactEmail || 'glasseatech@gmail.com'}</a>`
);
content = content.replace(
  /<a href="mailto:glasseatech@gmail\.com"/,
  `<a href={\`mailto:\${siteConfig?.footerContactEmail || 'glasseatech@gmail.com'}\`}`
);
content = content.replace(
  /<span className="block font-semibold text-neutral-400 mb-2 uppercase tracking-wide">About Luminary<\/span>/,
  `<span className="block font-semibold text-neutral-400 mb-2 uppercase tracking-wide">{siteConfig?.footerAboutTitle || 'About Luminary'}</span>`
);
content = content.replace(
  /<p className="text-neutral-500 leading-relaxed text-left text-xs max-w-md">\s*Luminary is a high-performance learning platform tailored for engineers, designers, and web architects\. We focus on practical, advanced curriculum that builds real-world mastery\.\s*<\/p>/,
  `<p className="text-neutral-500 leading-relaxed text-left text-xs max-w-md">{siteConfig?.footerAboutText || 'Luminary is a high-performance learning platform tailored for engineers, designers, and web architects. We focus on practical, advanced curriculum that builds real-world mastery.'}</p>`
);
content = content.replace(
  /© 2026 LUMINARY ACADEMY GROUP LTD\. ALL RIGHTS PRESERVED/,
  `{siteConfig?.footerCopyright || '© 2026 LUMINARY ACADEMY GROUP LTD. ALL RIGHTS PRESERVED'}`
);

fs.writeFileSync('src/components/Homepage.tsx', content);
