import { 
  ClipboardList, 
  HelpCircle, 
  Headphones, 
  Info 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function BottomNav() {
  const { user } = useUser();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Determine user roles
  const isStudent = user?.email.endsWith('@student.uonbi.ac.ke');
  const isAdmin = user?.is_admin;

  return (
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

      {/* 2. Support Desk */}
      <Link 
        to="/contact" 
        className={`flex flex-col items-center justify-center transition-all duration-300 ${
          isActive('/contact') 
            ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-semibold shadow-sm border border-slate-100 dark:border-slate-800/50 px-3.5 py-2.5 rounded-2xl scale-105' 
            : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2'
        }`}
      >
        <Headphones size={18} className={isActive('/contact') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'} />
        <span className="font-bold text-[8px] tracking-wider uppercase mt-1">Support</span>
      </Link>

      {/* 3. FAQs / Help */}
      <Link 
        to="/faq" 
        className={`flex flex-col items-center justify-center transition-all duration-300 ${
          isActive('/faq') 
            ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-semibold shadow-sm border border-slate-100 dark:border-slate-800/50 px-3.5 py-2.5 rounded-2xl scale-105' 
            : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2'
        }`}
      >
        <HelpCircle size={18} className={isActive('/faq') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-450'} />
        <span className="font-bold text-[8px] tracking-wider uppercase mt-1">FAQ</span>
      </Link>

      {/* 4. About Portal */}
      <Link 
        to="/about" 
        className={`flex flex-col items-center justify-center transition-all duration-300 ${
          isActive('/about') 
            ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-semibold shadow-sm border border-slate-100 dark:border-slate-800/50 px-3.5 py-2.5 rounded-2xl scale-105' 
            : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2'
        }`}
      >
        <Info size={18} className={isActive('/about') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-450'} />
        <span className="font-bold text-[8px] tracking-wider uppercase mt-1">About</span>
      </Link>
    </nav>
  );
}
