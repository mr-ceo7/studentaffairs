import { useEffect } from 'react';
import { Target, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function AboutUsPage() {
  useEffect(() => {
    document.title = 'About the Portal - UoN Clearinghouse';
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 sm:py-16 max-w-4xl text-slate-700 dark:text-slate-300">
      
      {/* Hero Section */}
      <div className="text-center mb-16">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 mb-6 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm shrink-0"
        >
          <img src="/uon_crest.jpg" className="w-full h-full object-cover" alt="UoN Crest" />
        </motion.div>
        <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-slate-100 mb-4 tracking-tight leading-tight">
          Clear Marks Faster. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 font-extrabold">Streamline Clearance.</span>
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The Automated Missing Marks & Academic Grievance Clearinghouse connects UoN students, course lecturers, and department HODs to resolve grading disputes transparently and securely.
        </p>
      </div>

      {/* Core Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <ShieldCheck className="w-8 h-8 text-blue-750 dark:text-blue-400 mb-4" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">Structured Auditable Trails</h3>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
            Every ticket logs an immutable history of status transitions and comments. Both students and registrars can verify precisely who verified or updated a score and when.
          </p>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <Zap className="w-8 h-8 text-blue-755 dark:text-blue-400 mb-4" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">Accelerated Timelines</h3>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
            Directly routes claims to the assigned unit lecturers, cutting mark resolution times from several months to a matter of days. Students receive real-time email alerts.
          </p>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <Target className="w-8 h-8 text-blue-755 dark:text-blue-400 mb-4" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">Student Privacy First</h3>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
            In compliance with strict data minimization bylaws, the portal only processes academic credentials (registration number, unit, marks), never collecting passwords or ID numbers.
          </p>
        </div>
      </div>

      {/* Origin Story */}
      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/50 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <img src="/uon_crest.jpg" className="w-64 h-64 object-cover" alt="UoN Crest Watermark" />
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Our Initiative</h2>
          <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl text-xs sm:text-sm">
            <p>
              The Automated Missing Marks Clearinghouse was commissioned by the Office of Academic Affairs to replace archaic, paper-based grievance files that frequently led to lost records and graduation delays.
            </p>
            <p>
              By structuring claims into a web-based, role-gated pipeline, students can submit graded slips, lecturers can verify and grade sheets digitally, and Faculty Boards can export aggregated clearance packets with a single click.
            </p>
            <p>
              This portal serves as the unified standard for academic records clearance across all 10 faculties at the University of Nairobi, ensuring trust and academic integrity is maintained throughout the curriculum lifecycle.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
