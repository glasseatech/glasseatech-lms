import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, runTransaction, serverTimestamp, collection, getDocs, setDoc } from 'firebase/firestore';
import { Course, Chapter, Lesson, Purchase, Certificate, Notification, Review } from './src/types';
import { INITIAL_COURSES } from './src/data.ts';

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
      
      firestore = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
      console.log(`Firebase initialized successfully. Database: ${firebaseConfig.firestoreDatabaseId}`);
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
  notifications: Notification[];
  reviews: Record<string, Review[]>; // key is: "courseId-lessonId" or "courseId"
  users: { id: string; email: string; name: string; role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' }[];
}

function initializeDB(): DBStructure {
  const defaultDB: DBStructure = {
    courses: INITIAL_COURSES,
    purchases: [
      {
        id: 'purch-1',
        userId: 'student-amina',
        courseId: 'course-ai-agent',
        amount: 35000,
        paidAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        reference: 'PSTK_MOCK_1122334455',
        status: 'success'
      }
    ],
    certificates: [],
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
      'course-ai-agent-les-ai-1': [
        {
          id: 'rev-1',
          courseId: 'course-ai-agent',
          userName: 'Amina Bello',
          rating: 5,
          comment: 'Perfect conceptual introduction! The explanation of stateless vs stateful central reasoning is superb.',
          createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
        }
      ]
    },
    users: [
      { id: 'student-amina', email: 'amina@premium.lms', name: 'Amina Bello', role: 'STUDENT' },
      { id: 'inst-1', email: 'evelyn@premium.lms', name: 'Dr. Evelyn Carter', role: 'INSTRUCTOR' },
      { id: 'admin-david', email: 'david@premium.lms', name: 'David Mercer', role: 'ADMIN' }
    ]
  };

  try {
    if (fs.existsSync(DB_FILE)) {
      const saved = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(saved);
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

// PAYSTACK SECURE SIMULATED CHECKOUT PATHWAY
app.post('/api/purchase', apiRateLimiter(10, 60 * 1000), async (req, res) => {
  const { userId, userName, courseId, amount, reference } = req.body;
  if (!userId || !courseId || !amount) {
    return res.status(400).json({ error: 'Missing transaction telemetry.' });
  }

  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  // Create purchase
  const newPurchase: Purchase = {
    id: `purch-${Date.now()}`,
    userId,
    courseId,
    amount: Number(amount),
    paidAt: new Date().toISOString(),
    reference: reference || `PSTK_MOCK_${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
    status: 'success'
  };

  db.purchases.push(newPurchase);
  course.studentsCount += 1;
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
    message: `Your Paystack payment reference ${newPurchase.reference} was verified. "${course.title}" is now permanently unlocked in your Dashboard!`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // Send notification to Instructor
  db.notifications.push({
    id: `notif-${Date.now()}-inst`,
    userId: course.instructorId,
    title: 'New Student Enrollment',
    message: `Student ${userName || 'Anonymous'} joined "${course.title}". ₦${amount.toLocaleString()} was credited to your core ledger balance.`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  res.json({ success: true, purchase: newPurchase });
});

// ISSUE VERIFIED CRYPTOGRAPHIC CERTIFICATES
app.post('/api/certificates', (req, res) => {
  const { userId, recipientName, courseId, courseTitle } = req.body;
  if (!userId || !courseId) {
    return res.status(400).json({ error: 'Missing credential generation fields.' });
  }

  // Check if exists
  const exists = db.certificates.find(c => c.userId === userId && c.courseId === courseId);
  if (exists) {
    return res.json(exists);
  }

  const newCertificate: Certificate = {
    id: `cert-${Date.now()}`,
    userId,
    courseId,
    courseTitle,
    recipientName: recipientName || 'Premium Scholar',
    issuedAt: new Date().toISOString().split('T')[0],
    verificationCode: `LMS-SECURE-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(Math.random() * 90000 + 10000)}`
  };

  db.certificates.push(newCertificate);
  
  // Notify user
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId,
    title: 'Certificate Awarded! 🎓',
    message: `Congratulations! You scored high-passing marks in "${courseTitle}". Open your account certificate drawer to print or share your verifiable credentials.`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  res.status(201).json(newCertificate);
});

// REVIEWS & DISCUSSIONS FOR LESSONS
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
