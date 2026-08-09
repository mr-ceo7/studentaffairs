import { useEffect } from 'react';
import { Mail, MapPin, HelpCircle } from 'lucide-react';
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
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl text-slate-700 dark:text-slate-350">
      <div className="text-center mb-10">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden border border-slate-205/50 dark:border-slate-800 flex items-center justify-center mb-3">
          <img src="/uon_crest.jpg" className="w-full h-full object-cover" alt="UoN Crest" />
        </div>
        <h1 className="text-3xl font-display font-extrabold text-slate-900 dark:text-slate-100 mb-2">Academic Support Desk</h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs">
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
          className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-400/50 dark:hover:border-blue-500 transition-colors group cursor-pointer min-w-0 shadow-sm"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20 transition-colors text-slate-500 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-400 shrink-0">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 text-center uppercase tracking-wider">Email Registrar</h2>
          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-350 text-center truncate w-full">{CONTACT_INFO.SUPPORT_EMAIL}</p>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 text-center mt-2">Expect a reply within 24-48 hours.</p>
        </motion.a>

        <div 
          className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors group min-w-0 shadow-sm"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500 dark:text-slate-400 shrink-0">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 text-center uppercase tracking-wider">Physical Helpdesk</h2>
          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-350 text-center w-full leading-tight">{CONTACT_INFO.LOCATION}</p>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 text-center mt-2">Open Weekdays 8:00 AM - 5:00 PM</p>
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/50 rounded-3xl space-y-2">
        <div className="flex gap-2 justify-center items-center mb-1">
          <HelpCircle className="w-4 h-4 text-blue-700 dark:text-blue-450" />
          <h3 className="text-xs font-extrabold text-blue-900 dark:text-blue-400 uppercase tracking-wider">Profile Record Syncing Issues?</h3>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 text-center leading-relaxed">
          If your student registration details, department course listings, or assigned units appear incorrect, please raise a support ticket at the UoN ICT Center or contact the Examinations Office to synchronize your records with the Student Management Information System (SMIS).
        </p>
      </div>
    </div>
  );
}
