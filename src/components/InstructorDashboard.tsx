import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Sparkles, AlertCircle, CheckCircle, DollarSign, 
  Users, BookOpen, Activity, ChevronRight, Play, Check, HelpCircle, 
  Trash2, Server, Eye, Loader2, Upload, ArrowRight, ShieldCheck, Clock,
  Award, RefreshCw, X
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  BarChart, Bar, Legend 
} from 'recharts';
import { Course, Chapter, Lesson, Quiz, CertificateRequest } from '../types.ts';
import { compressImageFile } from '../utils/imageCompressor';
import { useExchangeRate, DEFAULT_USD_NGN_RATE } from '../utils/currency.ts';

interface InstructorDashboardProps {
  courses: Course[];
  onCourseCreated: () => void;
  userEmail: string;
  loading: boolean;
}

export default function InstructorDashboard({
  courses,
  onCourseCreated,
  userEmail,
  loading
}: InstructorDashboardProps) {
  const parsedName = userEmail ? userEmail.split('@')[0].split(/[.__-]/).map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Dr. Evelyn Carter';
  const displayedName = userEmail === 'carter@premium.lms' || !userEmail ? 'Dr. Evelyn Carter' : parsedName;
  const displayedTitle = userEmail === 'carter@premium.lms' || !userEmail ? 'Lecturer of AI Frameworks & EVM Audits' : 'Certified Premium LMS Instructor';

  // Dynamic Instructor credentials (support full CRUD/Edit Settings!)
  const [activeInstructorName, setActiveInstructorName] = useState(() => {
    return localStorage.getItem(`inst-name-${userEmail || 'default'}`) || displayedName;
  });
  const [activeInstructorTitle, setActiveInstructorTitle] = useState(() => {
    return localStorage.getItem(`inst-title-${userEmail || 'default'}`) || displayedTitle;
  });
  const [activeInstructorImage, setActiveInstructorImage] = useState(() => {
    return localStorage.getItem(`inst-image-${userEmail || 'default'}`) || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200';
  });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editInstName, setEditInstName] = useState(activeInstructorName);
  const [editInstTitle, setEditInstTitle] = useState(activeInstructorTitle);
  const [editInstImage, setEditInstImage] = useState(activeInstructorImage);

  const handleSaveProfile = () => {
    localStorage.setItem(`inst-name-${userEmail || 'default'}`, editInstName);
    localStorage.setItem(`inst-title-${userEmail || 'default'}`, editInstTitle);
    localStorage.setItem(`inst-image-${userEmail || 'default'}`, editInstImage);
    setActiveInstructorName(editInstName);
    setActiveInstructorTitle(editInstTitle);
    setActiveInstructorImage(editInstImage);
    setShowProfileModal(false);
  };

  const handleOpenProfileModal = () => {
    setEditInstName(activeInstructorName);
    setEditInstTitle(activeInstructorTitle);
    setEditInstImage(activeInstructorImage);
    setShowProfileModal(true);
  };

  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'create-course' | 'certificates'>('analytics');
  
  // Analytics ledger state
  const [earnings, setEarnings] = useState(0); 
  const [studentCount, setStudentCount] = useState(0);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);

  // Certificate requests management state
  const [certRequests, setCertRequests] = useState<CertificateRequest[]>([]);
  const [certRequestsLoading, setCertRequestsLoading] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [certActionMessage, setCertActionMessage] = useState('');

  const fetchCertRequests = async () => {
    setCertRequestsLoading(true);
    try {
      const res = await fetch(`/api/certificates/requests?instructorId=${encodeURIComponent(userEmail || 'inst-1')}`);
      if (res.ok) {
        const data = await res.json();
        setCertRequests(data);
      }
    } catch (err) {
      console.error('Error fetching certificate requests:', err);
    } finally {
      setCertRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertRequests();
  }, [userEmail]);

  const handleApproveCertificate = async (requestId: string) => {
    setApprovingRequestId(requestId);
    setCertActionMessage('');
    try {
      const res = await fetch('/api/certificates/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      if (res.ok) {
        const data = await res.json();
        setCertActionMessage(`Certificate approved! Credentials generated and dispatched to student email: ${data.request?.studentEmail}`);
        fetchCertRequests();
        setTimeout(() => setCertActionMessage(''), 5000);
      }
    } catch (err) {
      console.error('Error approving certificate:', err);
    } finally {
      setApprovingRequestId(null);
    }
  };

  const handleRejectCertificate = async (requestId: string) => {
    const reason = prompt('Please specify feedback or reason for revision:');
    if (reason === null) return;
    try {
      const res = await fetch('/api/certificates/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, reason })
      });
      if (res.ok) {
        setCertActionMessage('Revision request sent to student.');
        fetchCertRequests();
        setTimeout(() => setCertActionMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error rejecting certificate:', err);
    }
  };

  useEffect(() => {
    const fetchInstructorStats = async () => {
      if (!userEmail || !courses) return;
      try {
        const { collection, getDocs } = await import("firebase/firestore");
        const { db } = await import("../firebase.ts");

        // Identify courses owned by this instructor
        const myCourseIds = new Set(
          courses.filter(c => c.instructorId === userEmail).map(c => c.id)
        );

        const purchasesSnap = await getDocs(collection(db, "purchases"));
        let totalEarnings = 0;
        const uniqueStudents = new Set<string>();
        
        // Group by month for chart
        const monthlyStats: Record<string, { Sales: number; Students: number; users: Set<string> }> = {};

        purchasesSnap.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'success' && myCourseIds.has(data.courseId)) {
            totalEarnings += (data.amount || 0);
            uniqueStudents.add(data.userId);

            const date = new Date(data.createdAt || Date.now());
            const monthName = date.toLocaleString('default', { month: 'short' });

            if (!monthlyStats[monthName]) {
              monthlyStats[monthName] = { Sales: 0, Students: 0, users: new Set() };
            }
            monthlyStats[monthName].Sales += (data.amount || 0);
            monthlyStats[monthName].users.add(data.userId);
          }
        });

        setEarnings(totalEarnings);
        setStudentCount(uniqueStudents.size);

        const chartData = Object.keys(monthlyStats).map(month => ({
          name: month,
          Sales: monthlyStats[month].Sales,
          Students: monthlyStats[month].users.size
        }));

        setRevenueChartData(chartData.length > 0 ? chartData : [
          { name: 'No Data', Sales: 0, Students: 0 }
        ]);

      } catch (err) {
        console.error("Failed to load instructor analytics:", err);
      }
    };

    fetchInstructorStats();
  }, [userEmail, courses]);

  // Manual course creation fields
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [coursePrice, setCoursePrice] = useState('49');
  const [courseCategory, setCourseCategory] = useState('Technology');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const { rate: liveRate } = useExchangeRate();

  // Course structural chapters
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  // AI Assistance triggers
  const [aiPromptTopic, setAiPromptTopic] = useState('');
  const [aiCategory, setAiCategory] = useState('AI');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // Editing state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseIdToDelete, setCourseIdToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Feedback states
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleAiSyllabusGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptTopic.trim()) return;

    setAiGenerating(true);
    setAiError('');
    try {
      const res = await fetch('/api/courses/generate-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: aiPromptTopic,
          category: aiCategory
        })
      });
      const data = await res.json();
      if (res.ok && data.chapters) {
        setChapters(data.chapters);
        // Automatically prefill name and settings
        setCourseTitle(aiPromptTopic);
        setCourseCategory(aiCategory);
      } else {
        setAiError(data.error || 'Failed to generate dynamic AI syllabus draft.');
      }
    } catch (err: any) {
      setAiError('Failed to capture response from AI model server.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const newChapters: Chapter[] = [];

        // Skip header index 0
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const [chapterTitle, lessonTitle, duration] = lines[i].split(',').map(s => s.trim());
            if (!chapterTitle) continue;

            let chapter = newChapters.find(c => c.title === chapterTitle);
            if (!chapter) {
                chapter = { id: `ch-${Date.now()}-${newChapters.length}`, title: chapterTitle, lessons: [] };
                newChapters.push(chapter);
            }

            if (lessonTitle) {
                chapter.lessons.push({
                    id: `les-${Date.now()}-${chapter.lessons.length}`,
                    title: lessonTitle,
                    duration: duration || '0:00',
                    videoUrl: 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-',
                    isPreview: false
                });
            }
        }
        setChapters(newChapters);
    };
    reader.readAsText(file);
  };

  // Curriculum CRUD actions for Course Modules, Lessons and Quizzes
  const handleAddChapter = () => {
    const newChapter: Chapter = {
      id: `ch-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `Chapter ${chapters.length + 1}: Core Concepts`,
      lessons: []
    };
    setChapters([...chapters, newChapter]);
  };

  const handleUpdateChapterTitle = (chapterIdx: number, newTitle: string) => {
    const next = [...chapters];
    next[chapterIdx].title = newTitle;
    setChapters(next);
  };

  const handleRemoveChapter = (chapterIdx: number) => {
    const next = [...chapters];
    next.splice(chapterIdx, 1);
    setChapters(next);
  };

  const handleAddLesson = (chapterIdx: number) => {
    const chapter = chapters[chapterIdx];
    const newLesson: Lesson = {
      id: `les-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `Lesson ${chapter.lessons.length + 1}: Interactive Lecture`,
      videoUrl: 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-', // Default demo youtube link
      duration: '10',
      isPreview: false
    };
    const next = [...chapters];
    next[chapterIdx].lessons.push(newLesson);
    setChapters(next);
  };

  const handleUpdateLessonField = (chapterIdx: number, lessonIdx: number, field: keyof Lesson, value: any) => {
    const next = [...chapters];
    next[chapterIdx].lessons[lessonIdx] = {
      ...next[chapterIdx].lessons[lessonIdx],
      [field]: value
    };
    setChapters(next);
  };

  const handleRemoveLesson = (chapterIdx: number, lessonIdx: number) => {
    const next = [...chapters];
    next[chapterIdx].lessons.splice(lessonIdx, 1);
    setChapters(next);
  };

  const handleAddQuizToLesson = (chapterIdx: number, lessonIdx: number) => {
    const next = [...chapters];
    next[chapterIdx].lessons[lessonIdx].quiz = {
      id: `quiz-${Date.now()}`,
      question: 'What is the primary concept explained in this video?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0
    };
    setChapters(next);
  };

  const handleUpdateQuizField = (chapterIdx: number, lessonIdx: number, field: keyof Quiz, value: any) => {
    const next = [...chapters];
    const lesson = next[chapterIdx].lessons[lessonIdx];
    if (lesson.quiz) {
      next[chapterIdx].lessons[lessonIdx].quiz = {
        ...lesson.quiz,
        [field]: value
      };
    }
    setChapters(next);
  };

  const handleUpdateQuizOption = (chapterIdx: number, lessonIdx: number, optionIdx: number, value: string) => {
    const next = [...chapters];
    const lesson = next[chapterIdx].lessons[lessonIdx];
    if (lesson.quiz) {
      const nextOptions = [...lesson.quiz.options];
      nextOptions[optionIdx] = value;
      next[chapterIdx].lessons[lessonIdx].quiz = {
        ...lesson.quiz,
        options: nextOptions
      };
    }
    setChapters(next);
  };

  const handleRemoveQuizFromLesson = (chapterIdx: number, lessonIdx: number) => {
    const next = [...chapters];
    delete next[chapterIdx].lessons[lessonIdx].quiz;
    setChapters(next);
  };

  const handleManualSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle || !coursePrice) {
      setSubmitError('Syllabus title and pricing variables are required.');
      return;
    }

    setSubmitError('');
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db, handleFirestoreError, OperationType } = await import("../firebase.ts");

      const courseData = {
        title: courseTitle,
        description: courseDesc,
        thumbnail: thumbnailUrl,
        price: Number(coursePrice),
        category: courseCategory,
        chapters,
        instructorId: userEmail === 'carter@premium.lms' || !userEmail ? 'inst-1' : userEmail,
        instructorName: activeInstructorName,
        rating: 0,
        reviewsCount: 0,
        tags: [],
        authorTitle: activeInstructorTitle,
        authorImage: activeInstructorImage
      };

      if (editingCourseId) {
        try {
          await setDoc(doc(db, "courses", editingCourseId), courseData, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `courses/${editingCourseId}`);
        }
      } else {
        const customId = `course-custom-${Math.random().toString(36).substring(2, 9)}`;
        try {
          await setDoc(doc(db, "courses", customId), {
            ...courseData,
            id: customId,
            isApproved: false,
            rating: 4.9,
            reviewsCount: 1,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `courses/${customId}`);
        }
      }

      setSubmitSuccess(true);
      // Reset manual create entries
      setCourseTitle('');
      setCourseDesc('');
      setCoursePrice('49');
      setThumbnailUrl('');
      setChapters([]);
      setAiPromptTopic('');
      setEditingCourseId(null);
      onCourseCreated(); // Refresh catalogs
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (error) {
      console.error(error);
      setSubmitError('Unable to broadcast metadata parameters to persistent database.');
    }
  };

  const handleEditCourse = (course: Course) => {
    setCourseTitle(course.title);
    setCourseDesc(course.description);
    setCoursePrice(course.price.toString());
    setCourseCategory(course.category);
    setThumbnailUrl(course.thumbnail || '');
    setChapters(course.chapters || []);
    setEditingCourseId(course.id);
    setActiveSubTab('create-course');
  };

  const handleDeleteCourse = (courseId: string) => {
    setDeleteError(null);
    setCourseIdToDelete(courseId);
  };

  const executeDeleteCourse = async () => {
    if (!courseIdToDelete) return;
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db, handleFirestoreError, OperationType } = await import("../firebase.ts");
      try {
        await deleteDoc(doc(db, "courses", courseIdToDelete));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `courses/${courseIdToDelete}`);
      }
      onCourseCreated(); // Refresh catalogs
      setCourseIdToDelete(null);
    } catch (error) {
      console.error(error);
      setDeleteError('Error deleting course from the network.');
    }
  };

  const [movingCourses, setMovingCourses] = useState(false);
  const [moveStatus, setMoveStatus] = useState('');

  const handleMoveAllCoursesToMe = async () => {
    setMovingCourses(true);
    setMoveStatus('Initiating secure transfer protocol...');
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db, handleFirestoreError, OperationType } = await import("../firebase.ts");

      const coursesToMigrate = courses.filter(c => c.instructorId !== userEmail);
      
      if (coursesToMigrate.length === 0) {
        setMoveStatus('All courses are already assigned to your profile.');
        setTimeout(() => setMoveStatus(''), 3000);
        setMovingCourses(false);
        return;
      }

      let successCount = 0;
      for (const course of coursesToMigrate) {
        const courseData = {
          ...course,
          instructorId: userEmail,
          instructorName: activeInstructorName || 'Glasseatech Instructor',
          authorTitle: activeInstructorTitle || 'Certified Premium LMS Instructor',
          authorImage: activeInstructorImage
        };
        try {
          await setDoc(doc(db, "courses", course.id), courseData, { merge: true });
          successCount++;
        } catch (err) {
          console.error("Error transferring course:", course.id, err);
        }
      }

      setMoveStatus(`Successfully transferred ${successCount} courses to your profile!`);
      onCourseCreated(); // Refresh App state catalogs
      setTimeout(() => setMoveStatus(''), 5000);
    } catch (error) {
      console.error(error);
      setMoveStatus('Failed to complete transfer.');
    } finally {
      setMovingCourses(false);
    }
  };

  useEffect(() => {
    if (userEmail === 'glasseatech@gmail.com' && courses.length > 0) {
      const coursesToMigrate = courses.filter(c => c.instructorId !== 'glasseatech@gmail.com');
      if (coursesToMigrate.length > 0) {
        const autoMigrate = async () => {
          try {
            const { doc, setDoc } = await import("firebase/firestore");
            const { db } = await import("../firebase.ts");
            for (const course of coursesToMigrate) {
              const updatedCourse = {
                ...course,
                instructorId: 'glasseatech@gmail.com',
                instructorName: activeInstructorName || 'Glasseatech Instructor',
                authorTitle: activeInstructorTitle || 'Certified Premium LMS Instructor',
                authorImage: activeInstructorImage
              };
              await setDoc(doc(db, "courses", course.id), updatedCourse, { merge: true });
            }
            onCourseCreated(); // trigger refresh
          } catch (e) {
            console.warn("Auto-migration of courses failed:", e);
          }
        };
        autoMigrate();
      }
    }
  }, [userEmail, courses, activeInstructorName, activeInstructorTitle, activeInstructorImage]);

  const filterInstructorCourses = courses.filter(c => {
    if (userEmail === 'carter@premium.lms' || !userEmail) {
      return c.instructorId === 'inst-1' || c.instructorId === 'carter@premium.lms';
    }
    return c.instructorId === userEmail;
  });

  // Dynamic Onboarding Checklist Verification
  const isProfileCompleted = !!localStorage.getItem(`inst-name-${userEmail || 'default'}`);
  const hasCoursesCreated = filterInstructorCourses.length > 0;
  const hasCourseContent = filterInstructorCourses.some(c => c.chapters && c.chapters.length > 0 && c.chapters.some(ch => ch.lessons && ch.lessons.length > 0));
  const hasApprovedCourse = filterInstructorCourses.some(c => c.isApproved);

  const checklistSteps = [
    {
      id: 'profile',
      label: 'Complete Instructor Profile',
      description: 'Define your public display name, credentials, and avatar to establish authority.',
      isComplete: isProfileCompleted,
      actionLabel: 'Update Profile',
      onClick: () => handleOpenProfileModal()
    },
    {
      id: 'create',
      label: 'Design First Course Syllabus',
      description: 'Draft your course title, pricing, and category (manually or using Gemini AI).',
      isComplete: hasCoursesCreated,
      actionLabel: 'Start Draft',
      onClick: () => setActiveSubTab('create-course')
    },
    {
      id: 'curriculum',
      label: 'Add Lessons & Quizzes',
      description: 'Embed educational videos, lecture files, or conceptual student check quizzes.',
      isComplete: hasCourseContent,
      actionLabel: 'Manage Content',
      onClick: () => {
        if (filterInstructorCourses.length > 0) {
          handleEditCourse(filterInstructorCourses[0]);
        } else {
          setActiveSubTab('create-course');
        }
      }
    },
    {
      id: 'approve',
      label: 'Awaiting Admin Quality Audit',
      description: 'Your submitted courses will be reviewed by administrators for syllabus excellence.',
      isComplete: hasApprovedCourse,
      actionLabel: 'View Status',
      onClick: null
    }
  ];

  const completedStepsCount = checklistSteps.filter(s => s.isComplete).length;
  const onboardingPercentage = Math.round((completedStepsCount / checklistSteps.length) * 100);

  return (
    <div className="min-h-screen text-left space-grid pb-24 pt-24 bg-neutral-bg" id="instructor-dashboard-root">
      
      {/* ================= INSTRUCTOR JUMBOTRON ================= */}
      <section className="bg-secondary/15 border-b border-white/[0.05] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left">
              <div className="relative group select-none shrink-0 border border-primary/20 p-0.5 rounded-full">
                <img 
                  src={activeInstructorImage} 
                  alt={activeInstructorName} 
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-full object-cover" 
                />
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 bg-primary/20 text-primary-light px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase font-bold">
                  Instructor Studio
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display font-extrabold text-2xl tracking-tight text-neutral-dark">{activeInstructorName}</h1>
                  <button 
                    onClick={handleOpenProfileModal}
                    type="button"
                    className="text-[9px] font-sans font-bold bg-primary/10 text-primary border border-primary/15 rounded-md px-2 py-0.5 hover:bg-primary hover:text-white transition cursor-pointer uppercase"
                  >
                    Edit Profile
                  </button>
                </div>
                <p className="text-xs text-neutral-medium font-mono">{activeInstructorTitle} • {userEmail || 'evelyn@premium.lms'}</p>
              </div>
            </div>

            {/* Global Earning balances */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-light/5 border border-white/5 p-4 rounded-xl text-left font-mono">
                <span className="block text-[10px] text-neutral-medium uppercase">Active Ledger Earnings (USD)</span>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-accent-alt">${(earnings || 0).toLocaleString()} USD</span>
                  <span className="text-[10px] text-emerald-400 mt-0.5">
                    ≈ ₦{Math.round((earnings || 0) * (liveRate || DEFAULT_USD_NGN_RATE)).toLocaleString()} NGN
                  </span>
                </div>
              </div>
              <div className="bg-neutral-light/5 border border-white/5 p-4 rounded-xl text-left font-mono">
                <span className="block text-[10px] text-neutral-medium uppercase">Active Scholars</span>
                <span className="text-xl font-bold text-primary">{studentCount} Students</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= INNER SUB NAVS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex overflow-x-auto scrollbar-hide border-b border-white/[0.05] gap-4" id="instructor-tabs">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`pb-3 pt-1.5 text-xs font-mono font-bold uppercase tracking-widest border-b-2 transition shrink-0 ${
              activeSubTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-medium hover:text-neutral-dark'
            }`}
          >
            Studio Ledger & Charts
          </button>
          <button
            onClick={() => {
              if (activeSubTab === 'create-course' && editingCourseId) {
                setEditingCourseId(null);
                setCourseTitle('');
                setCourseDesc('');
                setCoursePrice('35000');
                setThumbnailUrl('');
                setChapters([]);
              }
              setActiveSubTab('create-course');
            }}
            className={`pb-3 pt-1.5 text-xs font-mono font-bold uppercase tracking-widest border-b-2 transition shrink-0 ${
              activeSubTab === 'create-course'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-medium hover:text-neutral-dark'
            }`}
          >
            {editingCourseId ? 'Edit Course' : 'Create New Course (+ AI)'}
          </button>
          <button
            onClick={() => { setActiveSubTab('certificates'); fetchCertRequests(); }}
            className={`pb-3 pt-1.5 text-xs font-mono font-bold uppercase tracking-widest border-b-2 transition shrink-0 relative ${
              activeSubTab === 'certificates'
                ? 'border-accent text-accent'
                : 'border-transparent text-neutral-medium hover:text-neutral-dark'
            }`}
          >
            Certificate Requests
            {certRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-accent text-white text-[9px] font-bold rounded-full">
                {certRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {/* ================= SUB TAB: ANALYTICAL RECHARTS CHANNELS ================= */}
        {activeSubTab === 'analytics' && (
          <div className="mt-8 space-y-8" id="instructor-analytics-tab">
            
            {/* ================= INSTRUCTOR ONBOARDING CHECKLIST ================= */}
            <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] bg-secondary/5 text-left space-y-6 relative overflow-hidden" id="instructor-onboarding-panel">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl -z-10"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-[10px] text-primary font-mono font-bold tracking-widest uppercase">PORTAL CREDENTIAL VERIFICATION</span>
                  </div>
                  <h3 className="font-display font-extrabold text-lg text-neutral-dark flex flex-wrap items-center gap-2">
                    Instructor Onboarding Progress
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      onboardingPercentage === 100
                        ? 'bg-accent-alt/15 text-accent-alt border border-accent-alt/25'
                        : 'bg-primary/15 text-primary-light border border-primary/20'
                    }`}>
                      {onboardingPercentage === 100 ? 'PARTNER STATUS: VERIFIED' : 'PARTNER STATUS: PROVISIONAL'}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-medium max-w-2xl leading-relaxed">
                    Complete your onboarding checkpoints below to obtain official status verification. Verified partners gain higher visibility on the main catalog and immediate direct payouts.
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                  <span className="font-mono text-xs font-semibold text-neutral-medium">
                    Overall Onboarding: <strong className="text-primary-light">{onboardingPercentage}%</strong> ({completedStepsCount} of 4 tasks)
                  </span>
                  <div className="w-48 bg-neutral-light/5 border border-white/5 rounded-full h-2 h-max overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-primary via-primary-light to-accent h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${onboardingPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Steps Layout Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {checklistSteps.map((step, idx) => (
                  <div 
                    key={step.id} 
                    className={`flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 ${
                      step.isComplete 
                        ? 'bg-accent-alt/5 border-accent-alt/20 hover:border-accent-alt/40' 
                        : 'bg-neutral-light/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-neutral-medium/50 uppercase font-extrabold">Checkpoint 0{idx + 1}</span>
                        {step.isComplete ? (
                          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-accent-alt">
                            <Check className="h-3.5 w-3.5" />
                            <span>COMPLETED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-yellow-500">
                            <Clock className="h-3.5 w-3.5 animate-spin" />
                            <span>PENDING</span>
                          </div>
                        )}
                      </div>
                      
                      <h4 className="text-xs font-bold font-mono text-neutral-dark flex items-center gap-1.5">
                        {step.label}
                      </h4>
                      <p className="text-[11px] text-neutral-medium leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-medium">Action point</span>
                      {step.onClick ? (
                        <button
                          onClick={step.onClick}
                          className={`text-[9px] font-mono font-bold px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                            step.isComplete
                              ? 'bg-neutral-light hover:bg-neutral-light hover:text-white border border-neutral-medium/10 text-neutral-dark'
                              : 'bg-gradient-to-r from-primary via-primary-light to-accent text-black font-extrabold hover:scale-[1.02]'
                          }`}
                        >
                          {step.actionLabel}
                          <ArrowRight className="h-2.5 w-2.5" />
                        </button>
                      ) : (
                        <span className="text-[9px] font-mono text-neutral-medium/60 italic">
                          {step.isComplete ? 'Audited' : 'Awaiting Course'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {onboardingPercentage === 100 && (
                <div className="p-4 bg-accent-alt/10 border border-accent-alt/25 rounded-xl flex items-center gap-3 text-left animate-fade-in">
                  <ShieldCheck className="h-5 w-5 text-accent-alt shrink-0 animate-bounce" />
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-neutral-dark font-mono uppercase">CONGRATULATIONS! ONBOARDING COMPLETED</span>
                    <span className="block text-[11px] text-neutral-medium leading-relaxed">
                      You are now recognized as a **Verified Premium LMS Partner**. Your first course approval is live, and your payouts are officially connected to the sovereign smart contract ledger.
                    </span>
                  </div>
                </div>
              )}

              {/* Special Migration Action Panel */}
              {userEmail === 'glasseatech@gmail.com' && courses.some(c => c.instructorId !== 'glasseatech@gmail.com') && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left animate-fade-in">
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-neutral-dark font-mono uppercase flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      ADMIN POWER-UP: Seeded Catalog Courses Found
                    </span>
                    <span className="block text-[11px] text-neutral-medium leading-relaxed">
                      You can instantly transfer all platform-seeded courses in the database to your personal instructor profile. This will instantly configure your onboarding milestones!
                    </span>
                    {moveStatus && (
                      <span className="block text-xs font-mono font-bold text-primary-light animate-pulse mt-1">
                        {moveStatus}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleMoveAllCoursesToMe}
                    disabled={movingCourses}
                    className="shrink-0 text-xs font-mono font-extrabold bg-gradient-to-r from-primary via-primary-light to-accent text-black px-4 py-2.5 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-md shadow-primary/25 disabled:opacity-50 cursor-pointer"
                  >
                    {movingCourses ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Transferring...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Claim & Move All Courses</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {/* Visual Recharts graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Box 1: Sales trends */}
              <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] text-left space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-primary font-mono font-bold tracking-widest uppercase">SALES BALANCE PROGRESSION</span>
                  <h3 className="font-display font-bold text-base text-neutral-dark">Monthly Revenue Ledger</h3>
                </div>
                
                <div className="h-64 font-mono text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#00D9FF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" stroke="#6B7A99" />
                      <YAxis stroke="#6B7A99" />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#0F172A' }} />
                      <Area type="monotone" dataKey="Sales" stroke="#00D9FF" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Box 2: Student growth registrations */}
              <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] text-left space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-accent font-mono font-bold tracking-widest uppercase">SCHOLAR REGISTRATION VOLUME</span>
                  <h3 className="font-display font-bold text-base text-neutral-dark">Cumulative Registrations</h3>
                </div>
                
                <div className="h-64 font-mono text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" stroke="#6B7A99" />
                      <YAxis stroke="#6B7A99" />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#0F172A' }} />
                      <Bar dataKey="Students" fill="#FF00AA" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* My existing submitted courses and audit checks table */}
            <div className="space-y-4">
              <h3 className="text-sm font-mono font-bold tracking-widest text-neutral-medium uppercase">My Active Program Catalogue ({filterInstructorCourses.length})</h3>
              
              <div className="glass-panel rounded-2xl overflow-hidden border border-white/[0.05] divide-y divide-white/[0.05]">
                {filterInstructorCourses.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-medium">
                    No custom courses submitted. Open 'Create New Course' tab to start building!
                  </div>
                ) : (
                  filterInstructorCourses.map((c) => (
                    <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-neutral-light/[0.01] transition">
                      <div className="text-left font-mono">
                        <span className="block text-xs font-bold text-neutral-dark">{c.title}</span>
                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-neutral-medium mt-1">
                          <span>Category: {c.category}</span>
                          <span className="text-emerald-400 font-bold">
                            Fee: ${(c.price || 0)} USD (≈ ₦{Math.round((c.price || 0) * (liveRate || DEFAULT_USD_NGN_RATE)).toLocaleString()} NGN)
                          </span>
                          <span>Graduation completions: {c.studentsCount} scholars</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full ${
                          c.isApproved 
                            ? 'bg-accent-alt/15 text-accent-alt border border-accent-alt/30 glow-neon-emerald'
                            : 'bg-yellow-500/15 text-yellow-500 border border-yellow-500/30'
                        }`}>
                          {c.isApproved ? 'LIVE' : 'PENDING COMPLIANCE CHECK'}
                        </span>
                        <button 
                          onClick={() => handleEditCourse(c)}
                          className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-md bg-neutral-light border border-neutral-medium/10 text-neutral-dark hover:bg-neutral-light hover:text-white transition"
                        >
                          EDIT
                        </button>
                        <button 
                          onClick={() => handleDeleteCourse(c.id)}
                          className="p-1 rounded-md text-red-500 hover:bg-red-500/10 transition"
                          title="Delete Course"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* ================= SUB TAB: CERTIFICATE REQUESTS ================= */}
        {activeSubTab === 'certificates' && (
          <div className="mt-8 space-y-6" id="instructor-cert-requests-tab">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-mono font-bold tracking-widest text-neutral-medium uppercase">Student Certificate Requests</h3>
                <p className="text-xs text-neutral-medium/70 mt-1">Review student completion submissions and approve to send verified credentials to their email.</p>
              </div>
              <button
                onClick={fetchCertRequests}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-neutral-medium hover:text-white hover:border-white/20 rounded-xl text-xs font-mono font-bold transition"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>

            {certActionMessage && (
              <div className="p-4 bg-[#3ac58a]/15 border border-[#3ac58a]/30 rounded-xl text-[#3ac58a] text-xs font-mono animate-fade-in flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{certActionMessage}</span>
              </div>
            )}

            {certRequestsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <span className="ml-3 text-xs text-neutral-medium font-mono">Loading requests...</span>
              </div>
            ) : certRequests.length === 0 ? (
              <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
                <Award className="h-8 w-8 text-neutral-medium mx-auto opacity-40" />
                <p className="text-xs text-neutral-medium font-mono">No certificate requests yet. Once students complete your courses and request certificates, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {certRequests.map((req) => (
                  <div key={req.id} className={`glass-panel p-5 sm:p-6 rounded-2xl border transition-all ${
                    req.status === 'approved' ? 'border-[#3ac58a]/30 bg-[#3ac58a]/[0.02]' :
                    req.status === 'rejected' ? 'border-red-500/20 bg-red-500/[0.02]' :
                    'border-accent/20 bg-accent/[0.02]'
                  }`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                            req.status === 'approved' ? 'bg-[#3ac58a]/15 text-[#3ac58a] border-[#3ac58a]/30' :
                            req.status === 'rejected' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                            'bg-accent/15 text-accent border-accent/30 animate-pulse'
                          }`}>
                            {req.status === 'approved' ? '✓ APPROVED & EMAILED' :
                             req.status === 'rejected' ? '✗ REVISION REQUESTED' :
                             '◉ PENDING REVIEW'}
                          </span>
                          {req.status === 'approved' && req.emailSent && (
                            <span className="text-[10px] font-mono text-[#3ac58a] flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" /> Email Dispatched
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="font-display font-bold text-neutral-dark text-sm">{req.recipientName}</p>
                          <p className="text-xs text-neutral-medium font-mono">{req.studentEmail}</p>
                        </div>

                        <div className="text-xs text-neutral-medium">
                          <span className="font-bold text-neutral-dark/80">Course: </span>
                          <span>{req.courseTitle}</span>
                        </div>

                        {req.studentNotes && (
                          <div className="p-3 bg-black/20 border border-white/5 rounded-xl text-xs font-mono text-neutral-medium/80 italic">
                            "{req.studentNotes}"
                          </div>
                        )}

                        {req.rejectionReason && (
                          <div className="text-xs text-red-400 font-mono">
                            <span className="font-bold">Revision Note: </span>{req.rejectionReason}
                          </div>
                        )}

                        {req.verificationCode && req.status === 'approved' && (
                          <div className="text-xs font-mono text-[#3ac58a]/80 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Code: {req.verificationCode}
                          </div>
                        )}

                        <p className="text-[10px] text-neutral-medium/50 font-mono">
                          Requested: {new Date(req.requestedAt).toLocaleString()}
                        </p>
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex sm:flex-col gap-2 items-start sm:items-end shrink-0">
                          <button
                            onClick={() => handleApproveCertificate(req.id)}
                            disabled={approvingRequestId === req.id}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#3ac58a] text-black text-xs font-bold rounded-xl hover:bg-[#32b27b] transition disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/20"
                          >
                            {approvingRequestId === req.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            Approve & Email
                          </button>
                          <button
                            onClick={() => handleRejectCertificate(req.id)}
                            disabled={approvingRequestId === req.id}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-red-400 hover:border-red-500/30 hover:bg-red-500/10 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                            Request Revision
                          </button>
                        </div>
                      )}

                      {req.status === 'approved' && (
                        <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-[#3ac58a]">
                          <Award className="h-5 w-5" />
                          <span>Issued {req.issuedAt}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= SUB TAB: DRAFT WORKSPACE (GEMINI INTEGRATED) ================= */}
        {activeSubTab === 'create-course' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8" id="instructor-create-tab">
            
            {/* Column Left (Col 5): AI generation parameters controller */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel p-6 rounded-2xl border border-primary/30 relative overflow-hidden text-left space-y-6">
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
                    <span className="text-[10px] text-primary font-mono tracking-widest font-extrabold uppercase">GEMINI DYNAMIC SYLLABUS DRAFTER</span>
                  </div>
                  <h3 className="font-display font-extrabold text-base text-neutral-dark">Full Syllabus Creator</h3>
                  <p className="text-[11px] text-neutral-medium leading-relaxed">
                    Provide a conceptual learning prompt. The Gemini AI engine will output complete lessons, supplementary documents, learning explanations, and robust test quizzes.
                  </p>
                </div>

                <form onSubmit={handleAiSyllabusGenerate} className="space-y-4 font-mono text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-medium uppercase tracking-wider font-bold">Course Theme Prompt</label>
                    <input 
                      type="text"
                      className="w-full bg-neutral-light border border-neutral-medium/20 rounded-lg p-2.5 text-xs text-neutral-dark focus:outline-none focus:border-primary placeholder:text-neutral-medium/40"
                      placeholder="e.g. Full-Stack Dev with NextJS 15"
                      value={aiPromptTopic}
                      onChange={(e) => setAiPromptTopic(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-medium uppercase tracking-wider font-bold">Vertical Category Slot</label>
                    <select
                      className="w-full bg-neutral-light border border-neutral-medium/20 rounded-lg p-2.5 text-xs text-neutral-dark focus:outline-none focus:border-primary"
                      value={aiCategory}
                      onChange={(e) => setAiCategory(e.target.value)}
                    >
                      <option value="Technology">Technology</option>
                      <option value="AI">Artificial Intell</option>
                      <option value="Design">SaaS Design Core</option>
                      <option value="Finance">Quantitative Finance</option>
                      <option value="Business">Strategic Business</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={aiGenerating}
                    className="w-full bg-primary text-secondary-dark font-display font-extrabold text-xs py-3 rounded-xl glow-neon-cyan hover:bg-primary-light transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing and Synthesizing Syllabus...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Draft AI Syllabus Structure
                      </>
                    )}
                  </button>

                  <div className="relative pt-4">
                     <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-medium/20"></div>
                     </div>
                     <div className="relative flex justify-center text-[10px]">
                        <span className="bg-neutral-light px-2 text-neutral-medium uppercase font-bold">or bulk import</span>
                     </div>
                  </div>

                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-neutral-medium/20 rounded-lg cursor-pointer hover:border-primary transition group">
                      <div className="flex flex-col items-center">
                        <Upload className="h-6 w-6 text-neutral-medium group-hover:text-primary" />
                        <span className="text-[10px] text-neutral-medium mt-2">Upload CSV Syllabus</span>
                      </div>
                      <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                  </label>
                  
                  {aiError && (
                    <div className="text-red-400 bg-red-400/15 border border-red-400/30 font-mono text-[10px] p-2.5 rounded-lg">
                      {aiError}
                    </div>
                  )}
                </form>

              </div>
            </div>

            {/* Column Right (Col 7): Manual draft fields form and syllabus sequence preview */}
            <div className="lg:col-span-7">
              <form onSubmit={handleManualSubmitCourse} className="glass-panel p-6 sm:p-8 rounded-2xl text-left space-y-6">
                
                <h3 className="font-display font-extrabold text-lg text-neutral-dark border-b border-neutral-medium/10 pb-3 mb-4">Course Details Sheet</h3>

                <div className="space-y-4 font-mono text-xs">
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-medium uppercase">Course Module Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-neutral-light border border-neutral-medium/20 rounded-lg p-2.5 text-xs text-neutral-dark focus:outline-none focus:border-primary"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-medium uppercase">Strategic Concept Summary (Description)</label>
                    <textarea 
                      className="w-full bg-neutral-light border border-neutral-medium/20 rounded-lg p-2.5 text-xs text-neutral-dark h-24 focus:outline-none focus:border-primary"
                      value={courseDesc}
                      onChange={(e) => setCourseDesc(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-neutral-medium uppercase">Course Price (USD $)</label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="e.g. 49"
                        className="w-full bg-neutral-light border border-neutral-medium/20 rounded-lg p-2.5 text-xs text-neutral-dark focus:outline-none focus:border-primary"
                        value={coursePrice}
                        onChange={(e) => setCoursePrice(e.target.value)}
                        required 
                      />
                      <span className="text-[10px] text-neutral-medium font-mono block">
                        Estimated NGN equivalent: ≈ ₦{Math.round((Number(coursePrice) || 0) * (liveRate || DEFAULT_USD_NGN_RATE)).toLocaleString()} NGN
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-neutral-medium uppercase">Category Taxonomy</label>
                      <select 
                        className="w-full bg-neutral-light border border-neutral-medium/20 rounded-lg p-2.5 text-xs text-neutral-dark focus:outline-none focus:border-primary"
                        value={courseCategory}
                        onChange={(e) => setCourseCategory(e.target.value)}
                      >
                        <option value="Technology">Technology</option>
                        <option value="Business">Business</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="AI">AI</option>
                        <option value="Finance">Finance</option>
                        <option value="Education">Education</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-neutral-medium uppercase">Course Poster Cover (Image URL)</label>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        className="flex-1 bg-neutral-light border border-neutral-medium/20 rounded-lg p-2.5 text-xs text-neutral-dark focus:outline-none focus:border-primary"
                        placeholder="e.g. https://images.unsplash.com/photo-..."
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                      />
                      
                      <div className="relative shrink-0">
                        <label className="flex items-center gap-1.5 px-3 py-2.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-lg text-xs font-mono font-bold transition cursor-pointer">
                          <Upload className="h-4 w-4" />
                          Upload file
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                compressImageFile(file, { maxWidth: 800, maxHeight: 450 }).then(dataUrl => {
                                  setThumbnailUrl(dataUrl);
                                }).catch(err => console.error('Compression error:', err));
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                    
                    {thumbnailUrl && (
                      <div className="mt-2 p-2 rounded-xl border border-neutral-medium/10 bg-neutral-light flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img src={thumbnailUrl} alt="Cover preview" className="h-10 w-16 object-cover rounded border border-neutral-medium/10 shrink-0" />
                          <span className="text-[10px] text-neutral-medium truncate font-mono">
                            {thumbnailUrl.startsWith('data:') ? 'Custom Uploaded Cover Image' : 'Linked Internet Poster Cover'}
                          </span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setThumbnailUrl('')}
                          className="px-2 py-1 text-[9px] font-bold font-mono uppercase bg-red-100 text-red-500 rounded hover:bg-red-200 transition shrink-0"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                    
                    {/* Visual Preset Covers */}
                    <div className="space-y-1 mt-2">
                      <span className="block text-[8px] font-bold text-neutral-medium uppercase">Or select a professional cover preset</span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[
                          { name: 'AI Glow', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&h=450' },
                          { name: 'Coding', url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&h=450' },
                          { name: 'Product UX', url: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&h=450' },
                          { name: 'Ledger Stats', url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&h=450' },
                          { name: 'Web Dev', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&h=450' },
                          { name: 'Mobile App', url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&h=450' },
                        ].map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setThumbnailUrl(p.url)}
                            className={`relative aspect-video rounded overflow-hidden border text-[8px] font-mono font-bold leading-tight uppercase transition hover:opacity-100 ${
                              thumbnailUrl === p.url 
                                ? 'border-primary ring-1 ring-primary/40' 
                                : 'border-neutral-medium/10 opacity-65'
                            }`}
                            title={p.name}
                          >
                            <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 hover:bg-black/10 flex items-center justify-center p-0.5 text-white">
                              <span className="truncate max-w-full text-[7px]">{p.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Visual Curriculum Constructor Sheet */}
                <div className="space-y-4 pt-6 border-t border-neutral-medium/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="block text-[9px] font-mono text-primary font-bold uppercase tracking-widest">
                        Interactive Curriculum Builder
                      </span>
                      <h4 className="text-xs font-mono font-bold text-neutral-dark uppercase">
                        Syllabus Structure ({chapters.length} Modules Loaded)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddChapter}
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-lg transition"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Add Module
                    </button>
                  </div>

                  {chapters.length === 0 ? (
                    <div className="p-6 bg-neutral-light border border-dashed border-neutral-medium/20 rounded-xl text-center text-xs text-neutral-medium font-mono">
                      No custom module segments loaded yet.<br/>
                      <button 
                        type="button" 
                        onClick={handleAddChapter}
                        className="text-primary hover:underline font-bold mt-2 inline-block font-sans rounded"
                      >
                        Create your first Module Segment manually
                      </button> or select Gemini AI Syllabus Drafter on the left!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chapters.map((ch, chIdx) => (
                        <div 
                          key={ch.id || chIdx} 
                          className="p-4 rounded-xl bg-neutral-light border border-neutral-medium/10 font-mono space-y-4 shadow-xs text-left"
                        >
                          {/* Module Header Title & Deletion row */}
                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div className="flex-1 space-y-1.5 text-left w-full">
                              <label className="text-[9px] font-bold text-neutral-medium uppercase">
                                Module #{chIdx + 1} Title (Chapter)
                              </label>
                              <input 
                                type="text"
                                className="w-full bg-neutral-bg border border-neutral-medium/20 rounded-lg p-2 text-xs text-neutral-dark font-display font-medium font-sans focus:outline-none focus:border-primary"
                                value={ch.title}
                                onChange={(e) => handleUpdateChapterTitle(chIdx, e.target.value)}
                                placeholder="Module title..."
                                required
                              />
                            </div>

                            <div className="flex flex-row items-center gap-3 w-full sm:w-auto self-end sm:self-center shrink-0">
                              <div className="space-y-1 text-left flex-1 sm:flex-initial">
                                <label className="text-[9px] font-bold text-neutral-medium uppercase block">Module Cover</label>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="text"
                                    className="bg-neutral-bg border border-neutral-medium/20 rounded-lg px-2.5 py-1.5 text-xs text-neutral-dark focus:outline-none focus:border-primary w-28 text-[11px]"
                                    placeholder="Thumbnail URL..."
                                    value={ch.thumbnail || ''}
                                    onChange={(e) => {
                                      const next = [...chapters];
                                      next[chIdx].thumbnail = e.target.value;
                                      setChapters(next);
                                    }}
                                  />
                                  <label className="relative p-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer transition flex items-center justify-center shrink-0">
                                    <Upload className="h-3.5 w-3.5" />
                                    <input 
                                      type="file" 
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          compressImageFile(file, { maxWidth: 400, maxHeight: 225 }).then(dataUrl => {
                                            const next = [...chapters];
                                            next[chIdx].thumbnail = dataUrl;
                                            setChapters(next);
                                          }).catch(err => console.error('Compression error:', err));
                                        }
                                      }}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                  </label>
                                </div>
                              </div>
                              
                              {ch.thumbnail && (
                                <img src={ch.thumbnail} alt="Module cover" className="h-[28px] w-12 rounded object-cover border border-neutral-medium/10 mt-4 shrink-0" />
                              )}
                              
                              <button
                                type="button"
                                onClick={() => handleRemoveChapter(chIdx)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition mt-4 shrink-0"
                                title="Delete Module Segment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Lessons sub-sheet */}
                          <div className="space-y-3.5 pl-4 border-l-2 border-primary/20 text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-neutral-medium uppercase tracking-wider">
                                Video Clips & Learning Assets ({ch.lessons.length} loaded)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddLesson(chIdx)}
                                className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-primary hover:underline bg-transparent"
                              >
                                + Add Video Lesson
                              </button>
                            </div>

                            {ch.lessons.map((les, lesIdx) => (
                              <div 
                                key={les.id || lesIdx}
                                className="p-3 rounded-lg bg-neutral-bg border border-neutral-medium/10 shadow-xs space-y-3 text-left"
                              >
                                {/* Lesson primary inputs */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                  <div className="sm:col-span-4 space-y-1 text-left">
                                    <label className="text-[8px] font-bold text-neutral-medium uppercase">Lesson Title</label>
                                    <input 
                                      type="text"
                                      className="w-full bg-neutral-light border border-neutral-medium/20 rounded px-2 py-1 text-[11px] font-sans text-neutral-dark focus:outline-none focus:border-primary"
                                      value={les.title}
                                      onChange={(e) => handleUpdateLessonField(chIdx, lesIdx, 'title', e.target.value)}
                                      placeholder="Lesson Title"
                                      required
                                    />
                                  </div>

                                  <div className="sm:col-span-5 space-y-1 text-left">
                                    <label className="text-[8px] font-bold text-neutral-medium uppercase">YouTube link / Video URL</label>
                                    <input 
                                      type="text"
                                      className="w-full bg-neutral-light border border-neutral-medium/20 rounded px-2 py-1 text-[11px] text-neutral-dark focus:outline-none focus:border-primary"
                                      value={les.videoUrl}
                                      onChange={(e) => handleUpdateLessonField(chIdx, lesIdx, 'videoUrl', e.target.value)}
                                      placeholder="https://www.youtube.com/watch?v=..."
                                      required
                                    />
                                  </div>

                                  <div className="sm:col-span-2 space-y-1 text-left">
                                    <label className="text-[8px] font-bold text-neutral-medium uppercase">Duration (mins)</label>
                                    <input 
                                      type="text"
                                      className="w-full bg-neutral-light border border-neutral-medium/20 rounded px-2 py-1 text-[11px] text-neutral-dark focus:outline-none focus:border-primary"
                                      value={les.duration}
                                      onChange={(e) => handleUpdateLessonField(chIdx, lesIdx, 'duration', e.target.value)}
                                      placeholder="10"
                                      required
                                    />
                                  </div>

                                  <div className="sm:col-span-1 text-center self-end sm:self-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveLesson(chIdx, lesIdx)}
                                      className="p-1 rounded text-red-500 hover:bg-red-500/10 transition"
                                      title="Remove Lesson"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Extra options row and Quiz controller */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-medium/10 font-sans text-[10px]">
                                  <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-neutral-medium shrink-0 font-bold block uppercase text-[8px]">Lesson Thumbnail</span>
                                      <input 
                                        type="text"
                                        placeholder="Image URL..."
                                        className="bg-neutral-light border border-neutral-medium/15 rounded px-2 py-0.5 text-[9px] text-neutral-dark focus:outline-none focus:border-primary w-24"
                                        value={les.thumbnail || ''}
                                        onChange={(e) => handleUpdateLessonField(chIdx, lesIdx, 'thumbnail', e.target.value)}
                                      />
                                      <label className="relative p-1 rounded border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer transition flex items-center justify-center">
                                        <Upload className="h-3 w-3" />
                                        <input 
                                          type="file" 
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              compressImageFile(file, { maxWidth: 400, maxHeight: 225 }).then(dataUrl => {
                                                handleUpdateLessonField(chIdx, lesIdx, 'thumbnail', dataUrl);
                                              }).catch(err => console.error('Compression error:', err));
                                            }
                                          }}
                                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                      </label>
                                      {les.thumbnail && (
                                        <img src={les.thumbnail} alt="Lesson thumbnail" className="h-4 w-7 rounded object-cover border border-neutral-medium/10 shadow-xs" />
                                      )}
                                    </div>
                                  </div>

                                  {les.quiz ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveQuizFromLesson(chIdx, lesIdx)}
                                      className="text-red-500 hover:underline text-[9px] font-mono uppercase font-bold"
                                    >
                                      - Remove Inline Quiz
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAddQuizToLesson(chIdx, lesIdx)}
                                      className="text-primary hover:underline text-[9px] font-mono uppercase font-bold"
                                    >
                                      + Add Video Playback Quiz
                                    </button>
                                  )}
                                </div>

                                {/* Embedded Inline Quiz sub-editor if active */}
                                {les.quiz && (
                                  <div className="mt-2.5 p-3 rounded bg-amber-500/5 border border-amber-500/20 space-y-3 font-sans text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-mono font-bold text-amber-600 uppercase tracking-wide">
                                        Lesson Active Playback Quiz details
                                      </span>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[8px] font-mono font-bold text-neutral-medium uppercase">Question formulation</label>
                                      <input 
                                        type="text"
                                        className="w-full bg-neutral-bg border border-neutral-medium/15 rounded px-2 py-1 text-[11px] text-neutral-dark focus:outline-none focus:border-amber-500"
                                        value={les.quiz.question}
                                        onChange={(e) => handleUpdateQuizField(chIdx, lesIdx, 'question', e.target.value)}
                                        placeholder="Question content..."
                                        required
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                      {les.quiz.options.map((opt, optIdx) => (
                                        <div key={optIdx} className="space-y-0.5">
                                          <label className="text-[8px] font-mono font-bold text-neutral-medium">Option {String.fromCharCode(65 + optIdx)}</label>
                                          <input 
                                            type="text"
                                            className="w-full bg-neutral-bg border border-neutral-medium/15 rounded px-2 py-1 text-[11px] text-neutral-dark focus:outline-none focus:border-amber-500"
                                            value={opt}
                                            onChange={(e) => handleUpdateQuizOption(chIdx, lesIdx, optIdx, e.target.value)}
                                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                            required
                                          />
                                        </div>
                                      ))}
                                    </div>

                                    <div className="space-y-1.5 pt-1.5 border-t border-amber-500/10">
                                      <label className="block text-[8px] font-mono font-bold text-neutral-medium uppercase">Correct Option Answer Selection</label>
                                      <div className="flex items-center gap-4">
                                        {les.quiz.options.map((_, optIdx) => (
                                          <label key={optIdx} className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                                            <input 
                                              type="radio"
                                              name={`correct-option-${chIdx}-${lesIdx}`}
                                              checked={les.quiz?.correctIndex === optIdx}
                                              onChange={() => handleUpdateQuizField(chIdx, lesIdx, 'correctIndex', optIdx)}
                                              className="text-amber-500 accent-amber-500"
                                            />
                                            <span className="font-mono text-neutral-dark font-bold">{String.fromCharCode(65 + optIdx)}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                              </div>
                            ))}
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form submits */}
                <div className="pt-4 border-t border-white/[0.05] flex items-center justify-between gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-secondary-dark font-display font-bold text-xs rounded-xl glow-neon-cyan hover:bg-primary-light transition cursor-pointer"
                  >
                    {editingCourseId ? 'Save Edits' : 'Submit Course for Admin approval'}
                  </button>

                  {editingCourseId && (
                     <button
                        type="button"
                        onClick={() => {
                          setEditingCourseId(null);
                          setCourseTitle('');
                          setCourseDesc('');
                          setCoursePrice('35000');
                          setThumbnailUrl('');
                          setChapters([]);
                        }}
                        className="px-4 py-2.5 bg-neutral-light text-neutral-dark font-display font-bold text-xs rounded-xl border border-neutral-medium/10 transition cursor-pointer"
                     >
                       Cancel Edit
                     </button>
                  )}

                  {submitSuccess && (
                    <span className="text-xs font-mono text-accent-alt flex items-center gap-1 bg-accent-alt/15 px-3 py-1.5 rounded-lg border border-accent-alt/25">
                      <Check className="h-4 w-4" />
                      Course Registered for approval!
                    </span>
                  )}
                  {submitError && (
                    <span className="text-xs font-mono text-red-400 bg-red-400/15 border border-red-400/35 px-3 py-1.5 rounded-lg">
                      {submitError}
                    </span>
                  )}
                </div>

              </form>
            </div>

          </div>
        )}

      </div>

      {/* ================= EDIT PROFILE DIALOG MODAL ================= */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans text-left transition-opacity duration-300">
          <div className="w-full max-w-md bg-neutral-bg rounded-2xl shadow-2xl overflow-hidden border border-neutral-medium/10 animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-neutral-bg p-5 text-white flex justify-between items-center bg-gradient-to-r from-neutral-bg to-slate-900">
              <div>
                <h3 className="font-display font-black text-lg tracking-tight uppercase">Edit Instructor Profile</h3>
                <p className="text-[10px] text-neutral-medium font-mono mt-1">Configure profile name, clinical title & avatar assets</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="h-8 w-8 text-neutral-medium hover:text-white bg-neutral-light/10 hover:bg-neutral-light/20 rounded-full flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-4">
              
              {/* Profile Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-medium uppercase">Instructor Display Name</label>
                <input 
                  type="text"
                  className="w-full bg-neutral-light border border-neutral-medium/20 rounded-lg p-2.5 text-xs text-neutral-dark focus:outline-none focus:border-primary font-medium"
                  value={editInstName}
                  onChange={(e) => setEditInstName(e.target.value)}
                  placeholder="e.g. Dr. Evelyn Carter"
                  required
                />
              </div>

              {/* Profile Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-medium uppercase">Instructor Credentials / Academic Title</label>
                <input 
                  type="text"
                  className="w-full bg-neutral-light border border-neutral-medium/20 rounded-lg p-2.5 text-xs text-neutral-dark focus:outline-none focus:border-primary"
                  value={editInstTitle}
                  onChange={(e) => setEditInstTitle(e.target.value)}
                  placeholder="e.g. Lead Cryptographic Auditor & Lecturer"
                  required
                />
              </div>

              {/* Profile Avatar Image URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-medium uppercase">Avatar Image URL</label>
                <div className="flex gap-2">
                  <input 
                    type="url"
                    className="flex-1 bg-neutral-light border border-neutral-medium/20 rounded-lg p-2.5 text-xs text-neutral-dark focus:outline-none focus:border-primary"
                    value={editInstImage}
                    onChange={(e) => setEditInstImage(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/..."
                  />
                  <div className="relative shrink-0">
                    <label className="flex items-center gap-1.5 px-2.5 py-2.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-lg text-xs font-mono font-bold transition cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Upload Photo
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            compressImageFile(file, { maxWidth: 250, maxHeight: 250 }).then(dataUrl => {
                              setEditInstImage(dataUrl);
                            }).catch(err => console.error('Compression error:', err));
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Live Preview section */}
              <div className="p-3 bg-neutral-light border border-neutral-medium/10 rounded-xl flex items-center gap-4 text-left">
                <img 
                  src={editInstImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200'} 
                  alt="Live avatar" 
                  className="h-12 w-12 rounded-full object-cover border border-primary/20 shrink-0" 
                  referrerPolicy="no-referrer"
                />
                <div className="overflow-hidden">
                  <span className="block text-[8px] font-bold uppercase tracking-wider text-primary">Live Card Preview</span>
                  <p className="font-display font-bold text-sm text-neutral-dark truncate">{editInstName || 'Unnamed'}</p>
                  <p className="text-[10px] text-neutral-medium font-mono truncate">{editInstTitle || 'No credentials'}</p>
                </div>
              </div>

              {/* Action operations row */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-medium/10">
                <button 
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-neutral-light text-neutral-dark hover:bg-neutral-light/80 border border-neutral-medium/10 transition rounded-lg text-xs font-bold cursor-pointer"
                >
                  Discard
                </button>
                <button 
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-gradient-to-r from-primary via-primary-light to-accent text-black rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Check className="h-4 w-4" />
                  Save Changes
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {courseIdToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans text-left">
          <div className="w-full max-w-sm bg-neutral-bg rounded-2xl shadow-2xl overflow-hidden border border-neutral-medium/10 p-6 space-y-4">
            <h3 className="font-display font-black text-base text-neutral-dark uppercase tracking-tight">Confirm Deletion</h3>
            <p className="text-xs text-neutral-medium leading-relaxed">
              Are you absolutely sure you want to permanently delete this course from the Glasser database? This operation is irreversible and all enrolled students will lose access.
            </p>
            {deleteError && (
              <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-lg text-red-500 text-[10px] font-mono">
                {deleteError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCourseIdToDelete(null)}
                className="px-4 py-2 bg-neutral-light text-neutral-dark hover:bg-neutral-light/80 border border-neutral-medium/10 transition rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteCourse}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
