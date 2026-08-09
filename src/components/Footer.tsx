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
    <footer className="w-full bg-slate-50/50 border-t border-slate-200/60 backdrop-blur-md px-6 pt-10 pb-28 md:pb-10 mt-8 rounded-t-3xl overflow-hidden relative shrink-0">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/3 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" onClick={scrollLink('/')} className="flex items-center gap-2 group">
              <GraduationCap className="w-6 h-6 text-blue-700 group-hover:scale-110 transition-transform" />
              <span className="text-lg font-display font-bold tracking-tight text-slate-800">
                <span className="text-blue-700">UoN</span> Clearinghouse
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Automated Missing Marks & Academic Grievance Clearinghouse. Connecting students, lecturers, and Head of Departments to resolve results-based disputes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { to: '/', label: 'Clearance Gateway' },
                { to: '/faq', label: 'Portal FAQs & Help' },
                { to: '/about', label: 'About the Initiative' },
                { to: '/contact', label: 'Academic Support Desk' },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} onClick={scrollLink(to)} className="text-slate-600 hover:text-blue-700 transition-colors flex items-center gap-1 group">
                    <ArrowRight size={10} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* UoN Official */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">University Links</h4>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Access the main portal and student management systems.
            </p>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <a href="https://www.uonbi.ac.ke" target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                  UoN Main Website
                </a>
              </li>
              <li>
                <a href="https://smis.uonbi.ac.ke" target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                  Student Management System (SMIS)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200/60 pt-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-[10px] text-slate-400 text-center md:text-left leading-normal">
            © {new Date().getFullYear()} University of Nairobi. Office of Academic Affairs. <br className="md:hidden" />
            All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link to="/privacy" onClick={scrollLink('/privacy')} className="text-[11px] font-medium text-slate-500 hover:text-blue-700 transition-colors">Privacy Policy</Link>
            <Link to="/terms" onClick={scrollLink('/terms')} className="text-[11px] font-medium text-slate-500 hover:text-blue-700 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
