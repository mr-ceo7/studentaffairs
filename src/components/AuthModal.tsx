import React, { useState, useCallback, useEffect } from 'react';
import { X, Mail, ShieldAlert, GraduationCap, UserSquare2, ArrowRight, Loader2, BookOpen, Building2 } from 'lucide-react';
import { authService } from '../services/authService';
import { useUser } from '../context/UserContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledEmail?: string;
  prefilledRole?: 'student' | 'lecturer' | 'admin';
}

const CAMPUSES = [
  'Main Campus',
  'Chiromo Campus',
  'Upper Kabete Campus',
  'Lower Kabete Campus',
  'Parklands Campus',
  'Kenya Science Campus'
];

const FACULTIES = [
  "Faculty of Science & Technology",
  "Faculty of Health Sciences",
  "Faculty of Engineering",
  "Faculty of Business & Management Sciences",
  "Faculty of Arts & Social Sciences",
  "Faculty of Law",
  "Faculty of Education",
  "Faculty of Built Environment & Design",
  "Faculty of Agriculture",
  "Faculty of Veterinary Medicine"
];

export default function AuthModal({ isOpen, onClose, prefilledEmail, prefilledRole }: AuthModalProps) {
  const { refreshUser } = useUser();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'lecturer' | 'admin'>('student');

  // Academic Profile State
  const [regNumber, setRegNumber] = useState('F17/141029/2022');
  const [campus, setCampus] = useState('Main Campus');
  const [faculty, setFaculty] = useState('Faculty of Science & Technology');
  const [department, setDepartment] = useState('Department of Computer Science');
  const [course, setCourse] = useState('B.Sc. Computer Science');
  const [yearOfStudy, setYearOfStudy] = useState('Year 3');
  const [semester, setSemester] = useState('Semester 2');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate prefilled credentials when modal opens
  useEffect(() => {
    if (isOpen) {
      if (prefilledEmail) {
        setEmail(prefilledEmail);
        const emailParts = prefilledEmail.split('@')[0].split('.');
        const resolvedName = emailParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        setName(resolvedName);
      }
      if (prefilledRole) {
        setRole(prefilledRole);
      }
    }
  }, [isOpen, prefilledEmail, prefilledRole]);

  // Handle SSO submission
  const handleSSOSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your university email address.');
      return;
    }
    if (!name) {
      setError('Please enter your full name.');
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();
    if (!trimmedEmail.endsWith('@student.uonbi.ac.ke') && !trimmedEmail.endsWith('@uonbi.ac.ke')) {
      setError('Domain restriction: Use @student.uonbi.ac.ke (Students) or @uonbi.ac.ke (Staff).');
      return;
    }

    let finalRole = role;
    const isStudent = trimmedEmail.endsWith('@student.uonbi.ac.ke');
    if (isStudent) {
      finalRole = 'student';
    } else if (finalRole === 'student') {
      finalRole = 'lecturer';
    }

    setLoading(true);
    setError('');

    try {
      await authService.mockSSOLogin(
        trimmedEmail, 
        name, 
        finalRole, 
        undefined, 
        isStudent ? {
          reg_number: regNumber,
          campus,
          faculty,
          department,
          course,
          year_of_study: yearOfStudy,
          semester,
        } : undefined
      );
      await refreshUser();
      onClose();
      resetState();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, [email, name, role, regNumber, campus, faculty, department, course, yearOfStudy, semester, refreshUser, onClose]);

  // Quick sign-in helper for demo accounts
  const handleQuickSignIn = async (
    demoEmail: string, 
    demoName: string, 
    demoRole: 'student' | 'lecturer' | 'admin',
    demoProfile?: any
  ) => {
    setLoading(true);
    setError('');
    try {
      await authService.mockSSOLogin(demoEmail, demoName, demoRole, undefined, demoProfile);
      await refreshUser();
      onClose();
      resetState();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setEmail('');
    setName('');
    setRole('student');
    setError('');
  };

  const isStudentDomain = email.toLowerCase().trim().endsWith('@student.uonbi.ac.ke') || role === 'student';
  const isStaffDomain = email.toLowerCase().trim().endsWith('@uonbi.ac.ke');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg clay-card rounded-3xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <button onClick={() => { onClose(); resetState(); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-3 border border-blue-200/50 dark:border-blue-900/40">
            <GraduationCap size={28} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">University of Nairobi SSO</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Academic Missing Marks &amp; Grievance Clearinghouse</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSSOSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Emily Wanjiru"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                UoN Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. emily.wanjiru@student.uonbi.ac.ke"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  const val = e.target.value.toLowerCase().trim();
                  if (val.endsWith('@student.uonbi.ac.ke')) {
                    setRole('student');
                  } else if (val.endsWith('@uonbi.ac.ke') && role === 'student') {
                    setRole('lecturer');
                  }
                }}
                disabled={loading}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* Expanded Student Academic Profile Section */}
          {isStudentDomain && !isStaffDomain && (
            <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
                <BookOpen size={14} />
                Student Academic Profile Details
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Reg Number
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="F17/141029/2022"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Campus Location
                  </label>
                  <select
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    {CAMPUSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Faculty
                </label>
                <select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none truncate"
                >
                  {FACULTIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Department of Computer Science"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Degree Program
                  </label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="B.Sc. Computer Science"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Year of Study
                  </label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Year 1">Year 1</option>
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                    <option value="Year 4">Year 4</option>
                    <option value="Year 5">Year 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Role selector for staff domain */}
          {isStaffDomain && (
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Staff Authentication Tier
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('lecturer')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 ${
                    role === 'lecturer'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <UserSquare2 size={14} />
                  Lecturer Portal
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 ${
                    role === 'admin'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ShieldAlert size={14} />
                  Registrar / HOD
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer text-xs"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Mail size={16} /> Sign In via Google SSO
              </>
            )}
          </button>
        </form>

        {/* Demo profiles selector */}
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5">
          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 text-center">
            Or Click a Demo Account below to instantly log in
          </span>
          <div className="space-y-2">
            {/* Student demo */}
            <button
              onClick={() => handleQuickSignIn('emily.wanjiru@student.uonbi.ac.ke', 'Emily Wanjiru Kamau', 'student', {
                reg_number: 'F17/141029/2022',
                campus: 'Main Campus',
                faculty: 'Faculty of Science & Technology',
                department: 'Department of Computer Science',
                course: 'B.Sc. Computer Science',
                year_of_study: 'Year 3',
                semester: 'Semester 2',
              })}
              disabled={loading}
              className="w-full bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-xs uppercase">
                  EW
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Emily Wanjiru Kamau</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Student · F17/141029/2022 · Yr 3 Sem 2</span>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Lecturer demo */}
            <button
              onClick={() => handleQuickSignIn('peter.otieno@uonbi.ac.ke', 'Dr. Peter Otieno', 'lecturer')}
              disabled={loading}
              className="w-full bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs uppercase">
                  PO
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Dr. Peter Otieno</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Lecturer Portal · @uonbi.ac.ke</span>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Admin demo */}
            <button
              onClick={() => handleQuickSignIn('kaleb.wambua@uonbi.ac.ke', 'Prof. Kaleb Wambua', 'admin')}
              disabled={loading}
              className="w-full bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs uppercase">
                  KW
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">Prof. Kaleb Wambua</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Registrar / HOD Portal · @uonbi.ac.ke</span>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
