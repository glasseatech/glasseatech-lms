export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Lesson {
  id: string;
  title: string;
  videoUrl: string; // Embed or simulation URL
  duration: string; // e.g., "12:45"
  isPreview?: boolean;
  thumbnail?: string;
  content?: string;
  attachments?: { name: string; url: string }[];
  quiz?: Quiz;
}

export interface Chapter {
  id: string;
  title: string;
  thumbnail?: string; // Module thumbnail cover
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number; // in USD ($) as primary international pricing
  rating: number;
  reviewsCount?: number;
  studentsCount: number;
  instructorId: string;
  instructorName: string;
  category: string;
  chapters: Chapter[];
  isApproved: boolean; // Admin workflow
  createdAt: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  prerequisites?: string[]; // Course IDs
  authorTitle?: string;
  authorImage?: string;
}

export interface Instructor {
  id: string;
  name: string;
  bio: string;
  experience: string;
  certifications: string[];
  thumbnail: string;
}

export interface Purchase {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  courseId: string;
  amount: number;
  currency?: 'USD' | 'NGN';
  paidAt: string;
  reference: string;
  status: 'success' | 'pending' | 'failed';
  gateway?: 'flutterwave' | 'paystack';
}

export interface Review {
  id: string;
  courseId: string;
  userId?: string;
  userEmail?: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order?: number;
  isPublished?: boolean;
}

export interface WhyChooseUsItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export interface Certificate {
  id: string;
  userId: string;
  studentEmail?: string;
  courseId: string;
  courseTitle: string;
  recipientName: string;
  issuedAt: string;
  verificationCode: string; // Elite secure hash
  status?: 'pending' | 'approved' | 'rejected';
  instructorId?: string;
  instructorName?: string;
  emailSent?: boolean;
}

export interface CertificateRequest {
  id: string;
  userId: string;
  studentEmail: string;
  recipientName: string;
  courseId: string;
  courseTitle: string;
  instructorId: string;
  instructorName?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  issuedAt?: string;
  rejectionReason?: string;
  verificationCode?: string;
  emailSent?: boolean;
  studentNotes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface VideoLink {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  createdAt: string;
}

export interface SiteStats {
  totalRevenue: number;
  totalStudents: number;
  totalCoursesCount: number;
  totalTransactions: number;
}

export interface SiteConfig {
  heroTitle?: string;
  heroTitleHighlight?: string;
  heroTitleSuffix?: string;
  heroSubtitle?: string;
  featuresTitle?: string;
  featuresSubtitle?: string;
  faqTitle?: string;
  faqSubtitle?: string;
  heroButtonText?: string;
  bento1Stat?: string;
  bento1Title?: string;
  bento1Desc?: string;
  bento2Tag?: string;
  bento2Title?: string;
  bento3Tag?: string;
  bento3Title?: string;
  bento3Desc?: string;
  bento4Stat?: string;
  bento4Title?: string;
  catalogTag?: string;
  catalogTitle?: string;
  
  // Contact & Support Configuration
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsApp?: string;
  contactAddress?: string;
  contactWorkingHours?: string;
  contactSupportTitle?: string;
  contactSupportSubtitle?: string;
  
  footerContactEmail?: string;
  footerAboutTitle?: string;
  footerAboutText?: string;
  footerCopyright?: string;
  footerSocial1?: string;
  footerSocial2?: string;
  footerSocial3?: string;
  footerSocial4?: string;
  
  primaryColor?: string;
  accentColor?: string;
  neutralBg?: string;
}
