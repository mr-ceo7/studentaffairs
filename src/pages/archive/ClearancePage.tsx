import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Building2, FileCheck, Printer, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { clearanceService, type ClearanceRecord } from '../services/clearanceService';
import PencilLoader from '../components/PencilLoader';

export default function ClearancePage() {
  const { user } = useUser();
  const [record, setRecord] = useState<ClearanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClearance() {
      if (!user) return;
      try {
        const data = await clearanceService.getMyClearance();
        setRecord(data);
      } catch (err) {
        console.error('Failed to load clearance record:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClearance();
  }, [user]);

  const items = [
    {
      name: 'Academic Department (Coursework & Missing Marks Cleared)',
      status: record?.department_status || 'pending',
      icon: Building2,
    },
    {
      name: 'University Library (All Books & Fines Cleared)',
      status: record?.library_status || 'pending',
      icon: FileCheck,
    },
    {
      name: 'Finance & Student Accounts (Tuition Fee Balance: KES 0)',
      status: record?.finance_status || 'pending',
      icon: CheckCircle2,
    },
    {
      name: 'Hostels & Halls of Residence (Room Handover)',
      status: record?.hostel_status || 'pending',
      icon: Building2,
    },
    {
      name: 'Sports & Games Department',
      status: record?.sports_status || 'pending',
      icon: Award,
    },
    {
      name: 'Dean of Students (Clubs & Conduct Certificate)',
      status: record?.dean_status || 'pending',
      icon: FileCheck,
    },
    {
      name: 'Senate Registry (Conferment of Degree & Transcript Ready)',
      status: record?.registry_status || 'pending',
      icon: Award,
    },
  ];

  const approvedCount = items.filter((i) => i.status === 'approved').length;
  const progressPercent = Math.round((approvedCount / items.length) * 100);

  const getStatusStyle = (statusVal: string) => {
    if (statusVal === 'approved') {
      return {
        card: 'border-emerald-200/60 bg-emerald-500/5 dark:border-emerald-900/30 dark:bg-emerald-950/5',
        badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
        iconBg: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
        text: 'Verified & Authorized',
      };
    }
    if (statusVal === 'rejected') {
      return {
        card: 'border-red-200/60 bg-red-500/5 dark:border-red-900/30 dark:bg-red-950/5',
        badge: 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
        iconBg: 'bg-red-500/20 text-red-700 dark:text-red-400',
        text: 'Clearance Rejected / Action Required',
      };
    }
    return {
      card: 'border-slate-200/60 bg-slate-50/50 dark:border-slate-850/60 dark:bg-slate-900/10',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
      iconBg: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
      text: 'Pending Verification',
    };
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl text-slate-700 dark:text-slate-350 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest block">
            Academic Affairs · Student Records
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            Graduation Clearance &amp; Transcript Readiness
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-none">
            Official 7-Department Verification Checklist for {record?.student_name || user?.name} ({record?.reg_number || 'CS/45231/2022'})
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          <Printer size={14} /> Print Clearance Slip
        </button>
      </div>

      {/* Progress Card */}
      <div className="clay-card p-6 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
        {loading ? (
          <PencilLoader message="Calculating Senate clearance standings..." size="sm" />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider block">
                  Overall Senate Clearance Status
                </span>
                <div className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {progressPercent === 100 
                    ? '✅ 100% Cleared for Graduation' 
                    : `In Progress: ${approvedCount} of ${items.length} Departments Cleared`
                  }
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Program: <strong>Bachelor of Science in Computer Science</strong> · Faculty of Science &amp; Technology
                </p>
              </div>

              <div className="sm:text-right">
                <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 font-mono">{progressPercent}%</div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Clearance Progress</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-950/40 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850/60 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Department Checklist Grid */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          Departmental Verification Nodes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, idx) => {
            const styles = getStatusStyle(item.status);

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${styles.card}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
                    <item.icon size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{item.name}</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-450 block">
                      {styles.text}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${styles.badge}`}>
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Remarks Note */}
      {record?.remarks && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-450 dark:text-slate-400 tracking-wider">
            <AlertCircle size={13} className="text-blue-700 dark:text-blue-400" />
            Senate Academic Remarks
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-body">
            {record.remarks}
          </p>
        </div>
      )}
    </div>
  );
}
