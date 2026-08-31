import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, Pause, ChevronRight, ChevronDown, CheckCircle, MessageSquare, 
  Download, FileText, Sparkles, Send, Star, Volume2, ShieldCheck, HelpCircle, 
  Check, X, Award, ExternalLink, RotateCcw 
} from 'lucide-react';
import { Course, Chapter, Lesson, Quiz, Review } from '../types.ts';
import AdvancedVideoPlayer from './AdvancedVideoPlayer.tsx';
import { downloadCertificatePDF, openCertificatePDFInNewTab } from '../utils/certificateGenerator.ts';

interface CoursePlayerProps {
  course: Course;
  userEmail?: string;
  userName?: string;
  onCertificateEarned: (courseTitle: string) => void;
  onNavigate: (page: string) => void;
}

export function CoursePlayer({
  course: initialCourse,
  userEmail,
  userName,
  onCertificateEarned,
  onNavigate
}: CoursePlayerProps) {
  const course = React.useMemo(() => {
    if (initialCourse.chapters && initialCourse.chapters.length > 0 && initialCourse.chapters.some(ch => ch.lessons && ch.lessons.length > 0)) {
      return initialCourse;
    }
    // Generate high-quality chapters and lessons based on the course title and category!
    const category = initialCourse.category || 'General';
    const title = initialCourse.title || 'Advanced Masterclass';
    const fallbackChapters = [
      {
        id: `gen-ch-1-${initialCourse.id}`,
        title: `Introduction & Foundational Concepts of ${category}`,
        lessons: [
          {
            id: `gen-les-1-${initialCourse.id}`,
            title: `Chapter 1: Getting Started with ${title}`,
            videoUrl: 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-',
            duration: '09:45',
            isPreview: false,
            content: `Welcome to this premium masterclass on ${title}. In this initial lecture, we explore core philosophies, system prerequisites, and the step-by-step learning roadmap. Learn how to map out structural requirements for scaling ${category} environments.`,
            attachments: [
              { name: `${category.toLowerCase()}_handout_v1.pdf`, url: '#' },
              { name: `course_getting_started.zip`, url: '#' }
            ],
            quiz: {
              id: `gen-qz-1-${initialCourse.id}`,
              question: `What is the primary goal of studying ${title}?`,
              options: [
                `To acquire robust industry-standard expertise and deploy optimized solutions`,
                `To simply watch videos without applying the foundational principles`,
                `To build low-performance static templates`,
                `To skip optimization schemas entirely`
              ],
              correctIndex: 0
            }
          },
          {
            id: `gen-les-2-${initialCourse.id}`,
            title: `Chapter 2: Essential Paradigms and Architectural Setup`,
            videoUrl: 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-',
            duration: '12:30',
            isPreview: false,
            content: `In this segment, we deep-dive into practical setups, workflow automation, and tool modeling for ${category}. We walk through installing relevant dependencies, setting up high-performance environments, and resolving core bottlenecks.`
          }
        ]
      },
      {
        id: `gen-ch-2-${initialCourse.id}`,
        title: `Advanced Applied Methodology & Practical Case Studies`,
        lessons: [
          {
            id: `gen-les-3-${initialCourse.id}`,
            title: `Chapter 3: Deep-Dive Implementation Strategies`,
            videoUrl: 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-',
            duration: '15:10',
            isPreview: false,
            content: `This chapter covers hands-on implementations and live case studies. We analyze step-by-step production failures, security patterns, and optimizations required to run ${title} at scale.`,
            quiz: {
              id: `gen-qz-2-${initialCourse.id}`,
              question: `Which approach is highly recommended for scaling ${category} solutions?`,
              options: [
                `Deploying unoptimized code directly to single-point-of-failure servers`,
                `Designing modular, well-tested, and resilient software architectures with error recovery`,
                `Ignoring runtime telemetry and system resource metrics`,
                `Eliminating validation layers and security schemas entirely`
              ],
              correctIndex: 1
            }
          },
          {
            id: `gen-les-4-${initialCourse.id}`,
            title: `Chapter 4: Final Roadmap & Production Deployment`,
            videoUrl: 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-',
            duration: '18:15',
            isPreview: false,
            content: `In our final lesson of this milestone, we cover continuous integration, packaging, deployment configurations, and monitoring. We review student workflows and showcase best practices.`
          }
        ]
      }
    ];
    return {
      ...initialCourse,
      chapters: fallbackChapters
    };
  }, [initialCourse]);

  const [activeChapter, setActiveChapter] = useState<string>('');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Reset active chapter/lesson when the course changes
  useEffect(() => {
    if (course && course.chapters && course.chapters.length > 0) {
      // Find the first chapter that has lessons
      const firstCh = course.chapters.find(ch => ch.lessons && ch.lessons.length > 0) || course.chapters[0];
      setActiveChapter(firstCh.id);
      setActiveLesson(firstCh.lessons?.[0] || null);
      setExpandedChapters({ [firstCh.id]: true });
    }
  }, [course?.id]);

  // Track lesson watch percentage
  const [lessonsProgress, setLessonsProgress] = useState<Record<string, number>>({});

  // UI state variables
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'notes' | 'discussion' | 'attachments'>('notes');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Notes inputs
  const [notes, setNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Comments/Discussions input
  const [comments, setComments] = useState<Review[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [chatRating, setChatRating] = useState(5);

  // Quiz inputs
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScoreStatus, setQuizScoreStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  
  // Certificate awarding & request states
  const [certificatePending, setCertificatePending] = useState(false);
  const [certificateGranted, setCertificateGranted] = useState(false);
  const [certificateRequested, setCertificateRequested] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestRecipientName, setRequestRecipientName] = useState(userName || userEmail?.split('@')[0] || 'Premium Scholar');
  const [requestDeliveryEmail, setRequestDeliveryEmail] = useState(userEmail || 'student@glassea.tech');
  const [requestStudentNotes, setRequestStudentNotes] = useState('');
  const [requestSuccessMessage, setRequestSuccessMessage] = useState('');
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Check if certificate or request already exists for this course
  useEffect(() => {
    const checkCertStatus = async () => {
      if (!userEmail) return;
      try {
        const res = await fetch(`/api/certificates/requests?userId=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const reqs = await res.json();
          const currentReq = reqs.find((r: any) => r.courseId === course.id);
          if (currentReq) {
            if (currentReq.status === 'approved') {
              setCertificateGranted(true);
            } else if (currentReq.status === 'pending') {
              setCertificateRequested(true);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching cert request status:', err);
      }
    };
    checkCertStatus();
  }, [course.id, userEmail]);

  // Video Link active override state
  const [activeOverrideUrl, setActiveOverrideUrl] = useState<string | null>(null);

  // Standardized YouTube Embed Format extractor
  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';
    const trimmed = url.trim();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    let videoId = '';
    
    if (match && match[2].length === 11) {
      videoId = match[2];
    } else {
      try {
        if (trimmed.includes('v=')) {
          const parts = trimmed.split('v=')[1].split('&')[0].split('?')[0];
          if (parts.length === 11) videoId = parts;
        } else if (trimmed.includes('youtu.be/')) {
          const parts = trimmed.split('youtu.be/')[1].split('&')[0].split('?')[0];
          if (parts.length === 11) videoId = parts;
        } else if (trimmed.includes('embed/')) {
          const parts = trimmed.split('embed/')[1].split('&')[0].split('?')[0];
          if (parts.length === 11) videoId = parts;
        } else if (trimmed.includes('shorts/')) {
          const parts = trimmed.split('shorts/')[1].split('&')[0].split('?')[0];
          if (parts.length === 11) videoId = parts;
        }
      } catch (e) {
        // Safe fallback
      }
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&playsinline=1`;
    }
    return trimmed;
  };

  useEffect(() => {
    let active = true;
    const fetchActiveLink = async () => {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const { db } = await import("../firebase.ts");
        const q = query(collection(db, "video_links"), where("isActive", "==", true));
        const querySnapshot = await getDocs(q);
        if (!active) return;
        
        let foundUrl = '';
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data && data.url) {
            foundUrl = data.url;
          }
        });
        if (foundUrl) {
          setActiveOverrideUrl(foundUrl);
        } else {
          setActiveOverrideUrl(null);
        }
      } catch (err) {
        console.warn("Could not fetch active video link from Firestore in CoursePlayer:", err);
      }
    };
    fetchActiveLink();
    return () => {
      active = false;
    };
  }, [activeLesson?.id]);

  // Automatic certificate issuance state
  const [autoIssuedCert, setAutoIssuedCert] = useState<any>(null);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);

  // CHECK ELIGIBILITY FOR GRADUATION
  const allLessonsCompleted = () => {
    const totalLessons = course.chapters.flatMap(ch => ch.lessons).length;
    const tickCount = Object.values(completedLessons).filter(Boolean).length;
    return tickCount >= totalLessons || (totalLessons > 0 && quizScoreStatus === 'success');
  };

  const handleAutoIssueCertificate = async () => {
    if (autoIssuedCert) return;
    setIsGeneratingCert(true);
    try {
      const studentName = userName || userEmail?.split('@')[0] || 'Verified Scholar';
      const res = await fetch('/api/certificates/auto-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail || 'student-guest',
          userEmail: userEmail || '',
          userName: studentName,
          courseId: course.id,
          courseTitle: course.title,
          courseCategory: course.category || 'Modern Software Architecture',
          instructorName: course.instructorName || 'Dr. Elena Vance',
          duration: `${course.chapters?.length || 8} Modules`
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.certificate) {
          setAutoIssuedCert(data.certificate);
          setCertificateGranted(true);
          onCertificateEarned(course.title);
        }
      }
    } catch (e) {
      console.warn('Auto certificate issuance notice:', e);
    } finally {
      setIsGeneratingCert(false);
    }
  };

  const handleSubmitCertificateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCertificatePending(true);
    setRequestSuccessMessage('');

    try {
      const res = await fetch('/api/certificates/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail || 'student-guest',
          studentEmail: requestDeliveryEmail,
          recipientName: requestRecipientName,
          courseId: course.id,
          courseTitle: course.title,
          studentNotes: requestStudentNotes
        })
      });

      if (res.ok) {
        setCertificateRequested(true);
        setRequestSuccessMessage('Certificate request successfully dispatched to your instructor!');
        setTimeout(() => setShowRequestModal(false), 2000);
      }
    } catch (err) {
      console.error('Certificate request failed:', err);
    } finally {
      setCertificatePending(false);
    }
  };

  useEffect(() => {
    if (allLessonsCompleted()) {
      if (!hasCelebrated) {
        setHasCelebrated(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      handleAutoIssueCertificate();
    }
  }, [completedLessons, quizScoreStatus, course.chapters, hasCelebrated]);

  // Load initial completed lessons and watch progress from localStorage
  useEffect(() => {
    const initialCompleted: Record<string, boolean> = {};
    const initialProgress: Record<string, number> = {};

    course.chapters.forEach((ch) => {
      ch.lessons.forEach((les) => {
        // Load watch stats
        const savedProgress = localStorage.getItem(`video-progress-${course.id}-${les.id}`);
        if (savedProgress) {
          try {
            const data = JSON.parse(savedProgress);
            if (data.watchedPercent) {
              const rounded = Math.round(data.watchedPercent);
              initialProgress[les.id] = rounded;
              // If watched more than 95%, auto-mark completed
              if (rounded > 95) {
                initialCompleted[les.id] = true;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        // Also check manual completed marks
        const manualComplete = localStorage.getItem(`manual-completed-${course.id}-${les.id}`);
        if (manualComplete === 'true') {
          initialCompleted[les.id] = true;
        }
      });
    });

    setCompletedLessons(initialCompleted);
    setLessonsProgress(initialProgress);
  }, [course?.id]);

  // Initialize completed lessons and clear quiz states when active lesson changes
  useEffect(() => {
    if (activeLesson) {
      // Clear quiz states when lesson changes
      setSelectedOption(null);
      setQuizSubmitted(false);
      setQuizScoreStatus('idle');
      
      // Load saved notes for this lesson
      const savedNotes = localStorage.getItem(`notes-${course.id}-${activeLesson.id}`);
      setNotes(savedNotes || '');

      // Load comments for this specific lesson
      fetchComments();
    }
  }, [activeLesson]);

  const fetchComments = () => {
    if (!activeLesson) return;
    fetch(`/api/comments?courseId=${course.id}&lessonId=${activeLesson.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setComments(data);
        }
      })
      .catch((e) => console.error('Failed to load lesson comments', e));
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeLesson) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          lessonId: activeLesson.id,
          userName: userName || userEmail?.split('@')[0] || 'Premium Scholar',
          rating: chatRating,
          comment: newCommentText
        })
      });
      if (response.ok) {
        setNewCommentText('');
        fetchComments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleChapter = (chId: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chId]: !prev[chId]
    }));
  };

  const handleRewatchAndReset = () => {
    // Clear all manual-completed and video-progress records for this course's lessons
    course.chapters.forEach((ch) => {
      ch.lessons.forEach((les) => {
        localStorage.removeItem(`manual-completed-${course.id}-${les.id}`);
        localStorage.removeItem(`video-progress-${course.id}-${les.id}`);
      });
    });

    // Reset player specific states
    setCompletedLessons({});
    setLessonsProgress({});
    setHasCelebrated(false);
    setQuizScoreStatus('idle');
    setQuizSubmitted(false);
    setSelectedOption(null);
    setCertificateGranted(false);

    // Rewatch from the very first lesson
    if (course.chapters[0]?.lessons[0]) {
      setActiveChapter(course.chapters[0].id);
      setActiveLesson(course.chapters[0].lessons[0]);
      setExpandedChapters({ [course.chapters[0].id]: true });
    }
  };

  const handleLessonCheck = (lessonId: string) => {
    setCompletedLessons(prev => {
      const isNowCompleted = !prev[lessonId];
      const updated = { ...prev, [lessonId]: isNowCompleted };
      localStorage.setItem(`manual-completed-${course.id}-${lessonId}`, isNowCompleted ? 'true' : 'false');
      
      // Update progress state manually to match 100% or 0%
      setLessonsProgress(p => ({
        ...p,
        [lessonId]: isNowCompleted ? 100 : 0
      }));
      localStorage.setItem(
        `video-progress-${course.id}-${lessonId}`,
        JSON.stringify({ currentTime: 0, duration: 100, watchedPercent: isNowCompleted ? 100 : 0 })
      );

      return updated;
    });
  };

  const handleVideoProgressUpdate = (percent: number) => {
    if (!activeLesson) return;
    const rounded = Math.round(percent);
    setLessonsProgress(prev => ({
      ...prev,
      [activeLesson.id]: rounded
    }));
  };

  const handleVideoComplete = () => {
    if (!activeLesson) return;
    setCompletedLessons(prev => {
      const updated = { ...prev, [activeLesson.id]: true };
      localStorage.setItem(`manual-completed-${course.id}-${activeLesson.id}`, 'true');
      return updated;
    });
  };


  const handleSaveNotes = () => {
    if (!activeLesson) return;
    setIsSavingNotes(true);
    localStorage.setItem(`notes-${course.id}-${activeLesson.id}`, notes);
    setTimeout(() => {
      setIsSavingNotes(false);
    }, 1000);
  };

  const handleQuizSubmit = () => {
    if (selectedOption === null || !activeLesson?.quiz) return;
    setQuizSubmitted(true);
    
    if (selectedOption === activeLesson.quiz.correctIndex) {
      setQuizScoreStatus('success');
      // Append completed lesson automatically on quiz success
      setCompletedLessons(prev => ({ ...prev, [activeLesson.id]: true }));
    } else {
      setQuizScoreStatus('failed');
    }
  };

  const handleClaimCertificate = async () => {
    setCertificatePending(true);
    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail || 'student-guest',
          courseId: course.id,
          courseTitle: course.title,
          recipientName: userName || userEmail?.split('@')[0] || 'Premium Scholar'
        })
      });
      if (response.ok) {
        setCertificateGranted(true);
        // Bubble event to main driver
        onCertificateEarned(course.title);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCertificatePending(false);
    }
  };

  return (
    <div className="min-h-screen text-left bg-neutral-bg flex flex-col lg:flex-row pt-24" id="course-player-root">
      
      {/* ================= LEFT COLUMN: COURSE VIDEO WORKSPACE ================= */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto">
        
        {/* Dynamic header navigation trail */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-medium">
            <button 
              onClick={() => onNavigate('courses')}
              className="hover:text-primary transition"
            >
              Courses
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-neutral-dark font-bold truncate max-w-xs">{course.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
              {course.category}
            </span>
          </div>
        </div>

        {activeLesson ? (
          <div className="space-y-6">
            
            {/* Top Video Player Container with Custom Controls */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl border border-white/10">
              <AdvancedVideoPlayer 
                videoUrl={activeLesson.videoUrl}
                lessonId={activeLesson.id}
                courseId={course.id}
                userEmail={userEmail}
                onProgressUpdate={(pct) => {
                  if (pct >= 95) {
                    handleLessonCheck(activeLesson.id);
                  }
                }}
                onComplete={() => {
                  handleLessonCheck(activeLesson.id);
                }}
              />
            </div>

            {/* Lesson Title & Action Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                    ACTIVE MODULE
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-xl sm:text-2xl text-neutral-dark">
                  {activeLesson.title}
                </h2>
                <span className="text-xs text-neutral-medium font-mono flex items-center gap-1.5 pt-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#3ac58a]"></span>
                  Duration: {activeLesson.duration || '15:00'} min
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleLessonCheck(activeLesson.id)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
                    completedLessons[activeLesson.id]
                      ? 'bg-[#3ac58a]/20 text-[#3ac58a] border border-[#3ac58a]/30'
                      : 'bg-primary text-black hover:opacity-90'
                  }`}
                >
                  <Check className="h-4 w-4" />
                  {completedLessons[activeLesson.id] ? 'Completed' : 'Mark as Completed'}
                </button>
              </div>
            </div>

            {/* Lesson Content & Summary */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-mono font-bold tracking-widest text-neutral-medium uppercase">
                Module Brief & Learning Notes
              </h3>
              <p className="text-sm text-neutral-dark leading-relaxed whitespace-pre-line font-sans">
                {activeLesson.content || 'Detailed architectural overview and masterclass code breakdown for this chapter.'}
              </p>
            </div>

            {/* Chapter Quiz Section if exists */}
            {activeLesson.quiz && (
              <div className="glass-panel p-6 rounded-2xl space-y-4 border-l-4 border-l-accent">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-neutral-dark">
                    Module Knowledge Quiz
                  </h3>
                </div>
                
                <p className="text-sm font-medium text-neutral-dark">
                  {activeLesson.quiz.question}
                </p>

                <div className="space-y-2 pt-2">
                  {activeLesson.quiz.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedOption(idx);
                        setQuizSubmitted(false);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl text-xs font-mono transition-all border flex items-center justify-between ${
                        selectedOption === idx
                          ? 'border-accent bg-accent/10 text-neutral-dark font-bold'
                          : 'border-white/10 bg-white/[0.02] text-neutral-medium hover:border-white/20'
                      }`}
                    >
                      <span>{opt}</span>
                      {selectedOption === idx && <Check className="h-4 w-4 text-accent" />}
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={handleQuizSubmit}
                    disabled={selectedOption === null}
                    className="px-5 py-2 bg-accent text-white font-mono font-bold text-xs rounded-xl hover:opacity-90 transition disabled:opacity-40 cursor-pointer"
                  >
                    Submit Answer
                  </button>

                  {quizScoreStatus === 'success' && (
                    <span className="text-xs text-[#3ac58a] font-mono font-bold flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Correct! Module unlocked.
                    </span>
                  )}
                  {quizScoreStatus === 'failed' && (
                    <span className="text-xs text-red-400 font-mono font-bold">
                      Incorrect answer. Review lesson & try again!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* DYNAMIC CERTIFICATE GRANTED / REQUEST BANNER */}
            {allLessonsCompleted() && (
              <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border border-primary/30 relative overflow-hidden space-y-5 animate-fade-in">
                <div className="absolute top-0 right-0 p-8 select-none opacity-10 pointer-events-none">
                  <Award className="h-48 w-48 text-primary" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <span className="text-xs font-mono font-extrabold tracking-widest text-primary uppercase">100% COURSE COMPLETED • CERTIFICATE READY</span>
                  </div>
                  <h3 className="font-display font-extrabold text-xl text-neutral-dark">
                    Congratulations! Mastery Achieved for {course.title}
                  </h3>
                  <p className="text-xs text-neutral-medium leading-relaxed max-w-xl">
                    Your official Certificate of Completion has been automatically issued and registered with Certificate ID: <strong className="text-primary font-mono">{autoIssuedCert?.verificationCode || 'GT-2026-A89F4C2'}</strong>. You can instantly download your high-resolution official PDF certificate below.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      const student = autoIssuedCert?.recipientName || userName || userEmail?.split('@')[0] || 'Verified Scholar';
                      downloadCertificatePDF({
                        studentName: student,
                        courseTitle: course.title,
                        courseCategory: course.category,
                        certificateId: autoIssuedCert?.verificationCode || `GT-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                        issuedAt: autoIssuedCert?.issuedAt,
                        instructorName: course.instructorName || 'Dr. Elena Vance',
                        duration: `${course.chapters?.length || 8} Modules`
                      });
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary via-primary-light to-accent text-black text-xs font-bold tracking-wide flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    <Download className="h-4 w-4" />
                    Download Official PDF Certificate
                  </button>

                  <button
                    onClick={() => {
                      const student = autoIssuedCert?.recipientName || userName || userEmail?.split('@')[0] || 'Verified Scholar';
                      openCertificatePDFInNewTab({
                        studentName: student,
                        courseTitle: course.title,
                        courseCategory: course.category,
                        certificateId: autoIssuedCert?.verificationCode || `GT-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                        issuedAt: autoIssuedCert?.issuedAt,
                        instructorName: course.instructorName || 'Dr. Elena Vance',
                        duration: `${course.chapters?.length || 8} Modules`
                      });
                    }}
                    className="px-5 py-3 rounded-xl bg-neutral-light/10 hover:bg-neutral-light/20 text-neutral-dark text-xs font-bold tracking-wide flex items-center gap-2 transition cursor-pointer border border-white/10"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View in New Tab
                  </button>

                  <button
                    onClick={() => onNavigate('student-dashboard')}
                    className="px-5 py-3 rounded-xl bg-neutral-light/5 hover:bg-neutral-light/10 text-neutral-dark text-xs font-bold tracking-wide flex items-center gap-2 transition cursor-pointer border border-white/10"
                  >
                    <Award className="h-3.5 w-3.5 text-primary" />
                    View in Dashboard
                  </button>

                  <button
                    onClick={handleRewatchAndReset}
                    className="px-5 py-3 rounded-xl bg-neutral-light/5 hover:bg-neutral-light/10 text-neutral-medium text-xs font-bold tracking-wide flex items-center gap-2 transition cursor-pointer border border-white/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restart
                  </button>
                </div>
              </div>
            )}

            {/* Certificate Request Modal Dialog */}
            {showRequestModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-[#0b0f19] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 text-left relative">
                  
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-bold text-white leading-none">Request Certificate</h3>
                        <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Instructor Email Dispatch</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowRequestModal(false)}
                      className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitCertificateRequest} className="space-y-4 font-mono text-xs">
                    <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                      <span className="text-[10px] text-white/40 uppercase">Course</span>
                      <p className="font-bold text-white text-sm font-display">{course.title}</p>
                      <span className="text-[10px] text-primary">Instructor: {course.instructorName || 'Dr. Evelyn Carter'}</span>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider">
                        Full Legal Name (To appear on certificate)
                      </label>
                      <input
                        type="text"
                        required
                        value={requestRecipientName}
                        onChange={(e) => setRequestRecipientName(e.target.value)}
                        placeholder="e.g. Amina Bello"
                        className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white focus:border-primary focus:outline-none transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider">
                        Student Email (Where certificate will be sent)
                      </label>
                      <input
                        type="email"
                        required
                        value={requestDeliveryEmail}
                        onChange={(e) => setRequestDeliveryEmail(e.target.value)}
                        placeholder="student@domain.com"
                        className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white focus:border-primary focus:outline-none transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider">
                        Student Notes / Project Link (Optional)
                      </label>
                      <textarea
                        value={requestStudentNotes}
                        onChange={(e) => setRequestStudentNotes(e.target.value)}
                        placeholder="Include any final capstone GitHub repository links, feedback, or notes for the instructor..."
                        className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white focus:border-primary focus:outline-none transition h-20"
                      />
                    </div>

                    {requestSuccessMessage && (
                      <div className="p-3 bg-[#3ac58a]/15 border border-[#3ac58a]/30 rounded-xl text-[#3ac58a] text-xs font-mono animate-fade-in flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        <span>{requestSuccessMessage}</span>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowRequestModal(false)}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={certificatePending || !requestDeliveryEmail.includes('@')}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary via-primary-light to-accent text-black font-display font-bold text-xs hover:opacity-90 disabled:opacity-40 transition cursor-pointer flex items-center gap-2"
                      >
                        {certificatePending ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {certificatePending ? 'Submitting...' : 'Submit Request to Instructor'}
                      </button>
                    </div>
                  </form>

                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="p-12 text-center text-xs text-neutral-medium bg-neutral-light/5 rounded-2xl">
            Please pick a lesson from the syllabus outline map sidebar to spin up the player.
          </div>
        )}

        {/* ================= LOWER ROW: WORKSPACE TAB SECTION ================= */}
        <div className="mt-8 border-t border-white/[0.05] pt-8">
          <div className="flex overflow-x-auto scrollbar-hide border-b border-white/[0.05] gap-4" id="workspace-tabs-menu">
            {(['notes', 'discussion', 'attachments'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveWorkspaceTab(tab)}
                className={`pb-2.5 pt-1 text-xs font-mono uppercase tracking-widest border-b-2 transition shrink-0 ${
                  activeWorkspaceTab === tab
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-neutral-medium hover:text-neutral-dark'
                }`}
              >
                {tab === 'notes' ? 'Personal Notes' : (tab === 'discussion' ? `Discussions (${comments.length})` : 'Attachments')}
              </button>
            ))}
          </div>

          {/* TAB CONTENT: SAVING NOTES */}
          {activeWorkspaceTab === 'notes' && (
            <div className="mt-6 space-y-4" id="workspace-notes-tab">
              <span className="text-[10px] text-neutral-medium font-mono uppercase block">Scratchpad Code Console (Autosaved locally)</span>
              <div className="relative">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Paste structural configurations, code snippets, or notes about EVM optimization gas values..."
                  className="w-full h-44 bg-neutral-light font-mono text-xs rounded-xl border border-neutral-medium/20 p-4 text-neutral-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-neutral-medium font-mono">Changes persist automatically onto cache memory.</span>
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  {isSavingNotes ? 'Locking in...' : 'Sync Scratchpad'}
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT: DISCUSSION BOARD */}
          {activeWorkspaceTab === 'discussion' && (
            <div className="mt-6 space-y-6 text-left" id="workspace-discussion-tab">
              <form onSubmit={handleSendComment} className="flex gap-4">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Engage on optimization strategies, ask EVM questions..."
                  className="flex-1 bg-neutral-light border border-neutral-medium/20 rounded-xl p-3 text-xs text-neutral-dark focus:outline-none focus:border-primary"
                  required
                />
                <button
                  type="submit"
                  className="px-4 bg-gradient-to-r from-primary via-primary-light to-accent text-black rounded-xl flex items-center justify-center cursor-pointer hover:scale-[1.05] active:scale-[0.95] transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              {/* Feed logs */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {comments.length === 0 ? (
                  <span className="block text-xs text-neutral-medium text-center py-6">No discussions active for this module yet. Be the first to consult!</span>
                ) : (
                  [...comments].reverse().map((c) => (
                    <div key={c.id} className="p-4 bg-neutral-light/5 rounded-xl border border-white/[0.04]">
                      <div className="flex justify-between items-center mb-1 font-mono text-[11px] text-neutral-medium">
                        <span className="font-bold text-neutral-dark">{c.userName}</span>
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-neutral-dark font-mono leading-relaxed">{c.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: ATTACHMENTS */}
          {activeWorkspaceTab === 'attachments' && (
            <div className="mt-6 space-y-3" id="workspace-attachments-tab">
              <span className="text-[10px] text-neutral-medium font-mono uppercase block">Syllabus Supplementary Material</span>
              {activeLesson?.attachments && activeLesson.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeLesson.attachments.map((at, idx) => (
                    <div key={idx} className="p-3 bg-neutral-light/5 rounded-xl border border-white/5 flex items-center justify-between font-mono">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-xs text-neutral-dark font-bold truncate max-w-xs">{at.name}</span>
                      </div>
                      <button className="p-1 px-2 hover:bg-primary hover:text-secondary-dark border border-white/10 rounded text-[10px] text-primary transition font-extrabold cursor-pointer">
                        DOWNLOAD
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="block text-xs text-neutral-medium text-center py-4 bg-neutral-light/5 rounded-xl">No downloadable attachments configured for this modular block.</span>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ================= RIGHT COLUMN: INTERACTIVE NAVIGATION SIDEBAR ================= */}
      <div className="w-full lg:w-80 glass-panel border-t lg:border-t-0 lg:border-l border-white/[0.08] lg:h-[calc(100vh-6rem)] lg:overflow-y-auto" id="course-player-sidebar">
        
        {/* Course Info metadata Box */}
        <div className="p-4 sm:p-6 border-b border-white/[0.08] text-left bg-neutral-light/[0.02]">
          <span className="text-[9px] font-mono text-primary uppercase tracking-widest font-bold">COURSE SYLLABUS</span>
          <h3 className="font-display font-bold text-sm sm:text-base text-neutral-dark leading-snug mt-1">{course.title}</h3>
          <span className="text-[10px] sm:text-xs text-neutral-medium font-mono block mt-1.5">Instructor: {course.instructorName}</span>
        </div>

        {/* Scrollable chapters syllabus accordions list */}
        <div className="divide-y divide-white/[0.05]">
          {course.chapters.map((ch, idx) => {
            const isExpanded = !!expandedChapters[ch.id];
            return (
              <div key={ch.id} className="text-left">
                {/* Accordion header clicker */}
                <button
                  onClick={() => toggleChapter(ch.id)}
                  className="w-full p-4 flex items-center justify-between bg-neutral-light/[0.01] hover:bg-neutral-light/[0.03] transition font-mono text-xs text-neutral-dark font-bold cursor-pointer"
                >
                  <div className="flex gap-2 items-center mr-2 min-w-0">
                    <span className="text-[9px] text-primary uppercase font-extrabold font-mono shrink-0">C{idx + 1}</span>
                    <span className="truncate">{ch.title}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-neutral-medium">
                    <span className="text-[9px] hidden sm:inline">{ch.lessons.length} lessons</span>
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </div>
                </button>

                {/* Lessons list details */}
                {isExpanded && (
                  <div className="bg-secondary-dark/40 border-t border-white/[0.03] divide-y divide-white/[0.03]">
                    {ch.lessons.map((les) => (
                      <button
                        key={les.id}
                        onClick={() => setActiveLesson(les)}
                        className={`w-full p-3.5 pl-6 flex items-start gap-3 transition-colors text-left font-mono ${
                          activeLesson?.id === les.id
                            ? 'bg-primary/10 border-l-2 border-primary text-primary-dark font-bold'
                            : 'hover:bg-neutral-light/5 text-neutral-medium hover:text-neutral-dark'
                        }`}
                        id={`syllabus-sidebar-lesson-${les.id}`}
                      >
                        {/* Status Checker Icon */}
                        <div className="pt-0.5 shrink-0">
                          {completedLessons[les.id] ? (
                            <CheckCircle className="h-4 w-4 text-accent-alt glow-neon-emerald" />
                          ) : (
                            <Play className="h-4 w-4 text-neutral-medium/50 shrink-0" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 font-sans">
                          <div className="flex items-start justify-between gap-2.5">
                            <span className={`block text-xs font-mono leading-relaxed truncate ${activeLesson?.id === les.id ? 'text-primary-dark font-bold' : 'text-neutral-dark'}`}>
                              {les.title}
                            </span>
                            {lessonsProgress[les.id] !== undefined && lessonsProgress[les.id] > 0 && (
                              <span className="text-[9px] font-bold font-mono text-primary shrink-0">
                                {lessonsProgress[les.id]}%
                              </span>
                            )}
                          </div>

                          {/* Tiny premium nested inline progress indicator bar */}
                          {lessonsProgress[les.id] !== undefined && lessonsProgress[les.id] > 0 && (
                            <div className="w-full bg-neutral-medium/20 h-1 rounded-full overflow-hidden mt-1.5 pointer-events-none">
                              <div 
                                className="bg-primary h-full rounded-full transition-all duration-300"
                                style={{ width: `${lessonsProgress[les.id]}%` }}
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-medium font-medium font-mono">
                            <span>{les.duration} mins</span>
                            {les.quiz && (
                              <span className="text-[9px] bg-accent/20 text-accent font-extrabold px-1.5 rounded uppercase tracking-wider scale-95 shrink-0">
                                Exam Included
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}

export default CoursePlayer;
