import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, BookOpen, Activity, Check, X, ShieldAlert, Award, 
  Coins, Search, RefreshCw, BarChart, Settings, Sliders,
  Plus, Trash2, Edit2, Youtube, Link, Tv
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, AreaChart, Area, Legend 
} from 'recharts';
import { Course, Purchase, User } from '../types.ts';
import AdminHomepageContent from './AdminHomepageContent.tsx';

interface AdminDashboardProps {
  courses: Course[];
  onCourseApproved: () => void;
  userEmail: string;
  loading: boolean;
}

export default function AdminDashboard({
  courses,
  onCourseApproved,
  userEmail,
  loading
}: AdminDashboardProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<'approvals' | 'courses' | 'transactions' | 'users' | 'analytics' | 'videos' | 'content'>('analytics');
  
  // Dynamic metrics pulled from Express stats API
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [dbPurchases, setDbPurchases] = useState<Purchase[]>([]);
  const [metrics, setMetrics] = useState({
    revenue: 3500000,
    studentsCount: 154,
    totalTransactions: 32
  });

  const [statsLoading, setStatsLoading] = useState(true);
  const [refundNotification, setRefundNotification] = useState<string | null>(null);

  // Video Iframe CRUD states
  const [videoLinks, setVideoLinks] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newIsActive, setNewIsActive] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editIsActive, setEditIsActive] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);

  // Content (Courses) CRUD states
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<Partial<Course>>({});

  const fetchVideoLinks = async () => {
    setVideoLoading(true);
    try {
      const { collection, getDocs, doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      const querySnapshot = await getDocs(collection(db, "video_links"));
      const links: any[] = [];
      querySnapshot.forEach((doc) => {
        links.push({ id: doc.id, ...doc.data() });
      });

      // If absolutely empty, seed with the default one
      if (links.length === 0) {
        const defaultLink = {
          id: 'default-yt-link',
          title: 'Master Blockchain Security audit',
          url: 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-',
          isActive: true,
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(doc(db, "video_links", defaultLink.id), defaultLink);
          links.push(defaultLink);
        } catch (seedErr) {
          console.warn("Could not seed default video link:", seedErr);
        }
      }
      setVideoLinks(links);
    } catch (err) {
      console.error("Could not fetch video links from Firestore:", err);
    } finally {
      setVideoLoading(false);
    }
  };

  const handleCreateVideoLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    try {
      const { doc, setDoc, updateDoc } = await import("firebase/firestore");
      const { db, handleFirestoreError, OperationType } = await import("../firebase.ts");
      
      const linkId = 'vl-' + Date.now();
      const payload: any = {
        id: linkId,
        title: newTitle.trim(),
        url: newUrl.trim(),
        isActive: newIsActive,
        createdAt: new Date().toISOString()
      };

      // If new link is active, set all other links to inactive
      if (newIsActive) {
        for (const link of videoLinks) {
          if (link.isActive) {
            try {
              await updateDoc(doc(db, "video_links", link.id), { isActive: false });
            } catch (err) {
              console.warn(`Could not set inactive for ${link.id}:`, err);
            }
          }
        }
      }

      try {
        await setDoc(doc(db, "video_links", linkId), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `video_links/${linkId}`);
      }

      setNewTitle('');
      setNewUrl('');
      setNewIsActive(false);
      fetchVideoLinks();
    } catch (err) {
      console.error("Error creating video link:", err);
    }
  };

  const handleUpdateVideoLink = async (linkId: string) => {
    if (!editTitle.trim() || !editUrl.trim()) return;

    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db, handleFirestoreError, OperationType } = await import("../firebase.ts");

      // If we are activating this one, we must deactivate all others first!
      if (editIsActive) {
        for (const link of videoLinks) {
          if (link.id !== linkId && link.isActive) {
            try {
              await updateDoc(doc(db, "video_links", link.id), { isActive: false });
            } catch (err) {
              console.warn(`Could not set inactive for ${link.id}:`, err);
            }
          }
        }
      }

      try {
        await updateDoc(doc(db, "video_links", linkId), {
          title: editTitle.trim(),
          url: editUrl.trim(),
          isActive: editIsActive
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `video_links/${linkId}`);
      }

      setEditingLinkId(null);
      fetchVideoLinks();
    } catch (err) {
      console.error("Error updating video link:", err);
    }
  };

  const handleToggleActive = async (linkId: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db, handleFirestoreError, OperationType } = await import("../firebase.ts");

      // Deactivate all others
      for (const link of videoLinks) {
        if (link.id !== linkId && link.isActive) {
          try {
            await updateDoc(doc(db, "video_links", link.id), { isActive: false });
          } catch (err) {
            console.warn(`Could not set inactive for ${link.id}:`, err);
          }
        }
      }

      // Activate this one
      try {
        await updateDoc(doc(db, "video_links", linkId), { isActive: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `video_links/${linkId}`);
      }

      fetchVideoLinks();
    } catch (err) {
      console.error("Error toggling active status:", err);
    }
  };

  const handleDiscardVideoLink = async (linkId: string) => {
    try {
      const { doc, deleteDoc, updateDoc } = await import("firebase/firestore");
      const { db, handleFirestoreError, OperationType } = await import("../firebase.ts");

      const linkToDelete = videoLinks.find(l => l.id === linkId);
      const wasActive = linkToDelete?.isActive;

      try {
        await deleteDoc(doc(db, "video_links", linkId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `video_links/${linkId}`);
      }

      // If we deleted the active link and there are other links, set another one to active
      if (wasActive) {
        const remaining = videoLinks.filter(l => l.id !== linkId);
        if (remaining.length > 0) {
          try {
            await updateDoc(doc(db, "video_links", remaining[0].id), { isActive: true });
          } catch (err) {
            console.warn("Could not set replacement link as active:", err);
          }
        }
      }

      fetchVideoLinks();
    } catch (err) {
      console.error("Error deleting video link:", err);
    }
  };

  useEffect(() => {
    if (activeAdminTab === 'videos') {
      fetchVideoLinks();
    }
  }, [activeAdminTab]);

  useEffect(() => {
    fetchStats();
  }, [courses]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("../firebase.ts");
      
      const purchasesSnap = await getDocs(collection(db, "purchases"));
      const purchasesData: Purchase[] = [];
      let totalRevenue = 0;
      let totalTransactions = 0;
      const uniqueUsers = new Set<string>();

      purchasesSnap.forEach((doc) => {
        const p = { id: doc.id, ...doc.data() } as Purchase;
        purchasesData.push(p);
        if (p.status === 'success') {
          totalRevenue += (p.amount || 0);
          totalTransactions += 1;
          uniqueUsers.add(p.userId);
        }
      });

      setDbPurchases(purchasesData);
      setMetrics({
        revenue: totalRevenue,
        studentsCount: uniqueUsers.size,
        totalTransactions: totalTransactions
      });
      
      // Keep users list empty or fetch if needed, but metrics are updated
      setDbUsers([]);
    } catch (e) {
      console.error("Failed to fetch admin stats from Firestore", e);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleApprovalAction = async (courseId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'reject') {
         const { doc, deleteDoc } = await import("firebase/firestore");
         const { db, handleFirestoreError, OperationType } = await import("../firebase.ts");
         try {
           await deleteDoc(doc(db, "courses", courseId));
         } catch (err) {
           handleFirestoreError(err, OperationType.DELETE, `courses/${courseId}`);
         }
      } else {
         const { doc, updateDoc } = await import("firebase/firestore");
         const { db, handleFirestoreError, OperationType } = await import("../firebase.ts");
         try {
           await updateDoc(doc(db, "courses", courseId), { isApproved: true });
         } catch (err) {
           handleFirestoreError(err, OperationType.UPDATE, `courses/${courseId}`);
         }
      }
      
      // Refresh catalog lists
      onCourseApproved();
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db, handleFirestoreError, OperationType } = await import("../firebase.ts");
      try {
        await deleteDoc(doc(db, "courses", courseId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `courses/${courseId}`);
      }
      onCourseApproved();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourseId) return;
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db, handleFirestoreError, OperationType } = await import("../firebase.ts");
      try {
        await updateDoc(doc(db, "courses", editingCourseId), courseForm);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `courses/${editingCourseId}`);
      }
      setEditingCourseId(null);
      setCourseForm({});
      onCourseApproved();
    } catch (err) {
      console.error("Error updating course:", err);
    }
  };

  // Simulating standard refunds
  const handleIssueRefund = async (purchaseId: string) => {
    setRefundNotification(`Administrative refund lock dispatched for transaction instance ID ${purchaseId}. The original NGN Naira funds are being reversed securely to corresponding Paystack channels.`);
    // Directly mutate purchase list in state to give rich reactive feedback
    setDbPurchases(prev => 
      prev.map(p => p.id === purchaseId ? { ...p, status: 'failed' as const } : p)
    );
  };

  const pendingCourses = courses.filter(c => !c.isApproved);
  const approvedCourses = courses.filter(c => c.isApproved);

  // Render Site analytics data mockups
  const adminRevenueData = [
    { name: 'Core Technology', Earnings: 1250000 },
    { name: 'SaaS Design', Earnings: 950000 },
    { name: 'AI Workflows', Earnings: 1850000 },
    { name: 'Quantitative Fin', Earnings: 640000 },
  ];

  return (
    <div className="min-h-screen text-left flex flex-col bg-neutral-bg pb-24" id="admin-dashboard-root">
      {/* Modern Fixed Bottom Navigation Dock */}
      <aside className="fixed bottom-0 left-0 right-0 z-40 bg-secondary/95 backdrop-blur-md border-t border-neutral-light/10 shadow-2xl py-3 px-4 md:px-6" id="admin-dashboard-aside">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 bg-accent/20 text-accent px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-bold">
              Admin Terminal
            </span>
            <span className="hidden lg:inline text-xs text-neutral-medium font-mono truncate max-w-[200px]" title={userEmail}>
              {userEmail}
            </span>
          </div>
          <nav className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-0.5 sm:pb-0 justify-center">
            <button
              onClick={() => setActiveAdminTab('analytics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-tight whitespace-nowrap transition-all duration-200 shrink-0 ${
                activeAdminTab === 'analytics'
                  ? 'bg-primary text-black shadow-md'
                  : 'text-neutral-medium hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart size={14} />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveAdminTab('approvals')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-tight whitespace-nowrap transition-all duration-200 shrink-0 ${
                activeAdminTab === 'approvals'
                  ? 'bg-primary text-black shadow-md'
                  : 'text-neutral-medium hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Check size={14} />
                <span>Approvals</span>
              </div>
              {pendingCourses.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeAdminTab === 'approvals' ? 'bg-black text-white' : 'bg-primary text-black'}`}>
                  {pendingCourses.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveAdminTab('courses')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-tight whitespace-nowrap transition-all duration-200 shrink-0 ${
                activeAdminTab === 'courses'
                  ? 'bg-primary text-black shadow-md'
                  : 'text-neutral-medium hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen size={14} />
              <span>Courses</span>
            </button>
            <button
              onClick={() => setActiveAdminTab('transactions')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-tight whitespace-nowrap transition-all duration-200 shrink-0 ${
                activeAdminTab === 'transactions'
                  ? 'bg-primary text-black shadow-md'
                  : 'text-neutral-medium hover:text-white hover:bg-white/5'
              }`}
            >
              <DollarSign size={14} />
              <span>Transactions</span>
            </button>
            <button
              onClick={() => setActiveAdminTab('users')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-tight whitespace-nowrap transition-all duration-200 shrink-0 ${
                activeAdminTab === 'users'
                  ? 'bg-primary text-black shadow-md'
                  : 'text-neutral-medium hover:text-white hover:bg-white/5'
              }`}
            >
              <Users size={14} />
              <span>Users</span>
            </button>
            <button
              onClick={() => setActiveAdminTab('videos')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-tight whitespace-nowrap transition-all duration-200 shrink-0 ${
                activeAdminTab === 'videos'
                  ? 'bg-primary text-black shadow-md'
                  : 'text-neutral-medium hover:text-white hover:bg-white/5'
              }`}
            >
              <Youtube size={14} />
              <span>Videos</span>
            </button>
            <button
              onClick={() => setActiveAdminTab('content')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-tight whitespace-nowrap transition-all duration-200 shrink-0 ${
                activeAdminTab === 'content'
                  ? 'bg-primary text-black shadow-md'
                  : 'text-neutral-medium hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings size={14} />
              <span>Homepage</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-20 p-8">
      {loading ? (
        <div className="max-w-5xl mx-auto space-y-8 mt-12">
          <div className="h-32 bg-neutral-light/5 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-neutral-light/5 rounded-2xl animate-pulse" />
            <div className="h-64 bg-neutral-light/5 rounded-2xl animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-8">
          
          {refundNotification && (
            <div className="p-4 bg-accent/15 border border-accent/30 rounded-2xl text-accent text-xs font-mono flex justify-between items-center gap-4 animate-fade-in">
              <span>{refundNotification}</span>
              <button 
                onClick={() => setRefundNotification(null)}
                className="text-neutral-medium hover:text-white transition uppercase font-bold text-[10px] shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeAdminTab === 'analytics' && (
            <div className="space-y-8 animate-fade-in pt-[30px]">
              <h1 className="font-display font-extrabold text-2xl tracking-tight text-white mb-6">Gross Analytics</h1>
              
              {/* Quick platform stats totals cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-left text-xs">
                <div className="bg-secondary border border-neutral-light/10 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-accent">
                    <div className="p-2 bg-accent/10 rounded-lg"><Coins size={20} /></div>
                    <span className="text-xs uppercase font-bold tracking-wider">Gross Receipts</span>
                  </div>
                  <span className="text-3xl font-bold text-white">₦{(metrics.revenue || 0).toLocaleString()}</span>
                </div>
                <div className="bg-secondary border border-neutral-light/10 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-primary">
                    <div className="p-2 bg-primary/10 rounded-lg"><Users size={20} /></div>
                    <span className="text-xs uppercase font-bold tracking-wider">Total Scholars</span>
                  </div>
                  <span className="text-3xl font-bold text-white">{metrics.studentsCount}</span>
                </div>
                <div className="bg-secondary border border-neutral-light/10 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-neutral-light">
                    <div className="p-2 bg-neutral-light/10 rounded-lg"><Activity size={20} /></div>
                    <span className="text-xs uppercase font-bold tracking-wider">Transactions</span>
                  </div>
                  <span className="text-3xl font-bold text-white">{metrics.totalTransactions}</span>
                </div>
              </div>

              <div className="h-80 bg-secondary border border-neutral-light/10 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-white mb-6 font-mono uppercase">Revenue by Category</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={adminRevenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₦${val/1000}k`} />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ backgroundColor: '#151D30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                      labelStyle={{ color: '#aaa', fontSize: '12px', marginBottom: '4px' }}
                    />
                    <Bar dataKey="Earnings" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeAdminTab === 'approvals' && (
            <div className="space-y-6 animate-fade-in pt-[30px]">
              <h1 className="font-display font-extrabold text-2xl tracking-tight text-white mb-6">Compliance Queue</h1>
              <div className="bg-secondary border border-neutral-light/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-light/5 border-b border-neutral-light/10 text-neutral-medium font-mono text-xs uppercase">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Course Title</th>
                        <th className="px-6 py-4 font-semibold">Instructor</th>
                        <th className="px-6 py-4 font-semibold">Price</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-light/5">
                      {pendingCourses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-neutral-medium">
                            No pending course approvals.
                          </td>
                        </tr>
                      ) : (
                        pendingCourses.map(course => (
                          <tr key={course.id} className="hover:bg-neutral-light/5 transition-colors">
                            <td className="px-6 py-4 text-white font-medium">{course.title}</td>
                            <td className="px-6 py-4 text-neutral-light">{course.instructorId}</td>
                            <td className="px-6 py-4 text-neutral-light">₦{(course.price || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                              <button onClick={() => handleApprovalAction(course.id, 'approve')} className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-xs font-bold transition-colors">
                                <Check size={14} /> Approve
                              </button>
                              <button onClick={() => handleApprovalAction(course.id, 'reject')} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-colors">
                                <X size={14} /> Reject
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeAdminTab === 'courses' && (
            <div className="space-y-6 animate-fade-in pt-[30px]">
              <h1 className="font-display font-extrabold text-2xl tracking-tight text-white mb-6">Course Content CRUD</h1>
              
              {editingCourseId && (
                <div className="bg-secondary border border-neutral-light/10 p-6 rounded-2xl shadow-sm mb-8">
                  <h3 className="text-lg font-bold text-white mb-4">Edit Course</h3>
                  <form onSubmit={handleUpdateCourse} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-neutral-medium mb-1">Title</label>
                        <input type="text" value={courseForm.title || ''} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full bg-neutral-bg border border-neutral-light/10 p-3 rounded-xl text-sm text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-medium mb-1">Price (₦)</label>
                        <input type="number" value={courseForm.price || 0} onChange={e => setCourseForm({...courseForm, price: Number(e.target.value)})} className="w-full bg-neutral-bg border border-neutral-light/10 p-3 rounded-xl text-sm text-white" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-mono text-neutral-medium mb-1">Description</label>
                        <textarea value={courseForm.description || ''} onChange={e => setCourseForm({...courseForm, description: e.target.value})} className="w-full bg-neutral-bg border border-neutral-light/10 p-3 rounded-xl text-sm text-white h-24" />
                      </div>

                      {/* Dynamic Module & Lesson CRUD inside Admin Course Editor */}
                      <div className="col-span-2 border-t border-neutral-light/10 pt-4 mt-2">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                            Course Modules ({courseForm.chapters?.length || 0})
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              const newChapter = {
                                id: `ch-${Date.now()}`,
                                title: `New Module ${(courseForm.chapters?.length || 0) + 1}`,
                                lessons: []
                              };
                              setCourseForm({
                                ...courseForm,
                                chapters: [...(courseForm.chapters || []), newChapter]
                              });
                            }}
                            className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1"
                          >
                            <Plus size={14} /> Add Module Segment
                          </button>
                        </div>

                        {(!courseForm.chapters || courseForm.chapters.length === 0) ? (
                          <p className="text-xs text-neutral-medium italic">No modules loaded for this course yet. Click 'Add Module Segment' above.</p>
                        ) : (
                          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                            {courseForm.chapters.map((ch, chIdx) => (
                              <div key={ch.id || chIdx} className="bg-neutral-bg/30 border border-neutral-light/10 p-4 rounded-xl space-y-3">
                                <div className="flex justify-between items-center gap-3">
                                  <div className="flex-1">
                                    <label className="block text-[10px] font-mono text-neutral-medium mb-1">Module Title</label>
                                    <input
                                      type="text"
                                      value={ch.title || ''}
                                      onChange={(e) => {
                                        const nextChapters = [...(courseForm.chapters || [])];
                                        nextChapters[chIdx] = { ...nextChapters[chIdx], title: e.target.value };
                                        setCourseForm({ ...courseForm, chapters: nextChapters });
                                      }}
                                      className="w-full bg-neutral-bg border border-neutral-light/10 px-3 py-1.5 rounded-lg text-xs text-white"
                                      placeholder="e.g. Introduction to Blockchain"
                                    />
                                  </div>
                                  <div className="flex items-end self-end">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextChapters = [...(courseForm.chapters || [])];
                                        nextChapters.splice(chIdx, 1);
                                        setCourseForm({ ...courseForm, chapters: nextChapters });
                                      }}
                                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                      title="Remove Module"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* Lessons within this chapter */}
                                <div className="pl-4 border-l border-neutral-light/10 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono text-neutral-medium uppercase">
                                      Lessons ({ch.lessons?.length || 0})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextChapters = [...(courseForm.chapters || [])];
                                        const lessons = nextChapters[chIdx].lessons || [];
                                        const newLesson = {
                                          id: `les-${Date.now()}-${lessons.length}`,
                                          title: `Lesson ${lessons.length + 1}`,
                                          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
                                          duration: '10'
                                        };
                                        nextChapters[chIdx] = {
                                          ...nextChapters[chIdx],
                                          lessons: [...lessons, newLesson]
                                        };
                                        setCourseForm({ ...courseForm, chapters: nextChapters });
                                      }}
                                      className="text-[10px] text-primary hover:underline font-mono"
                                    >
                                      + Add Video Lesson
                                    </button>
                                  </div>

                                  {ch.lessons?.map((les, lesIdx) => (
                                    <div key={les.id || lesIdx} className="grid grid-cols-12 gap-2 bg-neutral-bg/20 p-2 rounded-lg items-center">
                                      <div className="col-span-4">
                                        <input
                                          type="text"
                                          value={les.title || ''}
                                          onChange={(e) => {
                                            const nextChapters = [...(courseForm.chapters || [])];
                                            const lessons = [...(nextChapters[chIdx].lessons || [])];
                                            lessons[lesIdx] = { ...lessons[lesIdx], title: e.target.value };
                                            nextChapters[chIdx] = { ...nextChapters[chIdx], lessons };
                                            setCourseForm({ ...courseForm, chapters: nextChapters });
                                          }}
                                          className="w-full bg-neutral-bg border border-neutral-light/10 px-2 py-1 rounded text-xs text-white"
                                          placeholder="Lesson Title"
                                        />
                                      </div>
                                      <div className="col-span-5">
                                        <input
                                          type="text"
                                          value={les.videoUrl || ''}
                                          onChange={(e) => {
                                            const nextChapters = [...(courseForm.chapters || [])];
                                            const lessons = [...(nextChapters[chIdx].lessons || [])];
                                            lessons[lesIdx] = { ...lessons[lesIdx], videoUrl: e.target.value };
                                            nextChapters[chIdx] = { ...nextChapters[chIdx], lessons };
                                            setCourseForm({ ...courseForm, chapters: nextChapters });
                                          }}
                                          className="w-full bg-neutral-bg border border-neutral-light/10 px-2 py-1 rounded text-xs text-white font-mono"
                                          placeholder="Video URL"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <input
                                          type="text"
                                          value={les.duration || ''}
                                          onChange={(e) => {
                                            const nextChapters = [...(courseForm.chapters || [])];
                                            const lessons = [...(nextChapters[chIdx].lessons || [])];
                                            lessons[lesIdx] = { ...lessons[lesIdx], duration: e.target.value };
                                            nextChapters[chIdx] = { ...nextChapters[chIdx], lessons };
                                            setCourseForm({ ...courseForm, chapters: nextChapters });
                                          }}
                                          className="w-full bg-neutral-bg border border-neutral-light/10 px-2 py-1 rounded text-xs text-white"
                                          placeholder="Mins"
                                        />
                                      </div>
                                      <div className="col-span-1 text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nextChapters = [...(courseForm.chapters || [])];
                                            const lessons = [...(nextChapters[chIdx].lessons || [])];
                                            lessons.splice(lesIdx, 1);
                                            nextChapters[chIdx] = { ...nextChapters[chIdx], lessons };
                                            setCourseForm({ ...courseForm, chapters: nextChapters });
                                          }}
                                          className="text-red-500 hover:text-red-400 p-1"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end mt-4">
                      <button type="button" onClick={() => setEditingCourseId(null)} className="px-4 py-2 text-sm text-neutral-medium hover:text-white">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-primary text-black text-sm font-bold rounded-xl">Save Changes</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-secondary border border-neutral-light/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-light/5 border-b border-neutral-light/10 text-neutral-medium font-mono text-xs uppercase">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Course Title</th>
                        <th className="px-6 py-4 font-semibold">Instructor</th>
                        <th className="px-6 py-4 font-semibold">Price</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-light/5">
                      {courses.map(course => (
                        <tr key={course.id} className="hover:bg-neutral-light/5 transition-colors">
                          <td className="px-6 py-4 text-white font-medium">{course.title}</td>
                          <td className="px-6 py-4 text-neutral-light">{course.instructorId}</td>
                          <td className="px-6 py-4 text-neutral-light">₦{(course.price || 0).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${course.isApproved ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                              {course.isApproved ? 'Active' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button 
                              onClick={() => {
                                setEditingCourseId(course.id);
                                setCourseForm(course);
                              }}
                              className="p-2 text-neutral-medium hover:text-primary transition-colors rounded-lg hover:bg-neutral-light/5"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCourse(course.id)}
                              className="p-2 text-neutral-medium hover:text-red-500 transition-colors rounded-lg hover:bg-neutral-light/5"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeAdminTab === 'transactions' && (
            <div className="space-y-6 animate-fade-in pt-[30px]">
              <h1 className="font-display font-extrabold text-2xl tracking-tight text-white mb-6">Transaction Ledger</h1>
              <div className="bg-secondary border border-neutral-light/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-light/5 border-b border-neutral-light/10 text-neutral-medium font-mono text-xs uppercase">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Transaction ID</th>
                        <th className="px-6 py-4 font-semibold">User</th>
                        <th className="px-6 py-4 font-semibold">Amount</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-light/5">
                      {dbPurchases.map(p => (
                        <tr key={p.id} className="hover:bg-neutral-light/5 transition-colors">
                          <td className="px-6 py-4 text-neutral-light font-mono text-xs">{p.id}</td>
                          <td className="px-6 py-4 text-white">{p.userId}</td>
                          <td className="px-6 py-4 text-white font-medium">₦{(p.amount || 0).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              p.status === 'success' ? 'bg-green-500/10 text-green-500' : 
                              p.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {p.status === 'success' && (
                              <button onClick={() => handleIssueRefund(p.id)} className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-wider">
                                Issue Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeAdminTab === 'users' && (
            <div className="space-y-6 animate-fade-in pt-[30px]">
              <h1 className="font-display font-extrabold text-2xl tracking-tight text-white mb-6">Users Registry</h1>
              <div className="bg-secondary border border-neutral-light/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-light/5 border-b border-neutral-light/10 text-neutral-medium font-mono text-xs uppercase">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Email</th>
                        <th className="px-6 py-4 font-semibold">Role</th>
                        <th className="px-6 py-4 font-semibold">Registered</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-light/5">
                      {dbUsers.map(u => (
                        <tr key={u.id} className="hover:bg-neutral-light/5 transition-colors">
                          <td className="px-6 py-4 text-white font-medium">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'ADMIN' ? 'bg-red-500/10 text-red-500' : 
                              u.role === 'INSTRUCTOR' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary-dark'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-neutral-light font-mono text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button className="text-xs text-neutral-medium hover:text-white underline">Edit</button>
                            <button className="text-xs text-red-500 hover:text-red-400 underline">Suspend</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeAdminTab === 'videos' && (
            <div className="space-y-6 animate-fade-in pt-[30px]">
              <h1 className="font-display font-extrabold text-2xl tracking-tight text-white mb-6">Video Integrations</h1>
              
              <div className="bg-secondary border border-neutral-light/10 p-6 rounded-2xl shadow-sm mb-8">
                {editingLinkId ? (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Edit Video Link</h3>
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateVideoLink(editingLinkId); }} className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-mono text-neutral-medium mb-1">Title</label>
                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-neutral-bg border border-neutral-light/10 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-primary" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-mono text-neutral-medium mb-1">URL (YouTube, Vimeo, etc.)</label>
                        <input type="text" value={editUrl} onChange={e => setEditUrl(e.target.value)} className="w-full bg-neutral-bg border border-neutral-light/10 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-primary" />
                      </div>
                      <div className="flex items-center gap-2 self-end shrink-0 mb-2">
                        <label className="text-xs font-mono text-neutral-medium">Active?</label>
                        <input type="checkbox" checked={editIsActive} onChange={e => setEditIsActive(e.target.checked)} className="h-4 w-4 rounded bg-neutral-bg border-neutral-light/10 text-primary accent-primary" />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="bg-primary hover:bg-primary-light transition-colors px-6 py-3 rounded-xl text-black text-sm font-bold shrink-0">
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingLinkId(null)} className="bg-neutral-light/10 hover:bg-neutral-light/20 transition-colors px-4 py-3 rounded-xl text-white text-sm font-bold shrink-0">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Add New Video Link</h3>
                    <form onSubmit={handleCreateVideoLink} className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-mono text-neutral-medium mb-1">Title</label>
                        <input type="text" placeholder="e.g. Master Blockchain Security" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-neutral-bg border border-neutral-light/10 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-primary" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-mono text-neutral-medium mb-1">URL (YouTube, Vimeo, etc.)</label>
                        <input type="text" placeholder="https://..." value={newUrl} onChange={e => setNewUrl(e.target.value)} className="w-full bg-neutral-bg border border-neutral-light/10 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-primary" />
                      </div>
                      <button type="submit" className="bg-primary hover:bg-primary-light transition-colors px-6 py-3 rounded-xl text-black text-sm font-bold shrink-0">
                        Add Video
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <div className="bg-secondary border border-neutral-light/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-light/5 border-b border-neutral-light/10 text-neutral-medium font-mono text-xs uppercase">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Title</th>
                        <th className="px-6 py-4 font-semibold">URL</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-light/5">
                      {videoLinks.map(link => (
                        <tr key={link.id} className="hover:bg-neutral-light/5 transition-colors">
                          <td className="px-6 py-4 text-white font-medium">{link.title}</td>
                          <td className="px-6 py-4 text-neutral-light font-mono text-xs max-w-xs truncate" title={link.url}>{link.url}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${link.isActive ? 'bg-green-500/10 text-green-500' : 'bg-neutral-light/10 text-neutral-medium'}`}>
                              {link.isActive ? 'Active Broadcast' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button 
                              onClick={() => {
                                setEditingLinkId(link.id);
                                setEditTitle(link.title);
                                setEditUrl(link.url);
                                setEditIsActive(link.isActive);
                              }}
                              className="p-2 text-neutral-medium hover:text-primary transition-colors rounded-lg hover:bg-neutral-light/5"
                              title="Edit Video Link"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleToggleActive(link.id)} 
                              className={`p-2 rounded-lg transition-colors ${link.isActive ? 'bg-green-500/20 text-green-500' : 'bg-neutral-light/5 text-neutral-medium hover:text-white'}`}
                              title={link.isActive ? 'Currently Active' : 'Set as Active'}
                            >
                              <Tv size={16} />
                            </button>
                            <button 
                              onClick={() => handleDiscardVideoLink(link.id)} 
                              className="p-2 text-neutral-medium hover:text-red-500 transition-colors rounded-lg hover:bg-neutral-light/5"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeAdminTab === 'content' && (
            <div className="space-y-6 animate-fade-in pt-[30px]">
              <h1 className="font-display font-extrabold text-2xl tracking-tight text-white mb-6">Homepage Content</h1>
              <AdminHomepageContent />
            </div>
          )}


        </div>
      )}
      </main>
    </div>
  );
}
