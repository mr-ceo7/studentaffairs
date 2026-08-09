import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FAQS = [
  {
    category: "General Information",
    questions: [
      { 
        q: "What is the UoN Academic Grievance Clearinghouse?", 
        a: "The Clearinghouse is a digital, role-gated platform built by the Office of Academic Affairs to replace manual, paper-based processes for resolving missing marks, disputed grades, and incomplete coursework records across all 10 faculties." 
      },
      { 
        q: "Who is eligible to submit a missing marks claim?", 
        a: "Any active student at the University of Nairobi. You must authenticate using your official university email domain (@student.uonbi.ac.ke) to access the submission portal." 
      },
      { 
        q: "How does the clearance workflow progress?", 
        a: "The clearance pipeline has three steps: (1) Student submits a ticket with stamped exam cards or CAT dockets, (2) The unit lecturer reviews the evidence and forwards it with a verified mark to the Head of Department, and (3) The HOD or Exam Officer approves the score and clearinghouse updates it on the Student Management System (SMS)." 
      }
    ]
  },
  {
    category: "Claims & Supporting Proof",
    questions: [
      { 
        q: "What documents are accepted as valid proof of attendance?", 
        a: "You can upload stamped exam cards, signed CAT invigilation dockets, graded laboratory/fieldwork sheets, or screenshots of portal registration logs. The files must be PDF or JPEG formats, under 5MB each." 
      },
      { 
        q: "What happens if my proof is illegible or insufficient?", 
        a: "The unit lecturer will flag your ticket as 'Awaiting Student Response' and post a request in your feedback thread. You will receive an alert and can reply directly with clearer attachments without filing a duplicate claim." 
      },
      { 
        q: "What are the consequences of uploading fake documents?", 
        a: "The clearinghouse operates under UoN Senate academic integrity bylaws. Submitting forged or modified dockets constitutes academic fraud and leads to immediate suspension, disciplinary hearings, or permanent expulsion." 
      }
    ]
  }
];

export default function FAQPage() {
  useEffect(() => {
    document.title = 'Portal FAQs - UoN Clearinghouse';
  }, []);

  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl text-slate-700 dark:text-slate-350">
      <div className="text-center mb-10">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden border border-slate-205/50 dark:border-slate-800 flex items-center justify-center mb-3">
          <img src="/uon_crest.jpg" className="w-full h-full object-cover" alt="UoN Crest" />
        </div>
        <h1 className="text-3xl font-display font-extrabold text-slate-900 dark:text-slate-100 mb-2">Frequently Asked Questions</h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Everything you need to know about resolving missing grades at UoN.</p>
      </div>
      
      <div className="space-y-8">
        {FAQS.map((section, sIndex) => (
          <div key={sIndex} className="mb-8">
            <h2 className="text-sm font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-4">{section.category}</h2>
            <div className="space-y-3">
              {section.questions.map((faq, qIndex) => {
                const id = `${sIndex}-${qIndex}`;
                const isOpen = openIndex === id;
                return (
                  <div key={id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-sm">
                    <button
                      onClick={() => toggle(id)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-6 pb-4 text-xs text-slate-650 dark:text-slate-350 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3 bg-slate-50/30 dark:bg-slate-950/15">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
