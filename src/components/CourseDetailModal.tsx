import React, { useState, useEffect } from 'react';
import { 
  X, Star, Users, Clock, BookOpen, Heart, ShoppingCart, 
  CheckCircle, ShieldCheck, ArrowRight, Play, Award, HelpCircle, Eye, MessageSquare
} from 'lucide-react';
import { Course, Instructor } from '../types.ts';
import { INITIAL_COURSES, INSTRUCTORS } from '../data.ts';

interface CourseDetailModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  isOwned: boolean;
  isInCart: boolean;
  isWishlisted: boolean;
  onToggleCart: () => void;
  onToggleWishlist: () => void;
  onBuyNow: () => void;
  onEnterRoom: () => void;
}

export default function CourseDetailModal({
  course,
  isOpen,
  onClose,
  isOwned,
  isInCart,
  isWishlisted,
  onToggleCart,
  onToggleWishlist,
  onBuyNow,
  onEnterRoom,
}: CourseDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'syllabus' | 'info' | 'benefits' | 'reviews'>('syllabus');
  const [activeVideoUrl, setActiveVideoUrl] = useState('https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-');

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
          setActiveVideoUrl(foundUrl);
        }
      } catch (err) {
        console.warn("Could not fetch active video link from Firestore in CourseDetailModal:", err);
      }
    };
    fetchActiveLink();
    return () => {
      active = false;
    };
  }, [isOpen]);
  
  // Review state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<{rating: number, comment: string}[]>([]);

  useEffect(() => {
    if (course) {
      const storedReviews = localStorage.getItem(`reviews-${course.id}`);
      if (storedReviews) {
        setReviews(JSON.parse(storedReviews));
      } else {
        setReviews([]);
      }
    }
  }, [course]);

  const handleSubmitReview = () => {
    if (rating === 0 || !comment.trim()) return;
    const newReview = { rating, comment };
    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);
    localStorage.setItem(`reviews-${course!.id}`, JSON.stringify(updatedReviews));
    setRating(0);
    setComment('');
  };

  if (!isOpen || !course) return null;

  const PrerequisiteMap = ({ ids }: { ids: string[] }) => {
    if (ids.length === 0) return null;
    return (
      <div className="mt-6 border-t border-neutral-medium/10 dark:border-neutral-medium/30 pt-6">
        <h4 className="font-bold text-xs uppercase mb-3 text-neutral-dark">Required Learning Path</h4>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
           {ids.map((id, index) => {
              const prereq = INITIAL_COURSES.find(c => c.id === id);
              return <React.Fragment key={id}>
                 <div className="p-2 bg-neutral-light dark:bg-neutral-bg border border-neutral-medium/10 dark:border-neutral-medium/30 rounded text-[10px] text-neutral-dark font-semibold whitespace-nowrap">{prereq?.title || 'Unknown Course'}</div>
                 <ArrowRight className="h-4 w-4 text-neutral-medium dark:text-neutral-medium/80 shrink-0" />
              </React.Fragment>
           })}
           <div className="p-2 bg-primary text-white border border-primary rounded text-[10px] font-bold whitespace-nowrap">This Course</div>
        </div>
      </div>
    );
  };

  // Find detailed instructor info
  const instructorDetails = INSTRUCTORS.find(i => i.id === course.instructorId);

  // Calculate total lessons and durations
  const totalLessons = course ? course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0) : 0;
  
  // Custom mock values to make it feel extremely rich and classic
  const benefits = [
    `Complete hands-on projects designed to simulate practical industry scenarios.`,
    `Verifiable cryptographic Completion Pass provided immediately upon curriculum sign-off.`,
    `Fully approved by the GLASSEA Academic Council.`,
    `Includes permanent personal cloud-sandbox access to all sandbox simulators.`
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" id="course-details-modal-overlay">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-bg/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Main Card Surface */}
      <div 
        className="relative w-full max-w-4xl max-h-[95vh] bg-neutral-bg dark:bg-zinc-950 border border-neutral-medium/10 dark:border-neutral-medium/30 rounded-2xl shadow-2xl flex flex-col overflow-y-auto scrollbar-hide animate-slideUp z-10 text-left"
        id="course-details-surface"
      >
        {/* Header Block */}
        <div className="relative bg-neutral-bg text-white dark:bg-zinc-900 dark:text-neutral-bg p-5 sm:p-8 shrink-0 flex flex-col md:flex-row gap-6 items-start justify-between border-b border-neutral-light/10">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-neutral-light/10 hover:bg-neutral-light/20 p-2 rounded-full cursor-pointer transition text-white z-10"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="space-y-4 max-w-xl order-2 md:order-1">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-mono leading-none font-bold uppercase tracking-widest text-[#00D9FF] bg-[#00D9FF]/10 px-2.5 py-1.5 rounded border border-[#00D9FF]/20">
                {course.category}
              </span>
              <span className="text-[10px] font-semibold text-neutral-medium flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-accent fill-accent" />
                <span className="text-white font-bold text-xs">{course.rating}</span>
                (GLASSEA Verified)
              </span>
            </div>

            <h2 className="font-display font-black text-2xl md:text-3xl lg:text-4xl tracking-tight text-white leading-tight">
              {course.title}
            </h2>

            <p className="text-sm md:text-base text-neutral-medium/90 leading-relaxed font-sans max-w-lg">
              {course.description}
            </p>

            {/* Quick Stats Grid */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-neutral-medium/80 pt-2">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#00D9FF]" />
                <strong className="text-white text-sm">{course.studentsCount.toLocaleString()}</strong> researchers
              </span>
              {totalLessons > 0 && (
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#00D9FF]" />
                  <strong className="text-white text-sm">{totalLessons}</strong> modules
                </span>
              )}
              {course.level && (
                <span className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#00D9FF]" />
                  <strong className="text-white text-sm">{course.level}</strong> track
                </span>
              )}
            </div>
          </div>

          {/* Graphic Banner block */}
          <div className="w-full md:w-64 aspect-video md:aspect-square rounded-xl relative overflow-hidden bg-neutral-light border border-neutral-light/10 shrink-0 shadow-inner group order-1 md:order-2">
            <img 
              src={course.thumbnail} 
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-neutral-bg/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="h-12 w-12 bg-neutral-light/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-all">
                <Eye className="h-5 w-5 text-neutral-dark animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Nav Tabs */}
        <div className="px-6 sm:px-8 border-b border-neutral-medium/10 dark:border-neutral-medium/30 bg-neutral-light dark:bg-zinc-950 flex items-center justify-between shrink-0 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex gap-4 sm:gap-6 mt-1 flex-nowrap min-w-max">
            <button
              onClick={() => { setActiveTab('syllabus'); }}
              className={`py-3 sm:py-4 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider relative cursor-pointer transition-colors ${
                activeTab === 'syllabus' ? 'text-[#00D9FF]' : 'text-neutral-medium hover:text-neutral-dark dark:hover:text-neutral-dark'
              }`}
            >
              Syllabus ({course?.chapters.length || 0})
              {activeTab === 'syllabus' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00D9FF] rounded-full" />}
            </button>
            <button
              onClick={() => { setActiveTab('info'); }}
              className={`py-3 sm:py-4 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider relative cursor-pointer transition-colors ${
                activeTab === 'info' ? 'text-[#00D9FF]' : 'text-neutral-medium hover:text-neutral-dark dark:hover:text-neutral-dark'
              }`}
            >
              Academic Instructor
              {activeTab === 'info' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00D9FF] rounded-full" />}
            </button>
            <button
              onClick={() => { setActiveTab('benefits'); }}
              className={`py-3 sm:py-4 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider relative cursor-pointer transition-colors ${
                activeTab === 'benefits' ? 'text-[#00D9FF]' : 'text-neutral-medium hover:text-neutral-dark dark:hover:text-neutral-dark'
              }`}
            >
              Benefits & Perks
              {activeTab === 'benefits' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00D9FF] rounded-full" />}
            </button>
            <button
              onClick={() => { setActiveTab('reviews'); }}
              className={`py-3 sm:py-4 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider relative cursor-pointer transition-colors ${
                activeTab === 'reviews' ? 'text-[#00D9FF]' : 'text-neutral-medium hover:text-neutral-dark dark:hover:text-neutral-dark'
              }`}
            >
              Reviews ({reviews.length})
              {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00D9FF] rounded-full" />}
            </button>
          </div>
          <div className="hidden sm:block text-[10px] font-mono font-bold text-neutral-medium dark:text-neutral-medium/80">
            TUITION CODE: <span className="text-neutral-dark uppercase">{course.id}</span>
          </div>
        </div>

        {/* Scrollable Tab Body Contents */}
        <div className="flex-1 p-6 sm:p-8 space-y-6 bg-neutral-bg dark:bg-zinc-950 text-neutral-dark shrink-0">

          
          {activeTab === 'syllabus' && (
            <div className="space-y-6 p-6 rounded-2xl border border-neutral-medium/10 dark:border-neutral-medium/30 min-h-[300px] flex flex-col" style={{ backgroundColor: '#091321' }}>
              {course.chapters.length > 0 ? (
                course.chapters.map((chapter, sIdx) => (
                  <div 
                    key={chapter.id} 
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-dark/10 dark:bg-primary/10 border border-primary-dark/20 dark:border-primary/20 text-primary-dark dark:text-primary font-mono text-xs font-black flex items-center justify-center">
                        {sIdx + 1}
                      </span>
                      <h4 className="font-display font-black text-sm text-slate-200 uppercase tracking-wide">
                        {chapter.title}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 pl-8">
                      {chapter.lessons.map((lesson) => (
                        <div 
                          key={lesson.id}
                          className="p-3 bg-neutral-bg border border-neutral-medium/5 dark:border-neutral-medium/20 hover:border-neutral-medium/15 dark:hover:border-neutral-medium/40 rounded-xl flex items-center justify-between gap-4 transition duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-6 rounded-lg bg-secondary dark:bg-neutral-light/10 border border-neutral-medium/10 dark:border-neutral-medium/30 flex items-center justify-center shadow-sm shrink-0">
                              <BookOpen className="h-3 w-3 text-neutral-medium dark:text-neutral-medium/80" />
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-slate-200 leading-snug">
                                {lesson.title}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-neutral-medium dark:text-neutral-medium/80">{lesson.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-60">
                  <div className="h-16 w-16 rounded-2xl bg-neutral-light/5 border border-white/5 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-primary/40 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-white font-display font-bold uppercase tracking-widest text-xs">Curriculum Under Development</h4>
                    <p className="text-[10px] text-neutral-medium max-w-[200px] mt-2 font-mono uppercase">This course syllabus is currently being finalized by the GLASSEA Academic Council.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-6 max-w-2xl border border-neutral-medium/10 dark:border-neutral-medium/30 rounded-2xl p-6" style={{ backgroundColor: '#091321' }}>
              <div className="flex items-center gap-4 text-left">
                {instructorDetails?.thumbnail || course.authorImage ? (
                  <img 
                    src={instructorDetails?.thumbnail || course.authorImage} 
                    alt={course.instructorName}
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 rounded-full object-cover shadow border-2 border-primary/20 select-none shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-accent-alt flex items-center justify-center font-display font-extrabold text-white text-xl shadow border-2 border-white select-none shrink-0">
                    {course.instructorName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-display font-black text-base text-slate-200">{course.instructorName}</h3>
                  <p className="text-xs font-mono text-[#00D9FF] font-bold uppercase mt-0.5">
                    {instructorDetails?.experience || course.authorTitle || 'Faculty Lead, GLASSEA Institute'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-neutral-medium dark:text-neutral-medium/80 mt-1">
                    <Star className="h-3 w-3 text-accent fill-accent" />
                    <span className="font-bold text-slate-200">{course.rating}</span> Instructor Rating
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed pt-2">
                <p>
                  {instructorDetails?.bio || 'The tutor is a senior digital research engineer, bringing over a decade of deep workspace domain experience to this curriculum track. Specializing in advanced modular instruction, you\'ll work through both theoretical concepts and real-world implementation logs.'}
                </p>
                <p>
                  Every syllabus item is calibrated for modern tech demands, guaranteeing precise competence transfer in high-revenue fields.
                </p>
              </div>

              {instructorDetails?.certifications && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {instructorDetails.certifications.map((cert, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-white/80 uppercase">
                      {cert}
                    </span>
                  ))}
                </div>
              )}

              <div className="h-px bg-neutral-medium/10 my-4" />
              <div className="flex justify-between flex-wrap gap-4 text-xs font-mono">
                <div>
                  <span className="block text-slate-400 text-[9px] uppercase font-bold">Approved By</span>
                  <span className="text-slate-200 font-bold">GLASSEA Academic Council</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[9px] uppercase font-bold">Accreditation</span>
                  <span className="text-[#00D9FF] font-extrabold">Level-IV Professional</span>
                </div>
              </div>

              {/* Prerequisites */}
              {course.prerequisites && course.prerequisites.length > 0 && (
                <PrerequisiteMap ids={course.prerequisites} />
              )}
            </div>
          )}

          {activeTab === 'benefits' && (
            <div className="space-y-4 p-6 rounded-2xl border border-neutral-medium/10 dark:border-neutral-medium/30" style={{ backgroundColor: '#091321' }}>
              <h4 className="font-display font-black text-sm text-slate-200 uppercase tracking-wide">
                What's included inside your enrollment tuition:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((b, bIdx) => (
                  <div key={bIdx} className="p-4 bg-neutral-bg border border-neutral-medium/5 dark:border-neutral-medium/20 hover:border-neutral-medium/15 dark:hover:border-neutral-medium/40 rounded-xl flex gap-3 text-left transition duration-200">
                    <CheckCircle className="h-4.5 w-4.5 text-green-500 fill-none shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-bold text-slate-200 mb-1">Tuition Level Indicator {bIdx + 1}</span>
                      <p className="text-xs text-slate-300 leading-normal">{b}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-neutral-bg text-white rounded-xl flex items-center justify-between flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-neutral-light/10 rounded-full flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-[#00D9FF]" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-black uppercase text-[#00D9FF] tracking-wider">Cryptographic Completion Pass</span>
                    <p className="text-[10px] text-slate-300 leading-normal mt-1">Fully downloadable cryptographic completion pass verified instantly by URL hash code lookup.</p>
                  </div>
                </div>
                <div className="text-xs font-mono text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/20 px-3 py-1 rounded font-bold">
                  SECURE HASH VERIFIED
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6 p-6 rounded-2xl border border-neutral-medium/10 dark:border-neutral-medium/30" style={{ backgroundColor: '#091321' }}>
              <div className="bg-neutral-bg p-6 rounded-2xl border border-neutral-medium/10 dark:border-neutral-medium/30">
                <h4 className="font-bold text-sm mb-4 text-slate-200">Leave a Review</h4>
                <div className="flex gap-2 mb-4">
                  {[1,2,3,4,5].map(star => (
                    <Star
                      key={star}
                      className={`h-6 w-6 cursor-pointer ${star <= rating ? 'fill-accent text-accent' : 'text-neutral-medium'}`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
                <textarea
                  className="w-full bg-[#1b1e21] border border-neutral-medium/30 p-3 rounded-xl mb-3 text-sm text-slate-200 focus:outline-none focus:border-primary placeholder:text-neutral-medium/40"
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  onClick={handleSubmitReview}
                  className="px-4 py-2 bg-[#00D9FF] text-neutral-dark hover:bg-[#00D9FF]/90 text-xs font-bold rounded-xl shadow-sm transition duration-200 cursor-pointer"
                >
                  Post Review
                </button>
              </div>
              <div className="space-y-3">
                {reviews.map((r, i) => (
                  <div key={i} className="p-4 bg-neutral-bg border border-neutral-medium/10 dark:border-neutral-medium/30 rounded-xl">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className={`h-4 w-4 ${idx < r.rating ? 'fill-accent text-accent' : 'text-neutral-medium dark:text-neutral-medium/60'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-slate-300">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions Bar (Moved here) */}
          <div className="p-4 bg-neutral-light dark:bg-neutral-bg rounded-xl border border-neutral-medium/10 dark:border-neutral-medium/30 flex items-center justify-between flex-col sm:flex-row gap-4">
            
            <div className="flex flex-col text-center sm:text-left">
              <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-medium dark:text-neutral-medium/80 font-bold leading-none">TOTAL TUITION COST</span>
              <span className="text-xl font-black font-display text-neutral-dark mt-1">
                {course.price === 0 ? 'Free' : `₦${course.price.toLocaleString()}`}
              </span>
            </div>

            <div className="flex items-center gap-2.5 select-none w-full sm:w-auto justify-center">
              {/* Wishlist toggle */}
              {!isOwned && (
                <button
                  onClick={onToggleWishlist}
                  className={`p-3 rounded-xl transition duration-200 border cursor-pointer ${
                    isWishlisted 
                      ? 'border-red-500 bg-red-500/10 text-red-500' 
                      : 'border-neutral-medium/15 dark:border-neutral-medium/30 hover:border-neutral-medium/30 dark:hover:border-neutral-medium/60 text-neutral-medium dark:text-neutral-medium/80 hover:text-neutral-dark dark:hover:text-neutral-dark bg-neutral-light dark:bg-neutral-bg'
                  }`}
                  title={isWishlisted ? "Remove from wishlist" : "Save in Wishlist"}
                >
                  <Heart className={`h-4.5 w-4.5 ${isWishlisted ? 'fill-red-500' : ''}`} />
                </button>
              )}

              {/* Cart toggle */}
              {!isOwned && (
                <button
                  onClick={onToggleCart}
                  className={`p-3 rounded-xl transition duration-200 border cursor-pointer ${
                    isInCart 
                      ? 'border-primary-dark dark:border-primary bg-primary-dark/10 dark:bg-primary/10 text-primary-dark dark:text-primary-light' 
                      : 'border-neutral-medium/15 dark:border-neutral-medium/30 hover:border-neutral-medium/30 dark:hover:border-neutral-medium/60 text-neutral-medium dark:text-neutral-medium/80 hover:text-neutral-dark dark:hover:text-neutral-dark bg-neutral-light dark:bg-neutral-bg'
                  }`}
                  title={isInCart ? "Remove from Academic Cart" : "Stash in Academic Cart"}
                >
                  <ShoppingCart className="h-4.5 w-4.5" />
                </button>
              )}

              {isOwned ? (
                <button
                  onClick={onEnterRoom}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition duration-200 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <CheckCircle className="h-4 w-4" />
                  Enter Course Room
                </button>
              ) : (
                <button
                  onClick={onBuyNow}
                  className="px-6 py-3 bg-gradient-to-r from-primary via-primary-light to-accent text-black text-xs font-bold rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-[0.98] hover:scale-[1.02] w-full sm:w-auto justify-center"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Buy & Unlock
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
