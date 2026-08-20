import React, { useState, useEffect, useRef } from 'react';
import { Bell, Plus, Pin, AlertTriangle, Calendar, Building2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { noticeService, type Notice } from '../services/noticeService';
import { ticketService } from '../services/ticketService';
import { useUser } from '../context/UserContext';
import { toast } from 'sonner';
import PencilLoader from '../components/PencilLoader';

const HERO_SLIDES = [
  {
    image: '/graduation_deadline.jpg',
    category: 'Graduation Clearance',
    title: 'Senate Clearance Timeline',
    subtitle: 'Ensure all missing marks claims are submitted and resolved before Senate approval panels assemble.',
  },
  {
    image: '/exam_timetable.jpg',
    category: 'Examinations',
    title: 'Supplementary Exams Timeline',
    subtitle: 'Check timetables and room assignments for supplementary and special examinations commencing soon.',
  },
  {
    image: '/marks_guidelines.jpg',
    category: 'Missing Marks',
    title: 'Legible Proof Requirements',
    subtitle: 'Remember to attach signed CAT dockets or attendance sheets to prevent automatic claim rejection.',
  }
];

export default function NoticesPage() {
  const { user } = useUser();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showPostModal, setShowPostModal] = useState(false);
  const [likedNotices, setLikedNotices] = useState<number[]>([]);

  // New Notice State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Missing Marks');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [targetFaculty, setTargetFaculty] = useState('All Faculties');
  const [isPinned, setIsPinned] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [heroSlide, setHeroSlide] = useState(0);

  // Sync likes from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('likedNoticeIds');
      if (saved) setLikedNotices(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleLikeNotice = (id: number) => {
    setLikedNotices((prev) => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('likedNoticeIds', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Hero carousel auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

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
    loadNotices();
  }, [categoryFilter, user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const filesData = await ticketService.uploadFiles(files);
      if (filesData.length > 0) {
        setImageUrl(filesData[0].url);
        toast.success('Notice cover image uploaded successfully!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

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
        image_url: imageUrl || undefined,
      });
      toast.success('Notice published to the clearinghouse bulletin!');
      setTitle('');
      setContent('');
      setIsPinned(false);
      setImageUrl('');
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
      
      {/* Hero Carousel */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-950 shadow-sm shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={heroSlide}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full flex flex-col justify-end p-6 md:p-8 bg-cover bg-center select-none"
            style={{ backgroundImage: `linear-gradient(to top, rgba(2, 6, 23, 0.95) 20%, rgba(2, 6, 23, 0.6) 60%, rgba(2, 6, 23, 0.1) 100%), url(${HERO_SLIDES[heroSlide].image})` }}
          >
            <div className="max-w-2xl space-y-2 text-left">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
                {HERO_SLIDES[heroSlide].category}
              </span>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white leading-tight font-display">
                {HERO_SLIDES[heroSlide].title}
              </h1>
              <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed max-w-xl">
                {HERO_SLIDES[heroSlide].subtitle}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Indicators */}
        <div className="absolute bottom-6 right-6 flex gap-1.5 z-10">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setHeroSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                heroSlide === idx ? 'w-6 bg-blue-500' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Category Tabs & Staff Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex gap-2 overflow-x-auto pb-1 font-semibold scrollbar-hide flex-1">
          {['All', 'Missing Marks', 'Graduation', 'Exam', 'Dean of Students', 'General'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-blue-700 dark:bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {isStaff && (
          <button
            onClick={() => setShowPostModal(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0 whitespace-nowrap self-start sm:self-center"
          >
            <Plus size={14} /> Post Announcement
          </button>
        )}
      </div>

      {/* Notices List (Instagram Feed Layout) */}
      <div className="space-y-6">
        {loading ? (
          <PencilLoader message="Fetching official Senate announcements..." size="sm" />
        ) : notices.length > 0 ? (
          notices.map((notice) => {
            // Pick a default cover image depending on category if none is set
            const fallbackImage = 
              notice.category === 'Graduation' ? '/graduation_deadline.jpg' :
              notice.category === 'Exam' ? '/exam_timetable.jpg' :
              '/marks_guidelines.jpg';
            const postImage = notice.image_url || fallbackImage;

            return (
              <div
                key={notice.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 max-w-xl mx-auto"
              >
                {/* 1. IG Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 text-blue-750 dark:text-blue-400 font-bold text-xs shrink-0 shadow-sm">
                      {notice.posted_by.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-100 block leading-tight truncate">
                        {notice.posted_by}
                      </span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-500 block">
                        Target: {notice.target_faculty}
                      </span>
                    </div>
                  </div>

                  {/* Pin & Actions */}
                  <div className="flex items-center gap-2">
                    {notice.is_pinned && (
                      <span className="text-amber-500 hover:scale-110 transition-transform" title="Pinned Announcement">
                        <Pin size={14} className="fill-current" />
                      </span>
                    )}
                    {isStaff && (
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
                        title="Delete Notice"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. IG Post Main Media Image */}
                <div className="relative w-full aspect-video sm:aspect-[16/10] overflow-hidden bg-slate-950 border-y border-slate-100 dark:border-slate-850/40">
                  <img
                    src={postImage}
                    alt={notice.title}
                    className="w-full h-full object-cover select-none"
                    loading="lazy"
                  />
                  {/* Category overlay */}
                  <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white px-2.5 py-1 rounded-xl font-bold text-[9px] uppercase tracking-wider border border-white/10 shadow-sm">
                    {notice.category}
                  </span>
                  
                  {/* Priority Overlay */}
                  {notice.priority === 'urgent' && (
                    <span className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-xl font-bold text-[9px] uppercase tracking-wider border border-white/10 flex items-center gap-1 shadow-sm">
                      <AlertTriangle size={10} /> Urgent
                    </span>
                  )}
                </div>

                {/* 3. IG Action Bar */}
                <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-slate-650 dark:text-slate-350">
                    <button 
                      onClick={() => handleLikeNotice(notice.id)}
                      className={`transition-transform duration-200 active:scale-125 cursor-pointer ${
                        likedNotices.includes(notice.id) ? 'text-red-500' : 'hover:text-red-500'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill={likedNotices.includes(notice.id) ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg>
                    </button>
                    <button className="hover:text-blue-500 transition-colors cursor-pointer" title="Share Alert">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                      </svg>
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {notice.created_at ? new Date(notice.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
                  </span>
                </div>

                {/* 4. IG Caption Section */}
                <div className="px-4 pb-4 space-y-1 text-left">
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                    <span className="font-extrabold mr-2 text-slate-900 dark:text-slate-550">
                      {notice.posted_by}
                    </span>
                    <span className="font-bold text-slate-850 dark:text-slate-100">
                      {notice.title}
                    </span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-normal whitespace-pre-line">
                    {notice.content}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-250/20 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500 text-xs rounded-3xl max-w-xl mx-auto">
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

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Cover Image (Optional)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3.5 py-2 bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-all border border-slate-200 dark:border-slate-800"
                  >
                    {isUploading ? 'Uploading image...' : imageUrl ? 'Change Image' : 'Select Image'}
                  </button>
                  {imageUrl && (
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold truncate max-w-[200px]">
                      ✓ {imageUrl.split('/').pop()}
                    </span>
                  )}
                </div>
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
