import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Filter, 
  ArrowRight,
  Calendar,
  Download,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  AlertCircle,
  Inbox,
  Code,
  UserCheck,
  Check,
  Building2,
  GraduationCap,
  Paperclip,
  Search,
  X,
  Eye,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ticketService, type TicketData, type CommentData } from '../services/ticketService';
import { supportService, type SupportMessage } from '../services/supportService';
import { toast } from 'sonner';
import PencilLoader from './PencilLoader';

interface AdminPortalProps {
  user: any;
  onTicketClick: (ticketId: string) => void;
  key?: string;
}

const CAMPUSES = [
  'Main Campus',
  'Chiromo Campus',
  'Upper Kabete Campus',
  'Lower Kabete Campus',
  'Parklands Campus',
  'Kenya Science Campus'
];

const FACULTIES = [
  "Faculty of Science & Technology",
  "Faculty of Health Sciences",
  "Faculty of Engineering",
  "Faculty of Business & Management Sciences",
  "Faculty of Arts & Social Sciences",
  "Faculty of Law",
  "Faculty of Education",
  "Faculty of Built Environment & Design",
  "Faculty of Agriculture",
  "Faculty of Veterinary Medicine"
];

const STATUS_CLASS: Record<string, string> = {
  "Submitted to Department/Lecturer": "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50",
  "Under Departmental Processing": "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50",
  "Awaiting Student Response": "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/50",
  "Rejected — Insufficient Proof": "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/55 dark:border-red-900/50",
  "Cleared for SMS Update": "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-900/50",
  "Verified on SMS": "bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-700 dark:border-emerald-800"
};

export default function AdminPortalView({ user, onTicketClick }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'clearance' | 'support_inbox'>('clearance');

  // Clearance Tickets
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  
  // Clearance Filters
  const [clearanceSearch, setClearanceSearch] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Support Inbox
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(false);
  
  // Support Inbox Filters & Search
  const [supportSearch, setSupportSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState('all');
  const [campusFilter, setCampusFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  // Quick Review Drawer States
  const [reviewTicketId, setReviewTicketId] = useState<string | null>(null);
  const [reviewTicket, setReviewTicket] = useState<TicketData | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [verifiedScoreInput, setVerifiedScoreInput] = useState('');
  const [selectedStatusInput, setSelectedStatusInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Lightbox State
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
    loadSupportMessages();
  }, []);

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const data = await ticketService.listTickets();
      setTickets(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load clearance queue');
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadSupportMessages = async () => {
    setLoadingSupport(true);
    try {
      const data = await supportService.getInboxMessages(
        targetFilter === 'all' ? undefined : targetFilter
      );
      setSupportMessages(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load support inbox');
    } finally {
      setLoadingSupport(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'support_inbox') {
      loadSupportMessages();
    }
  }, [targetFilter, activeTab]);

  // Fetch full details of ticket for quick drawer review
  useEffect(() => {
    if (reviewTicketId) {
      fetchReviewTicketDetails(reviewTicketId);
    } else {
      setReviewTicket(null);
    }
  }, [reviewTicketId]);

  const fetchReviewTicketDetails = async (ticketId: string) => {
    setLoadingReview(true);
    try {
      const detail = await ticketService.getTicket(ticketId);
      setReviewTicket(detail);
      setVerifiedScoreInput(detail.verified_score !== undefined && detail.verified_score !== null ? String(detail.verified_score) : '');
      setSelectedStatusInput(detail.status);
    } catch (err) {
      toast.error('Failed to load claim details');
      setReviewTicketId(null);
    } finally {
      setLoadingReview(false);
    }
  };

  const handleUpdateStatusAndScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTicket) return;

    if (!selectedStatusInput) {
      toast.error('Please select a target status');
      return;
    }

    const numericScore = verifiedScoreInput.trim() !== '' ? Number(verifiedScoreInput) : undefined;
    if (numericScore !== undefined && (isNaN(numericScore) || numericScore < 0 || numericScore > 100)) {
      toast.error('Please enter a valid verified score (0-100)');
      return;
    }

    setSubmittingReview(true);
    try {
      await ticketService.updateTicketStatus(
        reviewTicket.ticket_id,
        selectedStatusInput,
        numericScore,
        newComment.trim() !== '' ? newComment.trim() : undefined
      );

      toast.success('Grievance ticket updated successfully!');
      setNewComment('');
      
      // Reload main table & update local drawer content
      await loadTickets();
      await fetchReviewTicketDetails(reviewTicket.ticket_id);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update claim');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddDrawerComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTicket || !newComment.trim()) return;

    try {
      await ticketService.addComment(reviewTicket.ticket_id, newComment.trim());
      setNewComment('');
      toast.success('Comment added');
      // Reload drawer details to show the new comment
      fetchReviewTicketDetails(reviewTicket.ticket_id);
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleResolveSupportMessage = async (id: number) => {
    try {
      await supportService.updateMessageStatus(id, 'resolved');
      toast.success('Support message marked as resolved.');
      loadSupportMessages();
    } catch (err) {
      toast.error('Failed to resolve support ticket.');
    }
  };

  // Stats
  const total = tickets.length;
  const openCount = tickets.filter(t => !['Verified on SMS', 'Rejected — Insufficient Proof'].includes(t.status)).length;
  const clearedCount = tickets.filter(t => t.status === 'Cleared for SMS Update' || t.status === 'Verified on SMS').length;
  const rejectedCount = tickets.filter(t => t.status === 'Rejected — Insufficient Proof').length;

  // Status counts for graph
  const statusCounts = Object.keys(STATUS_CLASS).map(statusName => {
    const count = tickets.filter(t => t.status === statusName).length;
    return { name: statusName, count };
  });
  const maxCount = Math.max(...statusCounts.map(s => s.count), 1);

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.ticket_id.toLowerCase().includes(clearanceSearch.toLowerCase()) ||
      t.reg_number.toLowerCase().includes(clearanceSearch.toLowerCase()) ||
      t.unit_code.toLowerCase().includes(clearanceSearch.toLowerCase()) ||
      (t.student_name && t.student_name.toLowerCase().includes(clearanceSearch.toLowerCase()));

    const matchesFaculty = !selectedFaculty || t.faculty === selectedFaculty;
    const matchesStatus = !selectedStatus || t.status === selectedStatus;

    return matchesSearch && matchesFaculty && matchesStatus;
  });

  // Filtered Support Messages
  const filteredSupportMessages = supportMessages.filter(m => {
    const matchesSearch = 
      !supportSearch ||
      m.sender_name.toLowerCase().includes(supportSearch.toLowerCase()) ||
      m.user_email.toLowerCase().includes(supportSearch.toLowerCase()) ||
      (m.reg_number && m.reg_number.toLowerCase().includes(supportSearch.toLowerCase())) ||
      (m.subject && m.subject.toLowerCase().includes(supportSearch.toLowerCase())) ||
      m.message.toLowerCase().includes(supportSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (campusFilter && m.campus !== campusFilter) return false;
    if (facultyFilter && m.faculty !== facultyFilter) return false;
    if (yearFilter && m.year_of_study !== yearFilter) return false;
    return true;
  });

  // CSV Export
  const exportCSV = () => {
    if (tickets.length === 0) {
      toast.error('No tickets available to export.');
      return;
    }
    const header = ['Ticket ID', 'Reg No.', 'Faculty', 'Department', 'Unit Code', 'Category', 'Claimed', 'Verified', 'Status', 'Updated'];
    const rows = tickets.map(t => [
      t.ticket_id,
      t.reg_number,
      t.faculty,
      t.department,
      t.unit_code,
      t.assessment_category,
      t.claimed_score,
      t.verified_score ?? '',
      t.status,
      new Date(t.updated_at).toLocaleDateString()
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'UoN_Clearinghouse_Master_Clearance_Export.csv';
    a.click();
    toast.success('Clearance CSV export downloaded successfully!');
  };

  return (
    <div className="space-y-6 pt-2 text-slate-700 dark:text-slate-300 relative overflow-x-hidden">
      
      {/* Top Header & Tab Selector */}
      <div className="reveal active flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest block">
            Registrar &amp; Leadership Portal
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            Clearance &amp; Support Master Board
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-none">
            Manage academic grievances, view clearance analytics, and respond to developer &amp; ONUSS support messages.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('clearance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'clearance'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700'
            }`}
          >
            Clearance Registry
          </button>
          <button 
            onClick={() => setActiveTab('support_inbox')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'support_inbox'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700'
            }`}
          >
            <Inbox size={14} />
            Support Inbox ({supportMessages.filter(m => m.status === 'open').length})
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'clearance' ? (
          <motion.div
            key="clearance-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="clay-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Database size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Total Claims</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{total}</span>
                </div>
              </div>

              <div className="clay-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Open Queue</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{openCount}</span>
                </div>
              </div>

              <div className="clay-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Cleared for SMS</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{clearedCount}</span>
                </div>
              </div>

              <div className="clay-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <XCircle size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Rejected Claims</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{rejectedCount}</span>
                </div>
              </div>
            </div>

            {/* Analytics Graph Bars */}
            <div className="clay-card p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tickets by Workflow Status</h3>
              <div className="space-y-3">
                {statusCounts.map(statusObj => {
                  const pct = Math.round((statusObj.count / maxCount) * 100);
                  return (
                    <div key={statusObj.name} className="flex items-center gap-4 text-xs font-semibold">
                      <div className="w-48 text-slate-650 dark:text-slate-400 truncate text-[11px]">{statusObj.name}</div>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="bg-amber-600 dark:bg-amber-500 h-full rounded-full" 
                        />
                      </div>
                      <div className="w-8 text-right font-bold text-slate-800 dark:text-slate-200">{statusObj.count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clearance Master List */}
            <div className="clay-card p-6 space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-755 dark:text-blue-400" />
                  Clearance Registrar Registry
                </h2>
                
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {/* Registry Search */}
                  <div className="relative flex-1 md:flex-initial md:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-550" size={13} />
                    <input
                      type="text"
                      placeholder="Search Student, Reg, Unit..."
                      value={clearanceSearch}
                      onChange={(e) => setClearanceSearch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-850 focus:border-blue-500 focus:outline-none rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 transition-all"
                    />
                    {clearanceSearch && (
                      <button onClick={() => setClearanceSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800">
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={exportCSV}
                    className="px-3 py-1.5 bg-amber-605 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-sm"
                  >
                    <Download size={13} /> Export CSV
                  </button>
                  
                  {/* Faculty Filter */}
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <Filter size={12} className="text-slate-400" />
                    <select
                      value={selectedFaculty}
                      onChange={(e) => setSelectedFaculty(e.target.value)}
                      className="bg-transparent text-xs text-slate-700 dark:text-slate-350 font-semibold focus:outline-none cursor-pointer max-w-[120px]"
                    >
                      <option value="" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">All Faculties</option>
                      {FACULTIES.map(f => (
                        <option key={f} value={f} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">{f.replace('Faculty of ', '')}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <Filter size={12} className="text-slate-400" />
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="bg-transparent text-xs text-slate-700 dark:text-slate-350 font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">All Statuses</option>
                      {Object.keys(STATUS_CLASS).map(st => (
                        <option key={st} value={st} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">{st}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {loadingTickets ? (
                <PencilLoader message="Fetching university clearance claims..." size="sm" />
              ) : filteredTickets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-550 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Ticket</th>
                        <th className="py-3 px-4">Student Reg</th>
                        <th className="py-3 px-4">Faculty</th>
                        <th className="py-3 px-4">Unit</th>
                        <th className="py-3 px-4 text-center">Claimed</th>
                        <th className="py-3 px-4 text-center">Verified</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Updated</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {filteredTickets.map(t => (
                        <tr key={t.ticket_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/15 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-850 dark:text-slate-200">{t.ticket_id}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-350">{t.reg_number}</td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 truncate max-w-[120px]" title={t.faculty}>{t.faculty.replace('Faculty of ', '')}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{t.unit_code.split(' — ')[0]}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate max-w-[150px]">{t.unit_code.split(' — ')[1]}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-150">{t.claimed_score}</td>
                          <td className="py-3.5 px-4 text-center font-black text-blue-700 dark:text-blue-450">{t.verified_score !== null && t.verified_score !== undefined ? t.verified_score : '—'}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border uppercase tracking-wide inline-block ${STATUS_CLASS[t.status]}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} />
                              {new Date(t.updated_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setReviewTicketId(t.ticket_id)}
                                className="px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                title="Quick Inspect Drawer"
                              >
                                <Eye size={11} />
                                Quick Review
                              </button>
                              <button
                                onClick={() => onTicketClick(t.ticket_id)}
                                className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-305 rounded-lg transition-all cursor-pointer"
                                title="Open Inspection Board"
                              >
                                <ArrowRight size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <AlertCircle className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <h3 className="font-bold text-slate-700 dark:text-slate-350 text-sm">No Claims Found</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">There are no marks claims submitted under the selected filters.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="support-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="clay-card p-6 space-y-4"
          >
            {/* Support Inbox view controls */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5 flex flex-col gap-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    In-App Support &amp; Academic Advocacy Inbox
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Incoming developer bug reports and ONUSS student leaders academic advocacy requests with complete student academic profile metadata.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  {/* Support Search */}
                  <div className="relative flex-1 md:flex-initial md:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-550" size={12} />
                    <input
                      type="text"
                      placeholder="Search sender, message..."
                      value={supportSearch}
                      onChange={(e) => setSupportSearch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-850 focus:border-blue-500 focus:outline-none rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-205 transition-all"
                    />
                    {supportSearch && (
                      <button onClick={() => setSupportSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800">
                        <X size={11} />
                      </button>
                    )}
                  </div>

                  <select
                    value={targetFilter}
                    onChange={(e) => setTargetFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-350 focus:outline-none cursor-pointer shrink-0"
                  >
                    <option value="all">All Target Channels</option>
                    <option value="developer">Developer Bugs Only</option>
                    <option value="student_leader">Student Leaders (ONUSS) Only</option>
                  </select>
                </div>
              </div>

              {/* Academic Filtering Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="">All Campuses</option>
                  {CAMPUSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer truncate"
                >
                  <option value="">All Faculties</option>
                  {FACULTIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>

                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="">All Years of Study</option>
                  <option value="Year 1">Year 1</option>
                  <option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option>
                  <option value="Year 4">Year 4</option>
                  <option value="Year 5">Year 5</option>
                </select>
              </div>
            </div>

            {/* Support Message Lists */}
            {loadingSupport ? (
              <PencilLoader message="Fetching support inbox records..." size="sm" />
            ) : filteredSupportMessages.length > 0 ? (
              <div className="space-y-4">
                {filteredSupportMessages.map(msg => (
                  <motion.div 
                    key={msg.id} 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4.5 rounded-2xl border transition-colors space-y-3 ${
                      msg.target_recipient === 'developer'
                        ? 'bg-blue-500/5 border-blue-200/50 dark:border-blue-900/40'
                        : 'bg-emerald-500/5 border-emerald-200/50 dark:border-emerald-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {msg.target_recipient === 'developer' ? (
                          <span className="bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 border border-blue-500/20">
                            <Code size={11} /> DEVELOPER BUG
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 border border-emerald-500/20">
                            <UserCheck size={11} /> ONUSS STUDENT REPS
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {msg.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase ${
                          msg.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {msg.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-805 dark:text-slate-100">
                        {msg.subject || 'Support Ticket'}
                      </h3>
                      <p className="text-xs text-slate-650 dark:text-slate-300 mt-1 leading-relaxed">
                        {msg.message}
                      </p>
                    </div>

                    {/* Attached File/Image Preview */}
                    {msg.attachment_url && (
                      <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Paperclip size={11} className="text-blue-500" />
                          Attached Evidence / Screenshot
                        </div>
                        {msg.attachment_url.startsWith('data:image/') ? (
                          <div className="space-y-1">
                            <img 
                              src={msg.attachment_url} 
                              alt={msg.attachment_name || 'Attached proof'} 
                              onClick={() => setLightboxUrl(msg.attachment_url || null)}
                              className="max-h-48 rounded-lg object-contain border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/25 cursor-zoom-in"
                            />
                            <span className="text-[9px] text-slate-400 block font-mono">{msg.attachment_name}</span>
                          </div>
                        ) : (
                          <a
                            href={msg.attachment_url}
                            download={msg.attachment_name || 'attached_document'}
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                          >
                            <Download size={13} /> Download {msg.attachment_name || 'Attached Document'}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Student Academic Metadata Chips */}
                    <div className="p-2.5 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-slate-105 dark:border-slate-800/80 text-[11px] space-y-1">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium text-slate-600 dark:text-slate-350">
                        <div>Sender: <strong className="text-slate-900 dark:text-slate-100">{msg.sender_name || 'Anonymous Student'}</strong> ({msg.user_email || 'No email'})</div>
                        <div>Reg No: <strong className="font-mono text-blue-700 dark:text-blue-400">{msg.reg_number || 'F17/141029/2022'}</strong></div>
                        <div>Campus: <strong>{msg.campus || 'Main Campus'}</strong></div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <div>Faculty: <strong>{msg.faculty || 'Faculty of Science & Technology'}</strong></div>
                        <div>Dept: <strong>{msg.department || 'Department of Computer Science'}</strong></div>
                        <div>Course: <strong>{msg.course || 'B.Sc. Computer Science'}</strong> ({msg.year_of_study || 'Yr 3'} {msg.semester || 'Sem 2'})</div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      {msg.status === 'open' && (
                        <button
                          onClick={() => handleResolveSupportMessage(msg.id)}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-850 text-white rounded-xl font-bold text-[10px] flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                        >
                          <Check size={12} /> Mark as Resolved
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-xs text-slate-400 dark:text-slate-500 bg-slate-50/20 dark:bg-slate-900/10 rounded-2xl border border-slate-100 dark:border-slate-850">
                No support messages found matching your selected campus and academic filters.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK TICKET INSPECT/APPROVE DRAWER */}
      <AnimatePresence>
        {reviewTicketId && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewTicketId(null)}
              className="fixed inset-0 bg-black z-40 backdrop-blur-xs"
            />

            {/* Sliding Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full sm:max-w-lg bg-white dark:bg-slate-955 border-l border-slate-200 dark:border-slate-800/80 shadow-2xl z-50 flex flex-col text-xs text-slate-700 dark:text-slate-300"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Clearance Registry {reviewTicketId}
                    </h3>
                    <p className="text-[10px] text-slate-450 dark:text-slate-550 font-medium">Registrar master validation drawer</p>
                  </div>
                </div>
                <button
                  onClick={() => setReviewTicketId(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-750 dark:hover:text-slate-200"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Drawer Body Scroll */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                {loadingReview ? (
                  <div className="h-64 flex items-center justify-center">
                    <PencilLoader message="Fetching ticket records..." size="sm" />
                  </div>
                ) : reviewTicket ? (
                  <>
                    {/* Student Metadata Card */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-955/20 text-amber-705 dark:text-amber-400 flex items-center justify-center font-extrabold text-xs uppercase">
                          {reviewTicket.student_name ? reviewTicket.student_name.slice(0, 2).toUpperCase() : 'ST'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                            {reviewTicket.student_name || 'Anonymous Student'}
                          </h4>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono font-bold block">
                            Reg No: {reviewTicket.reg_number}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                        <div>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Faculty</span>
                          <span className="truncate block font-bold text-slate-700 dark:text-slate-350">{reviewTicket.faculty}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Department</span>
                          <span className="truncate block font-bold text-slate-700 dark:text-slate-350">{reviewTicket.department}</span>
                        </div>
                      </div>
                    </div>

                    {/* Claim Details Card */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                        Clearance Case Details
                      </h4>
                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
                        <div>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Course Unit</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-250 block mt-0.5">{reviewTicket.unit_code}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-850 pt-2.5">
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Category</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-350 text-[10px] block mt-0.5 truncate" title={reviewTicket.assessment_category}>
                              {reviewTicket.assessment_category.replace('End of Semester ', '')}
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Claimed Score</span>
                            <span className="font-black text-slate-800 dark:text-slate-200 text-sm block mt-0.5">{reviewTicket.claimed_score}</span>
                          </div>
                          <div className="text-center">
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Verified Score</span>
                            <span className="font-black text-blue-705 dark:text-blue-400 text-sm block mt-0.5">
                              {reviewTicket.verified_score !== null && reviewTicket.verified_score !== undefined ? reviewTicket.verified_score : '—'}
                            </span>
                          </div>
                        </div>

                        {reviewTicket.additional_notes && (
                          <div className="border-t border-slate-100 dark:border-slate-850 pt-2.5">
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Student Notes</span>
                            <p className="text-[11px] text-slate-650 dark:text-slate-400 mt-1 leading-relaxed bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 italic">
                              "{reviewTicket.additional_notes}"
                            </p>
                          </div>
                        )}

                        {/* Proof Attachment */}
                        {reviewTicket.proof_attachment && (
                          <div className="border-t border-slate-100 dark:border-slate-850 pt-2.5">
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Attached Student Script Evidence</span>
                            
                            <div className="flex flex-wrap gap-2">
                              {reviewTicket.proof_attachment.split(',').map((url, idx) => {
                                const filename = url.split('/').pop() || 'proof_doc';
                                const isImage = /\.(jpg|jpeg|png|webp)$/i.test(url) || url.startsWith('data:image/');
                                
                                return (
                                  <div key={idx} className="flex flex-col bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-850 items-center justify-center relative w-full">
                                    {isImage ? (
                                      <div className="relative group cursor-zoom-in w-full flex flex-col items-center">
                                        <img 
                                          src={url} 
                                          alt={`Proof ${idx}`} 
                                          onClick={() => setLightboxUrl(url)}
                                          className="max-h-36 rounded-lg object-contain border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-black/25 w-full"
                                        />
                                        <span className="text-[8px] text-slate-400 block mt-1 truncate max-w-full font-mono">{filename}</span>
                                      </div>
                                    ) : (
                                      <a 
                                        href={url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline py-1 flex items-center gap-1"
                                      >
                                        <Paperclip size={11} /> Download {filename}
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat Comments Thread */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-extrabold text-slate-450 dark:text-slate-550 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare size={12} /> Registrar &amp; Faculty Logs ({reviewTicket.comments?.length || 0})
                      </h4>
                      
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {reviewTicket.comments && reviewTicket.comments.length > 0 ? (
                          reviewTicket.comments.map((comment: CommentData) => {
                            const isMe = comment.author_name === user.username;
                            return (
                              <div 
                                key={comment.id} 
                                className={`flex flex-col max-w-[85%] rounded-2xl p-3 space-y-1 ${
                                  isMe 
                                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 ml-auto items-end rounded-tr-none' 
                                    : 'bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 mr-auto items-start rounded-tl-none'
                                }`}
                              >
                                <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 dark:text-slate-500">
                                  <span>{comment.author_name} ({comment.author_role})</span>
                                  <span>•</span>
                                  <span>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-slate-750 dark:text-slate-350">{comment.message}</p>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-6 bg-slate-50/20 dark:bg-slate-900/10 rounded-xl border border-slate-100 dark:border-slate-850 text-slate-450 italic text-[10px]">
                            No registrar log entries. Log a comment or dispatch update below.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Registry Action form */}
                    <form onSubmit={handleUpdateStatusAndScore} className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-4">
                      <h4 className="text-[10px] font-extrabold text-slate-455 dark:text-slate-550 uppercase tracking-wider">
                        Master Clearance Dispatch Actions
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Override Verified Score
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="change mark..."
                            value={verifiedScoreInput}
                            onChange={(e) => setVerifiedScoreInput(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-850 dark:text-slate-150 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Set Clearance Status
                          </label>
                          <select
                            value={selectedStatusInput}
                            onChange={(e) => setSelectedStatusInput(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-205 focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="Submitted to Department/Lecturer">Submitted to Dept/Lecturer</option>
                            <option value="Under Departmental Processing">Under Dept Processing</option>
                            <option value="Awaiting Student Response">Awaiting Student Response</option>
                            <option value="Rejected — Insufficient Proof">Rejected — Insufficient Proof</option>
                            <option value="Cleared for SMS Update">Cleared for SMS Update</option>
                            <option value="Verified on SMS">Verified on SMS</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Registrar Log &amp; Comment Entry
                        </label>
                        <textarea
                          placeholder="Type internal notes or instructions dispatching to HOD or Student..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleAddDrawerComment}
                          disabled={!newComment.trim()}
                          className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-[10px]"
                        >
                          Write Log Message
                        </button>
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm text-[10px]"
                        >
                          {submittingReview ? 'Dispatching...' : 'Dispatch Registry Update'}
                        </button>
                      </div>
                    </form>
                  </>
                ) : null}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* LIGHTBOX FOR PREVIEWING ATTACHMENTS */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-850 hover:bg-slate-800 text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="max-w-4xl max-h-[85vh] overflow-hidden flex items-center justify-center">
              <img 
                src={lightboxUrl} 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-slate-800" 
                alt="Document Full Proof" 
              />
            </div>
            <a 
              href={lightboxUrl} 
              download="student_script_proof.png" 
              className="mt-4 px-4 py-2 bg-blue-650 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <Paperclip size={13} /> Open Image In New Tab
            </a>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
