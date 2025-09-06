import { useState, useEffect, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  formatDistanceToNow,
} from 'date-fns';
import {
  getReviewerStats,
  getActivities,
  getUpcomingDeadlines,
  getAssignedReviews,
} from '../../services/reviewer';
import useAuth from '../../hooks/useAuth.ts';
import { supabase } from '@/lib/supabase';

export default function ReviewerDashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [reviewerStats, setReviewerStats] = useState<{ label: string; value: number }[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, loading: authLoading } = useAuth();

  

  useEffect(() => {
    let mounted = true;
    if (authLoading) return; 
    setLoading(true);

   
  const assignedPromise = user ? getAssignedReviews(user.id) : Promise.resolve([]);

    Promise.all([
      getReviewerStats(),
      getActivities(),
      getUpcomingDeadlines(),
      assignedPromise,
    ])
      .then(async ([stats, activities, deadlines, assigned]) => {
        if (!mounted) return;

        setReviewerStats(Array.isArray(stats) ? stats : []);
        setUpcomingDeadlines(Array.isArray(deadlines) ? deadlines : []);

       
        const assignedActivities = (Array.isArray(assigned) ? assigned : []).map((r: any, i: number) => ({
          id: `assign-${r?.id ?? i}`,
          type: 'assignment',
          title: `New Proposal Assigned: ${r?.proposal?.title || 'Untitled Proposal'}`,
          date: r?.date_assigned || r?.created_at || new Date().toISOString(),
        }));

       
        const baseActivities = Array.isArray(activities) ? activities : [];

        
        const { data: annData } = await supabase
          .from('announcements')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(6);
        const annActivities = (annData || []).map((a: any, i: number) => ({
          id: `anno-${a.id ?? i}`,
          type: 'announcement',
          title: `Announcement: ${a.title}`,
          date: a.created_at,
        }));

        const merged = [...assignedActivities, ...annActivities, ...baseActivities].sort((a: any, b: any) => {
          const da = new Date(a?.date || 0).getTime();
          const db = new Date(b?.date || 0).getTime();
          return db - da;
        });

  setRecentActivities(merged);
      })
      .catch((err) => {
        console.error('ReviewerDashboard load error:', err);
        if (!mounted) return;
        setReviewerStats([]);
        setRecentActivities([]);
        setUpcomingDeadlines([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  const deadlineDates = (upcomingDeadlines || [])
    .map((d: any) => {
      const due = d.due || d.dueDate || d.date;
      if (!due) return null;
      const parsed = Date.parse(due);
      if (!isNaN(parsed)) return new Date(parsed);
      const parts = String(due).replace(/,/g, '').split(' ');
      if (parts.length >= 3) return new Date(`${parts[0]} ${parts[1]}, ${parts[2]}`);
      return null;
    })
    .filter(Boolean) as Date[];

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-2">
      <button
        type="button"
        className="px-2 py-1 rounded hover:bg-blue-100"
        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
      >
        &lt;
      </button>
      <div className="text-center text-gray-700 font-medium">
        {format(currentMonth, 'MMMM yyyy')}
      </div>
      <button
        type="button"
        className="px-2 py-1 rounded hover:bg-blue-100"
        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
      >
        &gt;
      </button>
    </div>
  );

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(startOfMonth(currentMonth));
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-gray-500 text-sm font-medium">
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 gap-1">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const rows = [];
    let days: any[] = [];
    let day = startDate;
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const isDeadline = deadlineDates.some(
          (d) => isSameDay(d, day) && isSameMonth(d, currentMonth)
        );
        days.push(
          <div
            key={day.toString()}
            className={`py-1 rounded-lg cursor-pointer text-center text-sm ${
              isSameMonth(day, monthStart) ? '' : 'text-gray-300'
            } ${
              isSameDay(day, selectedDate)
                ? 'bg-blue-600 text-white font-bold'
                : isDeadline
                ? 'bg-blue-100 text-red-700 font-bold'
                : 'hover:bg-blue-50'
            }`}
            onClick={() => setSelectedDate(day)}
          >
            {format(day, 'd')}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  // Derive display name (full_name > name > email local part)
  const displayName = useMemo(() => {
    const meta: any = (user as any)?.user_metadata || {};
    const base = meta.full_name || meta.name || user?.email?.split('@')[0] || 'Reviewer';
    const cleaned = base.replace(/[._-]+/g, ' ').trim();
    return cleaned.replace(/\b\w+/g, (w: string) => w.charAt(0).toUpperCase() + w.slice(1));
  }, [user]);

  const relativeTime = (date: any) => {
    if (!date) return '';
    try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return ''; }
  };

  if (loading) return <div className="max-w-5xl mx-auto py-12 px-4 text-center text-gray-500 text-sm">Loading dashboard...</div>;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-lg font-medium ring-1 ring-blue-100">R</span>
              {displayName}
            </h1>
            <p className="text-sm text-gray-600 max-w-xl">Key review metrics, assignments, announcements & deadlines overview.</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            {(reviewerStats || []).map((stat: any, i: number) => (
              <div
                key={stat.label}
                className="relative group min-w-[150px] rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500/70 via-sky-500/60 to-blue-600/70 rounded-t-xl" />
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">{stat.label}</div>
                  <span className="text-gray-300 group-hover:text-blue-400 transition text-xs">#{i + 1}</span>
                </div>
                <div className="text-xl font-semibold text-gray-900 mt-1 tabular-nums">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 h-1 w-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-300 rounded-full opacity-70" />
      </header>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Recent Activities */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Recent Activities
            </h2>
            <span className="text-[11px] font-medium text-gray-500">Auto feed</span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {(recentActivities || []).map((activity: any, idx: number) => {
              const id = activity.id || String(idx);
              const isRemoving = removingIds.includes(id);
              return (
                <div
                  key={id}
                  className={`flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm transition-all duration-300 hover:border-blue-200/70 hover:bg-blue-50/40 ${isRemoving ? 'opacity-0 translate-x-6' : 'opacity-100 translate-x-0'}`}
                >
                  <span className={`flex-none w-7 h-7 rounded-md flex items-center justify-center text-sm shadow-sm ring-1 ring-inset ${activity.type === 'assignment' ? 'bg-blue-100 text-blue-600 ring-blue-200' : activity.type === 'announcement' ? 'bg-amber-100 text-amber-600 ring-amber-200' : 'bg-emerald-100 text-emerald-600 ring-emerald-200'}`}>
                    {activity.type === 'assignment' ? '📄' : activity.type === 'announcement' ? '📣' : '✔️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm leading-snug truncate">{activity.title}</div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>{relativeTime(activity.date)}</span>
                      <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
                      <span>{new Date(activity.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <button
                    aria-label="Remove"
                    className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                    onClick={() => {
                      setRemovingIds(prev => [...prev, id]);
                      setTimeout(() => {
                        setRecentActivities(prev => prev.filter((it: any) => (it.id || '') !== id));
                        setRemovingIds(prev => prev.filter(i => i !== id));
                      }, 300);
                    }}
                  >
                    &times;
                  </button>
                </div>
              );
            })}
            {(!recentActivities || recentActivities.length === 0) && (
              <div className="text-sm text-gray-500">No recent activities.</div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Upcoming Deadlines
            </h2>
            <span className="text-[11px] font-medium text-gray-500">Calendar view</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-500 mb-4">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-md bg-blue-600 inline-block" /> Selected</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-md bg-blue-100 inline-block border border-blue-200" /> Deadline</div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {(upcomingDeadlines || []).map((deadline: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm hover:border-blue-200/70 hover:bg-blue-50/40 transition">
                <span className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-sm ring-1 ring-blue-100">📅</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm leading-snug truncate">{deadline.title}</div>
                  <div className="text-[11px] text-gray-500">Due: {deadline.due || deadline.dueDate || deadline.date}</div>
                </div>
              </div>
            ))}
            {(!upcomingDeadlines || upcomingDeadlines.length === 0) && (
              <div className="text-sm text-gray-500">No upcoming deadlines.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
