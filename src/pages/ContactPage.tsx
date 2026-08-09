import { useEffect } from 'react';
import { Mail, MapPin, Building2, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

const CONTACT_INFO = {
  SUPPORT_EMAIL: 'clearinghouse@uonbi.ac.ke',
  LOCATION: 'Gandhi Wing, Ground Floor, Main Campus',
  TELEPHONE: '+254 (020) 491 0000',
};

export default function ContactPage() {
  useEffect(() => {
    document.title = 'Support Desk - UoN Clearinghouse';
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl text-slate-700">
      <div className="text-center mb-10">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
          <Building2 size={28} />
        </div>
        <h1 className="text-3xl font-display font-extrabold text-slate-900 mb-2">Academic Support Desk</h1>
        <p className="text-slate-500 text-xs">
          Need assistance with a grade grievance or having issues with clearance logs? We are here to help.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <motion.a 
          href={`mailto:${CONTACT_INFO.SUPPORT_EMAIL}`}
          target="_blank" 
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/70 border border-slate-200 rounded-2xl hover:border-blue-400/50 transition-colors group cursor-pointer min-w-0 shadow-sm"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors text-slate-500 group-hover:text-blue-700 shrink-0">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 mb-1 text-center uppercase tracking-wider">Email Registrar</h2>
          <p className="text-[10px] sm:text-xs text-slate-600 text-center truncate w-full">{CONTACT_INFO.SUPPORT_EMAIL}</p>
          <p className="text-[9px] text-slate-400 text-center mt-2">Expect a reply within 24-48 hours.</p>
        </motion.a>

        <div 
          className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/70 border border-slate-200 rounded-2xl transition-colors group min-w-0 shadow-sm"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-500 shrink-0">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 mb-1 text-center uppercase tracking-wider">Physical Helpdesk</h2>
          <p className="text-[10px] sm:text-xs text-slate-600 text-center w-full leading-tight">{CONTACT_INFO.LOCATION}</p>
          <p className="text-[9px] text-slate-400 text-center mt-2">Open Weekdays 8:00 AM - 5:00 PM</p>
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-50/50 border border-blue-200/50 rounded-3xl space-y-2">
        <div className="flex gap-2 justify-center items-center mb-1">
          <HelpCircle className="w-4 h-4 text-blue-700" />
          <h3 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">Profile Record Syncing Issues?</h3>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-600 text-center leading-relaxed">
          If your student registration details, department course listings, or assigned units appear incorrect, please raise a support ticket at the UoN ICT Center or contact the Examinations Office to synchronize your records with the Student Management Information System (SMIS).
        </p>
      </div>
    </div>
  );
}
