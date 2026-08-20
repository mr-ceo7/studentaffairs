import React, { useState, useEffect } from 'react';
import { BookOpen, PlusCircle, Trash2, GraduationCap, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';

interface CourseUnit {
  code: string;
  title: string;
  department: string;
  faculty: string;
  assignedLecturer: string;
}

const DEFAULT_UNITS: CourseUnit[] = [
  { code: "ICS 2101", title: "Data Structures & Algorithms", department: "Computing & Informatics", faculty: "Faculty of Science & Technology", assignedLecturer: "Dr. Peter Otieno" },
  { code: "ICS 2205", title: "Database Systems", department: "Computing & Informatics", faculty: "Faculty of Science & Technology", assignedLecturer: "Dr. Peter Otieno" },
  { code: "ICS 2303", title: "Computer Networks", department: "Computing & Informatics", faculty: "Faculty of Science & Technology", assignedLecturer: "Dr. Peter Otieno" },
  { code: "ICS 2401", title: "Software Engineering", department: "Computing & Informatics", faculty: "Faculty of Science & Technology", assignedLecturer: "Dr. Peter Otieno" },
  { code: "PHY 1101", title: "Mechanics & Sound", department: "Physics", faculty: "Faculty of Science & Technology", assignedLecturer: "Prof. John Mburu" },
  { code: "MAT 2201", title: "Linear Algebra I", department: "Mathematics", faculty: "Faculty of Science & Technology", assignedLecturer: "Dr. Anne Kamau" },
  { code: "CIV 2210", title: "Structural Analysis", department: "Civil Engineering", faculty: "Faculty of Engineering", assignedLecturer: "Eng. Francis Mwangi" },
  { code: "ACC 3105", title: "Financial Reporting", department: "Accounting", faculty: "Faculty of Business & Management Sciences", assignedLecturer: "Mrs. Grace Wambui" }
];

const FACULTIES = [
  { name: "Faculty of Science & Technology", depts: ["Computing & Informatics", "Physics", "Mathematics", "Biochemistry"] },
  { name: "Faculty of Health Sciences", depts: ["Medicine", "Nursing", "Public Health", "Pharmacy"] },
  { name: "Faculty of Engineering", depts: ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering"] },
  { name: "Faculty of Business & Management Sciences", depts: ["Accounting", "Finance", "Marketing"] }
];

export default function CatalogPage() {
  const { user } = useUser();
  const [units, setUnits] = useState<CourseUnit[]>(() => {
    const saved = localStorage.getItem('uon_catalog_units');
    return saved ? JSON.parse(saved) : DEFAULT_UNITS;
  });

  const [selectedFac, setSelectedFac] = useState(FACULTIES[0].name);
  const [selectedDept, setSelectedDept] = useState(FACULTIES[0].depts[0]);

  // Form states for adding new unit
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newLecturer, setNewLecturer] = useState('');

  useEffect(() => {
    localStorage.setItem('uon_catalog_units', JSON.stringify(units));
  }, [units]);

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newTitle.trim()) {
      toast.error('Unit code and title are required.');
      return;
    }

    const codeUpper = newCode.toUpperCase().trim();
    if (units.some(u => u.code === codeUpper)) {
      toast.error(`Unit code ${codeUpper} already exists.`);
      return;
    }

    const newUnit: CourseUnit = {
      code: codeUpper,
      title: newTitle.trim(),
      department: selectedDept,
      faculty: selectedFac,
      assignedLecturer: newLecturer.trim() || "Unassigned"
    };

    setUnits(prev => [...prev, newUnit]);
    setNewCode('');
    setNewTitle('');
    setNewLecturer('');
    toast.success(`Unit ${codeUpper} added successfully.`);
  };

  const handleDeleteUnit = (code: string) => {
    if (!window.confirm(`Are you sure you want to delete ${code}?`)) return;
    setUnits(prev => prev.filter(u => u.code !== code));
    toast.success(`Unit ${code} deleted.`);
  };

  const handleAssignLecturer = (code: string, lecturer: string) => {
    setUnits(prev => prev.map(u => {
      if (u.code === code) {
        return { ...u, assignedLecturer: lecturer || "Unassigned" };
      }
      return u;
    }));
    toast.success(`Updated lecturer assignment for ${code}.`);
  };

  // Filter units
  const displayedUnits = units.filter(u => u.faculty === selectedFac && u.department === selectedDept);

  const isAdmin = user?.is_admin;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl text-slate-700 dark:text-slate-350 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest block font-display">Reference Registry</span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            Course Catalog & Lecturer Assignments
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-none">
            Manage course unit definitions and update teaching staff mappings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="clay-card p-4 space-y-4">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Faculty / Dept</span>
            
            <div className="space-y-3 text-xs">
              {FACULTIES.map(fac => (
                <div key={fac.name} className="space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <GraduationCap size={12} className="text-slate-400 dark:text-slate-500" />
                    <span className="truncate max-w-[150px]">{fac.name.replace('Faculty of ', '')}</span>
                  </div>
                  <div className="pl-4 space-y-1 border-l border-slate-100 dark:border-slate-800 ml-1.5">
                    {fac.depts.map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          setSelectedFac(fac.name);
                          setSelectedDept(d);
                        }}
                        className={`block text-left w-full truncate py-1 transition-colors cursor-pointer ${
                          selectedDept === d && selectedFac === fac.name
                            ? 'text-blue-700 dark:text-blue-400 font-bold'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content list & Admin Form */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Unit list */}
          <div className="clay-card p-6 space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-750 dark:text-blue-400" />
                  {selectedDept} course units
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{selectedFac}</p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {displayedUnits.length} Units
              </span>
            </div>

            {displayedUnits.length > 0 ? (
              <div className="space-y-3">
                {displayedUnits.map(unit => (
                  <div key={unit.code} className="p-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-200/40 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/50">
                        {unit.code}
                      </span>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 pt-1">{unit.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-450">
                        <Users size={12} className="text-slate-400 dark:text-slate-500" />
                        <span>Lecturer:</span>
                      </div>
                      {isAdmin ? (
                        <select
                          value={unit.assignedLecturer}
                          onChange={(e) => handleAssignLecturer(unit.code, e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value="Dr. Peter Otieno" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">Dr. Peter Otieno</option>
                          <option value="Prof. John Mburu" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">Prof. John Mburu</option>
                          <option value="Dr. Anne Kamau" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">Dr. Anne Kamau</option>
                          <option value="Mrs. Grace Wambui" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">Mrs. Grace Wambui</option>
                          <option value="Unassigned" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250">Unassigned</option>
                        </select>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg">
                          {unit.assignedLecturer}
                        </span>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteUnit(unit.code)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete Unit"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                <BookOpen size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-slate-400 dark:text-slate-500 text-xs">No units configured for this department yet.</p>
              </div>
            )}
          </div>

          {/* Add unit form (Admin/Registrar only) */}
          {isAdmin && (
            <div className="clay-card p-6 space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <PlusCircle size={14} className="text-blue-750 dark:text-blue-400" />
                  Add Course Unit to {selectedDept}
                </h3>
              </div>

              <form onSubmit={handleAddUnit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Unit Code</label>
                  <input
                    type="text"
                    placeholder="e.g. ICS 2403"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 focus:border-blue-450 dark:focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none transition-all"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Unit Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Distributed Systems"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 focus:border-blue-450 dark:focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1">Assign Lecturer</label>
                  <select
                    value={newLecturer}
                    onChange={(e) => setNewLecturer(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 focus:border-blue-450 dark:focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer transition-all"
                  >
                    <option value="" className="bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-250">Select Lecturer...</option>
                    <option value="Dr. Peter Otieno" className="bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-250">Dr. Peter Otieno</option>
                    <option value="Prof. John Mburu" className="bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-250">Prof. John Mburu</option>
                    <option value="Dr. Anne Kamau" className="bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-250">Dr. Anne Kamau</option>
                    <option value="Mrs. Grace Wambui" className="bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-250">Mrs. Grace Wambui</option>
                  </select>
                </div>
                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Add Unit Definition
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
