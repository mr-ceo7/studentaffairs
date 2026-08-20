import React, { useState, useEffect, useRef } from 'react';
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
  GraduationCap,
  ChevronDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ticketService, type TicketData, type TicketCreatePayload } from '../services/ticketService';
import { API_BASE_URL } from '../services/apiClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'new-claim' | 'my-tickets'>('my-tickets');
  const [subTab, setSubTab] = useState<'unread' | 'read'>('unread');
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

  // Listen to hash changes and navigation events to switch tabs automatically (e.g. from header notifications click)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#tickets') {
        setActiveTab('my-tickets');
      }
    };
    const handleNavigateTickets = () => {
      setActiveTab('my-tickets');
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('navigate:tickets', handleNavigateTickets);
    handleHashChange();
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('navigate:tickets', handleNavigateTickets);
    };
  }, []);

  // Form states — auto-fill from user profile
  const [regNumber, setRegNumber] = useState(user.reg_number || '');
  const [unitCode, setUnitCode] = useState('');
  const [unitSearch, setUnitSearch] = useState('');
  const [debouncedUnitSearch, setDebouncedUnitSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const unitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUnitSearch(unitSearch);
    }, 200);
    return () => clearTimeout(handler);
  }, [unitSearch]);

  useEffect(() => {
    if (!unitCode) {
      setUnitSearch('');
    } else {
      setUnitSearch(unitCode);
    }
  }, [unitCode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (unitRef.current && !unitRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [category, setCategory] = useState('');
  const [claimedScore, setClaimedScore] = useState('');
  const [isScoreUnknown, setIsScoreUnknown] = useState(false);
  const [notes, setNotes] = useState('');
  const [agree, setAgree] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // RegEx validation helper
  const [regError, setRegError] = useState(false);

  // Multi-step form step state
  const [formStep, setFormStep] = useState(1);

  // Expanded ticket card state
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Step validation and transition handlers
  const handleNextStep = () => {
    if (formStep === 1) {
      if (!regNumber || regError) {
        toast.error('Please enter a valid Registration Number in the format ABC/12345/2022');
        return;
      }
      
      const selectedUnit = unitSearch.trim();
      if (!selectedUnit) {
        toast.error('Please select or type a course unit.');
        return;
      }
      
      setUnitCode(selectedUnit);
      setFormStep(2);
    } else if (formStep === 2) {
      if (!category) {
        toast.error('Please select an assessment category.');
        return;
      }
      if (!isScoreUnknown && (!claimedScore || isNaN(Number(claimedScore)))) {
        toast.error('Please enter a valid claimed score.');
        return;
      }
      setFormStep(3);
    }
  };

  const handlePrevStep = () => {
    if (formStep > 1) {
      setFormStep((prev) => prev - 1);
    }
  };

  // Auto-fill reg number from profile when user data loads
  useEffect(() => {
    if (user.reg_number && !regNumber) {
      setRegNumber(user.reg_number);
    }
  }, [user.reg_number]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const incomingFiles = Array.from(files) as File[];
    const duplicates = incomingFiles.filter(f => 
      uploadedFiles.some(uploaded => uploaded.name === f.name)
    );

    let filesToUpload = incomingFiles;
    if (duplicates.length > 0) {
      toast.warning(`Skipped duplicate file(s): ${duplicates.map(d => d.name).join(', ')}`);
      filesToUpload = incomingFiles.filter(f => 
        !uploadedFiles.some(uploaded => uploaded.name === f.name)
      );
      if (filesToUpload.length === 0) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB
    const overSizeFiles = incomingFiles.filter(f => f.size > MAX_FILE_SIZE);
    if (overSizeFiles.length > 0) {
      toast.error(`File(s) exceed 3MB limit: ${overSizeFiles.map(o => o.name).join(', ')}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (uploadedFiles.length + filesToUpload.length > 3) {
      toast.error('You can only upload up to 3 total files.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const filesData = await ticketService.uploadFiles(filesToUpload);
      setUploadedFiles((prev) => [...prev, ...filesData]);
      toast.success(`Successfully uploaded ${filesToUpload.length} document(s).`);
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.detail || 'Failed to upload files. Please try again.';
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regNumber || regError) {
      toast.error('Please enter a valid Registration Number in the format ABC/12345/2022');
      return;
    }
    const finalUnitCode = unitCode.trim() || unitSearch.trim();
    if (!finalUnitCode) {
      toast.error('Please select or type a course unit.');
      return;
    }
    if (!category) {
      toast.error('Please select an assessment category.');
      return;
    }
    if (!isScoreUnknown && (!claimedScore || isNaN(Number(claimedScore)))) {
      toast.error('Please enter a valid claimed score.');
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
        faculty: user.faculty || 'Faculty of Science & Technology',
        department: user.department || 'Computing & Informatics',
        unit_code: finalUnitCode,
        assessment_category: category,
        claimed_score: isScoreUnknown ? undefined : Number(claimedScore),
        proof_attachment: uploadedFiles.map(f => f.url).join(',') || undefined,
        additional_notes: notes
      };
      
      await ticketService.createTicket(payload);
      toast.success('Grievance ticket created successfully!');
      
      // Reset form — keep reg number from profile
      setRegNumber(user.reg_number || '');
      setUnitCode('');
      setCategory('');
      setClaimedScore('');
      setIsScoreUnknown(false);
      setNotes('');
      setAgree(false);
      setUploadedFiles([]);
      setFormStep(1);
      
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
    <div className="space-y-6 text-slate-700 dark:text-slate-300">
      {/* Welcome Message (above hero) — visible on mobile, hidden on desktop */}
      <div className="reveal active space-y-1 px-1 md:hidden">
        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest block">Student Portal</span>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Welcome, {user.username}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-none">
          {user.faculty || 'Faculty of Science & Technology'} · {user.department || 'Department of Computing & Informatics'}
        </p>
      </div>

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
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Subtle Dark Overlay to dim hero & improve text legibility on desktop */}
        <div className="absolute inset-0 bg-black/45 md:bg-black/55 z-10 pointer-events-none" />

        {/* Desktop Overlay: Welcome text & CTA buttons (visible on desktop only) */}
        <div className="hidden md:flex flex-col justify-between absolute inset-0 z-20 p-8 text-white">
          {/* Welcome Message */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block">Student Portal</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
              Welcome, {user.username}
            </h1>
            <p className="text-slate-200 text-xs font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
              {user.faculty || 'Faculty of Science & Technology'} · {user.department || 'Department of Computing & Informatics'}
            </p>
          </div>

          {/* CTA Tab Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={() => setActiveTab('new-claim')}
              className={`px-5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                activeTab === 'new-claim' 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-slate-800/90 border-slate-700/80 hover:bg-slate-700/90 text-white/95'
              }`}
            >
              <PlusCircle size={14} />
              New Claim Ticket
            </button>
            <button 
              onClick={() => setActiveTab('my-tickets')}
              className={`px-5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                activeTab === 'my-tickets' 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-slate-800/90 border-slate-700/80 hover:bg-slate-700/90 text-white/95'
              }`}
            >
              <ListTodo size={14} />
              My Tickets ({tickets.length})
            </button>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => setHeroSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 cursor-pointer"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 cursor-pointer"
        >
          <ChevronRight size={14} />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-2 right-3 flex gap-1.5 z-30">
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

      {/* Tab Buttons (below hero) — visible on mobile, hidden on desktop */}
      <div className="flex gap-2 md:hidden">
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

      {/* Tab Panels */}
      {activeTab === 'new-claim' ? (
        <div className="clay-card p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 reveal active max-w-4xl mx-auto space-y-5">
          {/* Compact Header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                <FileText size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  File a Missing / Disputed Mark
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">Submit exam sheets or CAT dockets for validation</p>
              </div>
            </div>
            {regNumber && !regError && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200/50 dark:border-emerald-900/50">
                <CheckSquare size={11} /> {regNumber}
              </span>
            )}
          </div>


          {/* Step Progress Indicator */}
          <div className="flex items-center justify-between px-1 py-1.5 max-w-md mx-auto border-b border-slate-50 dark:border-slate-850 pb-3">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (step < formStep) {
                        setFormStep(step);
                      } else if (step === 2 && formStep === 1) {
                        handleNextStep();
                      } else if (step === 3 && formStep === 2) {
                        handleNextStep();
                      }
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer ${
                      formStep === step
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/10'
                        : formStep > step
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {formStep > step ? '✓' : step}
                  </button>
                  <span className={`text-[10px] uppercase font-bold tracking-wider hidden sm:inline ${
                    formStep === step
                      ? 'text-slate-800 dark:text-slate-200 font-extrabold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {step === 1 ? 'Academic' : step === 2 ? 'Grievance' : 'Submit'}
                  </span>
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full ${
                    formStep > step ? 'bg-emerald-500' : 'bg-slate-150 dark:bg-slate-800'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <form onSubmit={handleSubmitClaim} className="space-y-4">
            <AnimatePresence mode="wait">
              {formStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Course Unit Code
                    </label>
                    <div ref={unitRef} className="relative">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search or select course unit..."
                          value={unitSearch}
                          onChange={(e) => {
                            setUnitSearch(e.target.value);
                            setIsDropdownOpen(true);
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                          className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all pr-8"
                        />
                        <div 
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-slate-500 dark:text-slate-400"
                        >
                          <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.12 }}
                            className="absolute z-30 w-full mt-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl overflow-hidden max-h-[160px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar"
                          >
                            {UNITS.filter(u => u.toLowerCase().includes(debouncedUnitSearch.toLowerCase())).length > 0 ? (
                              UNITS.filter(u => u.toLowerCase().includes(debouncedUnitSearch.toLowerCase())).map(u => (
                                <div
                                  key={u}
                                  onClick={() => {
                                    setUnitCode(u);
                                    setUnitSearch(u);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`p-2.5 text-xs text-left cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/80 font-medium ${
                                    unitCode === u ? 'bg-blue-50/40 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {u}
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-xs text-slate-500 dark:text-slate-400 italic text-center">
                                No matching units found
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}

              {formStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  {/* Row 2: Category + Score */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Assessment Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer transition-all"
                      >
                        <option value="" className="bg-white dark:bg-slate-950">Select Category...</option>
                        {CATEGORIES.map(c => (
                          <option key={c} value={c} className="bg-white dark:bg-slate-950">{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Claimed Score / Grade
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer text-[9px] font-extrabold text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200 select-none">
                          <input
                            type="checkbox"
                            checked={isScoreUnknown}
                            onChange={(e) => {
                              setIsScoreUnknown(e.target.checked);
                              if (e.target.checked) {
                                setClaimedScore('');
                              }
                            }}
                            className="rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                          />
                          <span>Mark is Missing</span>
                        </label>
                      </div>
                      <input
                        type="number"
                        placeholder={isScoreUnknown ? "N/A (Mark completely missing)" : "e.g. 68"}
                        value={claimedScore}
                        disabled={isScoreUnknown}
                        onChange={(e) => setClaimedScore(e.target.value)}
                        className={`w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none transition-all ${
                          isScoreUnknown ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-950/20' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Notes (compact) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Describe your issue
                    </label>
                    <textarea
                      placeholder="Provide clear details (e.g. invigilator name, exam room, script docket code, or why the mark is missing)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                      maxLength={500}
                      rows={5}
                      className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none transition-all resize-none"
                    />
                    <div className="flex justify-between items-center mt-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 select-none">
                      <span>Limit: 500 characters</span>
                      <span className={notes.length >= 480 ? 'text-red-500 dark:text-red-400' : ''}>
                        {notes.length}/500
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {formStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  {/* Proof Upload (compact inline) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Proof Attachment
                    </label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.heic"
                        className="hidden"
                      />

                      <div 
                        onClick={handleFileUpload}
                        className={`border border-dashed rounded-xl p-3 cursor-pointer transition-all flex items-center gap-3 ${
                          uploadedFiles.length > 0
                            ? 'border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/20' 
                            : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-900/40'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          uploadedFiles.length > 0
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          <Upload size={16} className={isUploading ? 'animate-bounce' : ''} />
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-semibold block truncate ${uploadedFiles.length > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {isUploading 
                              ? 'Uploading documents...' 
                              : uploadedFiles.length > 0 
                                ? `✓ ${uploadedFiles.length} file(s) attached` 
                                : 'Tap to attach supporting documents (Optional)'}
                          </span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400">PDF, Word (DOC, DOCX), or images (PNG, JPG, HEIC) up to 3MB (Max 3 files)</span>
                        </div>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {uploadedFiles.map((f, idx) => {
                            const isImage = /\.(jpg|jpeg|png|webp|heic)$/i.test(f.name);
                            const fullUrl = f.url.startsWith('http') ? f.url : `${API_BASE_URL}${f.url}`;
                            return (
                              <div key={idx} className="relative group bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/60 rounded-xl overflow-hidden">
                                {isImage ? (
                                  <a href={fullUrl} target="_blank" rel="noreferrer">
                                    <img
                                      src={fullUrl}
                                      alt={f.name}
                                      className="w-full h-20 object-cover rounded-t-xl bg-white dark:bg-black/25"
                                    />
                                  </a>
                                ) : (
                                  <a href={fullUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center h-20 bg-slate-100 dark:bg-slate-900">
                                    <FileText size={24} className="text-slate-400 dark:text-slate-500" />
                                  </a>
                                )}
                                <div className="flex items-center justify-between px-2 py-1.5">
                                  <span className="truncate text-[9px] font-semibold text-slate-650 dark:text-slate-350 max-w-[80%]">{f.name}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Disclaimer (compact) */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-900/50 space-y-2">
                    <div className="flex gap-2 items-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-[9px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Academic Integrity Disclaimer</span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      By submitting, I affirm all details represent my own work. Falsified documents constitute misconduct under UoN Senate Regulations.
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-700 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                      />
                      <span className="text-[10px] text-slate-700 dark:text-slate-300 select-none font-medium">I accept UoN academic integrity bylaws</span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit / Navigation Row */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {formStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              
              {formStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 sm:flex-none ml-auto px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none ml-auto px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all whitespace-nowrap"
                >
                  <ArrowRight size={14} />
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              )}
              
              <button
                type="button"
                onClick={() => {
                  setRegNumber(user.reg_number || '');
                  setUnitCode('');
                  setCategory('');
                  setClaimedScore('');
                  setIsScoreUnknown(false);
                  setNotes('');
                  setAgree(false);
                  setUploadedFiles([]);
                  setFormStep(1);
                }}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-all"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="reveal active space-y-4">
          {/* Section Header (No Parent Card background) */}
          <div className="flex justify-between items-center px-1">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                Active Grievance Tickets
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Review the clearance timeline of your marks.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 px-3 py-1 rounded-full shadow-sm whitespace-nowrap shrink-0">{tickets.length} Total</span>
          </div>

          {tickets.length > 0 ? (
            <>
              {/* Tab Switcher for separating read/unread tickets */}
              <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <button
                  onClick={() => setSubTab('unread')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    subTab === 'unread'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Attention Needed
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-md ${
                    subTab === 'unread' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  }`}>
                    {tickets.filter(t => {
                      const statusLower = t.status.toLowerCase();
                      if (statusLower.includes('awaiting student') || statusLower.includes('insufficient proof') || statusLower.includes('rejected')) return true;
                      return t.comments?.some(c => c.author_role !== 'student' && !c.is_read) || false;
                    }).length}
                  </span>
                </button>
                <button
                  onClick={() => setSubTab('read')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    subTab === 'read'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Seen & Acted Upon
                </button>
              </div>

              {/* Grid of displayed tickets */}
              {tickets.filter(t => {
                const isUnread = t.status.toLowerCase().includes('awaiting student') || 
                                 t.status.toLowerCase().includes('insufficient proof') || 
                                 t.status.toLowerCase().includes('rejected') || 
                                 t.comments?.some(c => c.author_role !== 'student' && !c.is_read);
                return subTab === 'unread' ? isUnread : !isUnread;
              }).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tickets.filter(t => {
                    const isUnread = t.status.toLowerCase().includes('awaiting student') || 
                                     t.status.toLowerCase().includes('insufficient proof') || 
                                     t.status.toLowerCase().includes('rejected') || 
                                     t.comments?.some(c => c.author_role !== 'student' && !c.is_read);
                    return subTab === 'unread' ? isUnread : !isUnread;
                  }).map(t => {
                    const isUnread = t.status.toLowerCase().includes('awaiting student') || 
                                     t.status.toLowerCase().includes('insufficient proof') || 
                                     t.status.toLowerCase().includes('rejected') || 
                                     t.comments?.some(c => c.author_role !== 'student' && !c.is_read);

                    return (
                      <div 
                        key={t.ticket_id} 
                        onClick={() => navigate(`/clearance/ticket/${t.ticket_id}`)}
                        className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-800 hover:ring-2 hover:ring-blue-500/5 transition-all duration-200 shadow-sm flex flex-col gap-3 cursor-pointer"
                      >
                        {/* Top Row: Ticket ID badge & Date */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="New Activity" />
                            )}
                            <span className="font-mono font-extrabold text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/80 px-2.5 py-0.5 rounded-lg shrink-0">
                              {t.ticket_id}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {new Date(t.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Main Title: Course Unit Code & Title */}
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                            {t.unit_code}
                          </h3>
                          {/* Subtitle: Student Name (Reg No) · Assessment Category */}
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium font-bold truncate">
                            {t.assessment_category}
                          </p>
                        </div>

                        {/* Divider line */}
                        <div className="border-t border-slate-100 dark:border-slate-800/80 my-0.5" />

                        {/* Bottom Metrics Row */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-slate-400">
                            <span>Claimed: <strong className="text-amber-600 dark:text-amber-500 font-extrabold">{t.claimed_score !== null ? `${t.claimed_score}%` : '—'}</strong></span>
                            <span className="text-slate-200 dark:text-slate-750">|</span>
                            <span>Verified: <strong className={t.verified_score !== null && t.verified_score !== undefined ? 'text-emerald-600 dark:text-emerald-450 font-extrabold' : 'text-slate-500 dark:text-slate-400 font-extrabold'}>
                              {t.verified_score !== null && t.verified_score !== undefined ? `${t.verified_score}%` : 'Pending'}
                            </strong></span>
                          </div>

                          {/* Status Text on right */}
                          <span className={`text-[10px] font-extrabold tracking-wider uppercase ${
                            t.status.toLowerCase().includes('clear') || t.status.toLowerCase().includes('sms')
                              ? 'text-emerald-600 dark:text-emerald-450'
                              : t.status.toLowerCase().includes('reject')
                                ? 'text-red-650 dark:text-red-400'
                                : 'text-blue-700 dark:text-blue-400'
                          }`}>
                            {t.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50/40 dark:bg-slate-900/10 rounded-2xl border border-slate-100 dark:border-slate-850 text-slate-400 italic text-xs">
                  {subTab === 'unread' ? "No unread claims or tickets requiring your attention!" : "No seen tickets in this tab."}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <BookOpen size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Active Tickets</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Submit a new claim to start tracking missing marks.</p>
              <button
                onClick={() => setActiveTab('new-claim')}
                className="mt-3 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 mx-auto transition-all cursor-pointer shadow-sm"
              >
                <PlusCircle size={14} />
                File New Claim
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
