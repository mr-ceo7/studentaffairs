import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Mail, 
  GraduationCap, 
  UserSquare2, 
  ArrowRight, 
  Loader2, 
  BookOpen, 
  ShieldAlert, 
  ArrowLeft,
  Sun,
  Moon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  ChevronRight,
  ClipboardList,
  Building2,
  Calendar
} from 'lucide-react';
import { authService } from '../services/authService';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';

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

const CAMPUS_FACULTY_MAP: Record<string, string[]> = {
  'Main Campus': [
    "Faculty of Engineering",
    "Faculty of Built Environment & Design",
    "Faculty of Arts & Social Sciences",
    "Faculty of Education"
  ],
  'Chiromo Campus': [
    "Faculty of Science & Technology",
    "Faculty of Health Sciences"
  ],
  'Upper Kabete Campus': [
    "Faculty of Agriculture",
    "Faculty of Veterinary Medicine"
  ],
  'Lower Kabete Campus': [
    "Faculty of Business & Management Sciences"
  ],
  'Parklands Campus': [
    "Faculty of Law"
  ],
  'Kenya Science Campus': [
    "Faculty of Education"
  ]
};

const FACULTY_DEPARTMENT_MAP: Record<string, string[]> = {
  "Faculty of Science & Technology": [
    "Department of Computer Science",
    "Department of Chemistry",
    "Department of Physics",
    "Department of Mathematics",
    "Department of Biology"
  ],
  "Faculty of Engineering": [
    "Department of Electrical & Information Engineering",
    "Department of Civil & Construction Engineering",
    "Department of Mechanical & Manufacturing Engineering"
  ],
  "Faculty of Health Sciences": [
    "Department of Medicine",
    "Department of Pharmacy",
    "Department of Nursing",
    "Department of Dental Sciences"
  ],
  "Faculty of Business & Management Sciences": [
    "Department of Finance & Accounting",
    "Department of Business Administration",
    "Department of Management Science"
  ],
  "Faculty of Arts & Social Sciences": [
    "Department of Economics",
    "Department of Sociology & Social Work",
    "Department of History & Archeology"
  ],
  "Faculty of Law": [
    "Department of Public Law",
    "Department of Private Law",
    "Department of Commercial Law"
  ],
  "Faculty of Education": [
    "Department of Educational Studies",
    "Department of Physical Education & Sport"
  ],
  "Faculty of Built Environment & Design": [
    "Department of Real Estate & Construction Management",
    "Department of Architecture",
    "Department of Art & Design"
  ],
  "Faculty of Agriculture": [
    "Department of Agricultural Economics",
    "Department of Plant Science & Crop Protection"
  ],
  "Faculty of Veterinary Medicine": [
    "Department of Veterinary Anatomy & Physiology",
    "Department of Clinical Studies"
  ]
};

const DEPARTMENT_COURSE_MAP: Record<string, string[]> = {
  "Department of Computer Science": [
    "B.Sc. Computer Science",
    "B.Sc. Applied Computer Science"
  ],
  "Department of Chemistry": [
    "B.Sc. Chemistry",
    "B.Sc. Industrial Chemistry"
  ],
  "Department of Physics": [
    "B.Sc. Physics",
    "B.Sc. Meteorology"
  ],
  "Department of Mathematics": [
    "B.Sc. Mathematics",
    "B.Sc. Statistics",
    "B.Sc. Actuarial Science"
  ],
  "Department of Biology": [
    "B.Sc. Biology",
    "B.Sc. Microbiology"
  ],
  "Department of Electrical & Information Engineering": [
    "B.Sc. Electrical & Electronic Engineering"
  ],
  "Department of Civil & Construction Engineering": [
    "B.Sc. Civil Engineering"
  ],
  "Department of Mechanical & Manufacturing Engineering": [
    "B.Sc. Mechanical Engineering"
  ],
  "Department of Medicine": [
    "Bachelor of Medicine & Bachelor of Surgery (MBChB)"
  ],
  "Department of Pharmacy": [
    "Bachelor of Pharmacy (B.Pharm)"
  ],
  "Department of Nursing": [
    "B.Sc. Nursing"
  ],
  "Department of Dental Sciences": [
    "Bachelor of Dental Surgery (BDS)"
  ],
  "Department of Finance & Accounting": [
    "Bachelor of Commerce (Finance)",
    "Bachelor of Commerce (Accounting)"
  ],
  "Department of Business Administration": [
    "Bachelor of Business Administration"
  ],
  "Department of Management Science": [
    "Bachelor of Project Planning & Management"
  ],
  "Department of Economics": [
    "Bachelor of Economics",
    "Bachelor of Economics & Statistics"
  ],
  "Department of Sociology & Social Work": [
    "Bachelor of Arts (Sociology)",
    "Bachelor of Arts (Social Work)"
  ],
  "Department of History & Archeology": [
    "Bachelor of Arts (History)"
  ],
  "Department of Public Law": [
    "Bachelor of Laws (LL.B)"
  ],
  "Department of Private Law": [
    "Bachelor of Laws (LL.B)"
  ],
  "Department of Commercial Law": [
    "Bachelor of Laws (LL.B)"
  ],
  "Department of Educational Studies": [
    "Bachelor of Education (Arts)",
    "Bachelor of Education (Science)"
  ],
  "Department of Physical Education & Sport": [
    "Bachelor of Education (Physical Education)"
  ],
  "Department of Real Estate & Construction Management": [
    "Bachelor of Real Estate",
    "Bachelor of Construction Management"
  ],
  "Department of Architecture": [
    "Bachelor of Architectural Studies"
  ],
  "Department of Art & Design": [
    "Bachelor of Arts (Design)"
  ],
  "Department of Agricultural Economics": [
    "B.Sc. Agricultural Education & Extension"
  ],
  "Department of Plant Science & Crop Protection": [
    "B.Sc. Agriculture"
  ],
  "Department of Veterinary Anatomy & Physiology": [
    "Bachelor of Veterinary Medicine (BVM)"
  ],
  "Department of Clinical Studies": [
    "Bachelor of Veterinary Medicine (BVM)"
  ]
};

// Separate component so useGoogleOneTapLogin hook is only called when GoogleOAuthProvider exists
function GoogleOneTapWrapper({ onSuccess }: { onSuccess: (idToken: string) => Promise<void> }) {
  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse) => {
      if (credentialResponse.credential) {
        await onSuccess(credentialResponse.credential);
      }
    },
    onError: () => {
      console.log('Google One Tap Login Failed');
    },
  });
  return null;
}

export default function LoginPage() {
  const { user, refreshUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Onboarding Wizard States
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingUser, setOnboardingUser] = useState<any>(null);

  // Redirect if already logged in and not onboarding
  useEffect(() => {
    if (user && user.reg_number && !showOnboarding) {
      navigate('/');
    }
  }, [user, navigate, showOnboarding]);

  // General States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);

  // Onboarding Form Details
  const [regNumber, setRegNumber] = useState('');
  const [campus, setCampus] = useState('Main Campus');
  const [faculty, setFaculty] = useState('Faculty of Engineering');
  const [department, setDepartment] = useState('Department of Electrical & Information Engineering');
  const [course, setCourse] = useState('B.Sc. Electrical & Electronic Engineering');
  const [yearOfStudy, setYearOfStudy] = useState('Year 1');
  const [semester, setSemester] = useState('Semester 1');

  // Google One Tap is handled by GoogleOneTapWrapper rendered below (only when provider is available)
  const googleClientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

  // Handle Google Login logic
  const handleGoogleLoginSuccess = async (idToken: string) => {
    setLoading(true);
    setError('');
    try {
      await authService.googleLogin(idToken);
      const userData = await authService.me();
      await refreshUser();
      
      const isStudent = !userData.email.endsWith('@uonbi.ac.ke') && !userData.is_admin;
      const isNewStudent = isStudent && !userData.reg_number;

      if (isNewStudent) {
        setOnboardingUser(userData);
        setShowOnboarding(true);
      } else {
        toast.success(`Welcome back, ${userData.username}!`);
        navigate('/');
      }
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Google Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Demo Login helper
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
      const userData = await authService.me();
      await refreshUser();

      const isStudent = !userData.email.endsWith('@uonbi.ac.ke') && !userData.is_admin;
      const isNewStudent = isStudent && !userData.reg_number;

      if (isNewStudent) {
        setOnboardingUser(userData);
        setShowOnboarding(true);
      } else {
        toast.success(`Welcome back, ${userData.username}!`);
        navigate('/');
      }
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  // Onboarding Wizard Submit
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize user inputs by stripping HTML tags and trimming spaces
    const cleanReg = regNumber.replace(/<[^>]*>/g, '').trim();
    const cleanCampus = campus.replace(/<[^>]*>/g, '').trim();
    const cleanFaculty = faculty.replace(/<[^>]*>/g, '').trim();
    const cleanDept = department.replace(/<[^>]*>/g, '').trim();
    const cleanCourse = course.replace(/<[^>]*>/g, '').trim();
    const cleanYear = yearOfStudy.replace(/<[^>]*>/g, '').trim();
    const cleanSem = semester.replace(/<[^>]*>/g, '').trim();

    if (!cleanReg || !cleanDept || !cleanCourse) {
      toast.error('Please fill in all academic profile details.');
      return;
    }

    setLoading(true);
    try {
      await authService.updateProfile({
        username: onboardingUser?.username,
        reg_number: cleanReg,
        campus: cleanCampus,
        faculty: cleanFaculty,
        department: cleanDept,
        course: cleanCourse,
        year_of_study: cleanYear,
        semester: cleanSem,
      });

      toast.success('Academic Profile Setup Complete!');
      await refreshUser();
      setShowOnboarding(false);
      navigate('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-body transition-colors duration-300 relative overflow-hidden w-full">
      {googleClientId && <GoogleOneTapWrapper onSuccess={handleGoogleLoginSuccess} />}
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Onboarding Overlay Wizard */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg clay-card p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl"
            >
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <GraduationCap size={24} />
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Setup Academic Profile</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">First-time student account setup</p>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      onboardingStep === step 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' 
                        : onboardingStep > step 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}>
                      {onboardingStep > step ? <CheckCircle2 size={14} /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`w-12 h-0.5 mx-1.5 transition-all ${
                        onboardingStep > step ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              <form 
                onSubmit={handleOnboardingSubmit} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onboardingStep < 3) {
                    e.preventDefault();
                  }
                }}
                className="space-y-5"
              >
                <AnimatePresence mode="wait">
                  {onboardingStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-blue-50/50 dark:bg-blue-950/10 p-3.5 rounded-2xl border border-blue-100/50 dark:border-blue-900/10 flex gap-2.5 items-start mb-2">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-blue-800 dark:text-blue-300 leading-normal font-medium">
                          Welcome, <strong>{onboardingUser?.username}</strong>! Please enter your academic registration details to unlock clearance access.
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1">
                          Registration Number
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. F17/141029/2022"
                          value={regNumber}
                          onChange={(e) => setRegNumber(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3.5 py-3 text-xs text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/80 transition-all font-medium font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1">
                          Campus Location
                        </label>
                        <select
                          value={campus}
                          onChange={(e) => {
                            const selected = e.target.value;
                            setCampus(selected);
                            const campusFaculties = CAMPUS_FACULTY_MAP[selected] || [];
                            if (campusFaculties.length > 0) {
                              const newFac = campusFaculties[0];
                              setFaculty(newFac);
                              const facultyDepts = FACULTY_DEPARTMENT_MAP[newFac] || [];
                              if (facultyDepts.length > 0) {
                                const newDept = facultyDepts[0];
                                setDepartment(newDept);
                                const deptCourses = DEPARTMENT_COURSE_MAP[newDept] || [];
                                if (deptCourses.length > 0) {
                                  setCourse(deptCourses[0]);
                                }
                              }
                            }
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3.5 py-3 text-xs text-slate-950 dark:text-white focus:outline-none focus:border-blue-500/80 transition-all font-medium"
                        >
                          {CAMPUSES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {onboardingStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1">
                          Faculty
                        </label>
                        <select
                          value={faculty}
                          onChange={(e) => {
                            const selected = e.target.value;
                            setFaculty(selected);
                            const facultyDepts = FACULTY_DEPARTMENT_MAP[selected] || [];
                            if (facultyDepts.length > 0) {
                              const newDept = facultyDepts[0];
                              setDepartment(newDept);
                              const deptCourses = DEPARTMENT_COURSE_MAP[newDept] || [];
                              if (deptCourses.length > 0) {
                                setCourse(deptCourses[0]);
                              }
                            }
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3.5 py-3 text-xs text-slate-950 dark:text-white focus:outline-none focus:border-blue-500/80 transition-all font-medium truncate"
                        >
                          {(CAMPUS_FACULTY_MAP[campus] || FACULTIES).map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1">
                          Department Name
                        </label>
                        <select
                          value={department}
                          onChange={(e) => {
                            const selected = e.target.value;
                            setDepartment(selected);
                            const deptCourses = DEPARTMENT_COURSE_MAP[selected] || [];
                            if (deptCourses.length > 0) {
                              setCourse(deptCourses[0]);
                            }
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3.5 py-3 text-xs text-slate-950 dark:text-white focus:outline-none focus:border-blue-500/80 transition-all font-medium truncate"
                        >
                          {(FACULTY_DEPARTMENT_MAP[faculty] || []).map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {onboardingStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1">
                          Degree Course
                        </label>
                        <input
                          type="text"
                          required
                          list="course-suggestions"
                          placeholder="e.g. B.Sc. Computer Science"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3.5 py-3 text-xs text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/80 transition-all font-medium"
                        />
                        <datalist id="course-suggestions">
                          {(DEPARTMENT_COURSE_MAP[department] || []).map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1">
                            Year of Study
                          </label>
                          <select
                            value={yearOfStudy}
                            onChange={(e) => setYearOfStudy(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3.5 py-3 text-xs text-slate-950 dark:text-white focus:outline-none focus:border-blue-500/80 transition-all font-medium"
                          >
                            <option value="Year 1">Year 1</option>
                            <option value="Year 2">Year 2</option>
                            <option value="Year 3">Year 3</option>
                            <option value="Year 4">Year 4</option>
                            <option value="Year 5">Year 5</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1">
                            Semester
                          </label>
                          <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3.5 py-3 text-xs text-slate-950 dark:text-white focus:outline-none focus:border-blue-500/80 transition-all font-medium"
                          >
                            <option value="Semester 1">Semester 1</option>
                            <option value="Semester 2">Semester 2</option>
                            <option value="Semester 3">Semester 3</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-3">
                  {onboardingStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(onboardingStep - 1)}
                      className="w-1/3 py-3 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Back
                    </button>
                  )}
                  
                  <button
                    type={onboardingStep === 3 ? "submit" : "button"}
                    disabled={loading}
                    onClick={(e) => {
                      if (onboardingStep < 3) {
                        e.preventDefault();
                        if (onboardingStep === 1 && !regNumber) {
                          toast.error('Registration number is required.');
                          return;
                        }
                        if (onboardingStep === 2 && !department) {
                          toast.error('Department name is required.');
                          return;
                        }
                        setOnboardingStep(onboardingStep + 1);
                      }
                    }}
                    className={`flex-1 py-3 text-white rounded-xl font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg ${
                      onboardingStep === 3 
                        ? 'bg-blue-700 hover:bg-blue-800' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {onboardingStep < 3 ? (
                      <>
                        Continue <ChevronRight size={14} />
                      </>
                    ) : loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Complete Profile <CheckCircle2 size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left side: Premium split visual showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 text-white flex-col justify-between p-12 relative overflow-hidden border-r border-slate-800">
        {/* Background Image of UoN Campus */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/uon_campus.jpg" 
            className="w-full h-full object-cover opacity-65 dark:opacity-55 brightness-95 grayscale-[10%] contrast-[1.05]" 
            alt="UoN Campus"
          />
          {/* Vignette & dark color tint overlay to ensure text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/50 to-slate-950/80" />
        </div>

        {/* Subtle glowing gradients on left side */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 border border-slate-800 shadow-sm shrink-0">
              <img src="/uon_crest.jpg" className="w-full h-full object-cover rounded-md" alt="UoN Crest" />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-white font-display leading-none">
                Students Affairs
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">University of Nairobi</span>
            </div>
          </Link>

        </div>

        {/* Center: High fidelity visual mockup and feature list */}
        <div className="relative z-10 mt-12 mb-auto max-w-lg space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight font-display">
              Academic Missing Marks &amp; Grievance Clearinghouse
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              A modern, unified portal designed to streamline academic claims, grades verification, and student clearance processes at the University of Nairobi.
            </p>
          </div>

          {/* Quick key highlights */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
            <div className="space-y-1">
              <span className="block text-xs font-bold text-slate-200">Instant SSO</span>
              <span className="block text-[11px] text-slate-400 leading-normal">Fast, secure login using standard Google and Microsoft accounts.</span>
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-bold text-slate-200">Role-Based Portals</span>
              <span className="block text-[11px] text-slate-400 leading-normal">Tailored user interfaces for Students, Lecturers, and HOD Registrars.</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6">
          <span>&copy; 2026 University of Nairobi. All Rights Reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-slate-350 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-350 transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right side: Login Form (Exclusively Google SSO) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 min-h-screen">

        {/* Form container */}
        <div className="w-full max-w-sm space-y-6 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="text-center space-y-3">
            {/* Branding Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-1.5 border border-slate-200 dark:border-slate-800 shadow-md">
                <img src="/uon_crest.jpg" className="w-full h-full object-cover" alt="UoN Crest" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-sm font-extrabold text-slate-800 dark:text-slate-100 font-display">
                  UoN Student Affairs Portal
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">University of Nairobi</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/40 text-red-650 dark:text-red-400 text-xs font-semibold flex gap-2.5 items-start">
              <ShieldAlert className="w-4 h-4 text-red-550 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Action: Google SSO Button container */}
          <div className="relative pt-28 lg:pt-48">
            {/* Kaleb Cutout (Peaking from behind the card, pointing down) */}
            <img 
              src="/kaleb_pointing_down.png" 
              className="absolute left-1/2 -translate-x-1/2 -top-[30px] lg:-top-[15px] w-[150px] lg:w-[220px] h-[200px] lg:h-[293px] object-contain pointer-events-none z-0 select-none drop-shadow-[0_-5px_8px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_-5px_8px_rgba(0,0,0,0.4)]" 
              alt="Kaleb Wambua"
            />
            {/* Handwritten Sign In Text */}
            <div className="absolute left-[calc(50%+40px)] lg:left-[calc(50%+60px)] top-[-10px] lg:top-[15px] z-20 text-blue-500 dark:text-blue-400 rotate-6 select-none font-bold" style={{ fontFamily: '"Caveat", cursive' }}>
              <span className="block text-2xl lg:text-3xl tracking-wide whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">Sign In here!</span>
              <span className="block text-sm lg:text-base text-slate-600 dark:text-slate-300 -mt-0.5 leading-tight">
                Submit &amp; track<br />missing marks
              </span>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-900/60 flex flex-col items-center justify-center space-y-4 relative z-10">
              <div className="text-center space-y-1">
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">Continue with your University Google Account</span>
                <span className="block text-[9px] text-slate-550 dark:text-slate-400 leading-normal">Allows quick one-tap login for verified domains.</span>
              </div>

              <div className="w-full flex justify-center pt-2">
                {loading ? (
                  <div className="flex items-center justify-center py-2 text-xs font-bold text-blue-700 dark:text-blue-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...
                  </div>
                ) : googleClientId ? (
                  <GoogleLogin 
                    onSuccess={(credentialResponse) => {
                      if (credentialResponse.credential) {
                        handleGoogleLoginSuccess(credentialResponse.credential);
                      }
                    }}
                    onError={() => {
                      setError('Google SSO Sign-In Failed. Please try again.');
                    }}
                    shape="rectangular"
                    theme={theme === 'dark' ? 'filled_black' : 'outline'}
                    size="large"
                    text="continue_with"
                  />
                ) : (
                  <div className="text-xs text-slate-500 dark:text-slate-400 py-2">Google Sign-In is not configured.</div>
                )}
              </div>
            </div>
          </div>

          {/* Collapsible Demo/Quick Login panel */}
          <div className="border-t border-slate-200 dark:border-slate-850 pt-4">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-350 transition-colors py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Info size={13} />
                Demo &amp; Testing Accounts
              </span>
              {showDemoAccounts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {showDemoAccounts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2 mt-3 overflow-hidden"
                >
                  {/* Student demo */}
                  <button
                    type="button"
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
                    className="w-full bg-white dark:bg-slate-900/30 hover:bg-slate-100/70 dark:hover:bg-slate-900/70 border border-slate-200 dark:border-slate-850 rounded-xl p-3 flex items-center justify-between text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-450 flex items-center justify-center font-bold text-xs shrink-0">
                        EW
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          Emily Wanjiru Kamau
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Student &middot; Yr 3 Sem 2 &middot; Existing Account
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>

                  {/* Lecturer demo */}
                  <button
                    type="button"
                    onClick={() => handleQuickSignIn('peter.otieno@uonbi.ac.ke', 'Dr. Peter Otieno', 'lecturer')}
                    disabled={loading}
                    className="w-full bg-white dark:bg-slate-900/30 hover:bg-slate-100/70 dark:hover:bg-slate-900/70 border border-slate-200 dark:border-slate-850 rounded-xl p-3 flex items-center justify-between text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-955/40 text-emerald-700 dark:text-emerald-450 flex items-center justify-center font-bold text-xs shrink-0">
                        PO
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          Dr. Peter Otieno
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Lecturer Portal &middot; Existing Account
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>

                  {/* Admin demo */}
                  <button
                    type="button"
                    onClick={() => handleQuickSignIn('kaleb.wambua@uonbi.ac.ke', 'Prof. Kaleb Wambua', 'admin')}
                    disabled={loading}
                    className="w-full bg-white dark:bg-slate-900/30 hover:bg-slate-100/70 dark:hover:bg-slate-900/70 border border-slate-200 dark:border-slate-850 rounded-xl p-3 flex items-center justify-between text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-955/40 text-amber-700 dark:text-amber-450 flex items-center justify-center font-bold text-xs shrink-0">
                        KW
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                          Prof. Kaleb Wambua
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Registrar Portal &middot; Existing Account
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>

                  {/* Mock New Student Registration (To test onboarding wizard) */}
                  <div className="border-t border-slate-200/50 dark:border-slate-800/40 my-2 pt-2" />
                  
                  <button
                    type="button"
                    onClick={() => handleQuickSignIn('new.student@student.uonbi.ac.ke', 'New Student Setup', 'student', undefined)}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:from-blue-100/60 hover:to-indigo-100/60 dark:hover:from-blue-955/40 dark:hover:to-indigo-955/40 border border-blue-200/55 dark:border-blue-900/40 rounded-xl p-3.5 flex items-center justify-between text-left transition-all group cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        +
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-blue-800 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                          Mock New Student Sign-In
                        </span>
                        <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                          Test the interactive onboarding wizard flow!
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-blue-550 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
