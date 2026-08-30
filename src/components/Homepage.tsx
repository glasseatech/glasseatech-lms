import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Play, Sparkles, Award, ArrowRight, Zap, Target, BookOpen, Clock, Users, Star, 
  CheckCircle, Heart, Download, MessageSquare,
  Smile, ArrowUpRight, Search, X, ShoppingCart, ArrowUp, Filter, Edit
} from 'lucide-react';
import { Course, Instructor } from '../types.ts';
import { TESTIMONIALS, WHY_CHOOSE_US, INSTRUCTORS } from '../data.ts';
import CourseDetailModal from './CourseDetailModal.tsx';
import { FAQ } from './FAQ.tsx';
import { Footer } from './Footer.tsx';
import InstructorSpotlight from './InstructorSpotlight.tsx';
// @ts-ignore
import regeneratedTestimonialImg from '../assets/images/regenerated_image_1782134062321.png';

interface HomepageProps {
  courses: Course[];
  isLoading: boolean;
  onSelectCourse: (courseId: string) => void;
  onNavigate: (page: string) => void;
  purchasedCourseIds: string[];
  cartCourseIds: string[];
  wishlistCourseIds: string[];
  onToggleCart: (courseId: string) => void;
  onToggleWishlist: (courseId: string) => void;
  siteConfig?: any;
  currentRole?: string;
}

export function Homepage({
  courses,
  isLoading,
  onSelectCourse,
  onNavigate,
  purchasedCourseIds,
  cartCourseIds,
  wishlistCourseIds,
  onToggleCart,
  onToggleWishlist,
  siteConfig,
  currentRole
}: HomepageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(() => localStorage.getItem('glassea_category') || 'All');
  const [searchQuery, setSearchQuery] = useState<string>(() => localStorage.getItem('glassea_search') || '');
  const [sortBy, setSortBy] = useState<'mostPopular' | 'priceLowToHigh' | 'latestReleases' | 'ratingHighToLow'>(() => (localStorage.getItem('glassea_sort') as any) || 'mostPopular');
  const [levelFilter, setLevelFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>(() => (localStorage.getItem('glassea_level') as any) || 'All');
  const [selectedDetailCourse, setSelectedDetailCourse] = useState<Course | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isJumping, setIsJumping] = useState(false);
  const [jumpVal, setJumpVal] = useState('');
  const [jumpError, setJumpError] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [features, setFeatures] = useState<any[]>(WHY_CHOOSE_US);
  const [bentoFeatures, setBentoFeatures] = useState<Record<string, any>>({});
  const [editingBentoCardId, setEditingBentoCardId] = useState<string | null>(null);
  const [bentoEditStat, setBentoEditStat] = useState('');
  const [bentoEditTitle, setBentoEditTitle] = useState('');
  const [bentoEditDesc, setBentoEditDesc] = useState('');
  const [bentoEditImageUrl, setBentoEditImageUrl] = useState('');
  const [isSavingBento, setIsSavingBento] = useState(false);

  const COURSES_PER_PAGE = 6;

  // Fetch dynamic content
  React.useEffect(() => {
    const fetchContent = async () => {
      try {
        const { collection, getDocs } = await import("firebase/firestore");
        const { db } = await import("../firebase.ts");
        const featureSnap = await getDocs(collection(db, "homepage_features"));
        const featureData = featureSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Separate bento cards from standard features
        const bentoMap: Record<string, any> = {};
        const normalFeatures: any[] = [];
        
        featureData.forEach((item: any) => {
          if (item.id.startsWith('bento')) {
            bentoMap[item.id] = item;
          } else {
            normalFeatures.push(item);
          }
        });

        if (normalFeatures.length > 0) {
          setFeatures(normalFeatures.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
        } else {
          setFeatures(WHY_CHOOSE_US);
        }
        setBentoFeatures(bentoMap);
      } catch (err) {
        console.error("Failed to fetch homepage content", err);
      }
    };
    fetchContent();
  }, []);

  const handleEditBentoClick = (cardId: string, defaults: { stat: string; title: string; description: string; imageUrl?: string }) => {
    if (currentRole !== 'ADMIN') return;
    const current = bentoFeatures[cardId] || {};
    setEditingBentoCardId(cardId);
    setBentoEditStat(current.stat !== undefined ? current.stat : defaults.stat);
    setBentoEditTitle(current.title !== undefined ? current.title : defaults.title);
    setBentoEditDesc(current.description !== undefined ? current.description : defaults.description);
    setBentoEditImageUrl(current.imageUrl !== undefined ? current.imageUrl : (defaults.imageUrl || ''));
  };

  const handleSaveBentoCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBentoCardId) return;

    try {
      setIsSavingBento(true);
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");

      const payload: any = {
        title: bentoEditTitle,
        description: bentoEditDesc,
        stat: bentoEditStat,
      };

      if (bentoEditImageUrl) {
        payload.imageUrl = bentoEditImageUrl;
      }

      await setDoc(doc(db, "homepage_features", editingBentoCardId), payload, { merge: true });

      // Update local state immediately
      setBentoFeatures(prev => ({
        ...prev,
        [editingBentoCardId]: {
          ...prev[editingBentoCardId],
          ...payload
        }
      }));

      setEditingBentoCardId(null);
    } catch (err) {
      console.error("Error saving bento feature:", err);
      alert("Error saving bento card changes. Please try again.");
    } finally {
      setIsSavingBento(false);
    }
  };

  // Persist state to localStorage on change
  React.useEffect(() => {
    localStorage.setItem('glassea_category', selectedCategory);
  }, [selectedCategory]);

  React.useEffect(() => {
    localStorage.setItem('glassea_search', searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    localStorage.setItem('glassea_sort', sortBy);
  }, [sortBy]);

  React.useEffect(() => {
    localStorage.setItem('glassea_level', levelFilter);
  }, [levelFilter]);

  const categories = ['All', 'Technology', 'Business', 'Design', 'Marketing', 'AI', 'Finance', 'Education'];

  const filteredCourses = courses.filter((course) => {
    if (!course.isApproved) return false;
    
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    
    const matchesSearch = searchQuery.trim() === '' || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = levelFilter === 'All' || (course.level || 'Beginner') === levelFilter;
      
    return matchesCategory && matchesSearch && matchesLevel;
  }).sort((a, b) => {
    if (sortBy === 'mostPopular') return b.studentsCount - a.studentsCount;
    if (sortBy === 'priceLowToHigh') return a.price - b.price;
    if (sortBy === 'latestReleases') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'ratingHighToLow') return b.rating - a.rating;
    return 0;
  });

  const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * COURSES_PER_PAGE,
    currentPage * COURSES_PER_PAGE
  );

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpVal);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setIsJumping(false);
      setJumpVal('');
      setJumpError(false);
    } else {
      setJumpError(true);
      setTimeout(() => setJumpError(false), 2000);
    }
  };

  // Reset page when category, search, or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy, levelFilter]);

  React.useEffect(() => {
    const handleScroll = () => {
      // Show back to top if scrolled past hero section roughly (e.g., 500px)
      if (window.scrollY > 500) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-left space-grid bg-neutral-bg" id="homepage-root">
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-20 pb-24 md:py-32 bg-neutral-bg" id="hero-section">
        <div className="absolute left-1/2 -top-[65rem] h-[100rem] w-[180rem] -translate-x-1/2 rounded-full blur-[180px] opacity-100 transition-all duration-1000 ease-in-out"
             style={{
               background: 'linear-gradient(to bottom, #ffffff 0%, #dce8ff 8%, #8FB2FF 18%, #5F86D6 38%, #3A5C9A 60%, transparent 100%)'
             }}
        />
        {/* Soft top-down white spotlight blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(0,163,204,0.06)_0%,rgba(0,163,204,0.02)_30%,rgba(0,0,0,0)_65%)] pointer-events-none -z-10"></div>
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/5 blur-[126px] -z-10 animate-pulse-slow"></div>
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 translate-x-1/2 w-80 h-80 rounded-full bg-accent/5 blur-3xl -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8 mb-16 p-4 sm:p-8 rounded-3xl backdrop-blur-sm">

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="font-display font-extrabold text-4xl sm:text-5xl lg:text-7xl tracking-tight text-neutral-dark leading-[1.1] max-w-4xl"
            >
              {siteConfig?.heroTitle || siteConfig?.heroTitleHighlight || siteConfig?.heroTitleSuffix ? (
                <>
                  {siteConfig.heroTitle}
                  {siteConfig.heroTitleHighlight && (
                    <><br className="hidden sm:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-accent sm:whitespace-nowrap">{siteConfig.heroTitleHighlight}</span></>
                  )}
                  {siteConfig.heroTitleSuffix && ` ${siteConfig.heroTitleSuffix}`}
                </>
              ) : (
                <>Master the Architecture of<br className="hidden sm:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-accent sm:whitespace-nowrap">Futuristic SaaS</span> Solutions</>
              )}
            </motion.h1>
            
            <p className="text-base sm:text-lg text-neutral-medium max-w-2xl leading-relaxed">
              {siteConfig?.heroSubtitle ? siteConfig.heroSubtitle : 'GLASSEA is a premier learning platform designed for programmers, software engineers, and digital architects. Master real-world tech skills with hands-on courses.'}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <motion.button 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                onClick={() => {
                  const el = document.getElementById('catalog-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-primary via-primary-light to-accent text-black font-display font-bold text-sm flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-primary/20"
                id="hero-cta-explore"
              >
                {siteConfig?.heroButtonText || 'Get Started Free'}
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          {/* ================= BENTO GRID OF CARDS ================= */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-12" id="homepage-bento-grid">
            
            {/* COLUMN 1 - Left Column: width md:span-3 */}
            <div className="md:col-span-3 flex flex-col gap-6">
              {/* Card A: 90% Competency Rate */}
              <div 
                onClick={() => handleEditBentoClick('bento1', { stat: siteConfig?.bento1Stat || '90%', title: siteConfig?.bento1Title || 'Alumni Success Ratio', description: siteConfig?.bento1Desc || 'Students report faster job upgrades' })}
                className={`bg-neutral-light border border-neutral-medium/15 p-6 rounded-3xl flex flex-col justify-between h-[150px] relative overflow-hidden group transition-all duration-300 shadow-sm ${currentRole === 'ADMIN' ? 'cursor-pointer hover:border-primary border-dashed border-2' : 'hover:border-primary/40'}`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-xl"></div>
                {currentRole === 'ADMIN' && (
                  <span className="absolute top-3 right-3 z-20 bg-primary text-black font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <Edit className="w-2.5 h-2.5" /> EDIT
                  </span>
                )}
                <div className="flex justify-between items-start">
                  <span className="text-4xl font-extrabold text-neutral-dark tracking-tight font-display">
                    {bentoFeatures.bento1?.stat !== undefined ? bentoFeatures.bento1.stat : (siteConfig?.bento1Stat || '90%')}
                  </span>
                  {currentRole !== 'ADMIN' && (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                      <Smile className="h-5 w-5 text-primary-dark fill-current" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-neutral-medium uppercase tracking-wider font-mono">
                    {bentoFeatures.bento1?.title !== undefined ? bentoFeatures.bento1.title : (siteConfig?.bento1Title || 'Alumni Success Ratio')}
                  </p>
                  <p className="text-xs text-neutral-medium italic mt-0.5">
                    {bentoFeatures.bento1?.description !== undefined ? bentoFeatures.bento1.description : (siteConfig?.bento1Desc || 'Students report faster job upgrades')}
                  </p>
                </div>
              </div>

              {/* Card B: Workspace Image display */}
              <div 
                onClick={() => handleEditBentoClick('bento2', { stat: siteConfig?.bento2Tag || 'WORKSPACE', title: siteConfig?.bento2Title || 'Active Implementation Lab', description: '', imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80' })}
                className={`hidden md:block relative rounded-3xl overflow-hidden aspect-[4/5] md:aspect-auto md:flex-1 min-h-[220px] border border-neutral-medium/15 shadow-sm group ${currentRole === 'ADMIN' ? 'cursor-pointer border-dashed border-2 border-primary' : ''}`}
              >
                <img 
                  src={bentoFeatures.bento2?.imageUrl || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80"} 
                  alt="LMS student coder working"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                {currentRole === 'ADMIN' && (
                  <span className="absolute top-3 right-3 z-20 bg-primary text-black font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <Edit className="w-2.5 h-2.5" /> EDIT
                  </span>
                )}
                <div className="absolute bottom-6 left-6 right-6 text-left">
                  <span className="font-mono text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-primary/20 text-primary-light border border-primary/20">
                    {bentoFeatures.bento2?.stat !== undefined ? bentoFeatures.bento2.stat : (siteConfig?.bento2Tag || 'WORKSPACE')}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2">
                    {bentoFeatures.bento2?.title !== undefined ? bentoFeatures.bento2.title : (siteConfig?.bento2Title || 'Active Implementation Lab')}
                  </h4>
                  {bentoFeatures.bento2?.description && (
                    <p className="text-xs text-white/80 mt-1">{bentoFeatures.bento2.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 2 - Middle Section: width md:span-6 */}
            <div className="hidden md:flex md:col-span-6 flex-col gap-6">
              {/* Card C: Large horizontal tutorial video teaser card */}
              <div 
                onClick={() => handleEditBentoClick('bento3', { stat: '', title: '', description: '', imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80' })}
                className={`relative rounded-3xl overflow-hidden aspect-[16/10] md:h-[250px] border border-neutral-medium/15 shadow-sm group ${currentRole === 'ADMIN' ? 'cursor-pointer border-dashed border-2 border-primary' : ''}`}
              >
                <img 
                  src={bentoFeatures.bento3?.imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"} 
                  alt="Students collaboration panel"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"></div>
                {currentRole === 'ADMIN' && (
                  <span className="absolute top-3 right-3 z-20 bg-primary text-black font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <Edit className="w-2.5 h-2.5" /> EDIT
                  </span>
                )}
                {(bentoFeatures.bento3?.title || bentoFeatures.bento3?.description || bentoFeatures.bento3?.stat) && (
                  <div className="absolute bottom-6 left-6 right-6 text-left">
                    {bentoFeatures.bento3?.stat && (
                      <span className="font-mono text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-primary/20 text-primary-light border border-primary/20">
                        {bentoFeatures.bento3.stat}
                      </span>
                    )}
                    {bentoFeatures.bento3?.title && (
                      <h4 className="text-sm font-bold text-white mt-2">{bentoFeatures.bento3.title}</h4>
                    )}
                    {bentoFeatures.bento3?.description && (
                      <p className="text-xs text-white/80 mt-1">{bentoFeatures.bento3.description}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom twin widgets container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:flex-1">
                {/* Card D: Collaborative environment text block */}
                <div 
                  onClick={() => handleEditBentoClick('bento4', { stat: siteConfig?.bento3Tag || 'Collaborative', title: siteConfig?.bento3Title || 'Collaborative Learning Environment', description: siteConfig?.bento3Desc || 'A learning environment facilitating faster teamwork, active peer review, and shared knowledge.' })}
                  className={`bg-neutral-light border border-neutral-medium/15 p-6 rounded-3xl flex flex-col justify-between min-h-[160px] group transition-all duration-300 shadow-sm relative ${currentRole === 'ADMIN' ? 'cursor-pointer hover:border-primary border-dashed border-2' : 'hover:border-primary/40'}`}
                >
                  {currentRole === 'ADMIN' && (
                    <span className="absolute top-3 right-3 z-20 bg-primary text-black font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <Edit className="w-2.5 h-2.5" /> EDIT
                    </span>
                  )}
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                      {bentoFeatures.bento4?.stat !== undefined ? bentoFeatures.bento4.stat : (siteConfig?.bento3Tag || 'Collaborative')}
                    </span>
                    <h3 className="font-display font-bold text-lg text-neutral-dark mt-4 tracking-tight">
                      {bentoFeatures.bento4?.title !== undefined ? bentoFeatures.bento4.title : (siteConfig?.bento3Title || 'Collaborative Learning Environment')}
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-medium leading-relaxed">
                    {bentoFeatures.bento4?.description !== undefined ? bentoFeatures.bento4.description : (siteConfig?.bento3Desc || 'A learning environment facilitating faster teamwork, active peer review, and shared knowledge.')}
                  </p>
                </div>

                {/* Card E: Collaborative group session image widget */}
                <div 
                  onClick={() => handleEditBentoClick('bento5', { stat: '', title: '', description: '', imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80' })}
                  className={`relative rounded-3xl overflow-hidden min-h-[160px] border border-neutral-medium/15 shadow-sm group ${currentRole === 'ADMIN' ? 'cursor-pointer border-dashed border-2 border-primary' : ''}`}
                >
                  <img 
                    src={bentoFeatures.bento5?.imageUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80"} 
                    alt="Classroom team discussion"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  {currentRole === 'ADMIN' && (
                    <span className="absolute top-3 right-3 z-20 bg-primary text-black font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <Edit className="w-2.5 h-2.5" /> EDIT
                    </span>
                  )}
                  {(bentoFeatures.bento5?.title || bentoFeatures.bento5?.description || bentoFeatures.bento5?.stat) && (
                    <div className="absolute bottom-6 left-6 right-6 text-left">
                      {bentoFeatures.bento5?.stat && (
                        <span className="font-mono text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-primary/20 text-primary-light border border-primary/20">
                          {bentoFeatures.bento5.stat}
                        </span>
                      )}
                      {bentoFeatures.bento5?.title && (
                        <h4 className="text-sm font-bold text-white mt-2">{bentoFeatures.bento5.title}</h4>
                      )}
                      {bentoFeatures.bento5?.description && (
                        <p className="text-xs text-white/80 mt-1">{bentoFeatures.bento5.description}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 3 - Right Section: width md:span-3 */}
            <div className="hidden md:flex md:col-span-3">
              {/* Card F: Tall classroom presenter/mentor */}
              <div 
                onClick={() => handleEditBentoClick('bento6', { stat: siteConfig?.bento4Stat || '20K+', title: siteConfig?.bento4Title || 'Happy Alumni Developer Profiles', description: '', imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80' })}
                className={`relative rounded-3xl overflow-hidden w-full min-h-[380px] md:h-auto flex flex-col justify-between p-6 border border-neutral-medium/15 shadow-sm group ${currentRole === 'ADMIN' ? 'cursor-pointer border-dashed border-2 border-primary' : ''}`}
              >
                <img 
                  src={bentoFeatures.bento6?.imageUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80"} 
                  alt="GLASSEA instructor"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 -z-10"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent -z-10"></div>
                {currentRole === 'ADMIN' && (
                  <span className="absolute top-3 right-3 z-20 bg-primary text-black font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <Edit className="w-2.5 h-2.5" /> EDIT
                  </span>
                )}
                
                {/* Glowing redirect corner trigger icon */}
                <div className="flex justify-end">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const el = document.getElementById('catalog-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="h-10 w-10 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm z-10"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Stat block at the bottom */}
                <div className="text-left">
                  <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                    {bentoFeatures.bento6?.stat !== undefined ? bentoFeatures.bento6.stat : (siteConfig?.bento4Stat || '20K+')}
                  </span>
                  <p className="text-xs text-neutral-medium uppercase tracking-wider font-mono font-medium mt-1">
                    {bentoFeatures.bento6?.title !== undefined ? bentoFeatures.bento6.title : (siteConfig?.bento4Title || 'Happy Alumni Developer Profiles')}
                  </p>
                  {bentoFeatures.bento6?.description && (
                    <p className="text-xs text-white/80 mt-1">{bentoFeatures.bento6.description}</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= FEATURED COURSES CATALOGUE ================= */}
      <section className="py-20 md:py-28 bg-neutral-bg" id="catalog-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center max-w-xl mx-auto space-y-4">
            <span className="text-xs uppercase tracking-widest font-mono text-primary font-bold">{siteConfig?.catalogTag || 'FEATURED COURSES'}</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-neutral-dark tracking-tight mt-3">{siteConfig?.catalogTitle || 'Explore Learning Pathways'}</h2>
          </div>
        </div>

        {/* Infinite Scrolling Marquee - Full Width */}
        <div className="w-full bg-neutral-bg border-y border-neutral-medium/10 overflow-hidden flex items-center py-4 mb-12 group">
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
            {/* First Block */}
            <div className="flex items-center">
              {categories.map((cat, index) => (
                <div key={`m1-${index}`} className="flex items-center">
                  <span className="text-neutral-500 font-sans uppercase tracking-[0.2em] text-xs font-semibold whitespace-nowrap px-8 cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedCategory(cat)}>
                    {cat}
                  </span>
                  <span className="text-primary text-[10px]">✦</span>
                </div>
              ))}
            </div>
            {/* Second Block (Duplicate for seamless loop) */}
            <div className="flex items-center" aria-hidden="true">
              {categories.map((cat, index) => (
                <div key={`m2-${index}`} className="flex items-center">
                  <span className="text-neutral-500 font-sans uppercase tracking-[0.2em] text-xs font-semibold whitespace-nowrap px-8 cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedCategory(cat)}>
                    {cat}
                  </span>
                  <span className="text-primary text-[10px]">✦</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Premium UI Real-time Search Hub */}
          <div className="max-w-xl mx-auto mb-12 flex flex-col md:flex-row gap-4" id="catalog-search-area">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources, topics, or authors..."
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-neutral-light border border-neutral-medium/15 text-neutral-dark placeholder-neutral-500 text-xs focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                <Search className="h-4 w-4" />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-dark transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            
            <div className="flex gap-4">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as any)}
                className="py-3 px-4 rounded-2xl bg-neutral-light border border-neutral-medium/15 text-neutral-dark text-xs focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all shadow-sm cursor-pointer"
              >
                <option value="All">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-3 px-4 rounded-2xl bg-neutral-light border border-neutral-medium/15 text-neutral-dark text-xs focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all shadow-sm cursor-pointer"
              >
                <option value="mostPopular">Most Popular</option>
                <option value="priceLowToHigh">Price: Low to High</option>
                <option value="latestReleases">Latest Releases</option>
                <option value="ratingHighToLow">Rating: High to Low</option>
              </select>
            </div>
          </div>

          {/* Catalog grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="courses-skeleton-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="group glass-panel rounded-2xl overflow-hidden border-neutral-medium/10 flex flex-col h-full animate-pulse min-h-[420px]">
                  <div className="h-48 bg-neutral-medium/20 w-full object-cover"></div>
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-4 text-left">
                      <div className="flex justify-between items-center">
                        <div className="h-4 w-24 bg-neutral-medium/20 rounded"></div>
                        <div className="h-3 w-8 bg-neutral-medium/20 rounded"></div>
                      </div>
                      <div className="h-6 w-3/4 bg-neutral-medium/20 rounded"></div>
                      <div className="space-y-2 mt-4">
                        <div className="h-3 w-full bg-neutral-medium/20 rounded"></div>
                        <div className="h-3 w-5/6 bg-neutral-medium/20 rounded"></div>
                        <div className="h-3 w-4/6 bg-neutral-medium/20 rounded"></div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-neutral-medium/10 flex items-center justify-between gap-4 mt-auto">
                      <div className="h-6 w-16 bg-neutral-medium/20 rounded"></div>
                      <div className="flex gap-2">
                        <div className="h-10 w-10 bg-neutral-medium/20 rounded-lg"></div>
                        <div className="h-10 w-28 bg-neutral-medium/20 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedCourses.length === 0 ? (
            <div className="text-center py-20 bg-neutral-light rounded-2xl border border-neutral-medium/10" id="catalog-empty-state">
              <span className="text-sm text-neutral-medium">No active courses registered in this slot. Switch perspective to Instructor to submit one!</span>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="courses-grid-list">
              {paginatedCourses.map((course) => {
                const isOwned = purchasedCourseIds.includes(course.id);
                const isWishlisted = wishlistCourseIds.includes(course.id);
                const isInCart = cartCourseIds.includes(course.id);
                return (
                  <motion.div 
                    layout
                    key={course.id}
                    className="group glass-panel rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1 hover:scale-[1.015] transition-all duration-300 flex flex-col h-full cursor-pointer"
                    id={`course-card-${course.id}`}
                    onClick={() => setSelectedDetailCourse(course)}
                  >
                    {/* Course Header Poster */}
                    <div className="relative h-48 overflow-hidden bg-neutral-light">
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                      
                      {/* Floating Subject Category badge */}
                      <span className="absolute top-4 left-4 bg-neutral-bg/95 dark:bg-neutral-light border border-primary/40 text-primary-light dark:text-primary uppercase text-[9px] font-mono tracking-widest px-2.5 py-1 rounded-md">
                        {course.category}
                      </span>

                          {/* Floating Wishlist Heart */}
                      {!isOwned && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(course.id);
                          }}
                          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-neutral-bg/90 backdrop-blur-md shadow-md border border-neutral-medium/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer z-10 group/heart"
                          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                          id={`heart-toggle-${course.id}`}
                        >
                          <Heart 
                            className={`h-4 w-4 transition-all duration-200 ${
                              isWishlisted 
                                ? 'fill-red-500 text-red-500 scale-105' 
                                : 'text-neutral-medium group-hover/heart:text-red-500'
                            }`} 
                          />
                        </button>
                      )}
                    </div>

                    {/* Course Body Contents */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-medium">
                          <div className="flex items-center gap-2">
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 const inst = INSTRUCTORS.find(i => i.id === course.instructorId);
                                 if (inst) setSelectedInstructor(inst);
                               }}
                               className="hover:text-primary transition underline decoration-primary/30"
                             >
                               {course.instructorName}
                             </button>
                             <span className="px-1.5 py-0.5 rounded bg-neutral-medium/10 text-neutral-dark font-bold">
                               {course.level || 'Beginner'}
                             </span>
                          </div>
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                            <span className="font-bold text-neutral-dark">{course.rating}</span>
                          </span>
                        </div>
                        
                        <h3 className="font-display font-bold text-lg text-neutral-dark group-hover:text-primary transition-colors leading-snug">
                          {course.title}
                        </h3>
                        
                        <p className="text-xs text-neutral-medium leading-relaxed line-clamp-3 text-left">
                          {course.description}
                        </p>

                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-primary group-hover:underline mt-2">
                          View details & syllabus curriculum →
                        </span>
                      </div>

                      {/* Course bottom meta analytics and pricing buy actions */}
                      <div className="pt-4 border-t border-neutral-medium/10 flex items-center justify-between gap-4">
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-medium">TUITION</span>
                          <span className="text-lg font-bold font-mono text-neutral-dark">
                            {(!course.price || course.price === 0) ? 'Free' : `₦${course.price.toLocaleString()}`}
                          </span>
                        </div>
                        
                        {isOwned ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCourse(course.id);
                            }}
                            className="bg-accent-alt/15 text-accent-alt border border-accent-alt/30 hover:bg-accent-alt/25 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Enter Room
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            {/* Shopping Cart button trigger */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleCart(course.id);
                              }}
                              className={`p-2.5 rounded-lg transition-all cursor-pointer border flex items-center justify-center ${
                                isInCart 
                                  ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20' 
                                  : 'bg-neutral-light/50 border-neutral-medium/15 text-neutral-medium hover:border-neutral-medium/30 hover:text-neutral-dark'
                              }`}
                              title={isInCart ? 'Remove from Academic Cart' : 'Stash in Academic Cart'}
                              id={`cart-add-btn-${course.id}`}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCourse(course.id);
                              }}
                              className="bg-gradient-to-r from-primary via-primary-light to-accent text-black px-4 py-2.5 rounded-lg text-xs font-bold font-display tracking-wide transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98] hover:scale-[1.02]"
                            >
                              Buy / Lock In
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-light border border-neutral-medium/15 text-neutral-dark hover:border-primary/40 disabled:opacity-50 transition cursor-pointer"
              >
                Previous
              </button>
              
              <div className="relative">
                {isJumping ? (
                  <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
                    <input 
                      autoFocus
                      type="text"
                      value={jumpVal}
                      onChange={(e) => {
                        setJumpVal(e.target.value);
                        if (jumpError) setJumpError(false);
                      }}
                      onBlur={() => !jumpVal && setIsJumping(false)}
                      placeholder="#"
                      className={`w-12 px-2 py-1 text-xs text-center font-mono bg-neutral-bg border rounded outline-none transition-all ${jumpError ? 'border-red-500' : 'border-primary/40'}`}
                    />
                    {jumpError && <X className="h-3 w-3 text-red-500" />}
                  </form>
                ) : (
                  <span 
                    onClick={() => setIsJumping(true)}
                    className="text-xs font-mono text-neutral-medium cursor-pointer hover:text-primary transition-colors select-none px-2 py-1 rounded hover:bg-primary/5 flex items-center gap-1.5"
                    title="Click to jump to page"
                  >
                    Page {currentPage} of {totalPages}
                    <Search className="h-3 w-3 opacity-30 group-hover:opacity-100" />
                  </span>
                )}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-light border border-neutral-medium/15 text-neutral-dark hover:border-primary/40 disabled:opacity-50 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          )}


        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-[#0b0f19] border-y border-white/10" id="why-us-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-[10px] font-mono text-primary uppercase tracking-[0.3em] font-bold">CORE VALUE PROPOSITION</h2>
            <h3 className="text-4xl font-display font-medium text-white tracking-tight">
              {siteConfig?.featuresTitle || 'Why Engineers Choose GLASSEA'}
            </h3>
            <p className="text-sm text-white/70 max-w-xl mx-auto">
              {siteConfig?.featuresSubtitle || 'Beyond simple videos, we provide a high-fidelity workspace for mastering the next generation of software architecture.'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((item, idx) => (
              <div key={idx} className="glass-panel bg-white/[0.03] border border-white/10 p-8 rounded-2xl space-y-4 hover:border-primary/40 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                  {idx === 0 && <Users className="h-5 w-5" />}
                  {idx === 1 && <Sparkles className="h-5 w-5" />}
                  {idx === 2 && <Play className="h-5 w-5" />}
                  {idx === 3 && <ShoppingCart className="h-5 w-5" />}
                  {idx === 4 && <Award className="h-5 w-5" />}
                  {idx === 5 && <Zap className="h-5 w-5" />}
                </div>
                <h4 className="font-display font-bold text-white">{item.title}</h4>
                <p className="text-xs text-white/60 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ siteConfig={siteConfig} />

      {/* ================= FOOTER ================= */}
      <Footer siteConfig={siteConfig} currentRole={currentRole} />

      {/* Course detailed view panel overlay */}
      <CourseDetailModal
        course={selectedDetailCourse}
        isOpen={!!selectedDetailCourse}
        onClose={() => setSelectedDetailCourse(null)}
        isOwned={selectedDetailCourse ? purchasedCourseIds.includes(selectedDetailCourse.id) : false}
        isInCart={selectedDetailCourse ? cartCourseIds.includes(selectedDetailCourse.id) : false}
        isWishlisted={selectedDetailCourse ? wishlistCourseIds.includes(selectedDetailCourse.id) : false}
        onToggleCart={() => {
          if (selectedDetailCourse) {
            onToggleCart(selectedDetailCourse.id);
          }
        }}
        onToggleWishlist={() => {
          if (selectedDetailCourse) {
            onToggleWishlist(selectedDetailCourse.id);
          }
        }}
        onBuyNow={() => {
          if (selectedDetailCourse) {
            const courseId = selectedDetailCourse.id;
            setSelectedDetailCourse(null);
            onSelectCourse(courseId);
          }
        }}
        onEnterRoom={() => {
          if (selectedDetailCourse) {
            const courseId = selectedDetailCourse.id;
            setSelectedDetailCourse(null);
            onSelectCourse(courseId);
          }
        }}
      />
      
      {selectedInstructor && (
        <InstructorSpotlight
          instructor={selectedInstructor}
          onClose={() => setSelectedInstructor(null)}
        />
      )}

      {/* Bento Card Edit Modal (Admin-only) */}
      {editingBentoCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" id="bento-edit-modal">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#0b0f19] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 text-left"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Edit Bento Grid Card ({editingBentoCardId.toUpperCase()})
              </h3>
              <button 
                onClick={() => setEditingBentoCardId(null)}
                className="text-neutral-medium hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBentoCard} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs text-neutral-medium font-mono uppercase tracking-wider">Stat / Tag Value</label>
                <input 
                  type="text"
                  value={bentoEditStat}
                  onChange={(e) => setBentoEditStat(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none transition"
                  placeholder="e.g. 90% or WORKSPACE"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-neutral-medium font-mono uppercase tracking-wider">Title Text</label>
                <input 
                  type="text"
                  value={bentoEditTitle}
                  onChange={(e) => setBentoEditTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none transition"
                  placeholder="Card title..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-neutral-medium font-mono uppercase tracking-wider">Description / Caption</label>
                <textarea 
                  value={bentoEditDesc}
                  onChange={(e) => setBentoEditDesc(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm h-24 focus:border-primary outline-none transition resize-none"
                  placeholder="Card description or supporting details..."
                />
              </div>

              {['bento2', 'bento3', 'bento5', 'bento6'].includes(editingBentoCardId) && (
                <div className="space-y-1">
                  <label className="block text-xs text-neutral-medium font-mono uppercase tracking-wider">Background Image URL</label>
                  <input 
                    type="text"
                    value={bentoEditImageUrl}
                    onChange={(e) => setBentoEditImageUrl(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none transition"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBentoCardId(null)}
                  className="px-4 py-2 text-xs font-bold text-neutral-medium hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBento}
                  className="px-5 py-2 text-xs font-bold bg-primary text-black rounded-xl hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  {isSavingBento ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Back to Top FAB */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 p-3 sm:p-4 bg-black text-[#0b0b0b] rounded-full shadow-2xl hover:bg-black hover:-translate-y-1 hover:scale-105 transition-all duration-300 z-50 group flex items-center justify-center ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5 text-white bg-black" />
      </button>

    </div>
  );
}

export default Homepage;
