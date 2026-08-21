import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MapPin, 
  HelpCircle, 
  Code, 
  Bug, 
  Send, 
  UserCheck, 
  MessageSquarePlus, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  X,
  Phone,
  Shield,
  Paperclip,
  Upload,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';
// import { supportService } from '../services/supportService';

const CONTACT_INFO = {
  DEV_EMAIL: 'dev-support@studentsaffairs.com',
  LEADERS_EMAIL: 'academic-affairs@onuss.uonbi.ac.ke',
  REGISTRAR_EMAIL: 'clearinghouse@uonbi.ac.ke',
  LOCATION: 'Gandhi Wing / Science Complex, Ground Floor, Main Campus',
  TELEPHONE: '+254 (020) 491 0000',
};

const CAROUSEL_SLIDES = [
  {
    image: '/onuss_kaleb_poster.jpg',
    title: 'Official Academic Grievance Clearinghouse Initiative',
    subtitle: 'Championed by Kaleb Wambua & Student Affairs Leadership to solve missing marks and streamline Senate clearance.',
  },
  {
    image: '/onuss_poster_banner.jpg',
    title: 'Academic Advocacy & Grade Clearinghouse',
    subtitle: 'Advocating for student rights, grade transparency, and Senate academic appeals across all UoN science faculties.',
  },
  {
    image: '/unsa_academic_sec.jpg',
    title: 'Dedicated Science Student Representation',
    subtitle: 'Connect directly with Student Affairs Representatives for missing mark escalations and faculty HOD follow-ups.',
  },
];

function formatNameFromEmail(email?: string): string {
  if (!email) return '';
  const prefix = email.split('@')[0];
  if (!prefix) return '';
  return prefix
    .split(/[\._]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function ContactPage() {
  const { user } = useUser();
  const [activeModal, setActiveModal] = useState<'developer' | 'student_leader' | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Form State
  const [category, setCategory] = useState('Missing Mark Delay');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [senderName, setSenderName] = useState('');

  // Attachment State
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');

  // Academic Profile State
  const [regNumber, setRegNumber] = useState('');
  const [campus, setCampus] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [semester, setSemester] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Carousel timer
  useEffect(() => {
    if (!activeModal) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeModal]);

  const autoFillProfile = () => {
    if (user) {
      setUserEmail(user.email || '');
      const nameVal = user.username && !user.username.includes('@') 
        ? user.username 
        : formatNameFromEmail(user.email);
      setSenderName(nameVal || '');

      setRegNumber(user.reg_number || 'F17/141029/2022');
      setCampus(user.campus || 'Main Campus');
      setFaculty(user.faculty || 'Faculty of Science & Technology');
      setDepartment(user.department || 'Department of Computer Science');
      setCourse(user.course || 'B.Sc. Computer Science');
      setYearOfStudy(user.year_of_study || 'Year 3');
      setSemester(user.semester || 'Semester 2');
    }
  };

  useEffect(() => {
    document.title = 'Student Support & Advocacy Desk - UoN Clearinghouse';
    autoFillProfile();
  }, [user]);

  const openModal = (type: 'developer' | 'student_leader') => {
    autoFillProfile();
    setActiveModal(type);
    if (type === 'developer') {
      setCategory('UI / Layout Glitch');
      setSubject('Technical Issue Report');
    } else {
      setCategory('Missing Mark Delay');
      setSubject('Academic Advocacy & Grade Discrepancy');
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setMessage('');
    setSubject('');
    setAttachmentUrl(null);
    setAttachmentName('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachmentUrl(event.target?.result as string);
      toast.success(`Attached ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachmentUrl(null);
    setAttachmentName('');
  };

  const handleSendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    if (!message.trim()) {
      toast.error('Please type your message before sending.');
      return;
    }

    toast.info(
      activeModal === 'developer'
        ? 'In-app developer support ticket submission is currently archived. Please email us directly.'
        : 'In-app student leader ticket submission is currently archived. Please email us directly.'
    );
    closeModal();
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl text-slate-700 dark:text-slate-350 space-y-8">
      
      {/* Page Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden border border-slate-200/50 dark:border-slate-800 flex items-center justify-center mb-3 shadow-sm">
          <img src="/uon_crest.jpg" className="w-full h-full object-cover" alt="UoN Crest" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-slate-100">
          Student Affairs Academic Support Desk
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
          Need assistance with a grade grievance or clearance issues? Student Affairs Leadership is here to advocate for you.
        </p>
      </div>

      {/* Main Support Options (Two Primary Pillars) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Pillar 1: Developer Technical Support */}
        <div className="clay-card p-6 border border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-b from-blue-50/40 to-transparent dark:from-blue-950/20 dark:to-transparent space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Code size={20} />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                Technical
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Developer &amp; Systems Support
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Report technical glitches, broken UI elements, upload failures, or system errors directly to the dev team.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <button
              onClick={() => openModal('developer')}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <Bug size={15} /> Report Site Bug / Issue
            </button>
            <div className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold text-center py-1">
              Developer Support: {CONTACT_INFO.DEV_EMAIL}
            </div>
          </div>
        </div>

        {/* Pillar 2: Student Leaders for Academic Affairs */}
        <div className="clay-card p-6 border border-emerald-200/60 dark:border-emerald-900/40 bg-gradient-to-b from-emerald-50/40 to-transparent dark:from-emerald-950/20 dark:to-transparent space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <UserCheck size={20} />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                Student Advocacy
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Student Leaders (Academic Affairs)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Connect with Student Representatives for grade dispute advocacy, missing mark delays, and Senate appeals.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <button
              onClick={() => openModal('student_leader')}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm text-center"
            >
              <MessageSquarePlus size={15} /> Contact Student Reps
            </button>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold text-center py-1">
              Official Email: {CONTACT_INFO.LEADERS_EMAIL}
            </div>
          </div>
        </div>

      </div>

      {/* Secondary Office Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.a 
          href={`mailto:${CONTACT_INFO.REGISTRAR_EMAIL}`}
          target="_blank" 
          rel="noopener noreferrer"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex items-center gap-4 transition-colors cursor-pointer shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
            <Mail size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Official Registrar Email</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{CONTACT_INFO.REGISTRAR_EMAIL}</p>
          </div>
        </motion.a>

        <div className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Physical Helpdesk</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{CONTACT_INFO.LOCATION}</p>
          </div>
        </div>
      </div>

      {/* Record Sync Help Note */}
      <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Record Synchronization Assistance</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            If your registration number or enrolled course unit details appear mismatched on your dashboard, please visit the UoN ICT Center or contact the Examinations Registrar to verify your Student Management Information System (SMIS) database records.
          </p>
        </div>
      </div>

      {/* OPTIMIZED FULL-SCREEN OVERLAY WORKSPACE (SPLIT 2-COLUMN DESIGN) */}
      {activeModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/98 backdrop-blur-2xl overflow-y-auto p-4 pb-28 md:p-6 md:pb-8 lg:p-8 animate-in fade-in duration-200">
          
          <div className="max-w-6xl mx-auto min-h-full flex flex-col justify-center space-y-4">
            
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                  activeModal === 'developer'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {activeModal === 'developer' ? <Bug size={18} /> : <UserCheck size={18} />}
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-bold text-white leading-tight">
                    {activeModal === 'developer'
                      ? 'Developer Technical Support Desk'
                      : 'Student Academic Advocacy Workspace'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {activeModal === 'developer'
                      ? 'Direct channel to engineering support'
                      : 'Direct channel to Student Representatives'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {/* Channel Switcher Pills */}
                <div className="hidden sm:flex p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal('student_leader');
                      setCategory('Missing Mark Delay');
                      setSubject('Academic Advocacy & Grade Discrepancy');
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      activeModal === 'student_leader'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserCheck size={12} /> Student Reps
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal('developer');
                      setCategory('UI / Layout Glitch');
                      setSubject('Technical Issue Report');
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      activeModal === 'developer'
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Bug size={12} /> Tech Bug
                  </button>
                </div>

                <button
                  onClick={closeModal}
                  className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Close Workspace"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Split 2-Column Grid Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (5 Cols): Hero Carousel */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Hero Carousel Banner Card */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl aspect-[16/10] group">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0"
                    >
                      <img 
                        src={CAROUSEL_SLIDES[currentSlide].image} 
                        alt={CAROUSEL_SLIDES[currentSlide].title}
                        className="w-full h-full object-cover opacity-65" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    </motion.div>
                  </AnimatePresence>

                  {/* Text Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-4 space-y-1 z-10">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600/80 backdrop-blur-md text-white text-[9px] font-extrabold uppercase tracking-widest border border-blue-400/30">
                      <GraduationCap size={11} />
                      Student Leadership
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {CAROUSEL_SLIDES[currentSlide].title}
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                      {CAROUSEL_SLIDES[currentSlide].subtitle}
                    </p>
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

              </div>

              {/* Right Column (7 Cols): Compose Form Workspace */}
              <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
                
                {/* Minimal Identity Bar */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>
                      {user ? (
                        <>
                          Sending as <strong className="text-white">{user.username || senderName}</strong> ({user.email})
                        </>
                      ) : (
                        'Public visitor mode'
                      )}
                    </span>
                  </div>

                  {user && (
                    <span className="font-mono text-[10px] font-bold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/40">
                      {regNumber || 'F17/141029/2022'} · {campus || 'Main Campus'}
                    </span>
                  )}
                </div>

                <form onSubmit={handleSendSupportMessage} className="space-y-3.5">
                  
                  {/* Name and Email for logged out visitors */}
                  {!user && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Your Full Name</label>
                        <input
                          type="text"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="e.g. Emily Wanjiru Kamau"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">University Email Address</label>
                        <input
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="student@student.uonbi.ac.ke"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Category & Subject Line */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        {activeModal === 'developer' ? 'Technical Bug Category' : 'Grievance Category'}
                      </label>
                      {activeModal === 'developer' ? (
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="UI / Layout Glitch">UI / Visual Layout Glitch</option>
                          <option value="Proof Upload Error">File / Proof Attachment Error</option>
                          <option value="SSO Login Issue">Google SSO / Login Issue</option>
                          <option value="Ticket Status Sync">Ticket Status Synchronization</option>
                          <option value="Other Technical Error">Other Technical Glitch</option>
                        </select>
                      ) : (
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Missing Mark Delay">Missing Mark Processing Delay</option>
                          <option value="Grade Discrepancy">Grade / Score Discrepancy</option>
                          <option value="Exam Absence Appeal">Exam Absence / Special Appeal</option>
                          <option value="Unit Allocation Error">Unit Allocation &amp; Registration</option>
                          <option value="General Academic Advocacy">General Academic Advocacy</option>
                        </select>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Subject Line</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder={
                          activeModal === 'developer' 
                            ? 'e.g. Broken file upload button on Chrome mobile' 
                            : 'e.g. ICS 2205 Lab score missing from SMIS portal'
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">
                      Detailed Message / Grievance Explanation
                    </label>
                    <textarea
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        activeModal === 'developer'
                          ? 'Describe the bug or error message step-by-step. What happened, what did you expect to happen, and which browser/device were you using?'
                          : 'Provide complete details regarding your academic grievance. Mention the unit code, lecturer name, exam date, and what assistance you need from student leaders...'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs leading-relaxed focus:outline-none focus:border-blue-500 transition-all resize-y min-h-[120px]"
                    />
                  </div>

                  {/* File Attachment Upload Control */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Paperclip size={12} className="text-blue-400" />
                        Attach Proof / Screenshot (Optional)
                      </span>
                      <span className="text-[9px] text-slate-400 font-normal">Images (PNG/JPG) or PDF up to 5MB</span>
                    </label>

                    {attachmentUrl ? (
                      <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                        <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                          {attachmentUrl.startsWith('data:image/') ? (
                            <img src={attachmentUrl} alt="Preview" className="w-8 h-8 object-cover rounded-lg shrink-0 border border-slate-800" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                              <FileText size={14} />
                            </div>
                          )}
                          <div className="truncate">
                            <div className="font-semibold text-slate-200 truncate">{attachmentName}</div>
                            <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 size={10} /> Attachment ready to send
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={removeAttachment}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Remove attachment"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-2.5 bg-slate-950 hover:bg-slate-900 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer transition-all">
                        <Upload size={14} className="text-blue-400" />
                        <span>Click to upload image, exam docket, or PDF proof</span>
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full sm:w-auto px-6 py-2.5 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all ${
                        activeModal === 'developer'
                          ? 'bg-blue-700 hover:bg-blue-800'
                          : 'bg-emerald-700 hover:bg-emerald-800'
                      }`}
                    >
                      <Send size={14} /> {submitting ? 'Transmitting...' : 'Send Message Direct to Portal'}
                    </button>
                  </div>
                </form>

              </div>

            </div>

            {/* Official Representative Helpdesk Box (LAST) */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-lg">
              <div className="flex items-center gap-2 font-bold text-white text-xs shrink-0">
                <Shield size={16} className="text-emerald-400" />
                Student Representative Helpdesk
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="font-mono">{CONTACT_INFO.LEADERS_EMAIL}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span>{CONTACT_INFO.LOCATION}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span>{CONTACT_INFO.TELEPHONE}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
