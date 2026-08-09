import { useState } from 'react';
import { 
  ClipboardList, 
  BookOpen, 
  ShieldAlert, 
  HelpCircle, 
  Headphones, 
  Calculator, 
  Bell, 
  GraduationCap, 
  MoreHorizontal, 
  Info, 
  FileText 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function BottomNav() {
  const { user } = useUser();
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Determine user roles
  const isStudent = user?.email.endsWith('@student.uonbi.ac.ke');
  const isStaff = user?.email.endsWith('@uonbi.ac.ke');
  const isAdmin = user?.is_admin;

  // Detect if any path within the "More" popover is active
  const morePaths = ['/catalog', '/contact', '/faq', '/about', '/admin', '/privacy', '/terms'];
  const isMoreActive = morePaths.includes(location.pathname);

  return (
    <div className="relative">
      {/* More Links Popover Card Overlay */}
      {isMoreOpen && (
        <>
          {/* Backdrop mask to dismiss the popover on click outside */}
          <div 
            className="fixed inset-0 z-40 bg-black/5 dark:bg-transparent" 
            onClick={() => setIsMoreOpen(false)}
          />
          
          {/* Popover Card content */}
          <div 
            className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-3.5 shadow-2xl z-50 space-y-1.5 animate-fade-in"
            style={{ 
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
            }}
          >
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/60 mb-1">
              More Services
            </div>
            
            {/* Course Catalog */}
            {user && (
              <Link 
                to="/catalog" 
                onClick={() => setIsMoreOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isActive('/catalog') 
                    ? 'bg-blue-50/70 border-blue-100/50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/40 dark:text-blue-300' 
                    : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen size={14} className={isActive('/catalog') ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-450'} />
                Course Catalog
              </Link>
            )}

            {/* Support Desk */}
            <Link 
              to="/contact" 
              onClick={() => setIsMoreOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isActive('/contact') 
                  ? 'bg-blue-50/70 border-blue-100/50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/40 dark:text-blue-300' 
                  : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Headphones size={14} className={isActive('/contact') ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-450'} />
              Support Desk
            </Link>

            {/* FAQs */}
            <Link 
              to="/faq" 
              onClick={() => setIsMoreOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isActive('/faq') 
                  ? 'bg-blue-50/70 border-blue-100/50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/40 dark:text-blue-300' 
                  : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle size={14} className={isActive('/faq') ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-450'} />
              FAQs / Help
            </Link>

            {/* About UoN Clearinghouse */}
            <Link 
              to="/about" 
              onClick={() => setIsMoreOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isActive('/about') 
                  ? 'bg-blue-50/70 border-blue-100/50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/40 dark:text-blue-300' 
                  : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Info size={14} className={isActive('/about') ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-450'} />
              About UoN Clearinghouse
            </Link>

            {/* Registrar Panel (Admin user only) */}
            {user?.is_admin && (
              <Link 
                to="/admin" 
                onClick={() => setIsMoreOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isActive('/admin') 
                    ? 'bg-amber-50/50 border-amber-200/50 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-300' 
                    : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-900 dark:hover:text-amber-250'
                }`}
              >
                <ShieldAlert size={14} className="text-amber-500" />
                Admin Panel
              </Link>
            )}

            <div className="border-t border-slate-100 dark:border-slate-800/60 my-1 pt-1.5" />

            {/* Privacy Policy */}
            <Link 
              to="/privacy" 
              onClick={() => setIsMoreOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
            >
              <FileText size={12} />
              Privacy Policy
            </Link>

            {/* Terms of Service */}
            <Link 
              to="/terms" 
              onClick={() => setIsMoreOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
            >
              <FileText size={12} />
              Terms of Service
            </Link>
          </div>
        </>
      )}

      {/* Main Bottom Navigation Bar */}
      <nav 
        className="md:hidden bg-slate-200/90 dark:bg-slate-950/90 backdrop-blur-md fixed bottom-0 w-full max-w-lg left-1/2 -translate-x-1/2 z-[10000] rounded-t-[32px] border-t border-slate-300/40 dark:border-slate-800/40 flex justify-around items-center h-22 px-2 pb-safe shadow-lg transition-colors duration-300"
        style={{ WebkitBackdropFilter: 'blur(30px) saturate(1.5)' }}
      >
        {/* 1. Claims / Dashboard */}
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center transition-all duration-300 ${
            isActive('/') 
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-semibold shadow-sm border border-slate-100 dark:border-slate-800/50 px-3.5 py-2.5 rounded-2xl scale-105' 
              : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2'
          }`}
        >
          <ClipboardList size={18} className={isActive('/') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'} />
          <span className="font-bold text-[8px] tracking-wider uppercase mt-1">
            {user ? (isAdmin ? 'Admin' : isStudent ? 'Claims' : 'Queue') : 'Gateway'}
          </span>
        </Link>

        {/* 2. Clearance (Student only) or Catalog (Staff/Admin only) */}
        {user && isStudent && (
          <Link 
            to="/clearance" 
            className={`flex flex-col items-center justify-center transition-all duration-300 ${
              isActive('/clearance') 
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-semibold shadow-sm border border-slate-100 dark:border-slate-800/50 px-3.5 py-2.5 rounded-2xl scale-105' 
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2'
            }`}
          >
            <GraduationCap size={18} className={isActive('/clearance') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'} />
            <span className="font-bold text-[8px] tracking-wider uppercase mt-1">Clearance</span>
          </Link>
        )}

        {user && (isStaff || isAdmin) && (
          <Link 
            to="/catalog" 
            className={`flex flex-col items-center justify-center transition-all duration-300 ${
              isActive('/catalog') 
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-semibold shadow-sm border border-slate-100 dark:border-slate-800/50 px-3.5 py-2.5 rounded-2xl scale-105' 
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2'
            }`}
          >
            <BookOpen size={18} className={isActive('/catalog') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'} />
            <span className="font-bold text-[8px] tracking-wider uppercase mt-1">Catalog</span>
          </Link>
        )}

        {/* 3. GPA Calculator (Student only) */}
        {user && isStudent && (
          <Link 
            to="/gpa" 
            className={`flex flex-col items-center justify-center transition-all duration-300 ${
              isActive('/gpa') 
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-semibold shadow-sm border border-slate-100 dark:border-slate-800/50 px-3.5 py-2.5 rounded-2xl scale-105' 
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2'
            }`}
          >
            <Calculator size={18} className={isActive('/gpa') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'} />
            <span className="font-bold text-[8px] tracking-wider uppercase mt-1">GPA Calc</span>
          </Link>
        )}

        {/* 4. Notices Bulletin (Logged in only) or FAQ (Logged out only) */}
        {user ? (
          <Link 
            to="/notices" 
            className={`flex flex-col items-center justify-center transition-all duration-300 ${
              isActive('/notices') 
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-semibold shadow-sm border border-slate-100 dark:border-slate-800/50 px-3.5 py-2.5 rounded-2xl scale-105' 
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2'
            }`}
          >
            <Bell size={18} className={isActive('/notices') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'} />
            <span className="font-bold text-[8px] tracking-wider uppercase mt-1">Bulletins</span>
          </Link>
        ) : (
          <Link 
            to="/faq" 
            className={`flex flex-col items-center justify-center transition-all duration-300 ${
              isActive('/faq') 
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-semibold shadow-sm border border-slate-100 dark:border-slate-800/50 px-3.5 py-2.5 rounded-2xl scale-105' 
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2'
            }`}
          >
            <HelpCircle size={18} className={isActive('/faq') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'} />
            <span className="font-bold text-[8px] tracking-wider uppercase mt-1">FAQ</span>
          </Link>
        )}

        {/* 5. More Menu Tab (Always Visible) */}
        <button 
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center justify-center transition-all duration-300 focus:outline-none ${
            (isMoreActive || isMoreOpen)
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-semibold shadow-sm border border-slate-100 dark:border-slate-800/50 px-3.5 py-2.5 rounded-2xl scale-105' 
              : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2'
          }`}
        >
          <MoreHorizontal size={18} className={(isMoreActive || isMoreOpen) ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-450'} />
          <span className="font-bold text-[8px] tracking-wider uppercase mt-1">More</span>
        </button>
      </nav>
    </div>
  );
}
