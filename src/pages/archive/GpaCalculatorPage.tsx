import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Sparkles, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CourseEntry {
  id: string;
  code: string;
  name: string;
  units: number;
  score: number;
  isMissing: boolean;
}

const HERO_SLIDES = [
  {
    image: '/gpa_planning_slide.jpg',
    category: 'Academic Planning',
    title: 'GPA & Missing Marks Calculator',
    subtitle: 'Calculate your cumulative weighted average and simulate the degree boost once your missing marks are cleared.',
  },
  {
    image: '/onuss_advocacy_slide.jpg',
    category: 'Student Advocacy',
    title: 'Clearing missing marks with Student Affairs',
    subtitle: 'Student Affairs representatives and HODs working in partnership to fast-track script retrievals and grade changes.',
  }
];

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

  const [heroSlide, setHeroSlide] = useState(0);

  // Hero carousel auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl text-slate-700 dark:text-slate-350 space-y-6">
      
      {/* Hero Carousel */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-950 shadow-sm shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={heroSlide}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full flex flex-col justify-end p-6 md:p-8 bg-cover bg-center select-none"
            style={{ backgroundImage: `linear-gradient(to top, rgba(2, 6, 23, 0.95) 20%, rgba(2, 6, 23, 0.6) 60%, rgba(2, 6, 23, 0.1) 100%), url(${HERO_SLIDES[heroSlide].image})` }}
          >
            <div className="max-w-2xl space-y-2 text-left">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
                {HERO_SLIDES[heroSlide].category}
              </span>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white leading-tight font-display">
                {HERO_SLIDES[heroSlide].title}
              </h1>
              <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed max-w-xl">
                {HERO_SLIDES[heroSlide].subtitle}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Indicators */}
        <div className="absolute bottom-6 right-6 flex gap-1.5 z-10">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setHeroSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                heroSlide === idx ? 'w-6 bg-blue-500' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
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
              <Award size={12} className="animate-pulse" /> Projected Standing (After Clearing Claim)
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

      {/* Courses List Layout (No Parent Card background) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
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
              className={`p-3 sm:p-4 rounded-2xl border flex flex-col gap-3 transition-all duration-200 shadow-sm ${
                course.isMissing
                  ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-250/30 dark:border-amber-900/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:shadow-md'
              }`}
            >
              {/* Row 1: Code & Name (Side-by-side on all screens) */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="text"
                  value={course.code}
                  onChange={(e) => updateCourse(course.id, 'code', e.target.value)}
                  className="w-20 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200 font-mono uppercase font-bold text-xs focus:outline-none focus:border-blue-400/50 text-center h-8 rounded-xl shrink-0"
                />
                <input
                  type="text"
                  value={course.name}
                  onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                  className="flex-1 px-3 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-400/50 h-8 rounded-xl min-w-0"
                />
              </div>

              {/* Row 2: Settings & Actions (Compact row) */}
              <div className="flex items-center gap-4 flex-wrap justify-between text-xs pt-1.5 border-t border-slate-100/50 dark:border-slate-800/30">
                {/* Left: Input settings */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="text-[9px] uppercase font-extrabold tracking-wider">Units</span>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={course.units}
                      onChange={(e) => updateCourse(course.id, 'units', Number(e.target.value))}
                      className="w-10 px-1 py-0.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-center text-xs focus:outline-none focus:border-blue-400/50 h-7"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="text-[9px] uppercase font-extrabold tracking-wider">Score (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      disabled={course.isMissing}
                      value={course.isMissing ? simulatedScore : course.score}
                      onChange={(e) => updateCourse(course.id, 'score', Number(e.target.value))}
                      className={`w-12 px-1 py-0.5 rounded-lg bg-white dark:bg-slate-950 border font-bold text-center text-xs focus:outline-none focus:border-blue-400/50 h-7 ${
                        course.isMissing 
                          ? 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-900/50' 
                          : 'text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Right: Toggle & Remove */}
                <div className="flex items-center gap-3 ml-auto sm:ml-0">
                  <label className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold cursor-pointer select-none text-[10px] uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={course.isMissing}
                      onChange={(e) => updateCourse(course.id, 'isMissing', e.target.checked)}
                      className="rounded border-amber-300 text-blue-700 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                    />
                    Missing
                  </label>

                  <button
                    onClick={() => removeCourse(course.id)}
                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer shrink-0"
                    title="Remove Course"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
