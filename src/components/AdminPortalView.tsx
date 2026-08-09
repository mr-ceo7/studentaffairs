import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Filter, 
  ArrowRight,
  Calendar,
  Download,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { ticketService, type TicketData } from '../services/ticketService';
import { toast } from 'sonner';

interface AdminPortalProps {
  user: any;
  onTicketClick: (ticketId: string) => void;
  key?: string;
}

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

const STATUS_CLASS: Record<string, string> = {
  "Submitted to Department/Lecturer": "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50",
  "Under Departmental Processing": "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50",
  "Awaiting Student Response": "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/50",
  "Rejected — Insufficient Proof": "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/55 dark:border-red-900/50",
  "Cleared for SMS Update": "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-900/50",
  "Verified on SMS": "bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-700 dark:border-emerald-800"
};

export default function AdminPortalView({ user, onTicketClick }: AdminPortalProps) {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedFaculty, setSelectedFaculty] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await ticketService.listTickets();
      setTickets(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load clearance queue');
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const total = tickets.length;
  const openCount = tickets.filter(t => !['Verified on SMS', 'Rejected — Insufficient Proof'].includes(t.status)).length;
  const clearedCount = tickets.filter(t => t.status === 'Cleared for SMS Update' || t.status === 'Verified on SMS').length;
  const rejectedCount = tickets.filter(t => t.status === 'Rejected — Insufficient Proof').length;

  // Visual status bars computation
  const statusCounts = Object.keys(STATUS_CLASS).map(statusName => {
    const count = tickets.filter(t => t.status === statusName).length;
    return { name: statusName, count };
  });
  const maxCount = Math.max(...statusCounts.map(s => s.count), 1);

  // Apply filters
  const filteredTickets = tickets.filter(t => {
    return !selectedFaculty || t.faculty === selectedFaculty;
  });

  // CSV Export
  const exportCSV = () => {
    if (tickets.length === 0) {
      toast.error('No tickets available to export.');
      return;
    }
    const header = ['Ticket ID', 'Reg No.', 'Faculty', 'Department', 'Unit Code', 'Category', 'Claimed', 'Verified', 'Status', 'Updated'];
    const rows = tickets.map(t => [
      t.ticket_id,
      t.reg_number,
      t.faculty,
      t.department,
      t.unit_code,
      t.assessment_category,
      t.claimed_score,
      t.verified_score ?? '',
      t.status,
      new Date(t.updated_at).toLocaleDateString()
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'UoN_Clearinghouse_Master_Clearance_Export.csv';
    a.click();
    toast.success('Clearance CSV export downloaded successfully!');
  };

  return (
    <div className="space-y-6 pt-2 text-slate-700 dark:text-slate-300">
      {/* Header Profile Info */}
      <div className="reveal active flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest block">Registrar & HOD Portal</span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            Clearance Master Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-none">
            Review university-wide clearances, view statistics by status, and export clearance reports.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={exportCSV}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white border border-amber-705 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
          >
            <Download size={14} />
            Export Clearance CSV
          </button>
          <button 
            onClick={loadTickets}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-all"
          >
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="clay-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Database size={20} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Claims</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{total}</span>
          </div>
        </div>

        <div className="clay-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Open Queue</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{openCount}</span>
          </div>
        </div>

        <div className="clay-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Cleared for SMS</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{clearedCount}</span>
          </div>
        </div>

        <div className="clay-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <XCircle size={20} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Rejected Claims</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Analytics Graph Bars */}
      <div className="clay-card p-6 reveal active space-y-4">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tickets by Workflow Status</h3>
        <div className="space-y-3">
          {statusCounts.map(statusObj => {
            const pct = Math.round((statusObj.count / maxCount) * 100);
            return (
              <div key={statusObj.name} className="flex items-center gap-4 text-xs font-semibold">
                <div className="w-48 text-slate-650 dark:text-slate-400 truncate text-[11px]">{statusObj.name}</div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-700 dark:bg-blue-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-8 text-right font-bold text-slate-800 dark:text-slate-200">{statusObj.count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clearance Master List */}
      <div className="clay-card p-6 reveal active space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-750 dark:text-blue-400" />
            Clearance Registrar Registry
          </h2>
          
          {/* Faculty Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 w-full sm:w-auto">
            <Filter size={12} className="text-slate-400" />
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">All Faculties</option>
              {FACULTIES.map(f => (
                <option key={f} value={f} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">{f}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <span className="text-xs text-slate-550 dark:text-slate-400 font-medium animate-pulse">Loading claims...</span>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-550 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Student Reg</th>
                  <th className="py-3 px-4">Faculty</th>
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
                    <td className="py-3.5 px-4 text-slate-650 dark:text-slate-405 truncate max-w-[120px]" title={t.faculty}>{t.faculty.replace('Faculty of ', '')}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{t.unit_code.split(' — ')[0]}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{t.unit_code.split(' — ')[1]}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">{t.claimed_score}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-800 dark:text-blue-400">{t.verified_score !== null && t.verified_score !== undefined ? t.verified_score : '—'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border uppercase tracking-wide inline-block ${STATUS_CLASS[t.status]}`}>
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
                        Inspect
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
            <AlertCircle className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-350 text-sm">No Claims Found</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">There are no marks claims submitted under the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
