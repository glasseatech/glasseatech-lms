import { Course, Instructor } from './types.ts';

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-ai-agent',
    title: 'Autonomous AI Agents: Node & LLM Architecture',
    description: 'Master the next frontiers of software engineering. Learn to build and deploy self-healing, agentic workflows using Node.js, vector databases, and real-time LLM integration hooks.',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    price: 35000, // NGN in Paystack NGN
    rating: 4.9,
    studentsCount: 1240,
    instructorId: 'inst-1',
    instructorName: 'Dr. Evelyn Carter',
    category: 'AI',
    isApproved: true,
    createdAt: '2026-02-15',
    level: 'Advanced',
    prerequisites: ['course-react-advanced'],
    chapters: [
      {
        id: 'ch-ai-1',
        title: 'Core Agent Foundations',
        lessons: [
          {
            id: 'les-ai-1',
            title: 'Welcome to Agentic Architecture',
            videoUrl: 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-',
            duration: '08:42',
            isPreview: false,
            content: 'In this session, we map out the basic conceptual model of an AI agent: Sensors, Actuators, and the Central Reasoning loop. We discuss why stateless APIs are evolving into stateful, persistent systems.',
            attachments: [
              { name: 'Architecture_Blueprint.pdf', url: '#' },
              { name: 'Core_Agent_Boilerplate.zip', url: '#' }
            ],
            quiz: {
              id: 'qz-ai-1',
              question: 'Which of the following best defines the agentic reasoning loop?',
              options: [
                'A purely stateless response cycle without memory',
                'A continuous state evaluation loop tracking objective, observation, plan, and execute actions',
                'A basic sequence of nested switch statements',
                'A client-side only browser hook'
              ],
              correctIndex: 1
            }
          },
          {
            id: 'les-ai-2',
            title: 'The Observation-Action Space',
            videoUrl: 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-',
            duration: '14:15',
            isPreview: false,
            content: 'Deep-dive into environment modeling. Learn how to wrap file systems, external database connections, and browser runtimes into secure tool hooks that an LLM can invoke reliably.',
            attachments: [
              { name: 'Observation_Schema.json', url: '#' }
            ]
          }
        ]
      },
      {
        id: 'ch-ai-2',
        title: 'Memory and Vector Search',
        lessons: [
          {
            id: 'les-ai-3',
            title: 'Vector Embeddings & Semantic Indexing',
            videoUrl: 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-',
            duration: '18:30',
            isPreview: false,
            content: 'This lesson explores how memory persists through dense vector indices. We will set up in-memory vector storage and configure search constraints to avoid retrieval leakage.',
            quiz: {
              id: 'qz-ai-2',
              question: 'What is the primary function of a vector embedding in AI agent memory?',
              options: [
                'Storing plaintext database passwords securely',
                'Representing unstructured text as a dense coordinate space to measure semantic similarity',
                'Compressing heavy MP4 videos into micro-bytes',
                'Handling active user sessions inside cookies'
              ],
              correctIndex: 1
            }
          }
        ]
      }
    ]
  },
  {
    id: 'course-ui-design',
    title: 'Extreme Glassmorphism: Designing Futuristic SaaS Interfaces',
    description: 'Learn the strict geometry, typography hierarchy, and advanced CSS blending states used to create the award-winning futuristic dark UI interfaces of Stripe, Linear, and Notion.',
    thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
    price: 25000,
    rating: 4.8,
    studentsCount: 930,
    instructorId: 'inst-2',
    instructorName: 'Marcus Vane',
    category: 'Design',
    isApproved: true,
    createdAt: '2026-03-10',
    prerequisites: ['course-design-systems'],
    chapters: [
      {
        id: 'ch-ui-1',
        title: 'Symmetry & Grid Math',
        lessons: [
          {
            id: 'les-ui-1',
            title: 'Subtractive Layout & Strict Whitespace',
            videoUrl: 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-',
            duration: '11:22',
            isPreview: false,
            content: 'Before we code a single line, we learn grid alignment. Discover the rule of 4 and 8 pixels, asymmetrical layouts, and how to define content priority so dark interfaces feel clean rather than cluttered.',
            attachments: [
              { name: 'Grid_Layout_Figma_Template.fig', url: '#' }
            ]
          },
          {
            id: 'les-ui-2',
            title: 'Layering Glass with Backpack Shadows',
            videoUrl: 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-',
            duration: '16:05',
            isPreview: false,
            content: 'Explore advanced CSS properties: background-blur, backdrop-filter, linear gradient borders, and dual-layered box shadows with custom alpha values.',
            quiz: {
              id: 'qz-ui-1',
              question: 'Which backdrop-filter CSS property creates the physical frosted-glass texture?',
              options: [
                'backdrop-filter: blur(x px)',
                'background: transparent',
                'filter: opacity(50%)',
                'transform: skew()'
              ],
              correctIndex: 0
            }
          }
        ]
      }
    ]
  },
  {
    id: 'course-crypto-finance',
    title: 'Solidity Core: Smart Contract Safety & Gas Optimization',
    description: 'A mathematical engineering course focused on auditing high-value Solidity smart contracts, understanding security vectors, and optimizing gas byte-by-byte for decentralized protocols.',
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
    price: 45000,
    rating: 4.95,
    studentsCount: 512,
    instructorId: 'inst-1',
    instructorName: 'Dr. Evelyn Carter',
    category: 'Finance',
    isApproved: true,
    createdAt: '2026-04-01',
    chapters: [
      {
        id: 'ch-fin-1',
        title: 'Reentrancy & Flash Loan Guarding',
        lessons: [
          {
            id: 'les-fin-1',
            title: 'The Reentrancy Pattern Deep-Dive',
            videoUrl: 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-',
            duration: '22:40',
            isPreview: false,
            content: 'We review historic DAO hack mechanics, explaining how recursive callers deplete contract contracts before state modifications occur. Learn to write secure checks-effects-interactions code.',
            quiz: {
              id: 'qz-fin-1',
              question: 'Which pattern is the most robust defense against reentrancy attacks?',
              options: [
                'Using an require statement at the end of functions',
                'The Checks-Effects-Interactions pattern or reentrancy guards',
                'Slowing down block execution speeds',
                'Hiding function names on the public ABI'
              ],
              correctIndex: 1
            }
          }
        ]
      }
    ]
  },
  {
    id: 'course-react-advanced',
    title: 'Advanced React Patterns',
    description: 'Master higher-order components, render props, and context optimization.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
    price: 30000,
    rating: 4.7,
    studentsCount: 200,
    instructorId: 'inst-1',
    instructorName: 'Dr. Evelyn Carter',
    category: 'Technology',
    isApproved: true,
    createdAt: '2026-05-01',
    chapters: []
  },
  {
    id: 'course-marketing-growth',
    title: 'Growth Marketing Essentials',
    description: 'Strategies for scaling your startup user base.',
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
    price: 20000,
    rating: 4.5,
    studentsCount: 150,
    instructorId: 'inst-2',
    instructorName: 'Marcus Vane',
    category: 'Marketing',
    isApproved: true,
    createdAt: '2026-05-05',
    chapters: []
  },
  {
    id: 'course-business-strategy',
    title: 'Business Strategy for SaaS',
    description: 'Learn how to build a profitable SaaS business model.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    price: 40000,
    rating: 4.6,
    studentsCount: 100,
    instructorId: 'inst-1',
    instructorName: 'Dr. Evelyn Carter',
    category: 'Business',
    isApproved: true,
    createdAt: '2026-05-10',
    chapters: []
  },
  {
    id: 'course-design-systems',
    title: 'Mastering Design Systems',
    description: 'Creating scalable design components for teams.',
    thumbnail: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa2f?auto=format&fit=crop&w=800&q=80',
    price: 28000,
    rating: 4.8,
    studentsCount: 300,
    instructorId: 'inst-2',
    instructorName: 'Marcus Vane',
    category: 'Design',
    isApproved: true,
    createdAt: '2026-05-15',
    chapters: []
  },
  {
    id: 'course-finance-crypto',
    title: 'DeFi Deep Dive',
    description: 'Understanding decentralized finance protocols.',
    thumbnail: 'https://images.unsplash.com/photo-1620321023374-d1a65f9b48f6?auto=format&fit=crop&w=800&q=80',
    price: 50000,
    rating: 4.9,
    studentsCount: 400,
    instructorId: 'inst-1',
    instructorName: 'Dr. Evelyn Carter',
    category: 'Finance',
    isApproved: true,
    createdAt: '2026-05-20',
    chapters: []
  },
  {
    id: 'course-edu-innovation',
    title: 'EduTech Innovations',
    description: 'Modern trends in edTech and digital learning.',
    thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    price: 15000,
    rating: 4.4,
    studentsCount: 500,
    instructorId: 'inst-1',
    instructorName: 'Dr. Evelyn Carter',
    category: 'Education',
    isApproved: true,
    createdAt: '2026-05-25',
    chapters: []
  },
  {
    id: 'course-golang-micro',
    title: 'Go Microservices Architecture',
    description: 'Building high-performance distributed systems with Go.',
    thumbnail: 'https://images.unsplash.com/photo-1591405351957-898837146522?auto=format&fit=crop&w=800&q=80',
    price: 35000,
    rating: 4.8,
    studentsCount: 250,
    instructorId: 'inst-1',
    instructorName: 'Dr. Evelyn Carter',
    category: 'Technology',
    isApproved: true,
    createdAt: '2026-06-01',
    chapters: []
  },
  {
    id: 'course-ui-animations',
    title: 'Advanced Motion Design',
    description: 'Crafting complex UI animations with Framer Motion.',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    price: 22000,
    rating: 4.7,
    studentsCount: 180,
    instructorId: 'inst-2',
    instructorName: 'Marcus Vane',
    category: 'Design',
    isApproved: true,
    createdAt: '2026-06-05',
    chapters: []
  },
  {
    id: 'course-data-science',
    title: 'Python for Data Science',
    description: 'Data analysis, visualization, and ML basics.',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    price: 45000,
    rating: 4.6,
    studentsCount: 320,
    instructorId: 'inst-1',
    instructorName: 'Dr. Evelyn Carter',
    category: 'AI',
    isApproved: true,
    createdAt: '2026-06-10',
    chapters: []
  },
  {
    id: 'course-product-management',
    title: 'Product Management for Tech',
    description: 'From discovery to launch - product management lifecycle.',
    thumbnail: 'https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=800&q=80',
    price: 38000,
    rating: 4.5,
    studentsCount: 120,
    instructorId: 'inst-2',
    instructorName: 'Marcus Vane',
    category: 'Business',
    isApproved: true,
    createdAt: '2026-06-15',
    chapters: []
  },
  {
    id: 'course-cyber-security',
    title: 'Cybersecurity Fundamentals',
    description: 'Protecting networks and data from breaches.',
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    price: 55000,
    rating: 4.9,
    studentsCount: 450,
    instructorId: 'inst-1',
    instructorName: 'Dr. Evelyn Carter',
    category: 'Technology',
    isApproved: true,
    createdAt: '2026-06-20',
    chapters: []
  },
  {
    id: 'course-content-marketing',
    title: 'Content Strategy Mastery',
    description: 'Create content that converts and engages.',
    thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
    price: 18000,
    rating: 4.3,
    studentsCount: 210,
    instructorId: 'inst-2',
    instructorName: 'Marcus Vane',
    category: 'Marketing',
    isApproved: true,
    createdAt: '2026-06-22',
    chapters: []
  },
  {
    id: 'course-node-security',
    title: 'Node.js Security Hardening',
    description: 'Best practices for securing production Node.js apps.',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    price: 32000,
    rating: 4.6,
    studentsCount: 220,
    instructorId: 'inst-1',
    instructorName: 'Dr. Evelyn Carter',
    category: 'Technology',
    isApproved: true,
    createdAt: '2026-06-22',
    chapters: []
  },
  {
    id: 'course-react-performance',
    title: 'React Performance Tuning',
    description: 'Optimize renders, hooks, and bundle sizes.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
    price: 26000,
    rating: 4.7,
    studentsCount: 190,
    instructorId: 'inst-2',
    instructorName: 'Marcus Vane',
    category: 'Technology',
    isApproved: true,
    createdAt: '2026-06-22',
    chapters: []
  },
  {
    id: 'course-typescript-mastery',
    title: 'TypeScript for Professionals',
    description: 'Advanced types, generics, and declaration files.',
    thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=800&q=80',
    price: 29000,
    rating: 4.8,
    studentsCount: 280,
    instructorId: 'inst-1',
    instructorName: 'Dr. Evelyn Carter',
    category: 'Technology',
    isApproved: true,
    createdAt: '2026-06-22',
    chapters: []
  },
  {
    id: 'course-sql-optimized',
    title: 'Optimizing SQL Queries',
    description: 'Indexing, execution plans, and performance.',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80',
    price: 33000,
    rating: 4.5,
    studentsCount: 150,
    instructorId: 'inst-2',
    instructorName: 'Marcus Vane',
    category: 'Finance',
    isApproved: true,
    createdAt: '2026-06-22',
    chapters: []
  },
  {
    id: 'course-design-figma',
    title: 'Advanced Figma Workflows',
    description: 'Auto-layout, prototypes, and team libraries.',
    thumbnail: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa2f?auto=format&fit=crop&w=800&q=80',
    price: 23000,
    rating: 4.7,
    studentsCount: 200,
    instructorId: 'inst-1',
    instructorName: 'Dr. Evelyn Carter',
    category: 'Design',
    isApproved: true,
    createdAt: '2026-06-22',
    chapters: []
  },
  {
    id: 'course-ai-llm-ops',
    title: 'LLMOps for Engineering',
    description: 'Managing and deploying LLM models at scale.',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    price: 52000,
    rating: 4.9,
    studentsCount: 350,
    instructorId: 'inst-1',
    instructorName: 'Dr. Evelyn Carter',
    category: 'AI',
    isApproved: true,
    createdAt: '2026-06-22',
    chapters: []
  }
];

export const INSTRUCTORS: Instructor[] = [
  {
    id: 'inst-1',
    name: 'Dr. Evelyn Carter',
    bio: 'Lead Researcher in NLP with over 15 years of experience in AI architecture design and research. Passionate about bringing agentic reasoning to modern software.',
    experience: '15+ Years in AI Research and Development',
    certifications: ['PhD in AI', 'Professional AI Architect', 'Published Researcher'],
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'inst-2',
    name: 'Marcus Vane',
    bio: 'Senior UI Architect with deep expertise in glassmorphism and motion design. Previously led design teams at top SaaS unicorns.',
    experience: '10+ Years in UI/UX Design and Frontend Engineering',
    certifications: ['Senior Interface Designer', 'UI/UX Specialist'],
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
  }
];

export const WHY_CHOOSE_US = [
  {
    title: 'Multi-Role Engineering Simulations',
    description: 'Experience the complete digital curriculum lifecycle across GLASSEA’s custom simulator. Effortlessly switch roles in the navbar to test Student, Instructor, or Admin views, gaining profound insights into each stakeholder perspective.'
  },
  {
    title: 'AI-Powered Syllabus Drafter',
    description: 'Leverage deep integration with the Gemini LLM model to instantly plan complex, dynamic lessons, curate relevant learning assets, and generate live interactive quizzes with a single, precise pedagogical prompt.'
  },
  {
    title: 'Superior Interactive Player',
    description: 'A study player built strictly for high knowledge retention. Stream interactive curriculum videos, test mastery with direct quizzes, write persistent key notes in our secure scratchpad, and exchange technical insights in peer comments.'
  },
  {
    title: 'Secure Local Payment Flows',
    description: 'Simulate genuine NGN local payment experiences using custom-styled, secure Paystack sandbox gateway dialogues. Effortlessly and safely lock-in full course access, purchase modules, and register directly for catalog items.'
  },
  {
    title: 'Cryptographic Achievement Certificates',
    description: 'Earn grand academic achievements on GLASSEA. Unlock fully styled, verifiable cryptographic completion passes complete with downloadable PDF copies, suitable for professional portfolio showcases.'
  },
  {
    title: 'Administrative Operations Hub',
    description: 'Review cumulative gross receipts in real-time, monitor transaction reference numbers, manage registered user list tables, and visualize complex catalog distribution metrics through modern Recharts-backed data views.'
  }
];

export const TESTIMONIALS = [
  {
    name: 'Amina Bello',
    role: 'Principal Agentic Engineer',
    review: 'The Autonomous AI Agents course is easily the most comprehensive coding syllabus I have witnessed. The glassmorphism player makes studying for hours a joy. Highly recommended!',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    courseCompleted: 'Autonomous AI Agents Architecture'
  },
  {
    name: 'Kenji Sato',
    role: 'Senior UI/UX Prototyper',
    review: 'This program changed the way I think about design math. The strict grid systems, CSS translucency rules, and layout logic are pure Stripe/Apple quality.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    courseCompleted: 'Extreme Glassmorphism SaaS Interfaces'
  },
  {
    name: 'Jordan Finch',
    role: 'Web3 Protocol Auditor',
    review: 'Solidity Gas Optimization lesson alone saved our startup millions of gas units. Evelyn is an incredible teacher who breaks down complex EVM bytecodes.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    courseCompleted: 'Solidity Core & Gas Optimization'
  }
];

export const PRICING_PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'for 7 days trial',
    description: 'Try out premium futuristic LMS features, explore our curriculum, and take foundational quizzes.',
    features: [
      'Access to full curriculum tracks',
      'Basic interactive quizzes',
      'Client-side notes pad',
      'Standard UI course player'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Professional',
    price: '₦ 95,000',
    period: 'one-time lifetime lock',
    description: 'Unlock complete full syllabus, dynamic instructor video folders, downloadable attachments, and verified certificates.',
    features: [
      'Total access to all premium cyber courses',
      'All lesson source files and assets',
      'Cryptographically verifiable certificates',
      'AI-powered syllabus and summary generators',
      'Lifetime course player updates'
    ],
    cta: 'Buy Professional License',
    popular: true
  },
  {
    name: 'Enterprise',
    price: '₦ 450,000',
    period: 'annual corporate pass',
    description: 'Provide your whole technical squad with direct workspace integrations, custom dashboards, and cohort control.',
    features: [
      'Infinite team log passes (up to 15 users)',
      'Custom workspace analytics tracking',
      'Express administrative team controls',
      'Premium 1-on-1 code reviews with instructors'
    ],
    cta: 'Connect Technical Squad',
    popular: false
  }
];

export const FAQS = [
  {
    question: "Do I get a certificate upon completion?",
    answer: "Yes. Upon successful completion of all modules and the final assessment, you will receive a cryptographically signed GLASSEA Certificate of Mastery, verifiable via our public ledger."
  },
  {
    question: "Is there lifetime access to the courses?",
    answer: "Absolutely. Once purchased, you have indefinite access to the course materials, including all future curriculum updates and supplementary research logs."
  },
  {
    question: "Can I access the curriculum on mobile devices?",
    answer: "GLASSEA is built with a responsive viewport engine. You can seamlessly continue your research on any tablet or smartphone without losing focus or progress."
  },
  {
    question: "What kind of support is available?",
    answer: "Students have access to the GLASSEA Research Forum and priority email support. Our faculty members also host periodic live seminar broadcasts for interactive Q&A."
  }
];
