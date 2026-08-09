import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  ListTodo, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckSquare, 
  Calendar, 
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ticketService, type TicketData, type TicketCreatePayload } from '../services/ticketService';
import { toast } from 'sonner';

interface StudentPortalProps {
  user: any;
  onTicketClick: (ticketId: string) => void;
  key?: string;
}

const REGEX_REG_NUMBER = /^([A-Z0-9]{2,3})\/([0-9]{5,6})\/([0-9]{4})$/;

const UNITS = [
  "ICS 2101 — Data Structures & Algorithms",
  "ICS 2205 — Database Systems",
  "ICS 2303 — Computer Networks",
  "ICS 2401 — Software Engineering",
  "PHY 1101 — Mechanics & Sound",
  "MAT 2201 — Linear Algebra I",
  "CIV 2210 — Structural Analysis",
  "ACC 3105 — Financial Reporting"
];

const CATEGORIES = [
  "End of Semester Main Exam",
  "Continuous Assessment Test (CAT)",
  "Lab Report / Practical Score",
  "Fieldwork / Industrial Attachment"
];

const HERO_SLIDES = [
  {
    image: '/onuss_claims_hero.jpg',
    title: 'ONUSS Marks Discrepancy & Claims Clearinghouse',
    subtitle: 'Submit, track, and resolve missing marks and grade disputes through the official ONUSS digital pipeline.',
  },
  {
    image: '/onuss_kaleb_poster.jpg',
    title: 'Championed by ONUSS Executive Leadership',
    subtitle: 'Kaleb Wambua & ONUSS Academic Secretaries are dedicated to resolving your grade grievances efficiently.',
  },
  {
    image: '/onuss_poster_banner.jpg',
    title: 'ONUSS Academic Advocacy & Grade Clearinghouse',
    subtitle: 'Grade transparency, Senate appeals, and faculty HOD follow-ups for all UoN science students.',
  },
];

export default function StudentPortalView({ user, onTicketClick }: StudentPortalProps) {
  const [activeTab, setActiveTab] = useState<'new-claim' | 'my-tickets'>('new-claim');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);

  // Hero carousel auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Form states
  const [regNumber, setRegNumber] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [category, setCategory] = useState('');
  const [claimedScore, setClaimedScore] = useState('');
  const [notes, setNotes] = useState('');
  const [agree, setAgree] = useState(false);
  const [fileName, setFileName] = useState('');
  
  // RegEx validation helper
  const [regError, setRegError] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [activeTab]);

  const loadTickets = async () => {
    try {
      const data = await ticketService.listTickets();
      setTickets(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load tickets');
    }
  };

  const handleRegChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    setRegNumber(uppercaseVal);
    if (uppercaseVal.length > 0) {
      setRegError(!REGEX_REG_NUMBER.test(uppercaseVal));
    } else {
      setRegError(false);
    }
  };

  const handleFileUpload = () => {
    // Mimic file upload for high-fidelity interactive flow
    const fileOptions = [
      'exam_slip_stamped.pdf', 
      'cat_sheet_docket_scan.jpeg', 
      'lab_attendance_pg1.pdf', 
      'attachment_evaluation_form.pdf'
    ];
    const randomFile = fileOptions[Math.floor(Math.random() * fileOptions.length)];
    setFileName(randomFile);
    toast.success(`Attached proof document: ${randomFile}`);
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regNumber || regError) {
      toast.error('Please enter a valid Registration Number in the format ABC/12345/2022');
      return;
    }
    if (!unitCode) {
      toast.error('Please select a course unit.');
      return;
    }
    if (!category) {
      toast.error('Please select an assessment category.');
      return;
    }
    if (!claimedScore || isNaN(Number(claimedScore))) {
      toast.error('Please enter a valid claimed score.');
      return;
    }
    if (!fileName) {
      toast.error('Please attach a proof document (exam slip, docket, or sheet).');
      return;
    }
    if (!agree) {
      toast.error('You must agree to the academic integrity authorization disclaimer.');
      return;
    }

    setLoading(true);
    try {
      const payload: TicketCreatePayload = {
        reg_number: regNumber,
        faculty: "Faculty of Science & Technology",
        department: "Computing & Informatics",
        unit_code: unitCode,
        assessment_category: category,
        claimed_score: Number(claimedScore),
        proof_attachment: fileName,
        additional_notes: notes
      };
      
      await ticketService.createTicket(payload);
      toast.success('Grievance ticket created successfully!');
      
      // Reset form
      setRegNumber('');
      setUnitCode('');
      setCategory('');
      setClaimedScore('');
      setNotes('');
      setAgree(false);
      setFileName('');
      
      // Load and redirect
      setActiveTab('my-tickets');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  // Status style helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted to Department/Lecturer':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50';
      case 'Under Departmental Processing':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50';
      case 'Awaiting Student Response':
        return 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/50';
      case 'Rejected — Insufficient Proof':
        return 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/55 dark:border-red-900/50';
      case 'Cleared for SMS Update':
        return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-900/50';
      case 'Verified on SMS':
        return 'bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-700 dark:border-emerald-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6 pt-2 text-slate-700 dark:text-slate-300">
      {/* ONUSS Claims Hero Carousel */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xl aspect-[21/9] sm:aspect-[3/1] group">
        <AnimatePresence mode="wait">
          <motion.div
            key={heroSlide}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <img
              src={HERO_SLIDES[heroSlide].image}
              alt={HERO_SLIDES[heroSlide].title}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Text Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600/80 backdrop-blur-md text-white text-[9px] font-extrabold uppercase tracking-widest border border-emerald-400/30">
            <GraduationCap size={11} />
            ONUSS Grade Claims Portal
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
            {HERO_SLIDES[heroSlide].title}
          </h3>
          <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2 max-w-xl">
            {HERO_SLIDES[heroSlide].subtitle}
          </p>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => setHeroSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
        >
          <ChevronRight size={14} />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-2 right-3 flex gap-1.5 z-20">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                i === heroSlide ? 'bg-white w-4' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Header Profile Info */}
      <div className="reveal active flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest block">Student Portal</span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            Welcome, {user.username}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-none">
            Faculty of Science & Technology · Department of Computing & Informatics
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('new-claim')}
            className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'new-claim' 
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 shadow-sm font-bold' 
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <PlusCircle size={14} />
            New Claim Ticket
          </button>
          <button 
            onClick={() => setActiveTab('my-tickets')}
            className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'my-tickets' 
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 shadow-sm font-bold' 
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ListTodo size={14} />
            My Tickets ({tickets.length})
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'new-claim' ? (
        <div className="clay-card p-6 bg-white border border-slate-200/60 reveal active max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-750 dark:text-blue-400" />
              File a Missing Mark / Disputed Mark Claim
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Submit your exam sheets or CAT dockets for department validation.</p>
          </div>

          <form onSubmit={handleSubmitClaim} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS/45231/2022"
                  value={regNumber}
                  onChange={(e) => handleRegChange(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-900/40 border rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none transition-all ${
                    regError 
                      ? 'border-red-500/50 focus:border-red-500' 
                      : 'border-slate-200 dark:border-slate-800 focus:border-blue-455 dark:focus:border-blue-500'
                  }`}
                />
                <span className={`text-[9px] mt-1 block ${regError ? 'text-red-500 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                  Format: ABC/12345/2022 (Letters, slash, 5 or 6 digits, slash, Year)
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Course Unit Code
                </label>
                <select
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 focus:border-blue-450 dark:focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer transition-all"
                >
                  <option value="" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">Select Course Unit...</option>
                  {UNITS.map(u => (
                    <option key={u} value={u} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Assessment Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 focus:border-blue-450 dark:focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer transition-all"
                >
                  <option value="" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">Select Category...</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Claimed Score / Grade
                </label>
                <input
                  type="number"
                  placeholder="e.g. 68"
                  value={claimedScore}
                  onChange={(e) => setClaimedScore(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 focus:border-blue-450 dark:focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none transition-all"
                />
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block">Specify your score as written on exam sheets or CAT evaluation</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider mb-1">
                Proof Attachment (PDF or JPEG, max 5MB)
              </label>
              <div 
                onClick={handleFileUpload}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  fileName 
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50/20 dark:bg-blue-950/20 text-blue-900 dark:text-blue-350' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-50/70 dark:hover:bg-slate-900/60 text-slate-500 dark:text-slate-400'
                }`}
              >
                <Upload size={24} className={fileName ? 'text-blue-700 dark:text-blue-400 animate-bounce' : 'text-slate-400'} />
                <span className="text-xs font-semibold">{fileName ? `Attached: ${fileName}` : 'Click to attach stamped exam card, CAT docket, or graded script'}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">Accepted formats: PDF or JPG, max 5MB. Ensure signatures and dates are visible.</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider mb-1">
                Additional Notes / Context (optional)
              </label>
              <textarea
                placeholder="Provide details about invigilators, exam rooms, or script codes to assist validation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 focus:border-blue-450 dark:focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none transition-all resize-none"
              />
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/50 dark:border-amber-900/50 space-y-2.5">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Academic Integrity Disclaimer</span>
              </div>
              <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                By submitting this claim, I affirm that all supporting files and details represent my own academic work. Submitting falsified documents or grades constitutes academic misconduct under UoN Senate Regulations and will result in disciplinary hearings, suspensions, or expulsion.
              </p>
              <label className="flex items-start gap-2.5 pt-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-700 focus:ring-blue-550 mt-0.5 cursor-pointer w-4 h-4"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 select-none">I accept and consent to evaluation of this academic claim under UoN integrity bylaws.</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm cursor-pointer"
              >
                Submit Grievance Claim
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegNumber('');
                  setUnitCode('');
                  setCategory('');
                  setClaimedScore('');
                  setNotes('');
                  setAgree(false);
                  setFileName('');
                }}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="clay-card p-6 bg-white border border-slate-200/60 reveal active space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-blue-750 dark:text-blue-400" />
                Active Grievance Tickets
              </h2>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Review the clearance timeline of your marks.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{tickets.length} Total</span>
          </div>

          {tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-550 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Unit Code</th>
                    <th className="py-3 px-4">Assessment</th>
                    <th className="py-3 px-4 text-center">Claimed</th>
                    <th className="py-3 px-4 text-center">Verified</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {tickets.map(t => (
                    <tr key={t.ticket_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{t.ticket_id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{t.unit_code.split(' — ')[0]}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{t.unit_code.split(' — ')[1]}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-650 dark:text-slate-400">{t.assessment_category}</td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">{t.claimed_score}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-blue-800 dark:text-blue-400">{t.verified_score !== null && t.verified_score !== undefined ? t.verified_score : '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border uppercase tracking-wide inline-block ${getStatusBadge(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1.5 border-none">
                        <Calendar size={12} />
                        {new Date(t.updated_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onTicketClick(t.ticket_id)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 rounded-lg font-semibold text-[10px] transition-all cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          View Thread
                          <ArrowRight size={10} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800">
              <BookOpen size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Active Tickets</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Submit a new claim to start tracking missing marks.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
