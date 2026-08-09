import React, { useState, useEffect } from 'react';
import { X, Send, Download, ShieldAlert, CheckCircle, HelpCircle, FileCheck, Ban } from 'lucide-react';
import { ticketService, type TicketData } from '../services/ticketService';
import { useUser } from '../context/UserContext';
import { toast } from 'sonner';

interface TicketDetailModalProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function TicketDetailModal({ ticketId, isOpen, onClose, onRefresh }: TicketDetailModalProps) {
  const { user } = useUser();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Score verification (Lecturer/Admin only)
  const [verificationScore, setVerificationScore] = useState('');

  useEffect(() => {
    if (isOpen && ticketId) {
      loadTicketDetails();
    }
  }, [isOpen, ticketId]);

  const loadTicketDetails = async () => {
    setLoading(true);
    try {
      const data = await ticketService.getTicket(ticketId);
      setTicket(data);
      setVerificationScore(String(data.verified_score ?? data.claimed_score));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load ticket details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !ticket) return;

    setSubmitting(true);
    try {
      await ticketService.addComment(ticket.ticket_id, replyMessage.trim());
      setReplyMessage('');
      toast.success('Comment added to thread');
      loadTicketDetails();
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  // Lecturer Action: Verify
  const handleVerify = async () => {
    if (!ticket) return;
    const score = Number(verificationScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Please enter a valid verified score (0-100)');
      return;
    }

    setSubmitting(true);
    try {
      await ticketService.updateTicketStatus(
        ticket.ticket_id, 
        'Under Departmental Processing', 
        score, 
        `Verified mark: Forwarded claim to HOD with score of ${score}.`
      );
      toast.success('Ticket forwarded to HOD with verified score.');
      loadTicketDetails();
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Verification action failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Lecturer Action: Request Info
  const handleRequestInfo = async () => {
    if (!ticket) return;
    if (!replyMessage.trim()) {
      toast.error('Please type a feedback message explaining what additional details or clearer proof you require.');
      return;
    }

    setSubmitting(true);
    try {
      await ticketService.updateTicketStatus(
        ticket.ticket_id,
        'Awaiting Student Response',
        undefined,
        replyMessage.trim()
      );
      setReplyMessage('');
      toast.success('Ticket flagged for student review.');
      loadTicketDetails();
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Lecturer Action: Reject
  const handleReject = async () => {
    if (!ticket) return;
    if (!replyMessage.trim() || replyMessage.trim().length < 20) {
      toast.error('Please provide a mandatory explanation note (minimum 20 characters) explaining the rejection.');
      return;
    }

    setSubmitting(true);
    try {
      await ticketService.updateTicketStatus(
        ticket.ticket_id,
        'Rejected — Insufficient Proof',
        undefined,
        `Rejected claim. Reason: ${replyMessage.trim()}`
      );
      setReplyMessage('');
      toast.success('Ticket rejected. Student notified.');
      loadTicketDetails();
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Rejection failed');
    } finally {
      setSubmitting(false);
    }
  };

  // HOD/Registrar Action: Clear for SMS Update
  const handleClearForSMS = async () => {
    if (!ticket) return;
    setSubmitting(true);
    try {
      await ticketService.updateTicketStatus(
        ticket.ticket_id,
        'Cleared for SMS Update',
        undefined,
        'Cleared for SMS Update: Score approved by HOD/Exam Officer.'
      );
      toast.success('Mark cleared for SMS update.');
      loadTicketDetails();
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Clearance action failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Registrar Action: Mark Verified on SMS
  const handleVerifiedOnSMS = async () => {
    if (!ticket) return;
    setSubmitting(true);
    try {
      await ticketService.updateTicketStatus(
        ticket.ticket_id,
        'Verified on SMS',
        undefined,
        'Cleared on SMS: Registrar has verified that the changes are updated in the Student Management System.'
      );
      toast.success('Ticket closed and marked Verified on SMS.');
      loadTicketDetails();
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Clearance action failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Role details
  const isStudent = user?.email.endsWith('@student.uonbi.ac.ke');
  const isStaff = user?.email.endsWith('@uonbi.ac.ke');
  const isAdmin = user?.is_admin;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">Grievance Inspection</span>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {loading ? 'Loading Claim...' : `${ticket?.ticket_id} — ${ticket?.unit_code.split(' — ')[0]}`}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex-1 py-20 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
            Fetching grievance data...
          </div>
        ) : ticket ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Registration No</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{ticket.reg_number}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Student Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{ticket.student_name}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Course Unit</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block" title={ticket.unit_code}>{ticket.unit_code.split(' — ')[0]}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Assessment</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{ticket.assessment_category}</span>
              </div>
              <div className="text-center bg-blue-50/50 dark:bg-blue-950/30 rounded-lg py-1 border border-blue-100/50 dark:border-blue-900/50">
                <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 uppercase block">Claimed Score</span>
                <span className="font-bold text-blue-900 dark:text-blue-300 text-sm">{ticket.claimed_score}</span>
              </div>
              <div className="text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-lg py-1 border border-emerald-100 dark:border-emerald-900/50">
                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Verified Score</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">{ticket.verified_score ?? '—'}</span>
              </div>
            </div>

            {/* Proof Attachment */}
            {ticket.proof_attachment && (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-200/55 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-green-700 dark:text-green-500" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-xs">{ticket.proof_attachment}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">Grade Proof Document</span>
                  </div>
                </div>
                <a
                  href={`/api/media/${ticket.proof_attachment}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info(`Mock Download: Opening PDF/Image viewer for ${ticket.proof_attachment}`);
                  }}
                >
                  <Download size={12} />
                  View Proof
                </a>
              </div>
            )}

            {/* Notes */}
            {ticket.additional_notes && (
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Student Remarks</span>
                <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{ticket.additional_notes}"
                </div>
              </div>
            )}

            {/* Thread */}
            <div className="space-y-3 pt-2">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800 pb-2">Feedback Thread ({ticket.comments.length})</span>
              
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
                {ticket.comments.length > 0 ? (
                  ticket.comments.map(c => {
                    const isSelf = (c.author_role === 'student' && isStudent) || (c.author_role !== 'student' && !isStudent);
                    return (
                      <div 
                        key={c.id} 
                        className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          isSelf 
                            ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 ml-auto' 
                            : 'bg-slate-50 dark:bg-slate-950/10 border border-slate-200/60 dark:border-slate-800 mr-auto'
                        }`}
                      >
                        <div className="flex justify-between items-center gap-4 mb-1 text-[10px] font-bold">
                          <span className={isSelf ? 'text-blue-900 dark:text-blue-400' : 'text-slate-800 dark:text-slate-300'}>{c.author_name}</span>
                          <span className="text-slate-400 dark:text-slate-500 font-normal">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">{c.message}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-slate-400 dark:text-slate-500 italic text-[11px]">
                    No comments in thread yet.
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder={isStaff ? "Leave feedback or request more info..." : "Reply to the lecturer..."}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 focus:border-blue-450 dark:focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={submitting || !replyMessage.trim()}
                  className="px-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>

            {/* Actions Panel */}
            {isStaff && (
              <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
                {/* Score Input for Lecturer */}
                {!isAdmin && (
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
                      Verify Grade (0-100)
                    </label>
                    <input
                      type="number"
                      value={verificationScore}
                      onChange={(e) => setVerificationScore(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 w-24 text-center font-bold"
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Confirm or adjust the verified score before forwarding.</span>
                  </div>
                )}

                {/* Actions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={handleClearForSMS}
                        disabled={submitting}
                        className="py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={14} />
                        Clear for SMS Update
                      </button>
                      <button
                        onClick={handleVerifiedOnSMS}
                        disabled={submitting}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={14} />
                        Mark Verified on SMS
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleVerify}
                        disabled={submitting}
                        className="py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={14} />
                        Verify — Forward to HOD
                      </button>
                      <button
                        onClick={handleRequestInfo}
                        disabled={submitting || !replyMessage.trim()}
                        className="py-2.5 bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                      >
                        <HelpCircle size={14} />
                        Request More Info
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={submitting || !replyMessage.trim()}
                        className="py-2.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 sm:col-span-2"
                      >
                        <Ban size={14} />
                        Reject Claim (Needs Comment explanation)
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
