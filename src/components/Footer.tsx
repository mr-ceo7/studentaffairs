import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();

  const scrollLink = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const container = document.querySelector('.overflow-y-auto');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    navigate(to);
  };

  return (
    <footer className="w-full bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md px-6 pt-6 pb-24 md:pb-6 mt-8 rounded-t-2xl overflow-hidden relative shrink-0">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/3 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-5 relative z-10">
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          {/* Left: Brand & Power Info */}
          <div className="space-y-1.5 text-center md:text-left">
            <Link to="/" onClick={scrollLink('/')} className="flex items-center justify-center md:justify-start gap-2 group">
              <div className="w-6 h-6 rounded-md bg-white overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow-sm shrink-0 group-hover:scale-105 transition-all">
                <img src="/uon_crest.jpg" className="w-full h-full object-cover" alt="UoN Crest" />
              </div>
              <span className="font-display font-extrabold text-sm tracking-tight text-slate-850 dark:text-slate-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">
                <span className="text-blue-700 dark:text-blue-400 font-extrabold">Students</span> Affairs
              </span>
            </Link>
            <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-none">
              Automated Missing Marks & Academic Grievance Clearinghouse
            </p>
            <p className="text-[9px] font-bold text-slate-450 dark:text-slate-500 pt-0.5 leading-none">
              Powered by <a href="https://galvaniytechnologies.xn--jhb4c.com/" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-extrabold">Galvaniy Technologies</a>
            </p>
          </div>

          {/* Right: Quick Links in Horizontal list */}
          <div className="flex flex-wrap justify-center md:justify-end gap-x-5 gap-y-2 text-xs font-semibold">
            <Link to="/" onClick={scrollLink('/')} className="text-slate-600 dark:text-slate-400 hover:text-blue-755 dark:hover:text-blue-400 transition-colors">Clearance Gateway</Link>
            <Link to="/faq" onClick={scrollLink('/faq')} className="text-slate-600 dark:text-slate-400 hover:text-blue-755 dark:hover:text-blue-400 transition-colors">Portal FAQs</Link>
            <Link to="/about" onClick={scrollLink('/about')} className="text-slate-600 dark:text-slate-400 hover:text-blue-755 dark:hover:text-blue-400 transition-colors">About Us</Link>
            <Link to="/contact" onClick={scrollLink('/contact')} className="text-slate-600 dark:text-slate-400 hover:text-blue-755 dark:hover:text-blue-400 transition-colors">Support Desk</Link>
            <a href="https://smis.uonbi.ac.ke" target="_blank" rel="noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-blue-755 dark:hover:text-blue-400 transition-colors">UoN SMIS</a>
          </div>
        </div>

        {/* Bottom copyright & legal */}
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row text-[10px] text-slate-450 dark:text-slate-500">
          <p className="text-center md:text-left leading-normal">
            © {new Date().getFullYear()} University of Nairobi. Office of Academic Affairs. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 font-semibold">
            <Link to="/privacy" onClick={scrollLink('/privacy')} className="text-slate-500 dark:text-slate-400 hover:text-blue-755 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms" onClick={scrollLink('/terms')} className="text-slate-500 dark:text-slate-400 hover:text-blue-755 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
