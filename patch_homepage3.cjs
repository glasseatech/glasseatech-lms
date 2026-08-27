const fs = require('fs');

let content = fs.readFileSync('src/components/Homepage.tsx', 'utf8');

content = content.replace(
  /import \{ FAQ \} from '\.\/FAQ\.tsx';/,
  `import { FAQ } from './FAQ.tsx';\nimport { Footer } from './Footer.tsx';`
);

// We need to replace the entire footer element.
const footerRegex = /<footer className="bg-\[#0b0f19\][\s\S]*?<\/footer>/;
content = content.replace(footerRegex, `<Footer siteConfig={siteConfig} currentRole={currentRole} />`);

fs.writeFileSync('src/components/Homepage.tsx', content);
