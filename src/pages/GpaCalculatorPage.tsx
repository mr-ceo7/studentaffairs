import React, { useState } from 'react';
import { Calculator, Plus, Trash2, Sparkles, Award, TrendingUp } from 'lucide-react';

interface CourseEntry {
  id: string;
  code: string;
  name: string;
  units: number;
  score: number;
  isMissing: boolean;
}

const DEFAULT_COURSES: CourseEntry[] = [
  { id: '1', code: 'ICS 2101', name: 'Data Structures & Algorithms', units: 3, score: 68, isMissing: false },
  { id: '2', code: 'ICS 2205', name: 'Database Systems', units: 3, score: 72, isMissing: false },
  { id: '3', code: 'ICS 2303', name: 'Computer Networks', units: 3, score: 74, isMissing: false },
  { id: '4', code: 'ICS 2401', name: 'Software Engineering', units: 3, score: 65, isMissing: false },
  { id: '5', code: 'CSC 3105', name: 'Artificial Intelligence', units: 3, score: 0, isMissing: true },
];

export default function GpaCalculatorPage() {
  const [courses, setCourses] = useState<CourseEntry[]>(DEFAULT_COURSES);
  const [simulatedScore, setSimulatedScore] = useState<number>(75);

  const addCourse = () => {
    const newCourse: CourseEntry = {
      id: Date.now().toString(),
      code: `ICS ${2100 + courses.length * 10}`,
      name: 'New Course Unit',
      units: 3,
      score: 60,
      isMissing: false,
    };
    setCourses([...courses, newCourse]);
  };

  const removeCourse = (id: string) => {
    setCourses(courses.filter((c) => c.id !== id));
  };

  const updateCourse = (id: string, field: keyof CourseEntry, value: any) => {
    setCourses(
      courses.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Calculations
  const currentTotalUnits = courses.reduce((acc, c) => acc + (c.isMissing ? 0 : c.units), 0);
  const currentWeightedSum = courses.reduce((acc, c) => acc + (c.isMissing ? 0 : c.score * c.units), 0);
  const currentAverage = currentTotalUnits > 0 ? currentWeightedSum / currentTotalUnits : 0;

  // Simulated with missing mark resolved
  const simTotalUnits = courses.reduce((acc, c) => acc + c.units, 0);
  const simWeightedSum = courses.reduce((acc, c) => {
    const scoreVal = c.isMissing ? simulatedScore : c.score;
    return acc + scoreVal * c.units;
  }, 0);
  const simAverage = simTotalUnits > 0 ? simWeightedSum / simTotalUnits : 0;

  const getClassification = (avg: number) => {
    if (avg >= 70) return { label: 'First Class Honours', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/50' };
    if (avg >= 60) return { label: 'Second Class Honours (Upper Division)', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/50' };
    if (avg >= 50) return { label: 'Second Class Honours (Lower Division)', color: 'text-slate-700 dark:text-slate-350 bg-slate-100 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800' };
    if (avg >= 40) return { label: 'Pass Degree', color: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 border-orange-200/50 dark:border-orange-900/50' };
    return { label: 'Fail / Supplementary Required', color: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/50' };
  };

  const currentClass = getClassification(currentAverage);
  const simClass = getClassification(simAverage);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl text-slate-700 dark:text-slate-350 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest block">Academic Planning</span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            GPA &amp; Missing Marks Recovery Calculator
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-none">
            Calculate your cumulative weighted average and simulate the degree boost once your missing marks are cleared.
          </p>
        </div>
      </div>

      {/* Degree Classification Simulator Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="clay-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Current Standing (Without Missing Mark)</span>
            <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 font-mono">{currentAverage.toFixed(1)}%</span>
          </div>
          <div className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${currentClass.color}`}>
            {currentClass.label}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Based on {courses.filter((c) => !c.isMissing).length} units currently reflected in SMS records.
          </p>
        </div>

        <div className="clay-card p-5 space-y-3 bg-gradient-to-r from-blue-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider flex items-center gap-1">
              <Sparkles size={12} className="animate-spin-slow" /> Projected Standing (After Clearing Claim)
            </span>
            <span className="text-xl font-extrabold text-blue-800 dark:text-blue-400 font-mono">{simAverage.toFixed(1)}%</span>
          </div>
          <div className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${simClass.color}`}>
            <Award size={14} />
            {simClass.label}
          </div>
          <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Simulate Cleared Mark:</span>
            <input
              type="range"
              min="40"
              max="100"
              value={simulatedScore}
              onChange={(e) => setSimulatedScore(Number(e.target.value))}
              className="w-32 accent-blue-700 dark:accent-blue-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
            />
            <span className="font-bold text-blue-700 dark:text-blue-400 font-mono">{simulatedScore}%</span>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="clay-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            Enrolled Academic Units
          </h3>
          <button
            onClick={addCourse}
            className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <Plus size={13} /> Add Course Unit
          </button>
        </div>

        <div className="space-y-2.5">
          {courses.map((course) => (
            <div
              key={course.id}
              className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                course.isMissing
                  ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-250/30 dark:border-amber-900/30'
                  : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/40 dark:border-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <input
                  type="text"
                  value={course.code}
                  onChange={(e) => updateCourse(course.id, 'code', e.target.value)}
                  className="w-24 px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 font-mono uppercase font-bold text-xs focus:outline-none focus:border-blue-400/50 text-center"
                />
                <input
                  type="text"
                  value={course.name}
                  onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-400/50"
                />
              </div>

              <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] uppercase font-bold">Units:</span>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={course.units}
                    onChange={(e) => updateCourse(course.id, 'units', Number(e.target.value))}
                    className="w-12 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 font-bold text-center text-xs focus:outline-none focus:border-blue-400/50"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] uppercase font-bold">Score (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={course.isMissing}
                    value={course.isMissing ? simulatedScore : course.score}
                    onChange={(e) => updateCourse(course.id, 'score', Number(e.target.value))}
                    className={`w-16 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-950 border font-bold text-center text-xs focus:outline-none focus:border-blue-400/50 ${
                      course.isMissing 
                        ? 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-900/50' 
                        : 'text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-850'
                    }`}
                  />
                </div>

                <label className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={course.isMissing}
                    onChange={(e) => updateCourse(course.id, 'isMissing', e.target.checked)}
                    className="rounded border-amber-300 text-blue-700 focus:ring-blue-500 cursor-pointer w-4 h-4"
                  />
                  Missing Mark
                </label>

                <button
                  onClick={() => removeCourse(course.id)}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-905 rounded-xl transition-all cursor-pointer"
                  title="Remove Course"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
