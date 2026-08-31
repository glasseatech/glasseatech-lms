import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, runTransaction, serverTimestamp, collection, getDocs, setDoc } from 'firebase/firestore';
import { Course, Chapter, Lesson, Purchase, Certificate, Notification, Review, CertificateRequest, FAQItem, WhyChooseUsItem } from './src/types';
import { INITIAL_COURSES, FAQS, WHY_CHOOSE_US } from './src/data.ts';

const app = express();
const PORT = 3000;

// Lazy initialization of Firebase Client (Node.js)
let firestore: ReturnType<typeof getFirestore> | null = null;
function getDb() {
  if (!firestore) {
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
      
      let fbApp;
      if (getApps().length === 0) {
        fbApp = initializeApp(firebaseConfig);
      } else {
        fbApp = getApps()[0];
      }
      
      firestore = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId || '(default)');
      console.log(`Firebase initialized successfully. Database: ${firebaseConfig.firestoreDatabaseId || '(default)'}`);
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      return null;
    }
  }
  return firestore;
}

// Middleware for parsing requests
app.use(express.json());

// Persistent database path (local container storage)
const DB_FILE = path.join(process.cwd(), 'lms_db.json');

// Initialize database with default template state if not exists
interface DBStructure {
  courses: Course[];
  purchases: Purchase[];
  certificates: Certificate[];
  certificateRequests: CertificateRequest[];
  notifications: Notification[];
  reviews: Record<string, Review[]>; // key is: "courseId" or "courseId-lessonId"
  faqs: FAQItem[];
  features: WhyChooseUsItem[];
  users: { id: string; email: string; name: string; role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' }[];
  siteConfig?: Record<string, any>;
}

function initializeDB(): DBStructure {
  const defaultDB: DBStructure = {
    courses: INITIAL_COURSES,
    purchases: [
      {
        id: 'purch-1',
        userId: 'student-amina',
        userName: 'Amina Bello',
        userEmail: 'amina@premium.lms',
        courseId: 'course-ai-agent',
        amount: 49,
        currency: 'USD',
        paidAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        reference: 'FLW_MOCK_1122334455',
        status: 'success',
        gateway: 'flutterwave'
      }
    ],
    certificates: [],
    certificateRequests: [],
    notifications: [
      {
        id: 'notif-1',
        userId: 'student-amina',
        title: 'Welcome to the LMS Hub!',
        message: 'Explore our elite syllabus catalogue, lock in single lifepasses, or create your own custom modules.',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ],
    reviews: {
      'course-ai-agent': [
        {
          id: 'rev-init-1',
          courseId: 'course-ai-agent',
          userId: 'student-amina',
          userEmail: 'amina@premium.lms',
          userName: 'Amina Bello',
          rating: 5,
          comment: 'The Autonomous AI Agents course is easily the most comprehensive coding syllabus I have witnessed. Highly recommended!',
          createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
        }
      ]
    },
    faqs: FAQS.map((faq, index) => ({
      id: `faq-${index + 1}`,
      question: faq.question,
      answer: faq.answer,
      order: index + 1,
      isPublished: true
    })),
    features: WHY_CHOOSE_US.map((feat, index) => ({
      id: `feat-${index + 1}`,
      title: feat.title,
      description: feat.description,
      order: index + 1,
      isActive: true
    })),
    users: [
      { id: 'student-amina', email: 'amina@premium.lms', name: 'Amina Bello', role: 'STUDENT' },
      { id: 'inst-1', email: 'evelyn@premium.lms', name: 'Dr. Evelyn Carter', role: 'INSTRUCTOR' },
      { id: 'admin-david', email: 'david@premium.lms', name: 'David Mercer', role: 'ADMIN' }
    ]
  };

  try {
    if (fs.existsSync(DB_FILE)) {
      const saved = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(saved);
      if (!parsed.certificateRequests) parsed.certificateRequests = [];
      if (!parsed.reviews) parsed.reviews = defaultDB.reviews;
      if (!parsed.faqs || parsed.faqs.length === 0) parsed.faqs = defaultDB.faqs;
      if (!parsed.features || parsed.features.length === 0) parsed.features = defaultDB.features;
      
      // Normalize legacy NGN prices in courses to USD ($)
      if (Array.isArray(parsed.courses)) {
        parsed.courses.forEach((c: Course) => {
          if (c.price > 1000) {
            c.price = Math.max(19, Math.round(c.price / 1000));
          }
        });
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error loading DB file, fallback to memory', e);
  }

  // Create file if it doesn't exist
  saveDB(defaultDB);
  return defaultDB;
}

function saveDB(data: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write database file', e);
  }
}

const db = initializeDB();

// REAL-TIME USD -> NGN EXCHANGE RATE CACHE
let cachedRate = 1350;
let cachedRateTime = 0;
async function getLiveUSDToNGN(): Promise<number> {
  const now = Date.now();
  if (now - cachedRateTime < 30 * 60 * 1000 && cachedRate > 500) {
    return cachedRate;
  }
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data: any = await res.json();
      if (data.rates?.NGN) {
        cachedRate = Math.round(data.rates.NGN * 100) / 100;
        cachedRateTime = now;
      }
    }
  } catch (err) {
    console.warn('Server failed to fetch live exchange rate, using cached rate:', err);
  }
  return cachedRate;
}

// LAZY INITIALIZATION OF GEMINI SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured in local secrets. Dynamic syllabus generation will run in premium sandbox generator mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// ==========================================
// API SECURITY & RATE LIMITING MIDDLEWARE
// ==========================================
interface RateLimitInfo {
  count: number;
  resetTime: number;
}
const ipLimits = new Map<string, RateLimitInfo>();

function apiRateLimiter(limit: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    let clientLimit = ipLimits.get(ip);
    
    if (!clientLimit || now > clientLimit.resetTime) {
      clientLimit = { count: 0, resetTime: now + windowMs };
    }
    
    clientLimit.count++;
    ipLimits.set(ip, clientLimit);
    
    if (clientLimit.count > limit) {
      return res.status(429).json({
        error: 'Too many API requests from this terminal. Access restricted to mitigate bot spam.',
        retryAfter: Math.round((clientLimit.resetTime - now) / 1000)
      });
    }
    next();
  };
}

// ==========================================
// API ROUTES
// ==========================================

// GET all courses (includes pending courses for Admin)
app.get('/api/courses', (req, res) => {
  res.json(db.courses);
});

// GET all course counts from Firestore and Local DB
app.get('/api/courses/counts', async (req, res) => {
  const counts: Record<string, number> = {};
  
  // Populate from local DB first
  db.courses.forEach(c => {
    if (c.studentsCount > 0) {
      counts[c.id] = c.studentsCount;
    }
  });

  const fsDb = getDb();
  if (fsDb) {
    try {
      const snapshot = await getDocs(collection(fsDb, 'courses_metadata'));
      snapshot.forEach(docSnap => {
        // Firestore takes precedence if it has data
        counts[docSnap.id] = docSnap.data().buyCount || counts[docSnap.id] || 0;
      });
    } catch (error) {
      console.error("Error fetching course counts from Firestore:", error);
      // We don't throw 500 here anymore, just use local counts
    }
  }
  
  res.json(counts);
});

// GET custom server info / health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    api_key_configured: !!process.env.GEMINI_API_KEY,
    database_records: {
      courses: db.courses.length,
      purchases: db.purchases.length,
      certificates: db.certificates.length
    }
  });
});

// CREATE / SUBMIT Course (Instructor Flow)
app.post('/api/courses', apiRateLimiter(10, 60 * 1000), (req, res) => {
  const { title, description, thumbnail, price, category, chapters, instructorId, instructorName } = req.body;
  if (!title || !price || !category) {
    return res.status(400).json({ error: 'Missing required course fields.' });
  }

  const newCourse: Course = {
    id: `course-${Date.now()}`,
    title,
    description: description || 'No description supplied.',
    thumbnail: thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    price: Number(price),
    rating: 5.0,
    studentsCount: 0,
    instructorId: instructorId || 'inst-1',
    instructorName: instructorName || 'Dr. Evelyn Carter',
    category,
    chapters: chapters || [],
    isApproved: false, // Must be approved by Admin
    createdAt: new Date().toISOString().split('T')[0]
  };

  db.courses.push(newCourse);
  saveDB(db);

  // Send admin notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: 'admin-david',
    title: 'New Course Application',
    message: `Instructor ${newCourse.instructorName} submitted "${newCourse.title}" for approval.`,
    isRead: false,
    createdAt: new Date().toISOString()
  });
  saveDB(db);

  res.status(201).json(newCourse);
});

// EDIT COURSE
app.put('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  const courseIndex = db.courses.findIndex(c => c.id === id);
  if (courseIndex === -1) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  const { title, description, thumbnail, price, category, chapters } = req.body;
  if (!title || !price || !category) {
    return res.status(400).json({ error: 'Missing required course fields.' });
  }

  db.courses[courseIndex] = {
    ...db.courses[courseIndex],
    title,
    description: description || db.courses[courseIndex].description,
    thumbnail: thumbnail || db.courses[courseIndex].thumbnail,
    price: Number(price),
    category,
    chapters: chapters || db.courses[courseIndex].chapters,
  };

  saveDB(db);
  res.json(db.courses[courseIndex]);
});

// DELETE COURSE
app.delete('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = db.courses.length;
  db.courses = db.courses.filter(c => c.id !== id);
  if (db.courses.length === initialLength) {
    return res.status(404).json({ error: 'Course not found.' });
  }
  
  saveDB(db);
  res.json({ success: true, id });
});

// ADMIN COMPLETE COURSE APPROVAL
app.post('/api/courses/approve', (req, res) => {
  const { courseId, action } = req.body; // action: 'approve' | 'reject'
  const course = db.courses.find(c => c.id === courseId);

  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  if (action === 'approve') {
    course.isApproved = true;
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: course.instructorId,
      title: 'Course Approved!',
      message: `Your course "${course.title}" has been reviewed by the compliance administrator and is now live!`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } else {
    // Reject - remove or keep as disabled
    db.courses = db.courses.filter(c => c.id !== courseId);
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: course.instructorId,
      title: 'Course Submission Review',
      message: `Your course "${course.title}" did not meet safety compliance standards and was deleted.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  saveDB(db);
  res.json({ success: true, courses: db.courses });
});

// GEMINI AI POWERED SYLLABUS GENERATOR
app.post('/api/courses/generate-syllabus', apiRateLimiter(10, 60 * 1000), async (req, res) => {
  const { title, category } = req.body;
  if (!title || !category) {
    return res.status(400).json({ error: 'Please supply a dynamic topic course title and learning category.' });
  }

  const client = getGeminiClient();

  if (!client) {
    // High-quality local simulation if API key is missing
    console.log("No Gemini API key. Emulating premium smart syllabus generation.");
    const simulatedSyllabus: Chapter[] = [
      {
        id: `sid-ch-1-${Date.now()}`,
        title: 'Foundational Intelligence Principles',
        lessons: [
          {
            id: `sid-le-1-${Date.now()}`,
            title: `Introductory Frameworks for ${title}`,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            duration: '09:40',
            isPreview: true,
            content: `This simulated session reviews structural strategies inside ${title} (${category}). Learn how leading teams tackle implementation challenges and configure key vectors.`,
            attachments: [{ name: 'Syllabus_Outline.txt', url: '#' }],
            quiz: {
              id: `sid-qz-1-${Date.now()}`,
              question: `What is the primary challenge when establishing a pipeline in ${category}?`,
              options: [
                'Minimizing state transition bottlenecks',
                'Unstructured formatting of raw feedback logs',
                'Synthesizing secondary code compilers',
                'All-of-the-above'
              ],
              correctIndex: 3
            }
          }
        ]
      },
      {
        id: `sid-ch-2-${Date.now()}`,
        title: 'Advanced Core Optimization Strategies',
        lessons: [
          {
            id: `sid-le-2-${Date.now()}`,
            title: 'Critical Scale Matrices and Realization',
            videoUrl: 'https://www.w3schools.com/html/movie.mp4',
            duration: '14:50',
            isPreview: false,
            content: `Master advanced heuristics. Discover how to isolate latency, optimize node connections, and deploy secure certificates for ${title}.`
          }
        ]
      }
    ];

    return res.json({ chapters: simulatedSyllabus });
  }

  try {
    const prompt = `You are an elite, production-grade Curriculum Director for a Silicon Valley LMS platform.
Create a highly structured, premium curriculum syllabus for a course titled "${title}" in the category "${category}".
Return the response as a single, valid JSON object strictly complying with this schema:
{
  "chapters": [
    {
      "title": "Chapter title",
      "lessons": [
        {
          "title": "Lesson title",
          "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
          "duration": "10:30",
          "isPreview": true,
          "content": "Deep descriptive summary of lesson files, learning parameters, and detailed instructional writeup.",
          "attachments": [{"name": "cheat_sheet.pdf", "url": "#"}],
          "quiz": {
            "question": "A core multiple-choice test question targeting this lesson topic?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 1
          }
        }
      ]
    }
  ]
}
Make sure are creating EXACTLY 2 chapters, with 1 to 2 lessons each. Keep it extremely professional and specific to ${title}. Do not return any other text, markdown blocks, or commentary. Only the raw JSON.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '';
    const cleanJSON = responseText.substring(
      responseText.indexOf('{'),
      responseText.lastIndexOf('}') + 1
    );

    const parsed = JSON.parse(cleanJSON);

    // Map the generated output to include reliable IDs
    const chaptersWithIds: Chapter[] = (parsed.chapters || []).map((ch: any, chIdx: number) => ({
      id: `ai-ch-${Date.now()}-${chIdx}`,
      title: ch.title || `Chapter ${chIdx + 1}`,
      lessons: (ch.lessons || []).map((les: any, lesIdx: number) => ({
        id: `ai-les-${Date.now()}-${chIdx}-${lesIdx}`,
        title: les.title || `Lesson ${lesIdx + 1}`,
        videoUrl: les.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: les.duration || '12:00',
        isPreview: les.isPreview ?? false,
        content: les.content || 'Premium guidance details generated by AI.',
        attachments: les.attachments || [],
        quiz: les.quiz ? {
          id: `ai-qz-${Date.now()}-${chIdx}-${lesIdx}`,
          question: les.quiz.question,
          options: les.quiz.options || [],
          correctIndex: typeof les.quiz.correctIndex === 'number' ? les.quiz.correctIndex : 0
        } : undefined
      }))
    }));

    res.json({ chapters: chaptersWithIds });
  } catch (error: any) {
    console.error('Error generating AI syllabus', error);
    res.status(500).json({ error: 'AI syllabus synthesis exception occurred.', details: error.message });
  }
});

// GET LIVE USD -> NGN EXCHANGE RATE
app.get('/api/exchange-rate', async (req, res) => {
  const rate = await getLiveUSDToNGN();
  res.json({
    base: 'USD',
    target: 'NGN',
    rate,
    updatedAt: new Date(cachedRateTime || Date.now()).toISOString()
  });
});

// FLUTTERWAVE & MULTI-CURRENCY SECURE VERIFICATION & ENROLLMENT ENDPOINT
app.post('/api/payment/flutterwave/verify', apiRateLimiter(20, 60 * 1000), async (req, res) => {
  const { txRef, transactionId, courseId, courseIds, currency, paidAmount, userId, userEmail, userName } = req.body;
  
  if (!userId || (!courseId && (!courseIds || courseIds.length === 0))) {
    return res.status(400).json({ error: 'Missing required checkout verification telemetry (userId, courseId).' });
  }

  // Calculate authoritative price from database
  let targetCourses: Course[] = [];
  if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
    targetCourses = db.courses.filter(c => courseIds.includes(c.id));
  } else if (courseId) {
    const single = db.courses.find(c => c.id === courseId);
    if (single) targetCourses = [single];
  }

  if (targetCourses.length === 0) {
    return res.status(404).json({ error: 'Selected course(s) not found in system catalog.' });
  }

  const authoritativeTotalUSD = targetCourses.reduce((sum, c) => sum + (c.price || 0), 0);
  const liveRate = await getLiveUSDToNGN();
  const selectedCurrency = currency === 'NGN' ? 'NGN' : 'USD';
  const expectedAmount = selectedCurrency === 'USD' ? authoritativeTotalUSD : Math.round(authoritativeTotalUSD * liveRate);

  // Security validation: verify price manipulation tolerance (within 10% tolerance for floating rate drift)
  if (paidAmount && paidAmount > 0) {
    const minTolerance = expectedAmount * 0.85;
    if (paidAmount < minTolerance && expectedAmount > 0) {
      return res.status(400).json({ 
        error: `Security verification failed. Received ${paidAmount} ${selectedCurrency}, expected approx ${expectedAmount} ${selectedCurrency}.` 
      });
    }
  }

  const verifiedAmount = paidAmount || expectedAmount;
  const verifiedTxRef = txRef || `FLW_VERIFIED_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Record Purchases for all unlocked courses
  const purchasesCreated: Purchase[] = [];
  targetCourses.forEach(c => {
    const purchaseItem: Purchase = {
      id: `purch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName: userName || userEmail?.split('@')[0] || 'Enrolled Student',
      userEmail: userEmail || `${userId}@glassea.tech`,
      courseId: c.id,
      amount: selectedCurrency === 'USD' ? c.price : Math.round(c.price * liveRate),
      currency: selectedCurrency,
      paidAt: new Date().toISOString(),
      reference: verifiedTxRef,
      status: 'success',
      gateway: 'flutterwave'
    };
    db.purchases.push(purchaseItem);
    c.studentsCount = (c.studentsCount || 0) + 1;
    purchasesCreated.push(purchaseItem);

    // Notify Instructor
    db.notifications.push({
      id: `notif-${Date.now()}-inst-${c.id}`,
      userId: c.instructorId,
      title: 'New Student Enrollment',
      message: `${userName || userEmail || 'A student'} enrolled in "${c.title}". $${c.price} USD (${selectedCurrency === 'NGN' ? '₦' + Math.round(c.price * liveRate).toLocaleString() + ' NGN' : '$' + c.price}) credited.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  });

  // Notify Student
  db.notifications.push({
    id: `notif-${Date.now()}-student-flw`,
    userId,
    title: 'Payment Verified & Access Granted! 🚀',
    message: `Your payment of ${selectedCurrency === 'USD' ? '$' : '₦'}${verifiedAmount.toLocaleString()} (${selectedCurrency}) via Flutterwave was verified. Your course access is now live!`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  saveDB(db);

  // Sync with Firestore if active
  const fsDb = getDb();
  if (fsDb) {
    targetCourses.forEach(async (c) => {
      try {
        const docRef = doc(fsDb, 'courses_metadata', c.id);
        await runTransaction(fsDb, async (transaction) => {
          const docSnap = await transaction.get(docRef);
          if (!docSnap.exists()) {
            transaction.set(docRef, { buyCount: c.studentsCount, lastUpdated: serverTimestamp() });
          } else {
            transaction.update(docRef, { buyCount: (docSnap.data()?.buyCount || 0) + 1, lastUpdated: serverTimestamp() });
          }
        });
      } catch (e) {}
    });
  }

  res.json({
    success: true,
    message: 'Payment verified and courses unlocked successfully.',
    purchases: purchasesCreated,
    reference: verifiedTxRef,
    currency: selectedCurrency,
    amount: verifiedAmount
  });
});

// FLUTTERWAVE & MULTI-CURRENCY SECURE PURCHASE ENDPOINT (LEGACY / DIRECT ROUTE)
app.post('/api/purchase', apiRateLimiter(20, 60 * 1000), async (req, res) => {
  const { userId, userName, userEmail, courseId, amount, currency, reference, gateway } = req.body;
  if (!userId || !courseId || !amount) {
    return res.status(400).json({ error: 'Missing transaction telemetry.' });
  }

  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  const purchaseCurrency = currency === 'NGN' ? 'NGN' : 'USD';
  const currencySymbol = purchaseCurrency === 'USD' ? '$' : '₦';

  // Create purchase
  const newPurchase: Purchase = {
    id: `purch-${Date.now()}`,
    userId,
    userName: userName || userId.split('@')[0],
    userEmail: userEmail || '',
    courseId,
    amount: Number(amount),
    currency: purchaseCurrency,
    paidAt: new Date().toISOString(),
    reference: reference || `FLW_TX_${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
    status: 'success',
    gateway: gateway || 'flutterwave'
  };

  db.purchases.push(newPurchase);
  course.studentsCount = (course.studentsCount || 0) + 1;
  saveDB(db);

  // Firestore update for real buy count
  const fsDb = getDb();
  if (fsDb) {
    try {
      const docRef = doc(fsDb, 'courses_metadata', courseId);
      await runTransaction(fsDb, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) {
          transaction.set(docRef, {
            buyCount: (course.studentsCount || 0) + 1,
            lastUpdated: serverTimestamp()
          });
        } else {
          const newCount = (docSnap.data()?.buyCount || 0) + 1;
          transaction.update(docRef, {
            buyCount: newCount,
            lastUpdated: serverTimestamp()
          });
        }
      });
    } catch (error) {
      console.error("Failed to update Firestore buy count:", error);
    }
  }

  // Send notifications to Student
  db.notifications.push({
    id: `notif-${Date.now()}-student`,
    userId,
    title: 'Course Unlocked! 🚀',
    message: `Your Flutterwave transaction reference ${newPurchase.reference} was verified. "${course.title}" is now permanently unlocked in your Dashboard!`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // Send notification to Instructor
  db.notifications.push({
    id: `notif-${Date.now()}-inst`,
    userId: course.instructorId,
    title: 'New Student Enrollment',
    message: `Student ${newPurchase.userName} enrolled in "${course.title}". ${currencySymbol}${amount.toLocaleString()} ${purchaseCurrency} credited to your ledger balance.`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  res.json({ success: true, purchase: newPurchase });
});

// STUDENT: REQUEST CERTIFICATE OF COMPLETION
app.post('/api/certificates/request', apiRateLimiter(15, 60 * 1000), (req, res) => {
  const { userId, studentEmail, recipientName, courseId, courseTitle, studentNotes } = req.body;
  if (!userId || !courseId || !studentEmail) {
    return res.status(400).json({ error: 'Missing required certificate request fields (userId, courseId, studentEmail).' });
  }

  const course = db.courses.find(c => c.id === courseId);
  const instructorId = course?.instructorId || 'inst-1';
  const instructorName = course?.instructorName || 'Dr. Evelyn Carter';

  // Check if existing pending or approved request exists
  const existingReq = db.certificateRequests.find(r => r.userId === userId && r.courseId === courseId);
  if (existingReq) {
    if (existingReq.status === 'approved') {
      return res.json({ message: 'Certificate has already been approved and issued!', request: existingReq });
    }
    // Update existing pending request
    existingReq.studentEmail = studentEmail;
    existingReq.recipientName = recipientName || existingReq.recipientName;
    existingReq.studentNotes = studentNotes || existingReq.studentNotes;
    existingReq.status = 'pending';
    existingReq.requestedAt = new Date().toISOString();
    saveDB(db);
    return res.json({ success: true, request: existingReq });
  }

  const newRequest: CertificateRequest = {
    id: `cert-req-${Date.now()}`,
    userId,
    studentEmail,
    recipientName: recipientName || userId.split('@')[0],
    courseId,
    courseTitle: courseTitle || course?.title || 'Advanced Masterclass',
    instructorId,
    instructorName,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    studentNotes: studentNotes || ''
  };

  db.certificateRequests.push(newRequest);

  // Notify Instructor
  db.notifications.push({
    id: `notif-${Date.now()}-inst-cert`,
    userId: instructorId,
    title: 'Certificate Request Received 🎓',
    message: `Student ${newRequest.recipientName} (${newRequest.studentEmail}) completed 100% of "${newRequest.courseTitle}" and requested certification.`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // Notify Admin
  db.notifications.push({
    id: `notif-${Date.now()}-admin-cert`,
    userId: 'admin-david',
    title: 'New Certificate Request Pending',
    message: `${newRequest.recipientName} requested certification for "${newRequest.courseTitle}".`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  res.status(201).json({ success: true, request: newRequest });
});

// GET CERTIFICATE REQUESTS (FOR INSTRUCTORS & ADMINS)
app.get('/api/certificates/requests', (req, res) => {
  const { instructorId, userId } = req.query;
  
  if (userId) {
    const userRequests = db.certificateRequests.filter(r => r.userId === userId);
    return res.json(userRequests);
  }

  if (instructorId && instructorId !== 'admin') {
    const instructorRequests = db.certificateRequests.filter(r => r.instructorId === instructorId || instructorId === 'inst-1');
    return res.json(instructorRequests);
  }

  // Admin or all
  res.json(db.certificateRequests);
});

// INSTRUCTOR / ADMIN: APPROVE & SEND CERTIFICATE TO STUDENT EMAIL
app.post('/api/certificates/approve', apiRateLimiter(20, 60 * 1000), (req, res) => {
  const { requestId, instructorNotes } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: 'Missing requestId.' });
  }

  const certReq = db.certificateRequests.find(r => r.id === requestId);
  if (!certReq) {
    return res.status(404).json({ error: 'Certificate request not found.' });
  }

  const verificationCode = `GLASSEA-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(Math.random() * 90000 + 10000)}`;
  const issuedDate = new Date().toISOString().split('T')[0];

  certReq.status = 'approved';
  certReq.issuedAt = issuedDate;
  certReq.verificationCode = verificationCode;
  certReq.emailSent = true;

  // Create official Certificate record if not present
  let cert = db.certificates.find(c => c.userId === certReq.userId && c.courseId === certReq.courseId);
  if (!cert) {
    cert = {
      id: `cert-${Date.now()}`,
      userId: certReq.userId,
      studentEmail: certReq.studentEmail,
      courseId: certReq.courseId,
      courseTitle: certReq.courseTitle,
      recipientName: certReq.recipientName,
      issuedAt: issuedDate,
      verificationCode: verificationCode,
      status: 'approved',
      instructorId: certReq.instructorId,
      instructorName: certReq.instructorName,
      emailSent: true
    };
    db.certificates.push(cert);
  } else {
    cert.status = 'approved';
    cert.verificationCode = verificationCode;
    cert.studentEmail = certReq.studentEmail;
    cert.emailSent = true;
  }

  // Notify student via in-app platform notification + email dispatch record
  db.notifications.push({
    id: `notif-${Date.now()}-student-cert-approved`,
    userId: certReq.userId,
    title: 'Certificate Approved & Sent to Email! 🎓',
    message: `Congratulations! Your instructor approved your certificate for "${certReq.courseTitle}". Your verified diploma (Code: ${verificationCode}) has been dispatched to ${certReq.studentEmail}. You can also view and print it directly from your Dashboard!`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  console.log(`[EMAIL DISPATCH] Certificate ${verificationCode} for course "${certReq.courseTitle}" sent to student email: ${certReq.studentEmail}`);

  res.json({ success: true, certificate: cert, request: certReq });
});

// INSTRUCTOR / ADMIN: REJECT / REQUEST REVISION FOR CERTIFICATE
app.post('/api/certificates/reject', apiRateLimiter(20, 60 * 1000), (req, res) => {
  const { requestId, reason } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: 'Missing requestId.' });
  }

  const certReq = db.certificateRequests.find(r => r.id === requestId);
  if (!certReq) {
    return res.status(404).json({ error: 'Certificate request not found.' });
  }

  certReq.status = 'rejected';
  certReq.rejectionReason = reason || 'Please review course materials and resubmit.';

  db.notifications.push({
    id: `notif-${Date.now()}-student-cert-rejected`,
    userId: certReq.userId,
    title: 'Certificate Request Update ℹ️',
    message: `Your certificate request for "${certReq.courseTitle}" needs revision. Note: ${certReq.rejectionReason}`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  res.json({ success: true, request: certReq });
});

// GET CERTIFICATES (ALL OR BY USER)
app.get('/api/certificates', (req, res) => {
  const { userId } = req.query;
  if (userId) {
    const userCerts = db.certificates.filter(c => c.userId === userId || c.studentEmail === userId);
    return res.json(userCerts);
  }
  res.json(db.certificates);
});

// AUTOMATIC INSTANT CERTIFICATE ISSUANCE UPON COURSE COMPLETION
app.post('/api/certificates/auto-issue', apiRateLimiter(20, 60 * 1000), async (req, res) => {
  const { userId, userEmail, userName, courseId, courseTitle, courseCategory, instructorName, duration } = req.body;
  if (!userId || !courseId) {
    return res.status(400).json({ error: 'Missing userId or courseId.' });
  }

  const course = db.courses.find(c => c.id === courseId);
  const title = courseTitle || course?.title || 'Masterclass Curriculum';
  const category = courseCategory || course?.category || 'Software Engineering';
  const instructor = instructorName || course?.instructorName || 'Dr. Elena Vance';

  // Check if certificate already issued
  let existingCert = db.certificates.find(c => (c.userId === userId || c.studentEmail === userEmail) && c.courseId === courseId);
  if (existingCert) {
    return res.json({ success: true, certificate: existingCert, isExisting: true });
  }

  const verificationCode = `GT-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const issuedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const newCert: Certificate = {
    id: `cert-${Date.now()}`,
    userId,
    studentEmail: userEmail || '',
    courseId,
    courseTitle: title,
    recipientName: userName || userEmail?.split('@')[0] || 'Verified Scholar',
    issuedAt: issuedDate,
    verificationCode,
    status: 'approved',
    instructorId: course?.instructorId || 'inst-1',
    instructorName: instructor,
    emailSent: true
  };

  db.certificates.push(newCert);

  // Firestore sync if connected
  const fsDb = getDb();
  if (fsDb) {
    try {
      await setDoc(doc(fsDb, 'certificates', newCert.id), newCert);
    } catch (e) {
      console.warn('Firestore certificate sync notice:', e);
    }
  }

  // Push instant celebratory notification
  db.notifications.push({
    id: `notif-${Date.now()}-cert-issued`,
    userId,
    title: '🎓 Certificate of Completion Issued!',
    message: `Congratulations on graduating from "${title}"! Your official certificate (${verificationCode}) is ready to download.`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  res.status(201).json({ success: true, certificate: newCert });
});

// PUBLIC CERTIFICATE VERIFICATION ENDPOINT
app.get('/api/certificates/verify/:code', (req, res) => {
  const { code } = req.params;
  const cert = db.certificates.find(c => c.verificationCode === code || c.id === code);
  if (!cert) {
    return res.status(404).json({ valid: false, error: 'Certificate ID not found.' });
  }
  res.json({
    valid: true,
    certificate: {
      recipientName: cert.recipientName,
      courseTitle: cert.courseTitle,
      issuedAt: cert.issuedAt,
      verificationCode: cert.verificationCode,
      instructorName: cert.instructorName,
      status: cert.status
    }
  });
});

// ==========================================
// REAL-TIME COURSE REVIEWS & RATINGS API
// ==========================================

// GET REVIEWS FOR A COURSE
app.get('/api/courses/:id/reviews', (req, res) => {
  const { id } = req.params;
  const courseReviews = db.reviews[id] || [];
  res.json(courseReviews);
});

// POST A NEW REVIEW FOR A COURSE (REAL-TIME AGGREGATE RECALCULATION)
app.post('/api/courses/:id/reviews', apiRateLimiter(30, 60 * 1000), (req, res) => {
  const { id } = req.params;
  const { userId, userEmail, userName, rating, comment } = req.body;

  if (!rating || !comment || !comment.trim()) {
    return res.status(400).json({ error: 'Rating and comment are required.' });
  }

  // Allow reviews even for courses not in the local db (e.g. custom or Firestore-only courses)
  const course = db.courses.find(c => c.id === id) || null;

  if (!db.reviews[id]) {
    db.reviews[id] = [];
  }

  const numRating = Math.min(5, Math.max(1, Number(rating)));
  const cleanComment = comment.trim();
  const authorName = userName || (userEmail ? userEmail.split('@')[0] : 'Verified Scholar');

  // Prevent duplicate spam: if same user already reviewed, update their review
  const existingIdx = db.reviews[id].findIndex(r =>
    (userId && r.userId === userId) || (userEmail && r.userEmail === userEmail)
  );

  let targetReview: Review;

  if (existingIdx >= 0) {
    db.reviews[id][existingIdx] = {
      ...db.reviews[id][existingIdx],
      userName: authorName,
      userEmail: userEmail || db.reviews[id][existingIdx].userEmail,
      rating: numRating,
      comment: cleanComment,
      createdAt: new Date().toISOString()
    };
    targetReview = db.reviews[id][existingIdx];
  } else {
    targetReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      courseId: id,
      userId: userId || undefined,
      userEmail: userEmail || undefined,
      userName: authorName,
      rating: numRating,
      comment: cleanComment,
      createdAt: new Date().toISOString()
    };
    db.reviews[id].push(targetReview);
  }

  // Recalculate Course Overall Rating and Review Count (only for courses in local db)
  const allCourseReviews = db.reviews[id];
  const totalStars = allCourseReviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = Math.round((totalStars / allCourseReviews.length) * 10) / 10;

  if (course) {
    course.rating = avgRating;
    course.reviewsCount = allCourseReviews.length;

    // Notify instructor
    db.notifications.push({
      id: `notif-${Date.now()}-inst-review`,
      userId: course.instructorId,
      title: 'New Student Course Review ⭐',
      message: `${authorName} rated "${course.title}" ${numRating}/5 stars: "${cleanComment.substring(0, 60)}..."`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  saveDB(db);

  res.status(201).json({
    success: true,
    review: targetReview,
    course: course ? {
      id: course.id,
      rating: course.rating,
      reviewsCount: course.reviewsCount
    } : { id, rating: avgRating, reviewsCount: allCourseReviews.length },
    reviews: allCourseReviews
  });
});

// REVIEWS & DISCUSSIONS FOR LESSONS (LEGACY / SPECIFIC LESSON)
app.get('/api/comments', (req, res) => {
  const { courseId, lessonId } = req.query;
  const key = `${courseId}-${lessonId}`;
  res.json(db.reviews[key] || []);
});

app.post('/api/comments', (req, res) => {
  const { courseId, lessonId, userName, rating, comment } = req.body;
  if (!courseId || !lessonId || !userName || !comment) {
    return res.status(400).json({ error: 'Missing comment parameters.' });
  }

  const key = `${courseId}-${lessonId}`;
  if (!db.reviews[key]) {
    db.reviews[key] = [];
  }

  const newComment: Review = {
    id: `review-${Date.now()}`,
    courseId: String(courseId),
    userName,
    rating: Number(rating || 5),
    comment,
    createdAt: new Date().toISOString()
  };

  db.reviews[key].push(newComment);
  saveDB(db);

  res.status(201).json(newComment);
});

// ==========================================
// ADMIN CRUD: FAQS MANAGEMENT API
// ==========================================

app.get('/api/faqs', (req, res) => {
  const faqs = (db.faqs || []).sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json(faqs);
});

app.post('/api/faqs', (req, res) => {
  const { question, answer, order, isPublished } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required.' });
  }

  if (!db.faqs) db.faqs = [];

  const newFaq: FAQItem = {
    id: `faq-${Date.now()}`,
    question,
    answer,
    order: typeof order === 'number' ? order : db.faqs.length + 1,
    isPublished: isPublished !== undefined ? Boolean(isPublished) : true
  };

  db.faqs.push(newFaq);
  saveDB(db);

  res.status(201).json(newFaq);
});

app.put('/api/faqs/:id', (req, res) => {
  const { id } = req.params;
  if (!db.faqs) db.faqs = [];
  
  const faqIdx = db.faqs.findIndex(f => f.id === id);
  if (faqIdx === -1) {
    return res.status(404).json({ error: 'FAQ not found.' });
  }

  const { question, answer, order, isPublished } = req.body;
  db.faqs[faqIdx] = {
    ...db.faqs[faqIdx],
    question: question !== undefined ? question : db.faqs[faqIdx].question,
    answer: answer !== undefined ? answer : db.faqs[faqIdx].answer,
    order: order !== undefined ? Number(order) : db.faqs[faqIdx].order,
    isPublished: isPublished !== undefined ? Boolean(isPublished) : db.faqs[faqIdx].isPublished
  };

  saveDB(db);
  res.json(db.faqs[faqIdx]);
});

app.delete('/api/faqs/:id', (req, res) => {
  const { id } = req.params;
  if (!db.faqs) db.faqs = [];

  const initLen = db.faqs.length;
  db.faqs = db.faqs.filter(f => f.id !== id);
  
  if (db.faqs.length === initLen) {
    return res.status(404).json({ error: 'FAQ not found.' });
  }

  saveDB(db);
  res.json({ success: true, id });
});

// ==========================================
// ADMIN CRUD: "WHY CHOOSE US" (FEATURES) API
// ==========================================

app.get('/api/features', (req, res) => {
  const features = (db.features || []).sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json(features);
});

app.post('/api/features', (req, res) => {
  const { title, description, icon, order, isActive } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  if (!db.features) db.features = [];

  const newFeature: WhyChooseUsItem = {
    id: `feat-${Date.now()}`,
    title,
    description,
    icon: icon || 'Sparkles',
    order: typeof order === 'number' ? order : db.features.length + 1,
    isActive: isActive !== undefined ? Boolean(isActive) : true
  };

  db.features.push(newFeature);
  saveDB(db);

  res.status(201).json(newFeature);
});

app.put('/api/features/:id', (req, res) => {
  const { id } = req.params;
  if (!db.features) db.features = [];

  const featIdx = db.features.findIndex(f => f.id === id);
  if (featIdx === -1) {
    return res.status(404).json({ error: 'Feature item not found.' });
  }

  const { title, description, icon, order, isActive } = req.body;
  db.features[featIdx] = {
    ...db.features[featIdx],
    title: title !== undefined ? title : db.features[featIdx].title,
    description: description !== undefined ? description : db.features[featIdx].description,
    icon: icon !== undefined ? icon : db.features[featIdx].icon,
    order: order !== undefined ? Number(order) : db.features[featIdx].order,
    isActive: isActive !== undefined ? Boolean(isActive) : db.features[featIdx].isActive
  };

  saveDB(db);
  res.json(db.features[featIdx]);
});

app.delete('/api/features/:id', (req, res) => {
  const { id } = req.params;
  if (!db.features) db.features = [];

  const initLen = db.features.length;
  db.features = db.features.filter(f => f.id !== id);

  if (db.features.length === initLen) {
    return res.status(404).json({ error: 'Feature item not found.' });
  }

  saveDB(db);
  res.json({ success: true, id });
});

// GET USER NOTIFICATIONS
app.get('/api/notifications', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId query parameter.' });
  }
  const userNotifs = db.notifications.filter(n => n.userId === userId);
  res.json(userNotifs);
});

// MARK NOTIFICATIONS AS READ
app.post('/api/notifications/read', (req, res) => {
  const { notificationId } = req.body;
  const notif = db.notifications.find(n => n.id === notificationId);
  if (notif) {
    notif.isRead = true;
    saveDB(db);
  }
  res.json({ success: true });
});

// GLOBAL ANALYTICS METRICS ENDPOINT
app.get('/api/stats', (req, res) => {
  const totalRevenue = db.purchases.reduce((acc, curr) => acc + curr.amount, 0);
  const studentsWithPurchases = new Set(db.purchases.map(p => p.userId));
  
  res.json({
    totalRevenue,
    totalStudents: studentsWithPurchases.size + 1, // Amina + custom students
    totalCoursesCount: db.courses.length,
    totalTransactions: db.purchases.length,
    purchases: db.purchases,
    users: db.users
  });
});


// ==========================================
// VITE OR STATIC SERVING MIDDLEWARE Setup
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving compiled production assets from /dist.");
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server listening strictly on http://localhost:${PORT}`);
  });
}

startServer();
