const fs = require('fs');
let content = fs.readFileSync('src/components/AdminHomepageContent.tsx', 'utf8');

content = content.replace(
  /heroTitle: '',/,
  `heroTitle: 'Master the Architecture of',`
);
content = content.replace(
  /heroTitleHighlight: '',/,
  `heroTitleHighlight: 'Futuristic SaaS',`
);
content = content.replace(
  /heroTitleSuffix: '',/,
  `heroTitleSuffix: 'Solutions',`
);
content = content.replace(
  /heroSubtitle: '',/,
  `heroSubtitle: 'Luminary is a premium engineering academy designed for programmers, structural architects, and Web3 executives. Join certified developers locking in lifetime lifepasses.',`
);
content = content.replace(
  /featuresTitle: '',/,
  `featuresTitle: 'Why Engineers Choose GLASSEA',`
);
content = content.replace(
  /featuresSubtitle: '',/,
  `featuresSubtitle: 'Beyond simple videos, we provide a high-fidelity workspace for mastering the next generation of software architecture.',`
);
content = content.replace(
  /faqTitle: '',/,
  `faqTitle: 'Technical Clarifications',`
);
content = content.replace(
  /faqSubtitle: '',/,
  `faqSubtitle: 'Addressing common inquiries regarding certification, access protocols, and curriculum mastery.',`
);

fs.writeFileSync('src/components/AdminHomepageContent.tsx', content);
