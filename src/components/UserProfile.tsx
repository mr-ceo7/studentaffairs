import { X, User, LogOut, Shield, GraduationCap, BookOpen, Building } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, logout } = useUser();

  if (!isOpen || !user) return null;

  const isStudent = user.email.endsWith('@student.uonbi.ac.ke');
  const isAdmin = user.is_admin;
  
  // Resolve academic details (can be mocked cleanly based on user data for high-fidelity representation)
  const regNumber = isStudent ? (user.email === 'emily.wanjiru@student.uonbi.ac.ke' ? 'CS/45231/2022' : 'CS/40118/2021') : 'N/A';
  const faculty = "Faculty of Science & Technology";
  const department = "Computing & Informatics";
  const assignedUnits = isStudent 
    ? [] 
    : ["ICS 2101 — Data Structures & Algorithms", "ICS 2205 — Database Systems", "ICS 2303 — Computer Networks", "ICS 2401 — Software Engineering"];

  const handleLogoutClick = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md clay-card rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-2xl overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 hover:scale-110 active:scale-95 cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-850 pb-6">
          <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
            {user.profile_picture ? (
              <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-50 dark:bg-slate-900 text-blue-750 dark:text-blue-400 flex items-center justify-center font-bold text-lg uppercase">
                {user.username.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display truncate">{user.username}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user.email}</p>
          </div>
        </div>


        {/* Academic Details Card */}
        <div className="space-y-4 mb-6">
          {isStudent ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/50">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Registration No.</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{regNumber}</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/50">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Department</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block" title={department}>{department}</span>
              </div>
              <div className="col-span-2 bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/50 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400 dark:text-slate-550" />
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Faculty</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block" title={faculty}>{faculty}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/50 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-450 dark:text-slate-550" />
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block mb-0.5">Department & Faculty</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">{department} · {faculty}</span>
                </div>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/50">
                <div className="flex items-center gap-1.5 mb-2 text-slate-500">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Assigned Unit Codes</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {assignedUnits.map(unit => (
                    <span key={unit} className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-450 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-900/40">
                      {unit.split(' — ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 border-t border-slate-100 dark:border-slate-850 pt-5 justify-between items-center">
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-950/25 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl transition-all text-xs font-bold border border-red-100 dark:border-red-900/30 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Logout Session
          </button>
          
          <div className="flex gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all text-xs font-bold"
              >
                <Shield className="w-4 h-4" /> Registrar Dashboard
              </Link>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-705 transition-all text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
