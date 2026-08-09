import { ClipboardList, BookOpen, ShieldAlert, HelpCircle, Headphones } from 'lucide-react';
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
      className="md:hidden bg-white/80 backdrop-blur-md fixed bottom-0 w-full max-w-lg left-1/2 -translate-x-1/2 z-50 rounded-t-3xl border-t border-slate-200/60 flex justify-around items-center h-20 px-1 pb-safe"
      style={{ WebkitBackdropFilter: 'blur(30px) saturate(1.5)', boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.03)' }}
    >
      <Link 
        to="/" 
        className={`flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all w-[64px] ${
          isActive('/') ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/55' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <ClipboardList size={20} />
        <span className="font-bold text-[8px] tracking-wide uppercase mt-1">
          {user ? (isAdmin ? 'Master' : isStudent ? 'Claims' : 'Queue') : 'Gateway'}
        </span>
      </Link>
      
      {user && (
        <Link 
          to="/catalog" 
          className={`flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all w-[64px] ${
            isActive('/catalog') ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/55' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen size={20} />
          <span className="font-bold text-[8px] tracking-wide uppercase mt-1">Catalog</span>
        </Link>
      )}

      <Link 
        to="/faq" 
        className={`flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all w-[64px] ${
          isActive('/faq') ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/55' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <HelpCircle size={20} />
        <span className="font-bold text-[8px] tracking-wide uppercase mt-1">FAQ</span>
      </Link>

      <Link 
        to="/contact" 
        className={`flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all w-[64px] ${
          isActive('/contact') ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/55' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Headphones size={20} />
        <span className="font-bold text-[8px] tracking-wide uppercase mt-1">Support</span>
      </Link>

      {user?.is_admin && (
        <Link 
          to="/admin" 
          className={`flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all w-[64px] ${
            isActive('/admin') ? 'bg-amber-50 text-amber-700 font-semibold shadow-sm border border-amber-200/50' : 'text-slate-500 hover:text-amber-700'
          }`}
        >
          <ShieldAlert size={20} />
          <span className="font-bold text-[8px] tracking-wide uppercase mt-1">Admin</span>
        </Link>
      )}
    </nav>
  );
}
