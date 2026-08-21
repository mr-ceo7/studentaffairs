import React, { useEffect, useState, useRef } from 'react';
import { Mail, X, Send, Inbox, MessageSquare, AlertCircle, ArrowRight, CornerDownRight, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { supportService, SupportMessage } from '../services/supportService';
import { toast } from 'sonner';

export default function FloatingSupportButton() {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [readMessageIds, setReadMessageIds] = useState<number[]>([]);
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null);

  // Inline Reply states
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [isReplyingId, setIsReplyingId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show button after 1 second delay
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Load read message IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('readSupportMessageIds');
      if (stored) {
        setReadMessageIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load read message IDs', e);
    }
  }, []);

  // Fetch student's support messages periodically if logged in
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      try {
        const data = await supportService.getStudentMessages();
        setMessages(data);
      } catch (e) {
        console.error('Failed to fetch student support messages', e);
      }
    };

    fetchMessages();
    // Poll every 15 seconds to fetch fresh updates/replies
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isInboxOpen && 
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsInboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isInboxOpen]);

  const handleMarkAsRead = (msgId: number) => {
    if (readMessageIds.includes(msgId)) return;
    const updated = [...readMessageIds, msgId];
    setReadMessageIds(updated);
    try {
      localStorage.setItem('readSupportMessageIds', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async (id: number) => {
    const replyText = replyTexts[id];
    if (!replyText || !replyText.trim()) return;

    setIsReplyingId(id);
    try {
      const updatedMsg = await supportService.replyToMessage(id, replyText.trim());
      
      // Clear reply text for this message
      setReplyTexts(prev => ({ ...prev, [id]: '' }));
      
      // Update messages list locally
      setMessages(prev => prev.map(m => m.id === id ? updatedMsg : m));
      toast.success('Reply sent successfully!');
    } catch (e) {
      console.error('Failed to send reply', e);
      toast.error('Failed to send reply. Please try again.');
    } finally {
      setIsReplyingId(null);
    }
  };

  // Helper to parse message segments (Student replies are appended to original message text)
  const getMessageSegments = (fullMessage: string) => {
    return fullMessage.split('\n\n').map((segment, index) => {
      if (segment.startsWith('[Student')) {
        const headerEnd = segment.indexOf(']:');
        if (headerEnd !== -1) {
          const header = segment.substring(1, headerEnd);
          const text = segment.substring(headerEnd + 2).trim();
          return { id: index, sender: 'student', header, text };
        }
      }
      return { id: index, sender: 'student', header: 'Original Message', text: segment };
    });
  };

  // Count unread replies
  const unreadCount = messages.filter(
    (m) => m.reply_notes && !readMessageIds.includes(m.id)
  ).length;

  if (!user) return null; // Hide the floating inbox completely if not logged in

  return (
    <div ref={containerRef} className="fixed z-40 bottom-24 right-4 md:bottom-8 md:right-8">
      {/* Floating Button with Unread Badge */}
      <AnimatePresence>
        {isVisible && !isInboxOpen && (
          <motion.button
            onClick={() => setIsInboxOpen(true)}
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-700 hover:bg-blue-800 text-white shadow-[0_8px_32px_rgba(29,78,216,0.3)] border border-blue-600/30 transition-colors relative cursor-pointer group"
            title="Open Support Inbox"
          >
            {/* Pulsing Outer Ring */}
            <div className="absolute inset-0 rounded-full bg-blue-700/30 animate-ping opacity-75 group-hover:hidden" />
            
            <Mail className="w-5 h-5 relative z-10" />

            {/* Unread Counter Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}

            {/* Tooltip Label */}
            <span className="absolute right-14 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-lg">
              Support Inbox
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Inbox Panel (Slide-up drawer / Modal) */}
      <AnimatePresence>
        {isInboxOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-[330px] sm:w-[380px] max-h-[500px] rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-[0_12px_40px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col relative"
          >
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  Support Inbox
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                    {unreadCount} new reply
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsInboxOpen(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Drawer Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[320px] max-h-[400px]">
              {messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isExpanded = expandedMessageId === msg.id;
                    const hasReply = !!msg.reply_notes;
                    const isUnreadReply = hasReply && !readMessageIds.includes(msg.id);
                    const segments = getMessageSegments(msg.message);

                    return (
                      <div
                        key={msg.id}
                        className={`rounded-xl border transition-all duration-200 ${
                          isExpanded
                            ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/10 dark:bg-blue-950/10'
                            : 'border-slate-100 dark:border-slate-900 hover:border-slate-200 dark:hover:border-slate-800 bg-white dark:bg-slate-900/40'
                        }`}
                      >
                        {/* Row Header clickable */}
                        <div
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedMessageId(null);
                            } else {
                              setExpandedMessageId(msg.id);
                              if (hasReply) {
                                handleMarkAsRead(msg.id);
                              }
                            }
                          }}
                          className="p-3.5 cursor-pointer flex items-start justify-between gap-3 select-none"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider border ${
                                msg.target_recipient === 'developer'
                                  ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/40'
                                  : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40'
                              }`}>
                                {msg.target_recipient === 'developer' ? 'Technical Dev' : 'Student Rep'}
                              </span>
                              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                msg.status === 'resolved'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450'
                                  : 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400'
                              }`}>
                                {msg.status}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs truncate">
                              {msg.subject || 'No Subject'}
                            </h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              {new Date(msg.created_at).toLocaleDateString()} · {msg.category}
                            </p>
                          </div>

                          {/* Indicators on right */}
                          <div className="flex items-center gap-2 shrink-0 pt-1">
                            {isUnreadReply && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                            )}
                            <span className={`text-slate-400 text-[10px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                              ▼
                            </span>
                          </div>
                        </div>

                        {/* Accordion Expansion (Chat History & Reply form) */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="overflow-hidden border-t border-slate-100 dark:border-slate-850/60 bg-slate-50/25 dark:bg-slate-950/40 p-4 space-y-4 text-[11px] leading-relaxed"
                            >
                              {/* Conversation History Bubble Thread */}
                              <div className="space-y-3">
                                {segments.map((seg) => (
                                  <div key={seg.id} className="space-y-0.5 max-w-[90%]">
                                    <span className="block text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                      {seg.header}
                                    </span>
                                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-350 shadow-sm">
                                      {seg.text}
                                    </div>
                                  </div>
                                ))}

                                {/* Support Desk Response Bubble */}
                                {msg.reply_notes && (
                                  <div className="space-y-0.5 ml-auto max-w-[90%] flex flex-col items-end">
                                    <span className="block text-[8px] font-extrabold text-blue-500 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                      <MessageSquare className="w-2.5 h-2.5" />
                                      Support Response (Admin)
                                    </span>
                                    <div className="bg-blue-50/60 dark:bg-blue-950/30 p-2.5 rounded-2xl rounded-tr-none border border-blue-100/50 dark:border-blue-900/30 text-blue-800 dark:text-blue-300 font-medium shadow-sm text-right">
                                      {msg.reply_notes}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Interactive Inline Reply Input Bar */}
                              <div className="pt-3 border-t border-slate-150/60 dark:border-slate-800/80">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder={msg.status === 'resolved' ? "Re-open ticket by replying..." : "Write a response..."}
                                    value={replyTexts[msg.id] || ''}
                                    onChange={(e) => setReplyTexts(prev => ({ ...prev, [msg.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSendReply(msg.id);
                                      }
                                    }}
                                    disabled={isReplyingId === msg.id}
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-slate-850 dark:text-slate-200 placeholder:text-slate-400 placeholder:dark:text-slate-600 shadow-sm"
                                  />
                                  <button
                                    onClick={() => handleSendReply(msg.id)}
                                    disabled={isReplyingId === msg.id || !(replyTexts[msg.id] || '').trim()}
                                    className="p-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* EMPTY STATE (No support requests sent) */
                <div className="text-center py-12 text-slate-400 dark:text-slate-550 space-y-4 px-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-350 dark:text-slate-600">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11.5px] font-bold text-slate-700 dark:text-slate-350">Your Inbox is Empty</p>
                    <p className="text-[10px] leading-relaxed text-slate-450 dark:text-slate-500 max-w-[240px] mx-auto">
                      Any academic advocacy tickets or dev support requests you submit on the Contact page will appear here.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/contact');
                      setIsInboxOpen(false);
                    }}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold rounded-xl text-[10.5px] border border-blue-100 dark:border-blue-900/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
                  >
                    <span>Open New Support Request</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-900 text-[9px] text-slate-400 text-center font-medium">
              Powered by <span className="font-bold text-blue-600 dark:text-blue-400">Galvaniy Technologies</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
