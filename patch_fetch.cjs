const fs = require('fs');
let content = fs.readFileSync('src/components/AdminHomepageContent.tsx', 'utf8');

content = content.replace(
  /if \(snap\.exists\(\)\) \{\s*setSiteConfig\(\{ \.\.\.siteConfig, \.\.\.snap\.data\(\) \}\);\s*\}/,
  `if (snap.exists()) {
        const data = snap.data();
        const merged = { ...siteConfig };
        for (const key in data) {
          if (data[key]) {
            merged[key] = data[key];
          }
        }
        setSiteConfig(merged);
      }`
);

fs.writeFileSync('src/components/AdminHomepageContent.tsx', content);
