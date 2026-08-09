import React, { useState, useEffect } from 'react';
import { Mail, MapPin, HelpCircle, Code, Bug, Send, UserCheck, MessageSquarePlus, CheckCircle2, Building2, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';
import { supportService } from '../services/supportService';

const CONTACT_INFO = {
  DEV_EMAIL: 'dev-support@studentsaffairs.com',
  LEADERS_EMAIL: 'academic-affairs@unsa.uonbi.ac.ke',
  REGISTRAR_EMAIL: 'clearinghouse@uonbi.ac.ke',
  LOCATION: 'Gandhi Wing, Ground Floor, Main Campus',
  TELEPHONE: '+254 (020) 491 0000',
};

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

  // Form State
  const [category, setCategory] = useState('UI / Layout Glitch');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [senderName, setSenderName] = useState('');

  // Academic Profile State
  const [regNumber, setRegNumber] = useState('');
  const [campus, setCampus] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [semester, setSemester] = useState('');

  const [submitting, setSubmitting] = useState(false);

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
    document.title = 'Support Desk - UoN Clearinghouse';
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
  };

  const handleSendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    if (!message.trim()) {
      toast.error('Please enter your message details.');
      return;
    }

    setSubmitting(true);
    try {
      await supportService.submitMessage({
        target_recipient: activeModal,
        category,
        subject: subject.trim() || (activeModal === 'developer' ? 'Developer Bug Report' : 'Student Advocacy Request'),
        message: message.trim(),
        user_email: userEmail.trim() || undefined,
        sender_name: senderName.trim() || undefined,
        reg_number: regNumber || undefined,
        campus: campus || undefined,
        faculty: faculty || undefined,
        department: department || undefined,
        course: course || undefined,
        year_of_study: yearOfStudy || undefined,
        semester: semester || undefined,
      });

      toast.success(
        activeModal === 'developer'
          ? 'Bug report sent directly to the development team!'
          : 'Message sent directly to UNSA Academic Affairs Student Reps!'
      );

      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send support message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl text-slate-700 dark:text-slate-350 space-y-8">
      
      {/* Page Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden border border-slate-200/50 dark:border-slate-800 flex items-center justify-center mb-3 shadow-sm">
          <img src="/uon_crest.jpg" className="w-full h-full object-cover" alt="UoN Crest" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-slate-100">
          Support &amp; Advocacy Desk
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
          Compose and send an in-app message to developer technical support or UNSA student academic representatives with full academic profile metadata.
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

        {/* Pillar 2: Student Leaders for Academic Affairs (UNSA) */}
        <div className="clay-card p-6 border border-emerald-200/60 dark:border-emerald-900/40 bg-gradient-to-b from-emerald-50/40 to-transparent dark:from-emerald-950/20 dark:to-transparent space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <UserCheck size={20} />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                Advocacy
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Student Leaders (Academic Affairs)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Connect with UNSA Academic Secretaries and Student Reps for grade dispute advocacy, missing mark delays, and Senate appeals.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <button
              onClick={() => openModal('student_leader')}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm text-center"
            >
              <MessageSquarePlus size={15} /> Contact UNSA Academic Reps
            </button>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold text-center py-1">
              Official Email: {CONTACT_INFO.LEADERS_EMAIL}
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic In-App Support Message Compose Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 rounded-3xl space-y-4 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {activeModal === 'developer' ? (
                  <>
                    <Bug className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    Report Developer Bug / Technical Glitch
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    Contact UNSA Student Leaders (Academic Advocacy)
                  </>
                )}
              </h3>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-bold px-1"
              >
                &times;
              </button>
            </div>

            {/* Minimal clean status indicator */}
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
              <span>Student profile &amp; academic metadata attached automatically</span>
            </div>

            <form onSubmit={handleSendSupportMessage} className="space-y-3">
              {!user && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Your Name</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Emily Wanjiru"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Email Address</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="student@student.uonbi.ac.ke"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Category</label>
                  {activeModal === 'developer' ? (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 text-xs focus:outline-none"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 text-xs focus:outline-none"
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
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief subject line..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Message Body</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    activeModal === 'developer'
                      ? 'Describe the bug, error message, or technical issue...'
                      : 'Provide details regarding your missing mark delay or academic grievance...'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-2 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5 ${
                    activeModal === 'developer'
                      ? 'bg-blue-700 hover:bg-blue-800'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  <Send size={13} /> {submitting ? 'Sending...' : 'Send In-App Message'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
