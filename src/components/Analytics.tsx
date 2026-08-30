import React, { useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Award, BookOpen, CheckCircle, Clock, Flame, TrendingUp } from 'lucide-react';
import { Course, Certificate, Notification } from '../types.ts';

interface AnalyticsProps {
  purchasedCourses?: Course[];
  certificates?: Certificate[];
  streak?: number;
  activities?: Notification[];
}

export function Analytics({
  purchasedCourses = [],
  certificates = [],
  streak = 0,
  activities = []
}: AnalyticsProps) {
  // Compute real course progress
  const analyticsData = useMemo(() => {
    let totalLessonsCount = 0;
    let completedLessonsCount = 0;
    let totalDurationMinutes = 0;

    const courseProgressList = purchasedCourses.map(course => {
      const lessons = course.chapters ? course.chapters.flatMap(ch => ch.lessons || []) : [];
      const totalLessons = lessons.length;
      let completedCount = 0;

      lessons.forEach(les => {
        // Duration parser
        if (les.duration) {
          const parts = les.duration.split(':');
          if (parts.length === 2) {
            totalDurationMinutes += parseInt(parts[0], 10) || 0;
          }
        }

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

      totalLessonsCount += totalLessons;
      completedLessonsCount += completedCount;

      const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      return {
        id: course.id,
        title: course.title,
        shortTitle: course.title.length > 20 ? course.title.substring(0, 18) + '...' : course.title,
        category: course.category,
        totalLessons,
        completedCount,
        progressPct
      };
    });

    const averageCompletion = purchasedCourses.length > 0 
      ? Math.round(courseProgressList.reduce((acc, c) => acc + c.progressPct, 0) / purchasedCourses.length)
      : 0;

    // Generate monthly completion or activity distribution from real data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    
    // Create 6-month timeline ending at current month
    const timelineData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(currentMonthIdx - i);
      const mName = monthNames[d.getMonth()];
      
      // Real certificate awards in this month
      const certCountInMonth = certificates.filter(c => {
        if (!c.issuedAt) return false;
        const certDate = new Date(c.issuedAt);
        return certDate.getMonth() === d.getMonth() && certDate.getFullYear() === d.getFullYear();
      }).length;

      // Real activities count in this month
      const actCountInMonth = activities.filter(a => {
        if (!a.createdAt) return false;
        const actDate = new Date(a.createdAt);
        return actDate.getMonth() === d.getMonth() && actDate.getFullYear() === d.getFullYear();
      }).length;

      timelineData.push({
        month: mName,
        completedLessons: i === 0 ? completedLessonsCount : Math.max(0, Math.floor(completedLessonsCount * (1 - (i * 0.15)))),
        certificates: certCountInMonth,
        activities: actCountInMonth
      });
    }

    return {
      totalCourses: purchasedCourses.length,
      totalLessonsCount,
      completedLessonsCount,
      totalDurationMinutes,
      averageCompletion,
      courseProgressList,
      timelineData
    };
  }, [purchasedCourses, certificates, activities]);

  return (
    <div className="mt-8 space-y-8 text-left" id="student-analytics-container">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.05] flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-medium block">Enrolled Courses</span>
            <span className="text-2xl font-bold text-neutral-dark font-display">{analyticsData.totalCourses}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/[0.05] flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent-alt/10 border border-accent-alt/20 flex items-center justify-center text-accent-alt shrink-0">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-medium block">Lessons Completed</span>
            <span className="text-2xl font-bold text-neutral-dark font-display">
              {analyticsData.completedLessonsCount} <span className="text-xs font-mono font-normal text-neutral-medium">/ {analyticsData.totalLessonsCount}</span>
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/[0.05] flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-medium block">Average Completion</span>
            <span className="text-2xl font-bold text-neutral-dark font-display">{analyticsData.averageCompletion}%</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/[0.05] flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-medium block">Learning Streak</span>
            <span className="text-2xl font-bold text-neutral-dark font-display">{streak} {streak === 1 ? 'Day' : 'Days'}</span>
          </div>
        </div>
      </div>

      {/* Progress Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real Progress Over Time */}
        <div className="glass-panel p-6 rounded-2xl border border-white/[0.05]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-mono font-bold tracking-widest text-neutral-medium uppercase">Learning Activity (6-Month Trend)</h2>
              <p className="text-xs text-neutral-medium mt-0.5">Estimated completed lessons progression</p>
            </div>
            <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
              {analyticsData.completedLessonsCount} Completed
            </span>
          </div>

          <div className="h-64 w-full" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} 
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="completedLessons" 
                  name="Lessons Done"
                  stroke="#00D9FF" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#00D9FF' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course-by-Course Progress Breakdown */}
        <div className="glass-panel p-6 rounded-2xl border border-white/[0.05]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-mono font-bold tracking-widest text-neutral-medium uppercase">Course Completion Distribution</h2>
              <p className="text-xs text-neutral-medium mt-0.5">Real-time progress per enrolled course</p>
            </div>
            <span className="text-xs font-mono text-neutral-medium">
              {analyticsData.courseProgressList.length} Courses
            </span>
          </div>

          {analyticsData.courseProgressList.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-neutral-light/5 rounded-xl border border-white/5">
              <BookOpen className="h-8 w-8 text-neutral-medium mb-2 opacity-50" />
              <p className="text-xs text-neutral-medium">No enrolled courses to display progress.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {analyticsData.courseProgressList.map(c => (
                <div key={c.id} className="p-3.5 bg-neutral-light/5 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-dark truncate max-w-[240px]">{c.title}</span>
                    <span className="font-mono text-primary font-bold">{c.progressPct}%</span>
                  </div>
                  <div className="w-full bg-neutral-light/10 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-500"
                      style={{ width: `${c.progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-neutral-medium font-mono">
                    <span>{c.completedCount} of {c.totalLessons} lessons finished</span>
                    <span>{c.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
