import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Filter, 
  Layers, 
  ArrowRight,
  BookOpen,
  Calendar,
  AlertCircle,
  Search,
  CheckCircle,
  Clock,
  User,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  X,
  Eye,
  Check,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ticketService, type TicketData, type CommentData } from '../services/ticketService';
import { API_BASE_URL } from '../services/apiClient';
import { toast } from 'sonner';
import PencilLoader from './PencilLoader';
import { useNavigate } from 'react-router-dom';

interface LecturerPortalProps {
  user: any;
  onTicketClick: (ticketId: string) => void;
  key?: string;
}

const ASSIGNED_UNITS = [
  "ICS 2101 — Data Structures & Algorithms",
  "ICS 2205 — Database Systems",
  "ICS 2303 — Computer Networks",
  "ICS 2401 — Software Engineering"
];

const CATEGORIES = [
  "End of Semester Main Exam",
  "Continuous Assessment Test (CAT)",
  "Lab Report / Practical Score",
  "Fieldwork / Industrial Attachment"
];

const STATUSES = [
  "Submitted to Department/Lecturer",
  "Under Departmental Processing",
  "Awaiting Student Response",
  "Rejected — Insufficient Proof",
  "Cleared for SMS Update",
  "Verified on SMS"
];

export default function LecturerPortalView({ user, onTicketClick }: LecturerPortalProps) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeUnitFilter, setActiveUnitFilter] = useState<string | null>(null);

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
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await ticketService.listTickets();
      // Filter claims to only show assigned unit codes for high fidelity
      const filtered = data.filter(t => ASSIGNED_UNITS.includes(t.unit_code));
      setTickets(filtered);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load claims queue');
    } finally {
      setLoading(false);
    }
  };

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

  // Status style helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted to Department/Lecturer':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50';
      case 'Under Departmental Processing':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50';
      case 'Awaiting Student Response':
        return 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/50';
      case 'Rejected — Insufficient Proof':
        return 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/55 dark:border-red-900/50';
      case 'Cleared for SMS Update':
        return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-900/50';
      case 'Verified on SMS':
        return 'bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-700 dark:border-emerald-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  // Get active/open count for a specific unit (status not Cleared or Rejected or Verified)
  const getOpenCount = (unitCode: string) => {
    return tickets.filter(
      t => t.unit_code === unitCode && 
      !['Verified on SMS', 'Rejected — Insufficient Proof'].includes(t.status)
    ).length;
  };

  // Apply search query and filters
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reg_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.student_name && t.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.unit_code.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = !selectedType || t.assessment_category === selectedType;
    const matchesStatus = !selectedStatus || t.status === selectedStatus;
    const matchesUnit = !activeUnitFilter || t.unit_code === activeUnitFilter;

    return matchesSearch && matchesType && matchesStatus && matchesUnit;
  });

  // Calculate stats for overview cards
  const totalAssignedClaims = tickets.length;
  const pendingReviewCount = tickets.filter(t => t.status === 'Submitted to Department/Lecturer').length;
  const underProcessingCount = tickets.filter(t => t.status === 'Under Departmental Processing').length;
  const completedClaims = tickets.filter(t => t.status === 'Verified on SMS' || t.status === 'Cleared for SMS Update').length;
  
  const resolutionRate = totalAssignedClaims > 0 
    ? Math.round((completedClaims / totalAssignedClaims) * 100) 
    : 0;

  const renderReviewPanelContent = () => {
    if (loadingReview) {
      return (
        <div className="h-64 flex items-center justify-center">
          <PencilLoader message="Fetching ticket records..." size="sm" />
        </div>
      );
    }
    if (!reviewTicket) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
          <AlertCircle size={32} className="mx-auto text-slate-350 dark:text-slate-700 mb-2" />
          <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">No Ticket Selected</h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1 max-w-[200px]">Click on any ticket in the clearance queue to display its full verification details.</p>
        </div>
      );
    }

    return (
      <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
        {/* Student Metadata Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-extrabold text-xs uppercase">
              {reviewTicket.student_name ? reviewTicket.student_name.slice(0, 2).toUpperCase() : 'ST'}
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                {reviewTicket.student_name || 'Anonymous Student'}
              </h4>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold block">
                Reg No: {reviewTicket.reg_number}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
            <div>
              <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Faculty</span>
              <span className="truncate block font-bold text-slate-700 dark:text-slate-350">{reviewTicket.faculty.replace('Faculty of ', '')}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</span>
              <span className="truncate block font-bold text-slate-700 dark:text-slate-350">{reviewTicket.department}</span>
            </div>
          </div>
        </div>

        {/* Claim Details Card */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Claim Discrepancy Details
          </h4>
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
            <div>
              <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Course Unit</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">{reviewTicket.unit_code}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-850 pt-2.5">
              <div>
                <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</span>
                <span className="font-semibold text-slate-700 dark:text-slate-350 text-[10px] block mt-0.5 truncate" title={reviewTicket.assessment_category}>
                  {reviewTicket.assessment_category.replace('End of Semester ', '')}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Claimed Score</span>
                <span className="font-black text-slate-800 dark:text-slate-200 text-sm block mt-0.5">{reviewTicket.claimed_score !== null ? reviewTicket.claimed_score : '—'}</span>
              </div>
              <div className="text-center">
                <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified Score</span>
                <span className="font-black text-blue-700 dark:text-blue-400 text-sm block mt-0.5">
                  {reviewTicket.verified_score !== null && reviewTicket.verified_score !== undefined ? reviewTicket.verified_score : '—'}
                </span>
              </div>
            </div>

            {reviewTicket.additional_notes && (
              <div className="border-t border-slate-100 dark:border-slate-850 pt-2.5">
                <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student Notes</span>
                <p className="text-[11px] text-slate-700 dark:text-slate-200 mt-1 leading-relaxed bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 italic">
                  "{reviewTicket.additional_notes}"
                </p>
              </div>
            )}

            {/* Proof Attachment Preview */}
            {reviewTicket.proof_attachment && (
              <div className="border-t border-slate-100 dark:border-slate-850 pt-2.5">
                <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Evidence Proof / Script Sheet</span>
                
                <div className="flex flex-wrap gap-2">
                  {reviewTicket.proof_attachment.split(',').map((url, index) => {
                    const filename = url.split('/').pop() || 'proof_document';
                    const getFileUrl = (path: string) => {
                      if (!path) return '';
                      if (path.startsWith('http') || path.startsWith('data:')) return path;
                      if (path.startsWith('/api/media')) return `${API_BASE_URL}${path}`;
                      return `${API_BASE_URL}/api/media/${path}`;
                    };
                    const fullUrl = getFileUrl(url);
                    const isImage = /\.(jpg|jpeg|png|webp|heic)$/i.test(filename) || url.startsWith('data:image/');
                    const isPdf = /\.pdf$/i.test(filename);
                    
                    return (
                      <div key={index} className="flex flex-col bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 items-center justify-center relative w-full">
                        {isImage ? (
                          <div className="relative group cursor-zoom-in w-full flex flex-col items-center">
                            <img 
                              src={fullUrl} 
                              alt={`Proof ${index}`} 
                              onClick={() => setLightboxUrl(fullUrl)}
                              className="max-h-36 rounded-lg object-contain border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-black/25 w-full"
                            />
                            <span className="text-[8px] text-slate-500 dark:text-slate-400 block mt-1 truncate max-w-full font-mono">{filename}</span>
                          </div>
                        ) : isPdf ? (
                          <div className="w-full flex flex-col items-center gap-1.5">
                            <iframe 
                              src={fullUrl} 
                              title={`PDF Proof ${index}`}
                              className="w-full h-80 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white"
                            />
                            <div className="flex justify-between items-center w-full px-1">
                              <span className="text-[8px] text-slate-500 dark:text-slate-400 truncate max-w-[70%] font-mono">{filename}</span>
                              <a 
                                href={fullUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[9px] text-blue-600 dark:text-blue-400 font-extrabold hover:underline"
                              >
                                Open PDF ↗
                              </a>
                            </div>
                          </div>
                        ) : (
                          <a 
                            href={fullUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline py-1 flex items-center gap-1"
                          >
                            <FolderOpen size={11} /> Download {filename}
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

        {/* Timeline & Student-Lecturer Comments */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare size={12} /> Discussion History ({reviewTicket.comments?.length || 0})
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
                        ? 'bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 ml-auto items-end rounded-tr-none' 
                        : 'bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 mr-auto items-start rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[8px] font-bold text-slate-500 dark:text-slate-400">
                      <span>{comment.author_name} ({comment.author_role})</span>
                      <span>•</span>
                      <span>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-750 dark:text-slate-300">{comment.message}</p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 bg-slate-50/20 dark:bg-slate-900/10 rounded-xl border border-slate-100 dark:border-slate-850 text-slate-400 italic text-[10px]">
                No comments listed. Send a feedback message below.
              </div>
            )}
          </div>
        </div>

        {/* Action form */}
        <form onSubmit={handleUpdateStatusAndScore} className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-4">
          <h4 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Update Claim & Verify Mark
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Verified Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="verified marks..."
                value={verifiedScoreInput}
                onChange={(e) => setVerifiedScoreInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-850 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Workflow Status
              </label>
              <select
                value={selectedStatusInput}
                onChange={(e) => setSelectedStatusInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
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

          {/* Comment textarea */}
          <div>
            <label className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Comment / Resolution Notes
            </label>
            <textarea
              placeholder="Type details for the student, lecturer logs, or reason for rejection/approval..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
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
              Send Message Only
            </button>
            <button
              type="submit"
              disabled={submittingReview}
              className="flex-1 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm text-[10px]"
            >
              {submittingReview ? 'Updating...' : 'Submit Resolution'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="space-y-6 pt-2 text-slate-700 dark:text-slate-300 relative overflow-x-hidden">
      
      {/* Header Profile Info */}
      <div className="reveal active flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest block">Lecturer Portal</span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            {user.username} — Claims Queue
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-none">
            Department of Computing & Informatics · Assigned Units: ICS 2101, ICS 2205, ICS 2303, ICS 2401
          </p>
        </div>
        <button 
          onClick={loadTickets}
          className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0 flex items-center gap-1.5"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh Queue
        </button>
      </div>

      {/* Analytics & Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="clay-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Resolution Rate</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{resolutionRate}%</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <TrendingUp size={10} /> completed
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-pulse" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${resolutionRate}%, 0 ${resolutionRate}%)` }} />
            <FileCheck2 size={16} className="text-emerald-500" />
          </div>
        </div>

        <div className="clay-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">New Submissions</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{pendingReviewCount}</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">needs review</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>

        <div className="clay-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Under Review</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{underProcessingCount}</span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">in progress</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FolderOpen size={18} />
          </div>
        </div>

        <div className="clay-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Completed</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{completedClaims}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">claims resolved</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle size={18} />
          </div>
        </div>
      </div>

      {/* Unit Cards Summary & Clickable Quick Filter */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Filter Queue by Assigned Unit Code
          </span>
          {activeUnitFilter && (
            <button 
              onClick={() => setActiveUnitFilter(null)}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              Clear Unit Filter <X size={10} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {ASSIGNED_UNITS.map(unit => {
            const openClaims = getOpenCount(unit);
            const isActive = activeUnitFilter === unit;
            return (
              <motion.div 
                key={unit} 
                whileHover={{ y: -3 }}
                onClick={() => setActiveUnitFilter(isActive ? null : unit)}
                className={`clay-card p-4 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden border ${
                  isActive 
                    ? 'border-blue-500 dark:border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/10 dark:bg-blue-950/10' 
                    : 'border-slate-200/60 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {unit.split(' — ')[0]}
                  </span>
                  {isActive && <CheckCircle size={12} className="text-blue-500" />}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{openClaims}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-450 font-medium">Open Claim{openClaims !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate block mt-2" title={unit.split(' — ')[1]}>
                  {unit.split(' — ')[1]}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Split Layout Container */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* Left Side: Clearance Queue Table & Controls */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          <div className="clay-card p-6 reveal active space-y-4">
            {/* Top Control Bar */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Clearance Queue
              </h2>
              
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Search Input */}
                <div className="relative flex-1 md:flex-initial md:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder="Search Reg No., Name, Unit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-850 focus:border-blue-500 focus:outline-none rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-850 dark:text-slate-200 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Assessment Category Filter */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850">
                  <Filter size={12} className="text-slate-450 dark:text-slate-400" />
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="bg-transparent text-xs text-slate-750 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">All Categories</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">{c}</option>
                    ))}
                  </select>
                </div>

                {/* Workflow Status Filter */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850">
                  <Layers size={12} className="text-slate-455 dark:text-slate-400" />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-transparent text-xs text-slate-750 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">All Statuses</option>
                    {STATUSES.map(s => (
                      <option key={s} value={s} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table or Empty State */}
            {filteredTickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-3 px-2.5">Ticket</th>
                      <th className="py-3 px-2.5">Student Reg</th>
                      <th className="py-3 px-2.5">Student Name</th>
                      <th className="py-3 px-2.5">Unit</th>
                      <th className="py-3 px-2.5 text-center">Claimed</th>
                      <th className="py-3 px-2.5 text-center">Verified</th>
                      <th className="py-3 px-2.5">Status</th>
                      <th className="py-3 px-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((t) => (
                      <tr 
                        key={t.ticket_id}
                        onClick={() => setReviewTicketId(t.ticket_id)}
                        className={`border-b border-slate-100/60 dark:border-slate-850/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer ${
                          reviewTicketId === t.ticket_id ? 'bg-blue-50/40 dark:bg-blue-950/15' : ''
                        }`}
                      >
                        <td className="py-3 px-2.5 font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-1.5">
                            {!t.is_read_by_lecturer && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="New Activity / Unread" />
                            )}
                            <span>{t.ticket_id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2.5 text-slate-600 dark:text-slate-400 font-medium">
                          {t.reg_number}
                        </td>
                        <td className="py-3 px-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          {t.student_name}
                        </td>
                        <td className="py-3 px-2.5">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{t.unit_code}</span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate block max-w-xs">{t.unit_name}</span>
                        </td>
                        <td className="py-3 px-2.5 text-center font-bold text-slate-800 dark:text-slate-200">
                          {t.claimed_score !== null ? t.claimed_score : '—'}
                        </td>
                        <td className="py-3 px-2.5 text-center font-bold text-blue-700 dark:text-blue-400">
                          {t.verified_score !== null && t.verified_score !== undefined ? t.verified_score : '—'}
                        </td>
                        <td className="py-3 px-2.5">
                          <span className={`inline-flex px-2 py-1.5 rounded-full text-[9px] font-bold ${
                            t.status.startsWith('Cleared') || t.status.startsWith('Verified')
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100/50 dark:border-emerald-900/30'
                              : t.status.startsWith('Rejected')
                              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border border-rose-100/50 dark:border-rose-900/30'
                              : t.status.startsWith('Awaiting')
                              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border border-amber-100/50 dark:border-amber-900/30'
                              : 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-450 border border-blue-100/50 dark:border-blue-900/30'
                          }`}>
                            {t.status.replace('Submitted to Department/Lecturer', 'SUBMITTED').replace('Under Departmental Processing', 'PROCESSING').replace('Cleared for SMS Update', 'CLEARED FOR SMS').replace('Verified on SMS', 'VERIFIED ON SMS').replace('Rejected — Insufficient Proof', 'REJECTED - PROOF').replace('Awaiting Student Response', 'AWAITING STUDENT')}
                          </span>
                        </td>
                        <td className="py-3 px-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/clearance/ticket/${t.ticket_id}`)}
                              className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                              title="Open Full Workspace"
                            >
                              <ExternalLink size={11} />
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
                <AlertCircle size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="font-bold text-slate-700 dark:text-slate-350 text-sm">Clear Queue</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">No claims match the selected filters or search queries.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Permanent Details Panel on Desktop */}
        <div className="hidden lg:flex w-96 xl:w-[420px] shrink-0 sticky top-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xs flex-col text-xs text-slate-700 dark:text-slate-300 max-h-[calc(100vh-100px)] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <FileCheck2 size={16} />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  {reviewTicketId ? `Grievance Claim ${reviewTicketId}` : 'Inspection Board'}
                </h3>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Quick Review & Action Panel</p>
              </div>
            </div>
          </div>

          {/* Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {renderReviewPanelContent()}
          </div>
        </div>

      </div>

      {/* QUICK REVIEW SLIDE-OUT DRAWER (MOBILE / TABLET ONLY) */}
      <AnimatePresence>
        {reviewTicketId && (
          <>
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewTicketId(null)}
              className="fixed inset-0 bg-black z-40 backdrop-blur-xs lg:hidden"
            />

            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full sm:max-w-lg bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col text-xs text-slate-700 dark:text-slate-300 lg:hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <FileCheck2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Grievance Claim {reviewTicketId}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Quick inspection & marks approval board</p>
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
                {renderReviewPanelContent()}
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
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <FolderOpen size={13} /> Open Image In New Tab
            </a>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
