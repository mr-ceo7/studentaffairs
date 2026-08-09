import { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
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
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl text-slate-700">
      <div className="text-center mb-10">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
          <HelpCircle size={28} />
        </div>
        <h1 className="text-3xl font-display font-extrabold text-slate-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-slate-500 text-xs">Everything you need to know about resolving missing grades at UoN.</p>
      </div>
      
      <div className="space-y-8">
        {FAQS.map((section, sIndex) => (
          <div key={sIndex} className="mb-8">
            <h2 className="text-sm font-extrabold text-blue-800 uppercase tracking-widest mb-4">{section.category}</h2>
            <div className="space-y-3">
              {section.questions.map((faq, qIndex) => {
                const id = `${sIndex}-${qIndex}`;
                const isOpen = openIndex === id;
                return (
                  <div key={id} className="border border-slate-200 rounded-xl overflow-hidden bg-white/70 backdrop-blur-md shadow-sm">
                    <button
                      onClick={() => toggle(id)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-slate-800 text-sm">{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-6 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/30">
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
