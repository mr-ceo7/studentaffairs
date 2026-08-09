import React, { useState, useCallback, useEffect } from 'react';
import { X, Mail, ShieldAlert, GraduationCap, UserSquare2, ArrowRight, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import { useUser } from '../context/UserContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledEmail?: string;
  prefilledRole?: 'student' | 'lecturer' | 'admin';
}

export default function AuthModal({ isOpen, onClose, prefilledEmail, prefilledRole }: AuthModalProps) {
  const { refreshUser } = useUser();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'lecturer' | 'admin'>('student');

  // Populate prefilled credentials when modal opens
  useEffect(() => {
    if (isOpen) {
      if (prefilledEmail) {
        setEmail(prefilledEmail);
        // Extract a mock name from email for quick login convenience
        const emailParts = prefilledEmail.split('@')[0].split('.');
        const resolvedName = emailParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        setName(resolvedName);
      }
      if (prefilledRole) {
        setRole(prefilledRole);
      }
    }
  }, [isOpen, prefilledEmail, prefilledRole]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle mock SSO submission
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

    // Auto-resolve role based on email domain
    let finalRole = role;
    if (trimmedEmail.endsWith('@student.uonbi.ac.ke')) {
      finalRole = 'student';
    } else {
      // If staff, ensure they aren't marked as student
      if (finalRole === 'student') {
        finalRole = 'lecturer';
      }
    }

    setLoading(true);
    setError('');

    try {
      await authService.mockSSOLogin(trimmedEmail, name, finalRole);
      await refreshUser();
      onClose();
      resetState();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, [email, name, role, refreshUser, onClose]);

  // Quick sign-in helper for demo accounts
  const handleQuickSignIn = async (demoEmail: string, demoName: string, demoRole: 'student' | 'lecturer' | 'admin') => {
    setLoading(true);
    setError('');
    try {
      await authService.mockSSOLogin(demoEmail, demoName, demoRole);
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

  // Adjust role selector dynamically based on email typed
  const isStaffDomain = email.toLowerCase().trim().endsWith('@uonbi.ac.ke');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg clay-card rounded-2xl p-6 md:p-8 border border-slate-200/50 bg-white text-on-surface animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-2xl">
        <button onClick={() => { onClose(); resetState(); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary-container text-primary-fixed flex items-center justify-center mb-3">
            <GraduationCap size={28} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">University of Nairobi SSO</h2>
          <p className="text-slate-500 text-xs mt-1">Academic Missing Marks & Grievance Clearinghouse</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSSOSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Emily Wanjiru"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 focus:border-primary-fixed-dim/50 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
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
              className="w-full bg-slate-50 border border-slate-200 focus:border-primary-fixed-dim/50 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Domains: <strong>@student.uonbi.ac.ke</strong> for Students or <strong>@uonbi.ac.ke</strong> for Staff.
            </span>
          </div>

          {/* Role selector for staff domain */}
          {isStaffDomain && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Staff Authentication Tier
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('lecturer')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 ${
                    role === 'lecturer'
                      ? 'bg-primary-container border-primary-fixed-dim/30 text-primary-fixed'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserSquare2 size={14} />
                  Lecturer Portal
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 ${
                    role === 'admin'
                      ? 'bg-primary-container border-primary-fixed-dim/30 text-primary-fixed'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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
            className="w-full py-3 bg-primary-fixed-dim hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer text-sm"
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
        <div className="mt-6 border-t border-slate-100 pt-5">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
            Or Click a Demo Account below to instantly log in
          </span>
          <div className="space-y-2">
            {/* Student demo */}
            <button
              onClick={() => handleQuickSignIn('emily.wanjiru@student.uonbi.ac.ke', 'Emily Wanjiru Kamau', 'student')}
              disabled={loading}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl p-3 flex items-center justify-between text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs uppercase">
                  EW
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900 group-hover:text-primary-fixed transition-colors">Emily Wanjiru Kamau</span>
                  <span className="text-[10px] text-slate-500">Student Portal · @student.uonbi.ac.ke</span>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Lecturer demo */}
            <button
              onClick={() => handleQuickSignIn('peter.otieno@uonbi.ac.ke', 'Dr. Peter Otieno', 'lecturer')}
              disabled={loading}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl p-3 flex items-center justify-between text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-xs uppercase">
                  PO
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900 group-hover:text-primary-fixed transition-colors">Dr. Peter Otieno</span>
                  <span className="text-[10px] text-slate-500">Lecturer Portal · @uonbi.ac.ke</span>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Admin demo */}
            <button
              onClick={() => handleQuickSignIn('kaleb.wambua@uonbi.ac.ke', 'Prof. Kaleb Wambua', 'admin')}
              disabled={loading}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl p-3 flex items-center justify-between text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs uppercase">
                  KW
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900 group-hover:text-primary-fixed transition-colors">Prof. Kaleb Wambua</span>
                  <span className="text-[10px] text-slate-500">Registrar / HOD Portal · @uonbi.ac.ke</span>
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
