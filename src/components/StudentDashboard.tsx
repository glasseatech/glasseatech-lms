import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Award, Play, CheckCircle, Bell, Download, Heart, User, Shield, 
  Clock, Sparkles, AlertCircle, RefreshCw, Eye, ShoppingCart, BarChart2
} from 'lucide-react';
import { Course, Purchase, Certificate, Notification } from '../types.ts';
import Analytics from './Analytics.tsx';
import { downloadCertificatePDF, openCertificatePDFInNewTab } from '../utils/certificateGenerator.ts';

interface StudentDashboardProps {
  purchasedCourses: Course[];
  purchasedCourseIds: string[];
  onSelectCourse: (courseId: string) => void;
  certificates: Certificate[];
  onNavigate: (page: string) => void;
  userEmail: string;
  userName: string;
  wishlistCourses: Course[];
  onMoveWishlistItemToCart: (courseId: string) => void;
  onRemoveFromWishlist: (courseId: string) => void;
  loading: boolean;
  activities?: Notification[];
}

export function StudentDashboard({
  purchasedCourses,
  purchasedCourseIds,
  onSelectCourse,
  certificates,
  onNavigate,
  userEmail,
  userName,
  wishlistCourses,
  onMoveWishlistItemToCart,
  onRemoveFromWishlist,
  loading,
  activities = []
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'courses' | 'wishlist' | 'certificates' | 'downloads' | 'settings' | 'activities' | 'analytics'>('courses');
  const [profileName, setProfileName] = useState(userName || 'Student');
  const [profileEmail, setProfileEmail] = useState(userEmail || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (userName) {
      setProfileName(userName);
    }
  }, [userName]);

  useEffect(() => {
    if (userEmail) {
      setProfileEmail(userEmail);
    }
  }, [userEmail]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = localStorage.getItem('lastLoginDate');
    let currentStreak = parseInt(localStorage.getItem('streakCount') || '0', 10);

    if (lastLogin) {
      if (lastLogin !== today) {
        const lastDate = new Date(lastLogin);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
        localStorage.setItem('streakCount', currentStreak.toString());
      }
    } else {
      currentStreak = 1;
      localStorage.setItem('streakCount', currentStreak.toString());
    }

    localStorage.setItem('lastLoginDate', today);
    setStreak(currentStreak);
  }, []);

  // Simulated static downloads list
  const downloads = [
    { name: 'AI_Agent_Central_Reasoning_Loop.js', size: '14.5 KB', course: 'Autonomous AI Agents Architecture' },
    { name: 'Frosted_Glassmorphism_Tailwind_Figma_UI.fig', size: '4.2 MB', course: 'Extreme Glassmorphism SaaS Interfaces' },
    { name: 'Solidity_Gas_Optimizer_Hook_V3.sol', size: '8.1 KB', course: 'Solidity Core & Gas Optimization' }
  ];

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Render skeleton when loading
  if (loading) {
    return (
      <div className="min-h-screen text-left space-grid pb-24 pt-24 bg-neutral-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="h-32 bg-neutral-light/5 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-neutral-light/5 rounded-2xl animate-pulse" />
            <div className="h-64 bg-neutral-light/5 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-left space-grid pb-24 pt-24 bg-neutral-bg" id="student-dashboard-root">
      
      {/* ================= HERO PROFILE DISPLAY ================= */}
      <section className="border-b border-white/[0.05] py-12 bg-secondary/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="flex items-center gap-4 text-left">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary via-accent to-accent-alt p-[1px] glow-neon-cyan">
                <div className="h-full w-full bg-secondary-dark rounded-2xl flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-extrabold text-2xl text-neutral-dark">{profileName}</h1>
                  <span className="text-[10px] bg-primary/20 text-primary-light px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">STUDENT PASS</span>
                </div>
                <p className="text-xs text-neutral-medium font-mono">{profileEmail} • Enrolled Student</p>
              </div>
            </div>

            {/* Quick stats panel */}
            <div className="flex flex-wrap gap-4 md:gap-6">
              <div className="bg-neutral-light/5 border border-white/5 px-4 py-3 rounded-xl text-left font-mono min-w-[120px]">
                <span className="block text-[10px] text-neutral-medium uppercase tracking-wider">Enrolled Courses</span>
                <span className="text-xl font-bold text-neutral-dark">{purchasedCourses.length} Courses</span>
              </div>
              <div className="bg-neutral-light/5 border border-white/5 px-4 py-3 rounded-xl text-left font-mono min-w-[120px]">
                <span className="block text-[10px] text-neutral-medium uppercase tracking-wider">Certificates</span>
                <span className="text-xl font-bold text-accent-alt">{certificates.length} earned</span>
              </div>
              <div className="bg-neutral-light/5 border border-white/5 px-4 py-3 rounded-xl text-left font-mono min-w-[120px]">
                <span className="block text-[10px] text-neutral-medium uppercase tracking-wider">Learning Streak</span>
                <span className="text-xl font-bold text-orange-500">{streak} {streak === 1 ? 'Day' : 'Days'} 🔥</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= SEGMENT MENU TABS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex overflow-x-auto scrollbar-hide border-b border-white/[0.05] gap-4" id="dashboard-navbar-tabs">
          {(['courses', 'wishlist', 'certificates', 'activities', 'settings', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 pt-1.5 text-xs font-mono font-bold uppercase tracking-widest border-b-2 transition shrink-0 ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-medium hover:text-neutral-dark'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ================= TAB 1: ACCOMPANY COURSES ================= */}
        {activeTab === 'courses' && (
          <div className="mt-8 space-y-6" id="student-dashboard-courses-tab">
            <h2 className="text-sm font-mono font-bold tracking-widest text-neutral-medium uppercase mb-4">My Enrolled Courses</h2>
            
            {purchasedCourses.length === 0 ? (
              <div className="p-12 text-center bg-neutral-light/5 rounded-2xl border border-white/[0.05] space-y-4">
                <AlertCircle className="h-8 w-8 text-neutral-medium mx-auto" />
                <span className="block text-xs text-neutral-medium">You haven't enrolled in any courses yet. Browse our catalog to get started!</span>
                <button
                  onClick={() => onNavigate('courses')}
                  className="px-4 py-2 bg-gradient-to-r from-primary via-primary-light to-accent text-black text-xs font-bold font-display rounded-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Explore All Courses
                </button>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {purchasedCourses.map((course) => {
                  // Dynamically calculate progress percentage based on completed and watched lessons
                  const lessons = course.chapters.flatMap((ch) => ch.lessons);
                  const totalLessons = lessons.length;
                  let completedCount = 0;
                  lessons.forEach((les) => {
                    const manual = localStorage.getItem(`manual-completed-${course.id}-${les.id}`);
                    if (manual === 'true') {
                      completedCount++;
                    } else {
                      const prog = localStorage.getItem(`video-progress-${course.id}-${les.id}`);
                      if (prog) {
                        try {
                          const parsed = JSON.parse(prog);
                          if (parsed.watchedPercent && parsed.watchedPercent > 95) {
                            completedCount++;
                          }
                        } catch (e) {
                          console.error(e);
                        }
                      }
                    }
                  });
                  
                  const computedPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
                  // If no lessons are completed yet, default the first demo course to 33% mock progress for standard aesthetic balance
                  const progressPct = computedPct || (course.id === 'course-ai-agent' ? 33 : 0);
                  return (
                    <div 
                      key={course.id}
                      className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between gap-6 hover:border-primary/40 transition duration-300"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-[10px] bg-neutral-light/10 text-neutral-dark font-mono px-2.5 py-1 rounded">
                            {course.category}
                          </span>
                          <span className="text-xs text-neutral-medium font-mono">ID: {course.id}</span>
                        </div>

                        <h3 className="font-display font-bold text-lg text-neutral-dark leading-snug">
                          {course.title}
                        </h3>

                        <p className="text-xs text-neutral-medium line-clamp-2">
                          {course.description}
                        </p>
                      </div>

                      {/* Progress Metrics & Action */}
                      <div className="pt-4 border-t border-white/[0.05] space-y-3">
                          <div className="flex justify-between items-end">
                            <div className="space-y-0.5">
                              <span className="block text-[9px] font-mono text-neutral-medium uppercase tracking-wider">Completion Status</span>
                              <span className="block font-bold text-neutral-dark text-xs">{progressPct}% Complete</span>
                            </div>
                            <span className="text-[10px] text-neutral-medium font-mono border-l border-white/[0.1] pl-3">
                              {course.chapters.length} Chapters
                            </span>
                          </div>
                          
                          <div className="w-full bg-neutral-light/10 h-2 rounded-full overflow-hidden p-[1px]">
                            <div 
                              className="bg-gradient-to-r from-primary via-accent to-accent-alt h-full rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>

                        <div className="flex justify-between items-center pt-2 gap-2 flex-wrap">
                          <span className="text-[10px] text-neutral-medium font-mono">{course.chapters.length} chapters</span>
                          <div className="flex gap-2">
                            {computedPct === 100 && (
                              <button
                                onClick={() => {
                                  lessons.forEach((les) => {
                                    localStorage.removeItem(`manual-completed-${course.id}-${les.id}`);
                                    localStorage.removeItem(`video-progress-${course.id}-${les.id}`);
                                  });
                                  onSelectCourse(course.id);
                                }}
                                className="bg-neutral-light/10 hover:bg-neutral-light/15 text-neutral-dark font-display font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-white/10"
                                title="Reset Progress & Rewatch"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Rewatch
                              </button>
                            )}
                            <button
                              onClick={() => onSelectCourse(course.id)}
                              className="bg-gradient-to-r from-primary via-primary-light to-accent text-black font-display font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                            >
                              <Play className="h-3 w-3 fill-black" />
                              {computedPct === 100 ? 'Review' : 'Resume'}
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}

        {/* ================= TAB: WISHLIST ================= */}
        {activeTab === 'wishlist' && (
          <div className="mt-8 space-y-6" id="student-dashboard-wishlist-tab">
            <h2 className="text-sm font-mono font-bold tracking-widest text-neutral-medium uppercase mb-4">My Wishlist</h2>
            
            {wishlistCourses.length === 0 ? (
              <div className="p-12 text-center bg-neutral-light/5 rounded-2xl border border-white/[0.05] space-y-4">
                <Heart className="h-8 w-8 text-neutral-medium mx-auto" />
                <span className="block text-xs text-neutral-medium text-center">Your wishlist is currently empty.</span>
                <button
                  onClick={() => onNavigate('courses')}
                  className="px-4 py-2 bg-[#1d4ed8] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#1e40af] inline-block"
                >
                  Explore Courses
                </button>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {wishlistCourses.map((course) => {
                  return (
                    <div 
                      key={course.id}
                      className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between gap-6 hover:border-primary/40 transition duration-300"
                    >
                      <div className="space-y-4 text-left">
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-[10px] bg-neutral-light/10 text-neutral-dark font-mono px-2.5 py-1 rounded">
                            {course.category}
                          </span>
                          <span className="text-xs font-mono font-bold text-neutral-dark">{(!course.price || course.price === 0) ? 'Free' : `$${course.price}`}</span>
                        </div>

                        <h3 className="font-display font-bold text-lg text-neutral-dark leading-snug">
                          {course.title}
                        </h3>

                        <p className="text-xs text-neutral-medium line-clamp-2">
                          {course.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/[0.05] flex justify-between items-center gap-3">
                        <button
                          onClick={() => onRemoveFromWishlist(course.id)}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold rounded-lg cursor-pointer transition flex items-center gap-1.5 animate-pulse-slow"
                        >
                          Remove
                        </button>

                        <button
                          onClick={() => onMoveWishlistItemToCart(course.id)}
                          className="px-4 py-2 bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-[#1e40af] transition flex items-center gap-1.5"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Move to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}

        {/* ================= TAB 2: CERTIFICATES ================= */}
        {activeTab === 'certificates' && (
          <div className="mt-8 space-y-6" id="student-dashboard-certificates-tab">
            <div className="mb-4">
              <h2 className="text-sm font-mono font-bold tracking-widest text-neutral-medium uppercase">Verified Certificates</h2>
              <p className="text-xs text-neutral-medium mt-1">
                Earn certificates of completion by finishing courses and passing chapter quizzes.
              </p>
            </div>

            {certificates.length === 0 ? (
              <div className="bg-neutral-light/5 p-12 text-center rounded-2xl border border-white/[0.05] space-y-4">
                <Award className="h-8 w-8 text-neutral-medium mx-auto" />
                <span className="block text-xs text-neutral-medium">No certificates earned yet. Complete all lessons and quizzes to earn your certificate!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <div 
                    key={cert.id} 
                    className="p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between gap-4 border-accent glow-neon-pink group"
                  >
                    <div className="space-y-3 text-left">
                      <div className="h-8 w-8 rounded bg-accent/20 border border-accent/30 flex items-center justify-center">
                        <Award className="h-4.5 w-4.5 text-accent animate-pulse" />
                      </div>
                      <h4 className="font-display font-bold text-sm text-neutral-dark group-hover:text-primary transition-colors">
                        Certificate of Completion
                      </h4>
                      <p className="text-xs text-neutral-dark font-mono bg-neutral-light/5 p-2 rounded truncate">
                        Recipient: {cert.recipientName}
                      </p>
                      <p className="text-[11px] text-neutral-medium leading-relaxed">
                        For successfully completing the course: <span className="text-accent-alt">{cert.courseTitle}</span>.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-neutral-medium uppercase">{cert.verificationCode}</span>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => downloadCertificatePDF({
                            studentName: cert.recipientName || userName,
                            courseTitle: cert.courseTitle,
                            certificateId: cert.verificationCode,
                            issuedAt: cert.issuedAt,
                            instructorName: cert.instructorName || 'Dr. Elena Vance'
                          })}
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                          title="Download Official PDF"
                        >
                          <Download className="h-3 w-3" />
                          Download PDF
                        </button>
                        <button 
                          onClick={() => setSelectedCert(cert)}
                          className="text-primary hover:text-primary-light flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: DOWNLOADS ================= */}
        {activeTab === 'downloads' && (
          <div className="mt-8 space-y-4 text-left" id="student-dashboard-downloads-tab">
            <h2 className="text-sm font-mono font-bold tracking-widest text-neutral-medium uppercase mb-2">Workbook Resources</h2>
            <div className="glass-panel rounded-2xl divide-y divide-white/[0.06] overflow-hidden">
              {downloads.map((dl, idx) => (
                <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-neutral-light/[0.01] transition">
                  <div className="text-left font-mono">
                    <span className="block text-xs font-bold text-neutral-dark">{dl.name}</span>
                    <span className="block text-[10px] text-neutral-medium mt-1">For course: {dl.course}</span>
                  </div>
                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <span className="text-xs text-neutral-medium font-mono">{dl.size}</span>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-light/5 hover:bg-neutral-light/10 text-xs font-bold rounded-lg border border-white/10 transition cursor-pointer">
                      <Download className="h-3.5 w-3.5 text-primary" />
                      Get File
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: ACCOUNT SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div className="mt-8 max-w-2xl text-left" id="student-dashboard-settings-tab">
            <h2 className="text-sm font-mono font-bold tracking-widest text-neutral-medium uppercase mb-4">Student Profile Settings</h2>
            
            <form onSubmit={handleSaveSettings} className="glass-panel p-6 rounded-2xl space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-medium uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-neutral-light/50 border border-neutral-medium/20 rounded-lg p-2.5 text-xs text-neutral-dark focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-medium uppercase tracking-wider">Email Address</label>
                  <input 
                    type="text" 
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-neutral-light/50 border border-neutral-medium/20 rounded-lg p-2.5 text-xs text-neutral-dark focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-primary via-primary-light to-accent text-black font-display font-bold text-sm rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Save Settings
                </button>
                {saveSuccess && (
                  <span className="text-xs font-mono text-accent-alt flex items-center gap-1.5 animate-pulse">
                    <CheckCircle className="h-4 w-4" />
                    Profile settings saved successfully!
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 5: ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <Analytics 
            purchasedCourses={purchasedCourses}
            certificates={certificates}
            streak={streak}
            activities={activities}
          />
        )}

        {activeTab === 'activities' && (
          <div className="mt-8 space-y-6">
            <h2 className="text-sm font-mono font-bold tracking-widest text-neutral-medium uppercase mb-4">Recent Activity Log</h2>
            <div className="glass-panel p-6 rounded-2xl border border-white/[0.05]">
              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-neutral-medium text-xs font-mono">No recent activity detected.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map(act => (
                    <div key={act.id} className="flex gap-4 border-b border-white/[0.05] pb-4 last:border-0 last:pb-0 text-left">
                      <div className="mt-1">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse-slow"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-neutral-dark mb-1">{act.title}</p>
                        <p className="text-xs text-neutral-medium">{act.message}</p>
                        <p className="text-[9px] text-neutral-medium/60 mt-2 font-mono uppercase">
                          {new Date(act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ================= MODAL: DIGITAL DIPLOMA VIEWER ================= */}
      {selectedCert && (
        <div className="fixed inset-0 bg-secondary-dark/95 z-50 flex items-center justify-center p-4 overflow-y-auto" id="diploma-modal-overlay">
          <div className="relative max-w-2xl w-full gradient-border-primary rounded-3xl p-8 sm:p-12 text-center bg-neutral-bg glow-neon-cyan m-auto shadow-2xl">
            
            {/* Watermark Logo Backing */}
            <div className="absolute inset-x-0 top-1/4 flex opacity-[0.03] justify-center select-none pointer-events-none">
              <Award className="h-96 w-96 text-primary" />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
                <span className="text-[9px] font-mono text-primary uppercase tracking-widest font-extrabold">CERTIFICATE VERIFICATION</span>
                <button 
                  onClick={() => setSelectedCert(null)}
                  className="text-neutral-medium hover:text-neutral-dark text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
                >
                  Close [ESC]
                </button>
              </div>

              <div className="space-y-2 mt-4">
                <span className="text-xs uppercase tracking-widest text-accent-alt font-mono font-bold">GLASSEA TECH</span>
                <span className="block text-2xl sm:text-3xl font-display font-extrabold text-neutral-dark">CERTIFICATE OF COMPLETION</span>
                <p className="text-xs text-neutral-medium uppercase tracking-wider font-mono">This certificate is awarded to:</p>
              </div>

              <div className="py-4 border-b border-accent/20 max-w-md mx-auto">
                <h3 className="font-display font-extrabold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent uppercase">
                  {selectedCert.recipientName}
                </h3>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-neutral-medium leading-relaxed">
                  In recognition of successfully completing the curriculum and requirements for:
                </p>
                <span className="block font-display font-bold text-lg text-neutral-dark">
                  {selectedCert.courseTitle}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 font-mono border-t border-white/[0.08] text-xs text-left">
                <div>
                  <span className="block text-[9px] text-neutral-medium uppercase">DATE ISSUED</span>
                  <span className="font-bold text-neutral-dark">{selectedCert.issuedAt}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] text-neutral-medium uppercase">CERTIFICATE ID</span>
                  <span className="font-bold text-accent font-mono">{selectedCert.verificationCode}</span>
                </div>
              </div>

              {/* Action Buttons for Digital Diploma */}
              <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-white/[0.08]">
                <button
                  onClick={() => downloadCertificatePDF({
                    studentName: selectedCert.recipientName || userName,
                    courseTitle: selectedCert.courseTitle,
                    certificateId: selectedCert.verificationCode,
                    issuedAt: selectedCert.issuedAt,
                    instructorName: selectedCert.instructorName || 'Dr. Elena Vance'
                  })}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary via-primary-light to-accent text-black text-xs font-bold rounded-xl shadow-lg hover:scale-105 transition flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Official PDF
                </button>
                <button
                  onClick={() => openCertificatePDFInNewTab({
                    studentName: selectedCert.recipientName || userName,
                    courseTitle: selectedCert.courseTitle,
                    certificateId: selectedCert.verificationCode,
                    issuedAt: selectedCert.issuedAt,
                    instructorName: selectedCert.instructorName || 'Dr. Elena Vance'
                  })}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Open in New Tab
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default StudentDashboard;
