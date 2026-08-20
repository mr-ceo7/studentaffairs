import { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  LogIn, 
  ShieldAlert, 
  Info, 
  HelpCircle, 
  Headphones, 
  ClipboardList,
  Calculator,
  Bell
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { UserProfile } from './UserProfile';

interface SidebarProps {
  className?: string;
  onShowAuth: () => void;
}

export default function Sidebar({ className = "", onShowAuth }: SidebarProps) {
  const { user } = useUser();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Determine user role details
  const isStudent = user?.email.endsWith('@student.uonbi.ac.ke');
  const isStaff = user?.email.endsWith('@uonbi.ac.ke');
  const isAdmin = user?.is_admin;

  return (
    <>
      <nav className={`w-64 h-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-3xl flex flex-col p-6 z-10 shrink-0 shadow-sm ${className}`} style={{ WebkitBackdropFilter: 'blur(30px) saturate(1.5)' }}>
        {/* Navigation Section */}
        <div className="space-y-6 flex-1 overflow-y-auto pr-1 select-none scrollbar-hide">
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3">Portal Menu</div>
            <div className="space-y-1">
              {/* Main Dashboard Link */}
              <Link 
                to="/" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 relative group overflow-hidden ${
                  isActive('/') 
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 shadow-sm' 
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                }`}
              >
                {isActive('/') && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-700 dark:bg-blue-500 rounded-full" />
                )}
                <ClipboardList size={18} className={isActive('/') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'} />
                {user ? (isAdmin ? 'Registrar Master' : isStudent ? 'My Claims' : 'Lecturer Queue') : 'Faculty Gateway'}
              </Link>

              {/* Archived features:
              {user && (
                <Link 
                  to="/catalog" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 relative group overflow-hidden ${
                    isActive('/catalog') 
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 shadow-sm' 
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  {isActive('/catalog') && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-700 dark:bg-blue-500 rounded-full" />
                  )}
                  <BookOpen size={18} className={isActive('/catalog') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'} />
                  Course Catalog
                </Link>
              )}

              {user && (
                <Link 
                  to="/gpa" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 relative group overflow-hidden ${
                    isActive('/gpa') 
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 shadow-sm' 
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  {isActive('/gpa') && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-700 dark:bg-blue-500 rounded-full" />
                  )}
                  <Calculator size={18} className={isActive('/gpa') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'} />
                  GPA Calculator
                </Link>
              )}

              {user && (
                <Link 
                  to="/notices" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 relative group overflow-hidden ${
                    isActive('/notices') 
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 shadow-sm' 
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  {isActive('/notices') && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-700 dark:bg-blue-500 rounded-full" />
                  )}
                  <Bell size={18} className={isActive('/notices') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'} />
                  Official Bulletins
                </Link>
              )}

              {user && (
                <Link 
                  to="/clearance" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 relative group overflow-hidden ${
                    isActive('/clearance') 
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 shadow-sm' 
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  {isActive('/clearance') && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-700 dark:bg-blue-500 rounded-full" />
                  )}
                  <GraduationCap size={18} className={isActive('/clearance') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'} />
                  Academic Clearance
                </Link>
              )}
              */}

              {/* Admin Panel Link */}
              {user?.is_admin && (
                <Link 
                  to="/admin" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 relative group overflow-hidden ${
                    isActive('/admin') 
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 shadow-sm' 
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50/30 dark:hover:bg-amber-950/20'
                  }`}
                >
                  {isActive('/admin') && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-amber-600 dark:bg-amber-500 rounded-full" />
                  )}
                  <ShieldAlert size={18} className={isActive('/admin') ? 'text-amber-600 dark:text-amber-500' : 'text-slate-500 dark:text-slate-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors'} />
                  System Admin
                </Link>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3">Information</div>
            <div className="space-y-1">
              <Link 
                to="/about" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 relative group overflow-hidden ${
                  isActive('/about') 
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 shadow-sm' 
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                }`}
              >
                {isActive('/about') && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-700 dark:bg-blue-500 rounded-full" />
                )}
                <Info size={18} className={isActive('/about') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'} />
                About Portal
              </Link>
              <Link 
                to="/faq" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 relative group overflow-hidden ${
                  isActive('/faq') 
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 shadow-sm' 
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                }`}
              >
                {isActive('/faq') && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-700 dark:bg-blue-500 rounded-full" />
                )}
                <HelpCircle size={18} className={isActive('/faq') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'} />
                Portal FAQs
              </Link>
              <Link 
                to="/contact" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 relative group overflow-hidden ${
                  isActive('/contact') 
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 shadow-sm' 
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                }`}
              >
                {isActive('/contact') && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-700 dark:bg-blue-500 rounded-full" />
                )}
                <Headphones size={18} className={isActive('/contact') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'} />
                Support Desk
              </Link>
            </div>
          </div>
        </div>

        {/* User Card at the bottom */}
        {user ? (
          <div 
            onClick={() => setIsProfileOpen(true)}
            className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100/85 dark:hover:bg-slate-900/85 border border-slate-200 dark:border-slate-800 mt-auto transition-all duration-300 cursor-pointer shadow-sm group relative overflow-hidden shrink-0 rounded-2xl p-4"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-3 relative z-10">
              {user.profile_picture ? (
                <img 
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 object-cover group-hover:border-blue-400 transition-colors" 
                  src={user.profile_picture} 
                  alt="User avatar" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-blue-900 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm group-hover:scale-105 transition-all">
                  {user.username.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.username}</div>
                <div className="text-[9px] text-blue-700 dark:text-blue-400 font-extrabold truncate uppercase tracking-wider mt-0.5">
                  {isAdmin ? 'Registrar' : isStudent ? 'Student' : 'Lecturer'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={onShowAuth}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-auto transition-all active:scale-[0.98] shadow-sm hover:shadow-md shrink-0 cursor-pointer text-sm"
          >
            <LogIn size={18} /> SSO Sign In
          </button>
        )}
      </nav>
      <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
