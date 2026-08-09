import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Filter, 
  Layers, 
  ArrowRight,
  BookOpen,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { ticketService, type TicketData } from '../services/ticketService';
import { toast } from 'sonner';
import PencilLoader from './PencilLoader';

interface LecturerPortalProps {
  user: any;
  onTicketClick: (ticketId: string) => void;
  key?: string;
}

const ASSIGNED_UNITS = [
  "ICS 2101 — Data Structures & Algorithms",
  "ICS 2205 — Database Systems",
  "ICS 2303 — Computer Networks",
  "ICS 2401 — Software Engineering"
];

const CATEGORIES = [
  "End of Semester Main Exam",
  "Continuous Assessment Test (CAT)",
  "Lab Report / Practical Score",
  "Fieldwork / Industrial Attachment"
];

const STATUSES = [
  "Submitted to Department/Lecturer",
  "Under Departmental Processing",
  "Awaiting Student Response",
  "Rejected — Insufficient Proof",
  "Cleared for SMS Update",
  "Verified on SMS"
];

export default function LecturerPortalView({ user, onTicketClick }: LecturerPortalProps) {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await ticketService.listTickets();
      // Filter claims to only show assigned unit codes for high fidelity
      const filtered = data.filter(t => ASSIGNED_UNITS.includes(t.unit_code));
      setTickets(filtered);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load claims queue');
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

  // Get active/open count for a specific unit (status not Cleared or Rejected or Verified)
  const getOpenCount = (unitCode: string) => {
    return tickets.filter(
      t => t.unit_code === unitCode && 
      !['Verified on SMS', 'Rejected — Insufficient Proof'].includes(t.status)
    ).length;
  };

  // Apply frontend filters
  const filteredTickets = tickets.filter(t => {
    const matchesType = !selectedType || t.assessment_category === selectedType;
    const matchesStatus = !selectedStatus || t.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 pt-2 text-slate-700 dark:text-slate-300">
      {/* Header Profile Info */}
      <div className="reveal active flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest block">Lecturer Portal</span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            {user.username} — Claims Queue
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-none">
            Department of Computing & Informatics · Assigned Units: ICS 2101, ICS 2205, ICS 2303, ICS 2401
          </p>
        </div>
        <button 
          onClick={loadTickets}
          className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-250 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0"
        >
          Refresh Queue
        </button>
      </div>

      {/* Unit Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ASSIGNED_UNITS.map(unit => {
          const openClaims = getOpenCount(unit);
          return (
            <div key={unit} className="clay-card p-4 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {unit.split(' — ')[0]}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{openClaims}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-450 font-medium">Open Claim{openClaims !== 1 ? 's' : ''}</span>
              </div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate block mt-2" title={unit.split(' — ')[1]}>
                {unit.split(' — ')[1]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Filter and Queue Table */}
      <div className="clay-card p-6 reveal active space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-750 dark:text-blue-400" />
            Clearance Queue
          </h2>
          
          {/* Filters Bar */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850">
              <Filter size={12} className="text-slate-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850">
              <Layers size={12} className="text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">All Statuses</option>
                {STATUSES.map(s => (
                  <option key={s} value={s} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <PencilLoader message="Loading assigned unit claims..." size="sm" />
        ) : filteredTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-550 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Student Reg</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-center">Claimed</th>
                  <th className="py-3 px-4 text-center">Verified</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredTickets.map(t => (
                  <tr key={t.ticket_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{t.ticket_id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">{t.reg_number}</td>
                    <td className="py-3.5 px-4 text-slate-650 dark:text-slate-400">{t.student_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{t.unit_code.split(' — ')[0]}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{t.unit_code.split(' — ')[1]}</span>
                    </td>
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
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold text-[10px] transition-all cursor-pointer flex items-center gap-1 mx-auto shadow-sm"
                      >
                        Review
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
            <AlertCircle size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-350 text-sm">Clear Queue</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">No claims match the selected filters or assigned units.</p>
          </div>
        )}
      </div>
    </div>
  );
}
