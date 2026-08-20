import React, { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { List, CheckCheck, TrendingUp, Lock, Trophy, ChevronDown, Loader2 } from 'lucide-react';
import { getTipsByCategory, getAllTips, getTipStats, type Tip, type TipCategory } from '../services/tipsService';
import { useUser } from '../context/UserContext';
import { TeamLogo, LeagueLogo } from '../utils/logoHelper';
import Loader from '../components/Loader';

const CATEGORY_TABS: { id: TipCategory | 'all'; label: string; icon: ReactNode }[] = [
  { id: 'all', label: 'All Premium', icon: <List size={16} className="shrink-0" /> },
  { id: 'gg', label: 'GG Tips', icon: <CheckCheck size={16} className="shrink-0" /> },
  { id: 'over25', label: 'Over 2.5', icon: <TrendingUp size={16} className="shrink-0" /> },
];

function getDateLabel(matchDate: string): string {
  const date = new Date(matchDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  if (isSameDay(date, tomorrow)) return 'Tomorrow';

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupTipsByDate(tips: Tip[]) {
  const sorted = [...tips].sort(
    (a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
  );
  const grouped = new Map<string, Tip[]>();
  for (const tip of sorted) {
    const label = getDateLabel(tip.matchDate);
    const bucket = grouped.get(label) || [];
    bucket.push(tip);
    grouped.set(label, bucket);
  }
  return Array.from(grouped.entries());
}

const ArchivesBoard: React.FC<{ tips: Tip[] }> = ({ tips }) => {
  const settledTips = useMemo(() => tips.filter(t => t.result !== 'pending'), [tips]);
  const groupedTips = useMemo(() => groupTipsByDate(settledTips), [settledTips]);

  if (settledTips.length === 0) {
    return (
      <div className="text-center py-20 glass-panel rounded-2xl border border-white/5">
        <Trophy size={48} className="mx-auto text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No settled tips yet</h3>
        <p className="text-slate-400 text-sm">Settled matches and prediction results will be archived here.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-6 py-4">Match Details</th>
              <th className="px-6 py-4 text-center">Category</th>
              <th className="px-6 py-4">Prediction</th>
              <th className="px-6 py-4 text-center">Odds</th>
              <th className="px-6 py-4 text-center">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-sm text-slate-300">
            {groupedTips.map(([dateLabel, items]) => {
              const wonCount = items.filter(t => t.result === 'won').length;
              const lostCount = items.filter(t => t.result === 'lost').length;

              return (
                <React.Fragment key={dateLabel}>
                  {/* Date Header Row */}
                  <tr className="bg-white/[0.01]">
                    <td colSpan={5} className="px-6 py-3">
                      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-indigo-400">
                        <span>{dateLabel}</span>
                        <span className="text-[10px] text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {wonCount}W - {lostCount}L
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* Items Rows */}
                  {items.map((tip) => {
                    const resultColor = tip.result === 'won' ? 'text-green-400 bg-green-500/10 border-green-500/20' : tip.result === 'lost' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-slate-400 bg-white/5 border-white/10';
                    return (
                      <tr key={tip.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              <LeagueLogo name={tip.league} size="sm" />
                              <span>{tip.league}</span>
                              <span className="opacity-40">•</span>
                              <span>{new Date(tip.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <TeamLogo name={tip.homeTeam} size="sm" />
                              <span className="font-semibold text-white">{tip.homeTeam}</span>
                              <span className="text-slate-600 font-bold px-1">vs</span>
                              <TeamLogo name={tip.awayTeam} size="sm" />
                              <span className="font-semibold text-slate-300">{tip.awayTeam}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="glass-panel px-2.5 py-1 rounded text-[10px] font-black tracking-wider text-indigo-300 border border-indigo-500/20 uppercase">
                            {tip.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">
                          {tip.prediction}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-primary-fixed">
                          {tip.odds}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${resultColor}`}>
                            {tip.result}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TipCard: React.FC<{ tip: Tip; onUpgrade: () => void }> = ({ tip, onUpgrade }) => {
  const isLocked = tip.locked;
  const resultColor = tip.result === 'won' ? 'text-green-400' : tip.result === 'lost' ? 'text-red-400' : 'text-slate-400';
  const resultBg = tip.result === 'won' ? 'bg-green-500/10 border-green-500/20' : tip.result === 'lost' ? 'bg-red-500/10 border-red-500/20' : '';

  return (
    <div 
      onClick={isLocked ? onUpgrade : undefined}
      className={`clay-card rounded-xl p-3 md:p-4 group hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden ${resultBg}`}
    >
      <div className="flex justify-between items-center mb-2 md:mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <LeagueLogo name={tip.league} size="sm" className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-secondary-fixed-dim font-body text-[10px] md:text-[12px] truncate">{tip.league}</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          {tip.result !== 'pending' && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold uppercase ${resultColor}`}>
              {tip.result}
            </span>
          )}
          <span className={`glass-panel px-1.5 py-0.5 rounded font-bold text-[9px] md:text-[10px] tracking-wider shrink-0 ${
            isLocked ? 'text-tertiary-fixed-dim flex items-center gap-0.5' : 'text-primary-fixed'
          }`}>
            {isLocked ? <><Lock size={9} /> VIP</> : tip.category === 'free' ? 'FREE' : tip.category.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 md:gap-2.5 mb-3 md:mb-4">
        <div className="flex items-center gap-1.5 md:gap-2.5">
          <TeamLogo name={isLocked ? "VIP" : tip.homeTeam} size="sm" className="w-5 h-5 md:w-6 md:h-6" />
          <span className="font-display font-semibold text-[13px] md:text-[15px] text-on-surface truncate">
            {isLocked ? "Premium Match" : tip.homeTeam}
          </span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2.5">
          <TeamLogo name={isLocked ? "VIP" : tip.awayTeam} size="sm" className="w-5 h-5 md:w-6 md:h-6" />
          <span className="font-display font-semibold text-[13px] md:text-[15px] text-on-surface-variant truncate">
            {isLocked ? "Premium Match" : tip.awayTeam}
          </span>
        </div>
      </div>

      <div className="glass-panel rounded-xl py-2 md:py-3 flex justify-between items-center px-3 md:px-4 group-hover:bg-white/5 transition-colors">
        <div>
          <span className="text-secondary-fixed-dim font-body text-[10px] md:text-[11px] block mb-0.5">Prediction</span>
          {isLocked ? (
            <div className="flex items-center gap-1">
              <span className="font-display font-semibold text-[12px] md:text-[14px] text-on-surface blur-sm select-none">BTTS</span>
              <Lock size={12} className="text-tertiary-fixed-dim shrink-0" />
            </div>
          ) : (
            <span className="font-display font-semibold text-[12px] md:text-[14px] text-on-surface">{tip.prediction}</span>
          )}
        </div>
        <div className="text-right">
          <span className="text-secondary-fixed-dim font-body text-[10px] md:text-[11px] block mb-0.5">Odds</span>
          {isLocked ? (
            <span className="font-display font-bold text-[14px] md:text-[16px] text-on-surface blur-sm select-none">1.85</span>
          ) : (
            <span className="font-display font-bold text-[14px] md:text-[16px] text-primary-fixed">{tip.odds}</span>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="absolute inset-0 bg-surface/40 backdrop-blur-[1px] md:bg-surface/30 md:backdrop-blur-[2px] flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none md:pointer-events-auto">
          <button className="bg-tertiary-fixed-dim text-on-tertiary-fixed px-5 py-2.5 rounded-full font-display font-semibold text-[13px] shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
            <Trophy size={16} /> Unlock VIP
          </button>
        </div>
      )}
    </div>
  );
}

export default function TipsPage({ onShowPricing }: { onShowPricing: () => void }) {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const isArchivesRoute = location.pathname === '/archives';

  const [activeCategory, setActiveCategory] = useState<TipCategory | 'all' | 'archive'>(
    isArchivesRoute ? 'archive' : 'all'
  );
  const [tips, setTips] = useState<Tip[]>([]);
  const [stats, setStats] = useState({ total: 0, won: 0, lost: 0, pending: 0, winRate: 0 });
  const [loading, setLoading] = useState(true);

  // Synchronize category selection when path changes (e.g. clicking sidebar menu buttons)
  useEffect(() => {
    if (location.pathname === '/archives') {
      setActiveCategory('archive');
    } else {
      setActiveCategory(prev => prev === 'archive' ? 'all' : prev);
    }
  }, [location.pathname]);

  const fetchTips = useCallback(async () => {
    setLoading(true);
    try {
      const data = (activeCategory === 'all' || activeCategory === 'archive')
        ? await getAllTips()
        : await getTipsByCategory(activeCategory);
      if (activeCategory === 'archive') {
        setTips(data);
      } else {
        const premiumOnly = data.filter(t => !t.isFree && t.category !== 'free');
        setTips(premiumOnly);
      }
    } catch (e) {
      console.error('Failed to fetch tips:', e);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  useEffect(() => {
    getTipStats().then(setStats).catch(console.error);
  }, []);

  const handleTabClick = (tabId: TipCategory | 'all' | 'archive') => {
    if (tabId === 'archive') {
      navigate('/archives');
    } else {
      if (location.pathname !== '/tips') {
        navigate('/tips');
      }
      setActiveCategory(tabId);
    }
  };

  const activeTips = useMemo(() => tips.filter(t => t.result === 'pending'), [tips]);

  if (isArchivesRoute) {
    return (
      <main className="pt-6 px-4 md:px-0 relative z-10 space-y-6 flex-1">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 font-display">Archives</h2>
          <p className="text-sm text-slate-400">All settled football predictions and historical results.</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader size={48} label="Loading archives..." />
          </div>
        ) : (
          <ArchivesBoard tips={tips} />
        )}
        <div className="h-8" />
      </main>
    );
  }

  return (
    <main className="pt-6 px-4 md:px-0 relative z-10 space-y-6 flex-1">

      {/* Category Tabs */}
      <section>
        <div className="grid grid-cols-3 gap-1.5 md:flex md:gap-3 w-full">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-2 md:px-5 py-2 rounded-full font-display font-semibold text-[11px] sm:text-xs md:text-[14px] flex items-center justify-center gap-1 md:gap-2 hover:scale-[1.05] active:scale-[0.95] transition-all duration-200 ${
                activeCategory === tab.id
                  ? 'clay-button-primary text-on-primary shadow-md hover:shadow-indigo-500/30'
                  : 'glass-panel text-on-surface hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Tips Content */}
      <section>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader size={48} label="Loading tips..." />
          </div>
        ) : activeTips.length === 0 ? (
          <div className="text-center py-20">
            <Trophy size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No active tips</h3>
            <p className="text-slate-400 text-sm">Active tips will appear here once our analysts post them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4">
            {activeTips.map((tip) => (
              <TipCard key={tip.id} tip={tip} onUpgrade={onShowPricing} />
            ))}
          </div>
        )}
      </section>

      <div className="h-8" />
    </main>
  );
}
