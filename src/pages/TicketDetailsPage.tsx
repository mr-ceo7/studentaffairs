import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  FileCheck2, 
  FolderOpen, 
  MessageSquare, 
  AlertCircle, 
  FileCheck,
  Download,
  Paperclip,
  X,
  CheckCheck
} from 'lucide-react';
import { ticketService, type TicketData, type CommentData } from '../services/ticketService';
import { API_BASE_URL } from '../services/apiClient';
import { useUser } from '../context/UserContext';
import { toast } from 'sonner';
import PencilLoader from '../components/PencilLoader';

export default function TicketDetailsPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  // Review inputs
  const [verifiedScoreInput, setVerifiedScoreInput] = useState('');
  const [selectedStatusInput, setSelectedStatusInput] = useState('');
  
  // Reply attachments
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Fetch ticket details
  const fetchTicket = async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const data = await ticketService.getTicket(ticketId);
      setTicket(data);
      setVerifiedScoreInput(data.verified_score !== null && data.verified_score !== undefined ? String(data.verified_score) : '');
      setSelectedStatusInput(data.status);

      // Update student read timestamps in localStorage
      if (user && user.email.endsWith('@student.uonbi.ac.ke')) {
        try {
          const stored = localStorage.getItem(`clearance_last_read_tickets_${user.id}`);
          const readMap = stored ? JSON.parse(stored) : {};
          readMap[ticketId] = new Date().toISOString();
          localStorage.setItem(`clearance_last_read_tickets_${user.id}`, JSON.stringify(readMap));
        } catch (err) {
          console.error('Failed to update local storage read state', err);
        }
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load grievance details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload and get URL string
  const uploadAttachedFiles = async (): Promise<string | undefined> => {
    if (attachedFiles.length === 0) return undefined;
    try {
      const uploaded = await ticketService.uploadFiles(attachedFiles);
      return uploaded.map(f => f.url).join(',');
    } catch (err) {
      console.error('File upload failed', err);
      toast.error('Failed to upload attachments');
      throw err;
    }
  };

  // Submit status and score update (Lecturer/Admin)
  const handleUpdateStatusAndScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !ticket) return;
    try {
      setSubmittingReview(true);
      const proofUrl = await uploadAttachedFiles();
      const score = verifiedScoreInput.trim() !== '' ? parseInt(verifiedScoreInput) : undefined;
      const commentText = newComment.trim() !== '' ? newComment : undefined;

      await ticketService.updateTicketStatus(
        ticketId,
        selectedStatusInput,
        score,
        commentText
      );
      toast.success('Grievance claim updated successfully!');
      setNewComment('');
      setAttachedFiles([]);
      fetchTicket();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to update claim');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Add comment only (Shared)
  const handleAddCommentOnly = async () => {
    if (!ticketId) return;
    if (!newComment.trim() && attachedFiles.length === 0) return;
    try {
      setSubmittingReview(true);
      const proofUrl = await uploadAttachedFiles();
      await ticketService.addComment(ticketId, newComment, proofUrl);
      toast.success('Message sent successfully!');
      setNewComment('');
      setAttachedFiles([]);
      fetchTicket();
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to post comment');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[75vh] flex items-center justify-center">
        <PencilLoader message="Loading assigned unit claims..." size="sm" />
      </div>
    );
  }

  if (!ticket || !user) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center text-center p-6 text-slate-400">
        <AlertCircle size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
        <h3 className="font-bold text-base text-slate-700 dark:text-slate-350">Claim Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">The ticket ID is invalid or you do not have permission to view it.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isStudent = user.email.endsWith('@student.uonbi.ac.ke');
  const isAdmin = user.is_admin;
  const isLecturer = !isStudent && !isAdmin;

  return (
    <div className="reveal active space-y-6 pt-2 max-w-7xl mx-auto">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Clearance Grievance Workspace
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Ticket ID: {ticket.ticket_id} • Updated: {new Date(ticket.updated_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Workspace Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Student Details & Document Viewport (takes 7 columns) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Metadata Card */}
          <div className="clay-card p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black text-sm uppercase">
                {ticket.student_name ? ticket.student_name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-850 dark:text-slate-150 text-sm">
                  {ticket.student_name || 'Anonymous Student'}
                </h3>
                <span className="text-xs text-slate-550 dark:text-slate-400 font-mono font-bold block mt-0.5">
                  Reg Number: {ticket.reg_number}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div>
                <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Faculty</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{ticket.faculty}</span>
              </div>
              <div>
                <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Department</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{ticket.department}</span>
              </div>
              <div>
                <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Course Unit</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{ticket.unit_code}</span>
              </div>
            </div>
          </div>

          {/* Large Document Viewport */}
          <div className="clay-card p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xs space-y-4">
            <h4 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Student Evidence & Script Preview
            </h4>

            {ticket.proof_attachment ? (
              <div className="space-y-4">
                {ticket.proof_attachment.split(',').map((url, idx) => {
                  const filename = url.split('/').pop() || 'proof_doc';
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
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col items-center gap-3">
                      {isImage ? (
                        <div className="w-full flex flex-col items-center">
                          <img 
                            src={fullUrl} 
                            alt={`Evidence ${idx}`} 
                            className="max-h-[500px] object-contain rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-black/20 w-full"
                          />
                          <div className="flex justify-between items-center w-full mt-2.5 px-1.5">
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[70%]">{filename}</span>
                            <a 
                              href={fullUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold hover:underline"
                            >
                              Open Image ↗
                            </a>
                          </div>
                        </div>
                      ) : isPdf ? (
                        <div className="w-full flex flex-col items-center">
                          <iframe 
                            src={fullUrl} 
                            title={`PDF Document ${idx}`}
                            className="w-full h-[650px] rounded-xl border border-slate-250 dark:border-slate-800 bg-white"
                          />
                          <div className="flex justify-between items-center w-full mt-2.5 px-1.5">
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[70%]">{filename}</span>
                            <a 
                              href={fullUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold hover:underline"
                            >
                              Open PDF in Full Screen ↗
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full p-2">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-6 h-6 text-green-600 dark:text-green-500" />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono truncate max-w-xs">{filename}</span>
                          </div>
                          <a 
                            href={fullUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-extrabold flex items-center gap-1 text-slate-750 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
                          >
                            <Download size={11} /> Download File
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 italic text-xs">
                No files or script proof attachments provided.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Resolution Workflow & Discussion Feed (takes 5 columns) */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          {/* Claim Stats Card */}
          <div className="clay-card p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xs space-y-3">
            <h4 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Assessment Summary
            </h4>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="text-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="block text-[8px] font-extrabold text-slate-500 uppercase">Category</span>
                <span className="font-extrabold text-[10px] text-slate-750 dark:text-slate-200 block mt-0.5 truncate">{ticket.assessment_category.replace('End of Semester ', '')}</span>
              </div>
              <div className="text-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="block text-[8px] font-extrabold text-slate-500 uppercase">Claimed</span>
                <span className="font-black text-slate-800 dark:text-slate-200 text-sm block mt-0.5">{ticket.claimed_score !== null ? ticket.claimed_score : '—'}</span>
              </div>
              <div className="text-center bg-blue-50/40 dark:bg-blue-950/20 p-2.5 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                <span className="block text-[8px] font-extrabold text-blue-700 dark:text-blue-400 uppercase">Verified</span>
                <span className="font-black text-blue-700 dark:text-blue-400 text-sm block mt-0.5">{ticket.verified_score !== null && ticket.verified_score !== undefined ? ticket.verified_score : '—'}</span>
              </div>
            </div>

            {ticket.additional_notes && (
              <div className="border-t border-slate-100 dark:border-slate-850 pt-2.5">
                <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Student Notes</span>
                <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 italic">
                  "{ticket.additional_notes}"
                </p>
              </div>
            )}
          </div>

          {/* Interactive Action Verification Box (Lecturers & Admins ONLY) */}
          {!isStudent && (
            <div className="clay-card p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xs space-y-4">
              <h4 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 size={12} className="text-blue-600 dark:text-blue-400" />
                Workflow Action & Marks Update
              </h4>

              <form onSubmit={handleUpdateStatusAndScore} className="space-y-3.5">
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
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-semibold text-slate-850 dark:text-slate-200 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Workflow Status
                    </label>
                    <select
                      value={selectedStatusInput}
                      onChange={(e) => setSelectedStatusInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
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
                  <label className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Comment / Resolution Notes
                  </label>
                  <textarea
                    placeholder="Type details for the student, lecturer logs, or reason for rejection/approval..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                  />
                </div>

                {/* Attached files lists */}
                {attachedFiles.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
                        <span className="truncate max-w-[120px] font-mono">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachedFile(idx)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-full text-slate-400 hover:text-rose-650"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {/* File attach button */}
                  <label className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1">
                    <Paperclip size={14} />
                    <span className="text-[10px]">Attach File</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleAddCommentOnly}
                    disabled={(!newComment.trim() && attachedFiles.length === 0) || submittingReview}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-[10px]"
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
          )}

          {/* Interactive Chat Form (Students ONLY) */}
          {isStudent && (
            <div className="clay-card p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xs space-y-4">
              <h4 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={12} className="text-blue-600 dark:text-blue-400" />
                Reply / Send Feedback
              </h4>

              <div className="space-y-3">
                <textarea
                  placeholder="Type a reply to the department..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />

                {/* Attached files lists */}
                {attachedFiles.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
                        <span className="truncate max-w-[120px] font-mono">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachedFile(idx)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-full text-slate-400 hover:text-rose-650"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {/* File attach button */}
                  <label className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1">
                    <Paperclip size={14} />
                    <span className="text-[10px]">Attach File</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleAddCommentOnly}
                    disabled={(!newComment.trim() && attachedFiles.length === 0) || submittingReview}
                    className="flex-1 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm text-[10px]"
                  >
                    {submittingReview ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Discussion Thread Bubble Feed */}
          <div className="clay-card p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xs space-y-4">
            <h4 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={12} className="text-blue-600 dark:text-blue-400" />
              Discussion Thread ({ticket.comments?.length || 0})
            </h4>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((comment: CommentData) => {
                  const isMe = comment.author_name === user.username;
                  return (
                    <div 
                      key={comment.id} 
                      className={`flex flex-col max-w-[85%] rounded-2xl p-3 space-y-1.5 ${
                        isMe 
                          ? 'bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 ml-auto items-end rounded-tr-none' 
                          : 'bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 mr-auto items-start rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[8px] font-bold text-slate-500 dark:text-slate-400">
                        <span>{comment.author_name} ({comment.author_role})</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <span>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && (
                            comment.is_read ? (
                              <CheckCheck size={11} className="text-blue-500 stroke-[3px]" title="Read by recipient" />
                            ) : (
                              <CheckCheck size={11} className="text-slate-400 dark:text-slate-500 stroke-[2px]" title="Sent" />
                            )
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-750 dark:text-slate-300">{comment.message}</p>
                      
                      {/* Attached files list for comment */}
                      {comment.proof_attachment && (
                        <div className="flex flex-col gap-1 w-full pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                          {comment.proof_attachment.split(',').map((url, index) => {
                            const filename = url.split('/').pop() || 'attachment';
                            const getFileUrl = (path: string) => {
                              if (!path) return '';
                              if (path.startsWith('http') || path.startsWith('data:')) return path;
                              if (path.startsWith('/api/media')) return `${API_BASE_URL}${path}`;
                              return `${API_BASE_URL}/api/media/${path}`;
                            };
                            const fullUrl = getFileUrl(url);
                            const isImg = /\.(jpg|jpeg|png|webp|heic)$/i.test(filename) || url.startsWith('data:image/');
                            const isPdfFile = /\.pdf$/i.test(filename);

                            return (
                              <div key={index} className="flex items-center justify-between bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-150 dark:border-slate-800 text-[10px]">
                                <span className="font-mono text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{filename}</span>
                                <div className="flex gap-2">
                                  {isImg ? (
                                    <a 
                                      href={fullUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-blue-600 dark:text-blue-400 hover:underline font-extrabold"
                                    >
                                      View Image ↗
                                    </a>
                                  ) : isPdfFile ? (
                                    <a 
                                      href={fullUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-blue-600 dark:text-blue-400 hover:underline font-extrabold"
                                    >
                                      View PDF ↗
                                    </a>
                                  ) : (
                                    <a 
                                      href={fullUrl} 
                                      download
                                      className="text-blue-600 dark:text-blue-400 hover:underline font-extrabold"
                                    >
                                      Download ↗
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 bg-slate-50/20 dark:bg-slate-900/10 rounded-xl border border-slate-100 dark:border-slate-850 text-slate-400 italic text-[10px]">
                  No comments in the thread yet. Write a message above to start.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
