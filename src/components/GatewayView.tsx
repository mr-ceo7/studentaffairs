import { useState } from 'react';
import { GraduationCap, Building2, User, UserSquare2, ShieldAlert } from 'lucide-react';

interface GatewayProps {
  onShowAuth: (prefilledEmail?: string, prefilledRole?: 'student' | 'lecturer' | 'admin') => void;
}

const FACULTIES = [
  { name: "Science & Technology", depts: ["Computing & Informatics", "Physics", "Mathematics", "Biochemistry"] },
  { name: "Health Sciences", depts: ["Medicine", "Nursing", "Public Health", "Pharmacy"] },
  { name: "Engineering", depts: ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering"] },
  { name: "Business & Management", depts: ["Accounting", "Finance", "Marketing"] },
  { name: "Arts & Social Sciences", depts: ["Sociology", "Literature", "History"] },
  { name: "Law", depts: ["Public Law", "Private Law"] },
  { name: "Education", depts: ["Educational Psychology", "Curriculum Studies"] },
  { name: "Built Environment", depts: ["Architecture", "Urban Planning"] },
  { name: "Agriculture", depts: ["Agricultural Economics", "Crop Science"] },
  { name: "Veterinary Medicine", depts: ["Clinical Studies", "Public Health & Pharmacology"] }
];

export default function GatewayView({ onShowAuth }: GatewayProps) {
  const [selectedFac, setSelectedFac] = useState<number | null>(null);
  const [selectedDept, setSelectedDept] = useState('');

  const handleFacultySelect = (index: number) => {
    setSelectedFac(index);
    setSelectedDept(FACULTIES[index].depts[0]);
  };

  const handleStudentSSO = () => {
    const defaultEmail = selectedFac !== null 
      ? `student.${FACULTIES[selectedFac].depts[0].toLowerCase().replace(/[^a-z]/g, '')}@student.uonbi.ac.ke` 
      : 'emily.wanjiru@student.uonbi.ac.ke';
    onShowAuth(defaultEmail, 'student');
  };

  const handleLecturerSSO = () => {
    onShowAuth('peter.otieno@uonbi.ac.ke', 'lecturer');
  };

  const handleAdminSSO = () => {
    onShowAuth('kaleb.wambua@uonbi.ac.ke', 'admin');
  };

  return (
    <div className="space-y-6 pt-2 text-slate-700 dark:text-slate-350">
      {/* Hero Header */}
      <div className="reveal active text-center py-6 px-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-3xl border border-blue-100/50 dark:border-blue-900/50 shadow-sm max-w-4xl mx-auto">
        <img src="/uon_crest.jpg" className="w-16 h-16 object-cover mx-auto mb-3 hover:scale-105 transition-all rounded-xl shadow-md border border-slate-200/50 dark:border-slate-800" alt="UoN Crest" />
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight font-display">
          UoN Academic Clearance Gateway
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed max-w-xl mx-auto">
          Select your faculty and department to log in through Single Sign-On (SSO) and access claims submission or review queues.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
        {/* Step 1: Faculty List (Glass grid) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center gap-2 px-3">
            <span className="w-5 h-5 rounded-full bg-blue-700 dark:bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Select Faculty</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FACULTIES.map((fac, idx) => (
              <button
                key={fac.name}
                onClick={() => handleFacultySelect(idx)}
                className={`clay-card p-4 text-left flex items-center gap-3 transition-all cursor-pointer ${
                  selectedFac === idx
                    ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-300 font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedFac === idx ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <GraduationCap size={16} />
                </div>
                <span className="text-xs tracking-tight truncate leading-tight block w-full">{fac.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Department and SSO login */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 px-3">
            <span className="w-5 h-5 rounded-full bg-blue-700 dark:bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">SSO Sign-in</h2>
          </div>
          
          <div className="clay-card p-6 space-y-5 h-full flex flex-col justify-start">
            {/* Department selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Select Department
              </label>
              <select
                disabled={selectedFac === null}
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 focus:border-blue-450 dark:focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {selectedFac === null ? (
                  <option className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">Select a faculty first...</option>
                ) : (
                  FACULTIES[selectedFac].depts.map((d) => (
                    <option key={d} value={d} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                      {d}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* SSO role links */}
            <div className="space-y-2 pt-2 flex-1">
              <button
                disabled={selectedFac === null}
                onClick={handleStudentSSO}
                className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-3.5 flex items-center gap-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                  <User size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-750 dark:group-hover:text-blue-400 transition-colors">Continue as Student</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">Submit missing marks · @student.uonbi.ac.ke</span>
                </div>
              </button>

              <button
                disabled={selectedFac === null}
                onClick={handleLecturerSSO}
                className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-3.5 flex items-center gap-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 flex items-center justify-center shrink-0 group-hover:bg-green-100 dark:group-hover:bg-green-900 transition-colors">
                  <UserSquare2 size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-green-750 dark:group-hover:text-green-400 transition-colors">Continue as Lecturer</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">Review and verify claims · @uonbi.ac.ke</span>
                </div>
              </button>

              <button
                onClick={handleAdminSSO}
                className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-3.5 flex items-center gap-4 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-100 dark:group-hover:bg-amber-900 transition-colors">
                  <ShieldAlert size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-750 dark:group-hover:text-amber-400 transition-colors">Continue as Registrar / HOD</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">Clearance dashboard & export · @uonbi.ac.ke</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
