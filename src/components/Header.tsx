import { useState, useEffect, useRef } from 'react';
import { Bell, LogIn, LogOut, ShieldAlert, Sun, Moon, Inbox, MessageSquare, AlertCircle, CheckSquare, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';
import { UserProfile } from './UserProfile';
import { useTheme } from '../context/ThemeContext';
import { ticketService } from '../services/ticketService';
import { supportService } from '../services/supportService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onShowAuth: () => void;
}

export default function Header({ onShowAuth }: HeaderProps) {
  const { user, logout } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Determine user domain
  const isStudent = user?.email.endsWith('@student.uonbi.ac.ke');
  const isStaff = user?.email.endsWith('@uonbi.ac.ke');

  const [notifications, setNotifications] = useState<any[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Load read notification IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('readNotificationIds');
      if (stored) {
        setReadNotifIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch tickets & support messages to build notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const fetchNotificationsData = async () => {
      try {
        const list: any[] = [];
        
        // 1. Fetch Student/Staff Tickets
        const tickets = await ticketService.listTickets();
        tickets.forEach(t => {
          // If ticket has been cleared or rejected, or has lecturer comment, trigger notif
          // Status change notif:
          if (t.status !== 'Submitted to Department/Lecturer') {
            list.push({
              id: `ticket-status-${t.ticket_id}-${t.status}`,
              title: `Ticket Status Updated`,
              body: `${t.unit_code.split(' — ')[0]} is now "${t.status}"`,
              time: t.updated_at,
              type: 'ticket',
              meta: t.ticket_id,
            });
          }
          // Ticket comment notifs:
          if (t.comments && t.comments.length > 0) {
            t.comments.forEach(c => {
              if (c.author_role !== 'student') {
                list.push({
                  id: `ticket-comment-${c.id}`,
                  title: `New Comment from ${c.author_name}`,
                  body: `"${c.message}"`,
                  time: c.created_at,
                  type: 'comment',
                  meta: t.ticket_id,
                });
              }
            });
          }
        });

        // 2. Fetch Support Messages (if student)
        if (isStudent) {
          const supportMsgs = await supportService.getStudentMessages();
          supportMsgs.forEach(msg => {
            if (msg.reply_notes) {
              list.push({
                id: `support-reply-${msg.id}`,
                title: `Support Response Received`,
                body: `Reply on subject: "${msg.subject || 'Inquiry'}"`,
                time: msg.updated_at,
                type: 'support',
                meta: msg.id,
              });
            }
          });
        }

        // Sort all by time desc
        list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setNotifications(list.slice(0, 10)); // keep last 10 notifications
      } catch (err) {
        console.error('Failed to build notifications list', err);
      }
    };

    fetchNotificationsData();
    const interval = setInterval(fetchNotificationsData, 20000); // refresh every 20s
    return () => clearInterval(interval);
  }, [user, isStudent]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isNotifOpen && 
        notifRef.current && 
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

  const handleMarkRead = (id: string) => {
    if (readNotifIds.includes(id)) return;
    const updated = [...readNotifIds, id];
    setReadNotifIds(updated);
    try {
      localStorage.setItem('readNotificationIds', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readNotifIds, ...allIds]));
    setReadNotifIds(updated);
    try {
      localStorage.setItem('readNotificationIds', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    toast.success('All notifications cleared!');
  };

  const handleNotificationClick = (notif: any) => {
    handleMarkRead(notif.id);
    setIsNotifOpen(false);
    
    if (notif.type === 'support') {
      window.dispatchEvent(new CustomEvent('open:support-inbox'));
    } else {
      toast.info(`Checking updates for Ticket ${notif.meta}`);
      window.location.hash = `#tickets`;
    }
  };

  const unreadNotifCount = notifications.filter(n => !readNotifIds.includes(n.id)).length;

  return (
    <>
      <header 
        className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-md sticky top-0 w-full z-50 border-b border-slate-200/60 dark:border-slate-800/60 flex justify-between items-center h-16 px-6 shrink-0 relative"
        style={{ WebkitBackdropFilter: 'blur(30px) saturate(1.5)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.02)' }}
      >
        {/* Left Section: Branding Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm shrink-0 group-hover:scale-105 group-hover:border-blue-250 dark:group-hover:border-blue-800 transition-all duration-300">
            <img src="/uon_crest.jpg" className="w-full h-full object-cover" alt="UoN Crest" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 font-display leading-none group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">
              Students Affairs
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">University of Nairobi</span>
          </div>
        </Link>

        {/* Right Section: Navigation Elements */}
        <div className="flex gap-4 items-center ml-auto">
          {/* Staff/Admin Badge */}
          {user && (
            <div className="hidden sm:flex items-center">
              {user.is_admin ? (
                <span className="text-[10px] font-extrabold px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50 rounded-full flex items-center gap-1">
                  <ShieldAlert size={12} />
                  REGISTRAR / HOD
                </span>
              ) : isStaff ? (
                <span className="text-[10px] font-extrabold px-3 py-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-900/50 rounded-full flex items-center gap-1">
                  LECTURER
                </span>
              ) : (
                <span className="text-[10px] font-extrabold px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50 rounded-full flex items-center gap-1">
                  STUDENT
                </span>
              )}
            </div>
          )}

          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:scale-105 active:scale-95 transition-all p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notification Button with dropdown */}
          <div ref={notifRef} className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:scale-105 active:scale-95 transition-all p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950" />
              )}
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-[280px] sm:w-[320px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-xl rounded-2xl overflow-hidden flex flex-col z-[100]"
                >
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-850/60 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Inbox className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      Notifications ({unreadNotifCount})
                    </span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={handleClearAll}
                        className="text-[10px] font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900 custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map(n => {
                        const isUnread = !readNotifIds.includes(n.id);
                        return (
                          <div 
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900/65 cursor-pointer transition-colors relative flex items-start gap-2.5 ${
                              isUnread ? 'bg-blue-50/10 dark:bg-blue-950/5' : ''
                            }`}
                          >
                            {isUnread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-650 dark:bg-blue-400 mt-1.5 shrink-0" />
                            )}
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <h5 className="font-bold text-[11px] text-slate-800 dark:text-slate-200 flex items-center gap-1 leading-snug">
                                {n.type === 'support' ? (
                                  <MessageSquare className="w-3 h-3 text-purple-650 dark:text-purple-400 shrink-0" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 text-blue-700 dark:text-blue-400 shrink-0" />
                                )}
                                <span className="truncate">{n.title}</span>
                              </h5>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                {n.body}
                              </p>
                              <span className="block text-[8px] text-slate-400 dark:text-slate-550 pt-0.5">
                                {new Date(n.time).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 px-4 text-center text-slate-400 dark:text-slate-550 space-y-1">
                        <CheckSquare className="w-6 h-6 mx-auto text-slate-350 dark:text-slate-700" />
                        <p className="text-[10.5px] font-bold">You are all caught up</p>
                        <p className="text-[9.5px]">No updates or notifications at the moment.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Auth/Profile Actions */}
          {user ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={logout}
                className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 rounded-xl transition-all cursor-pointer"
              >
                <LogOut size={14} /> Logout
              </button>
              <button 
                onClick={() => setIsProfileOpen(true)}
                className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 hover:scale-105 active:scale-95 hover:shadow-md hover:border-blue-400 transition-all duration-150 cursor-pointer"
              >
                {user.profile_picture ? (
                  <img 
                    alt="User avatar" 
                    className="w-full h-full object-cover" 
                    src={user.profile_picture} 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                    {user.username.charAt(0)}
                  </div>
                )}
              </button>
            </div>
          ) : (
            <button 
              onClick={onShowAuth}
              className="flex items-center gap-1.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
            >
              <LogIn size={14} /> SSO Sign In
            </button>
          )}
        </div>
      </header>
      <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
