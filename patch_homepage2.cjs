const fs = require('fs');

let content = fs.readFileSync('src/components/Homepage.tsx', 'utf8');

content = content.replace(
  /\{siteConfig\?\.heroTitle \? \(\s*<span>\{siteConfig\.heroTitle\}<\/span>\s*\) : \(\s*<>Master the Architecture of<br className="hidden sm:block" \/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-accent sm:whitespace-nowrap">Futuristic SaaS<\/span> Solutions<\/>\s*\)\}/,
  `{siteConfig?.heroTitle || siteConfig?.heroTitleHighlight || siteConfig?.heroTitleSuffix ? (
                <>
                  {siteConfig.heroTitle}
                  {siteConfig.heroTitleHighlight && (
                    <><br className="hidden sm:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-accent sm:whitespace-nowrap">{siteConfig.heroTitleHighlight}</span></>
                  )}
                  {siteConfig.heroTitleSuffix && \` \${siteConfig.heroTitleSuffix}\`}
                </>
              ) : (
                <>Master the Architecture of<br className="hidden sm:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-accent sm:whitespace-nowrap">Futuristic SaaS</span> Solutions</>
              )}`
);

fs.writeFileSync('src/components/Homepage.tsx', content);
