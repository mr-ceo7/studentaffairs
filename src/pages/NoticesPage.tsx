import React, { useState, useEffect } from 'react';
import { Bell, Plus, Pin, AlertTriangle, Calendar, Building2, Trash2 } from 'lucide-react';
import { noticeService, type Notice } from '../services/noticeService';
import { useUser } from '../context/UserContext';
import { toast } from 'sonner';
import PencilLoader from '../components/PencilLoader';

export default function NoticesPage() {
  const { user } = useUser();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showPostModal, setShowPostModal] = useState(false);

  // New Notice State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Missing Marks');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [targetFaculty, setTargetFaculty] = useState('All Faculties');
  const [isPinned, setIsPinned] = useState(false);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const list = await noticeService.getNotices(
        categoryFilter === 'All' ? undefined : categoryFilter
      );
      setNotices(list);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotices();
    }
  }, [categoryFilter, user]);

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required.');
      return;
    }

    try {
      await noticeService.createNotice({
        title: title.trim(),
        category,
        content: content.trim(),
        priority,
        target_faculty: targetFaculty,
        is_pinned: isPinned,
      });
      toast.success('Notice published to the clearinghouse bulletin!');
      setTitle('');
      setContent('');
      setIsPinned(false);
      setShowPostModal(false);
      loadNotices();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to post notice.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await noticeService.deleteNotice(id);
      toast.success('Notice removed.');
      loadNotices();
    } catch (err) {
      toast.error('Failed to delete notice.');
    }
  };

  // Determine if active user is staff/admin
  const isStaff = user?.email.endsWith('@uonbi.ac.ke') || user?.is_admin;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl text-slate-700 dark:text-slate-350 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest block">
            Academic Affairs · Official Gazette
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            Noticeboard &amp; Examination Bulletins
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-none">
            Official announcements regarding missing marks deadlines, graduation clearance, and supplementary timetables.
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => setShowPostModal(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <Plus size={14} /> Post Announcement
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 font-semibold scrollbar-hide">
        {['All', 'Missing Marks', 'Graduation', 'Exam', 'Dean of Students', 'General'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === cat
                ? 'bg-blue-700 dark:bg-blue-600 text-white font-bold shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-850'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {loading ? (
          <PencilLoader message="Fetching official Senate announcements..." size="sm" />
        ) : notices.length > 0 ? (
          notices.map((notice) => {
            return (
              <div
                key={notice.id}
                className={`clay-card p-5 space-y-3 border relative transition-colors ${
                  notice.is_pinned
                    ? 'border-amber-300/40 bg-amber-500/5 dark:bg-amber-950/5'
                    : 'border-slate-200/60 dark:border-slate-850/60'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {notice.is_pinned && (
                      <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 border border-amber-500/20">
                        <Pin size={11} /> PINNED
                      </span>
                    )}
                    <span className="bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md font-bold text-[10px] border border-blue-500/20">
                      {notice.category}
                    </span>
                    {notice.priority === 'urgent' && (
                      <span className="bg-red-500/10 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 border border-red-500/20">
                        <AlertTriangle size={11} /> URGENT
                      </span>
                    )}
                    {notice.priority === 'high' && (
                      <span className="bg-orange-500/10 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-md font-bold text-[10px] border border-orange-500/20">
                        HIGH
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-[10px] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {notice.created_at ? new Date(notice.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                    {isStaff && (
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                        title="Delete Notice"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {notice.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                  {notice.content}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-850 text-[10px] text-blue-700 dark:text-blue-400 font-semibold flex items-center justify-between">
                  <span>Issued By: {notice.posted_by}</span>
                  <span className="text-slate-400 dark:text-slate-500 font-normal">Target: {notice.target_faculty}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="clay-card p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            No bulletins found for this category.
          </div>
        )}
      </div>

      {/* Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                Post Academic Bulletin
              </h3>
              <button 
                onClick={() => setShowPostModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-bold px-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePostNotice} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Notice Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notice headline..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="Missing Marks">Missing Marks</option>
                    <option value="Graduation">Graduation</option>
                    <option value="Exam">Exam Timetable</option>
                    <option value="Dean of Students">Dean of Students</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Alert</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Target Faculty</label>
                <select
                  value={targetFaculty}
                  onChange={(e) => setTargetFaculty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-200 text-xs focus:outline-none"
                >
                  <option value="All Faculties">All Faculties</option>
                  <option value="Faculty of Science & Technology">Faculty of Science & Technology</option>
                  <option value="Faculty of Health Sciences">Faculty of Health Sciences</option>
                  <option value="Faculty of Engineering">Faculty of Engineering</option>
                  <option value="Faculty of Business & Management Sciences">Faculty of Business & Management Sciences</option>
                  <option value="Faculty of Arts & Social Sciences">Faculty of Arts & Social Sciences</option>
                  <option value="Faculty of Law">Faculty of Law</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Bulletin Content</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Full bulletin body..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-400"
                />
              </div>

              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-350 font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-500 cursor-pointer w-4 h-4"
                />
                Pin to top of notice board
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm"
                >
                  Publish Notice
                </button>
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-850 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
