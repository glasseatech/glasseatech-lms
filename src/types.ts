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
  price: number; // in NGN (Nigerian Naira) or USD, using NGN prefix for Paystack
  rating: number;
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
  courseId: string;
  amount: number;
  paidAt: string;
  reference: string;
  status: 'success' | 'pending' | 'failed';
}

export interface Review {
  id: string;
  courseId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  recipientName: string;
  issuedAt: string;
  verificationCode: string; // Elite secure hash
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
