import { useState } from 'react';
import { Bell, LogIn, LogOut, ShieldAlert, GraduationCap, Sun, Moon } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';
import { UserProfile } from './UserProfile';
import { useTheme } from '../context/ThemeContext';

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
              <span className="text-blue-700 dark:text-blue-400 font-extrabold">UoN</span> Clearinghouse
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Academic Grievance</span>
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

          {/* Notification Button */}
          <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:scale-105 active:scale-95 transition-all p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <Bell className="w-5 h-5" />
          </button>

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
