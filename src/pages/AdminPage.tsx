import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, CreditCard, Settings, BarChart3, Plus, Trash2, Check, X, Loader2, Trophy, 
  TrendingUp, DollarSign, Bell, Send, Search, ChevronDown, Shield, Ban, Eye, 
  ArrowUpDown, UserX, UserCheck, Gift, XCircle, RefreshCw, Star, Edit, Smartphone, Globe,
  LayoutDashboard, LogOut, ChevronLeft, ChevronRight, Play, CheckCircle2, AlertTriangle,
  Crown, Target, Wifi, Megaphone
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { useUser } from '../context/UserContext';
import { addTip, deleteTip, updateTip, getAllTips, type Tip, type TipMutationInput } from '../services/tipsService';
import { getPricingTiers, updatePricingTier, addPricingTier, deletePricingTier, type SubscriptionTier } from '../services/pricingService';
import { adminService, type AdminUser, type UserActivityDetail } from '../services/adminService';
import { toast } from 'sonner';
import { AdsTab } from './admin/AdsTab';
import { CampaignsTab } from './admin/CampaignsTab';
import { SettingsTab } from './admin/SettingsTab';
import Loader from '../components/Loader';
import { AnimatedCheckbox, AnimatedInput, AnimatedTextArea, AnimatedButton } from '../components/AnimatedElements';

type AdminTab = 'dashboard' | 'users' | 'tips' | 'revenue' | 'pricing' | 'broadcast' | 'ads' | 'campaigns' | 'settings';

export default function AdminPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  // Authentication check
  if (!user || !user.is_admin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 font-display">Access Denied</h2>
        <p className="text-slate-400 text-center max-w-sm mb-6">
          You do not have administrative privileges to access this console.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-slate-900 text-slate-300 rounded-xl hover:bg-slate-800 transition-all text-sm font-medium border border-white/5"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'users' as AdminTab, label: 'Users', icon: <Users size={18} /> },
    { id: 'tips' as AdminTab, label: 'Tips', icon: <Trophy size={18} /> },
    { id: 'revenue' as AdminTab, label: 'Revenue', icon: <DollarSign size={18} /> },
    { id: 'pricing' as AdminTab, label: 'Pricing', icon: <CreditCard size={18} /> },
    { id: 'broadcast' as AdminTab, label: 'Broadcast', icon: <Bell size={18} /> },
    { id: 'ads' as AdminTab, label: 'Ads', icon: <Megaphone size={18} /> },
    { id: 'campaigns' as AdminTab, label: 'Campaigns', icon: <Target size={18} /> },
    { id: 'settings' as AdminTab, label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950/30 text-slate-100 flex font-sans select-none relative z-10 w-full rounded-2xl border border-white/5 overflow-hidden backdrop-blur-md">
      
      {/* ─── SIDEBAR ────────────────────────────────────── */}
      <aside className={`
        flex flex-col shrink-0 bg-slate-950/70 border-r border-white/10
        transition-all duration-300 ease-out
        ${collapsed ? 'w-[72px]' : 'w-[240px]'}
      `}>
        {/* Branding header */}
        <div className="h-20 flex items-center px-4 border-b border-white/5 gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white font-display tracking-wide uppercase">WinviRahisi</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Admin Console</p>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto scrollbar-hide">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold
                transition-all duration-200 group relative border cursor-pointer
                ${activeTab === item.id
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-md shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }
              `}
            >
              <span className={`shrink-0 ${activeTab === item.id ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] rounded-lg
                  invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap
                  shadow-xl pointer-events-none z-50 border border-white/10
                ">
                  {item.label}
                </div>
              )}
            </button>
          ))}

          {/* Separation border and Back to Site item */}
          <div className="pt-4 border-t border-white/5 mt-4">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent cursor-pointer"
            >
              <LogOut className="w-5 h-5 shrink-0 rotate-180" />
              {!collapsed && <span>Back to Site</span>}
            </button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-full py-2 rounded-xl text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all cursor-pointer"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </aside>

      {/* ─── MAIN WORKSPACE ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950/20">
        
        {/* Workspace Top Header - Empty left, profile on right */}
        <header className="h-16 border-b border-white/5 bg-slate-950/40 flex items-center justify-end px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">{user.name}</p>
              <p className="text-[9px] text-slate-400 font-bold tracking-wide">{user.email}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/25 flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-emerald-400">{user.name?.charAt(0)?.toUpperCase() || 'A'}</span>
            </div>
          </div>
        </header>

        {/* Workspace Contents */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto overflow-x-hidden min-w-0">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'tips' && <TipsTab />}
          {activeTab === 'revenue' && <RevenueTab />}
          {activeTab === 'pricing' && <PricingTab />}
          {activeTab === 'broadcast' && <BroadcastTab />}
          {activeTab === 'ads' && <AdsTab />}
          {activeTab === 'campaigns' && <CampaignsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════

interface NewDashboardStats {
  visitors: { total: number; registered: number; guests: number; today: number; yesterday: number; two_days_ago: number };
  online: { total: number; users: number; guests: number; been_online_today: number; existing_users_online: number; new_users_online: number };
  subscribers: { total: number; conversion_rate: number; tier_distribution: Record<string, number>; recent_5day: number; recent_10day: number; recent_30day: number };
  revenue_monthly: { total: number; today: number; by_method: { mpesa: number; paypal: number }; daily_history: { label: string; amount: number; date: string }[] };
  revenue_alltime: { total: number; this_year: number; monthly_history: { label: string; amount: number; key: string }[] };
  tips: { total: number; won: number; lost: number; pending: number; void: number; win_rate: number };
  revenue_over_time: Record<string, number>;
}

function DashboardTab() {
  const [stats, setStats] = useState<NewDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiClient.get<NewDashboardStats>('/admin/dashboard');
      setStats(r.data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleResetStats = async () => {
    if (!confirm('Are you sure you want to refresh all dashboard statistics from the database?')) return;
    fetchStats();
    toast.success('Real-time statistics re-synchronized!');
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader size={48} label="Loading console telemetry stats..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top dashboard title and subtitle row */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">Dashboard</h2>
          <p className="text-xs text-slate-400 mt-1">Platform overview & real-time analytics</p>
        </div>
        <button 
          onClick={handleResetStats}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
        >
          <RefreshCw size={14} className="animate-pulse" /> Reset Stats
        </button>
      </div>

      {/* Grid of 6 Columns aligned side-by-side on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* 1. TOTAL VISITORS */}
        <div className="glass-panel p-4 pb-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-emerald-500/20 transition-all bg-slate-950/40 shadow-xl min-h-[340px]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Users size={15} className="text-emerald-400" />
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Visitors</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white font-display tracking-tight">{stats.visitors.total}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded">
                REGISTERED: {stats.visitors.registered}
              </span>
              <span className="bg-slate-800/50 border border-white/5 text-slate-400 text-[9px] font-black px-1.5 py-0.5 rounded">
                GUESTS: {stats.visitors.guests}
              </span>
            </div>
          </div>

          {/* Bottom stats stacked */}
          <div className="grid grid-cols-3 gap-1.5 mt-6 text-center">
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-1.5 flex flex-col justify-center">
              <span className="text-[7px] text-emerald-400 font-bold uppercase">Today</span>
              <span className="text-sm font-black text-white">{stats.visitors.today}</span>
            </div>
            <div className="bg-slate-900/30 border border-white/5 rounded-xl p-1.5 flex flex-col justify-center">
              <span className="text-[7px] text-slate-500 font-bold uppercase">Yest.</span>
              <span className="text-sm font-black text-white">{stats.visitors.yesterday}</span>
            </div>
            <div className="bg-slate-900/30 border border-white/5 rounded-xl p-1.5 flex flex-col justify-center">
              <span className="text-[7px] text-slate-500 font-bold uppercase">2 Days</span>
              <span className="text-sm font-black text-white">{stats.visitors.two_days_ago}</span>
            </div>
          </div>
        </div>

        {/* 2. ONLINE NOW */}
        <div className="glass-panel p-4 pb-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-emerald-500/20 transition-all bg-slate-950/40 shadow-xl min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Wifi size={15} className="text-emerald-400" />
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Online Now</span>
              </div>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" /> LIVE
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white font-display tracking-tight">{stats.online.total}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              <span className="bg-slate-800/50 border border-white/5 text-slate-400 text-[9px] font-black px-1.5 py-0.5 rounded">
                USERS: {stats.online.users}
              </span>
              <span className="bg-slate-800/50 border border-white/5 text-slate-400 text-[9px] font-black px-1.5 py-0.5 rounded">
                GUESTS: {stats.online.guests}
              </span>
            </div>
          </div>

          {/* Bottom stats stacked */}
          <div className="space-y-2.5 mt-6">
            <div className="text-center">
              <span className="text-[8px] text-slate-500 font-bold uppercase">Been Online Today</span>
              <span className="text-xs font-black text-white ml-1.5">{stats.online.been_online_today}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-slate-900/30 border border-white/5 rounded-xl p-1.5">
                <span className="block text-[6px] text-slate-500 font-bold uppercase">Existing</span>
                <span className="text-xs font-black text-white">{stats.online.existing_users_online}</span>
              </div>
              <div className="bg-slate-900/30 border border-white/5 rounded-xl p-1.5">
                <span className="block text-[6px] text-slate-500 font-bold uppercase">New Reg</span>
                <span className="text-xs font-black text-white">{stats.online.new_users_online}</span>
              </div>
              <div className="bg-slate-900/30 border border-white/5 rounded-xl p-1.5">
                <span className="block text-[6px] text-slate-500 font-bold uppercase">Guests</span>
                <span className="text-xs font-black text-white">{stats.online.guests}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SUBSCRIBERS */}
        <div className="glass-panel p-4 pb-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-emerald-500/20 transition-all bg-slate-950/40 shadow-xl min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Crown size={15} className="text-amber-400" />
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Subscribers</span>
              </div>
              <span className="text-emerald-400 text-[8px] font-black px-1 py-0.5 rounded flex items-center gap-0.5">
                ↗ {stats.subscribers.conversion_rate}% conv.
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white font-display tracking-tight">{stats.subscribers.total}</span>
            </div>
          </div>

          {/* Bottom stats stacked */}
          <div className="space-y-2 mt-6">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/30 border border-white/5 rounded-xl p-1.5 text-center">
                <span className="block text-[7px] text-slate-500 font-bold uppercase">10Day</span>
                <span className="text-xs font-black text-white">{stats.subscribers.recent_10day}</span>
              </div>
              <div className="bg-slate-900/30 border border-white/5 rounded-xl p-1.5 text-center">
                <span className="block text-[7px] text-slate-500 font-bold uppercase">30Day</span>
                <span className="text-xs font-black text-white">{stats.subscribers.recent_30day}</span>
              </div>
            </div>
            <div className="bg-slate-900/30 border border-white/5 rounded-xl p-1.5 text-center">
              <span className="block text-[7px] text-slate-500 font-bold uppercase">5Day</span>
              <span className="text-xs font-black text-white">{stats.subscribers.recent_5day}</span>
            </div>
          </div>
        </div>

        {/* 4. MONTHLY REVENUE */}
        <div className="glass-panel p-4 pb-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-emerald-500/20 transition-all bg-slate-950/40 shadow-xl min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <DollarSign size={15} className="text-emerald-400" />
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</span>
              </div>
              <span className="text-emerald-400 text-[8px] font-black flex items-center gap-0.5">
                ↗ KES {(stats.revenue_monthly.today / 1000).toFixed(1)}K today
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-extrabold text-slate-400">KES</span>
              <span className="text-2xl font-black text-white font-display tracking-tight">
                {(stats.revenue_monthly.total / 1000).toFixed(1)}K
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              <span className="bg-slate-800/50 border border-white/5 text-slate-400 text-[9px] font-black px-1.5 py-0.5 rounded">
                MPESA: KES {(stats.revenue_monthly.by_method.mpesa / 1000).toFixed(1)}K
              </span>
              <span className="bg-slate-800/50 border border-white/5 text-slate-400 text-[9px] font-black px-1.5 py-0.5 rounded">
                PAYPAL: KES {stats.revenue_monthly.by_method.paypal}
              </span>
            </div>
          </div>

          {/* Bottom stats stacked */}
          <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
            <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Last 30 Days</span>
            <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide pr-1">
              {stats.revenue_monthly.daily_history.slice(0, 5).map((d, index) => {
                const isToday = index === 0;
                const isYesterday = index === 1;
                const dateLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : d.label;
                return (
                  <div key={index} className="flex justify-between items-center text-[10px] border-b border-white/5 last:border-b-0 pb-1 last:pb-0 font-medium">
                    <span className="text-slate-400">{dateLabel}</span>
                    <span className={`font-bold ${d.amount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      KES {d.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. ALL TIME REVENUE */}
        <div className="glass-panel p-4 pb-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-emerald-500/20 transition-all bg-slate-950/40 shadow-xl min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <TrendingUp size={15} className="text-yellow-400" />
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">All Time Revenue</span>
              </div>
              <span className="text-emerald-400 text-[8px] font-black flex items-center gap-0.5">
                ↗ KES {(stats.revenue_alltime.this_year / 1000).toFixed(1)}K this yr
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-extrabold text-slate-400">KES</span>
              <span className="text-2xl font-black text-white font-display tracking-tight">
                {(stats.revenue_alltime.total / 1000).toFixed(1)}K
              </span>
            </div>
          </div>

          {/* Bottom stats stacked */}
          <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
            <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Previous Months</span>
            <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide pr-1">
              {stats.revenue_alltime.monthly_history.slice(0, 3).map((m, index) => (
                <div key={index} className="flex justify-between items-center text-[10px] border-b border-white/5 last:border-b-0 pb-1 last:pb-0 font-medium">
                  <span className="text-slate-400">{m.label}</span>
                  <span className="font-bold text-amber-500">KES {m.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. TIPS & WIN RATE */}
        <div className="glass-panel p-4 pb-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-emerald-500/20 transition-all bg-slate-950/40 shadow-xl min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Target size={15} className="text-indigo-400" />
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tips & Win Rate</span>
              </div>
              <span className="text-indigo-400 text-[8px] font-black flex items-center gap-0.5 bg-indigo-500/10 border border-indigo-500/20 px-1 py-0.5 rounded">
                ↗ {stats.tips.total} total
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white font-display tracking-tight">{stats.tips.win_rate}%</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              <span className="bg-slate-800/50 border border-white/5 text-slate-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                Predictive Accuracy
              </span>
            </div>
          </div>

          {/* Bottom stats stacked */}
          <div className="grid grid-cols-2 gap-1.5 mt-6 text-center">
            <div className="bg-slate-900/30 border border-white/5 rounded-xl p-1 flex flex-col justify-center">
              <span className="text-[7px] text-slate-500 font-bold uppercase">Won</span>
              <span className="text-xs font-black text-green-400">{stats.tips.won}</span>
            </div>
            <div className="bg-slate-900/30 border border-white/5 rounded-xl p-1 flex flex-col justify-center">
              <span className="text-[7px] text-slate-500 font-bold uppercase">Lost</span>
              <span className="text-xs font-black text-red-400">{stats.tips.lost}</span>
            </div>
            <div className="bg-slate-900/30 border border-white/5 rounded-xl p-1 flex flex-col justify-center">
              <span className="text-[7px] text-slate-500 font-bold uppercase">Pending</span>
              <span className="text-xs font-black text-yellow-400">{stats.tips.pending}</span>
            </div>
            <div className="bg-slate-900/30 border border-white/5 rounded-xl p-1 flex flex-col justify-center">
              <span className="text-[7px] text-slate-500 font-bold uppercase">Void</span>
              <span className="text-xs font-black text-slate-300">{stats.tips.void}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom section: Revenue Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Revenue Trend chart card */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 lg:col-span-2 bg-slate-950/40 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Revenue Trend</h4>
              <p className="text-[10px] text-slate-400">Total daily earnings compilation</p>
            </div>
            <div className="flex gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5">
              {['7D', '30D', '90D', '1Y'].map((t, idx) => (
                <button
                  key={t}
                  className={`px-2.5 py-1 text-[9px] font-extrabold rounded-md transition-all ${
                    idx === 1 ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Simple visual simulated bar chart */}
          <div className="h-44 flex items-end justify-between gap-1 pt-6 px-2">
            {Array.from({ length: 24 }).map((_, i) => {
              const h = Math.max(10, Math.sin((i + 2) * 0.8) * 75 + 85 + (i % 3) * 12);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 bg-slate-900 border border-white/10 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                    KES {(h * 150).toLocaleString()}
                  </div>
                  <div 
                    className="w-full bg-linear-to-t from-indigo-500/20 to-indigo-500 rounded-sm group-hover:to-emerald-400 transition-all cursor-pointer"
                    style={{ height: `${(h / 180) * 100}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 font-bold px-2 pt-1">
            <span>30 days ago</span>
            <span>15 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Revenue by Method breakdown card */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-950/40 shadow-xl flex flex-col justify-between">
          <div className="border-b border-white/5 pb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Revenue by Method</h4>
            <p className="text-[10px] text-slate-400">Payment gateway breakdown</p>
          </div>

          <div className="py-6 flex flex-col gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">M-PESA Paybill</span>
                <span className="text-white">{(stats.revenue_monthly.total > 0 ? (stats.revenue_monthly.by_method.mpesa / stats.revenue_monthly.total) * 100 : 100).toFixed(0)}%</span>
              </div>
              <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${(stats.revenue_monthly.total > 0 ? (stats.revenue_monthly.by_method.mpesa / stats.revenue_monthly.total) * 100 : 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">PayPal Gateway</span>
                <span className="text-white">{(stats.revenue_monthly.total > 0 ? (stats.revenue_monthly.by_method.paypal / stats.revenue_monthly.total) * 100 : 0).toFixed(0)}%</span>
              </div>
              <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-indigo-500 rounded-full" 
                  style={{ width: `${(stats.revenue_monthly.total > 0 ? (stats.revenue_monthly.by_method.paypal / stats.revenue_monthly.total) * 100 : 0)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-black/25 border border-white/5 rounded-xl p-3 text-[10px] text-slate-400 font-medium space-y-1">
            <p>ℹ️ M-Pesa is processed dynamically via direct push STK payments.</p>
            <p>ℹ️ PayPal handles all international subscriber packages.</p>
          </div>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  USERS & TELEMETRY TAB
// ═══════════════════════════════════════════════════════════════

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [sortField, setSortField] = useState('last_seen');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [userDetail, setUserDetail] = useState<UserActivityDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Grant Subscription modal state
  const [grantModalUser, setGrantModalUser] = useState<AdminUser | null>(null);
  const [grantTier, setGrantTier] = useState('standard');
  const [grantDays, setGrantDays] = useState(30);
  const [granting, setGranting] = useState(false);
  const [availableTiers, setAvailableTiers] = useState<SubscriptionTier[]>([]);

  useEffect(() => {
    getPricingTiers().then(setAvailableTiers).catch(console.error);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        search: search || undefined,
        tier: tierFilter,
        sort_field: sortField,
        sort_dir: sortDir,
        page,
        per_page: 50,
      });
      setUsers(res.users);
      setTotal(res.total);
      setCounts(res.counts || {});
    } catch {
      toast.error('Failed to fetch users list');
    } finally {
      setLoading(false);
    }
  }, [search, tierFilter, sortField, sortDir, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (u: AdminUser) => {
    if (!confirm(u.is_active ? `Ban user "${u.email}"?` : `Unban user "${u.email}"?`)) return;
    try {
      await adminService.toggleUserActive(u.id);
      toast.success(u.is_active ? 'User banned successfully' : 'User unbanned successfully');
      fetchUsers();
    } catch {
      toast.error('Failed to update user active state');
    }
  };

  const handleRevoke = async (u: AdminUser) => {
    if (!confirm(`Revoke subscription entitlements for "${u.email}"?`)) return;
    try {
      await adminService.revokeSubscription(u.id);
      toast.success('Subscription revoked');
      fetchUsers();
      if (expandedId === u.id) handleExpand(u.id);
    } catch {
      toast.error('Failed to revoke subscription');
    }
  };

  const handleExpand = async (userId: number) => {
    if (expandedId === userId) {
      setExpandedId(null);
      setUserDetail(null);
      return;
    }
    setExpandedId(userId);
    setDetailLoading(true);
    try {
      const data = await adminService.getUserActivity(userId);
      setUserDetail(data);
    } catch {
      toast.error('Failed to fetch user activity detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantModalUser) return;
    setGranting(true);
    try {
      await adminService.grantSubscription(grantModalUser.id, {
        tier: grantTier,
        duration_days: grantDays,
      });
      toast.success(`Subscription tier "${grantTier}" granted successfully!`);
      setGrantModalUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to grant subscription');
    } finally {
      setGranting(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(1); }} 
            placeholder="Search users by name, email, phone..." 
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs w-full focus:outline-none focus:border-indigo-500/50" 
          />
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-white/5 p-1 rounded-xl border border-white/5 text-[10px] font-bold">
          {[
            { key: 'all', label: 'All' },
            { key: 'online', label: '🟢 Online' },
            { key: 'free', label: 'Free' },
            ...availableTiers.filter(t => t.tier_id !== 'free').map(t => ({ key: t.tier_id, label: t.name })),
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setTierFilter(f.key); setPage(1); }}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
                tierFilter === f.key ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f.label} {counts[f.key] !== undefined ? `(${counts[f.key]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader size={48} /></div>
      ) : (
        <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden bg-slate-950/40 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-slate-300 font-bold uppercase tracking-wider select-none">
                  <th onClick={() => handleSort('name')} className="py-4 px-6 cursor-pointer hover:text-white transition-colors">
                    User <ArrowUpDown className="inline w-3 h-3 ml-1" />
                  </th>
                  <th onClick={() => handleSort('subscription_tier')} className="py-4 px-6 cursor-pointer hover:text-white transition-colors">
                    Subscription <ArrowUpDown className="inline w-3 h-3 ml-1" />
                  </th>
                  <th onClick={() => handleSort('last_seen')} className="py-4 px-6 cursor-pointer hover:text-white transition-colors">
                    Status <ArrowUpDown className="inline w-3 h-3 ml-1" />
                  </th>
                  <th onClick={() => handleSort('total_time_spent')} className="py-4 px-6 cursor-pointer hover:text-white transition-colors">
                    Telemetry Activity <ArrowUpDown className="inline w-3 h-3 ml-1" />
                  </th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <React.Fragment key={u.id}>
                    <tr 
                      onClick={() => handleExpand(u.id)}
                      className={`border-b border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer ${
                        expandedId === u.id ? 'bg-white/[0.03]' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">{u.name || 'Anonymous User'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{u.email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          u.subscription_tier === 'free' ? 'bg-white/5 text-slate-400' : 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                        }`}>
                          {u.subscription_tier}
                        </span>
                        {u.subscription_expires_at && (
                          <div className="text-[9px] text-slate-500 mt-1">Expires: {new Date(u.subscription_expires_at).toLocaleDateString()}</div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {u.is_online ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">
                            Offline
                            {u.last_seen && <span className="block text-[9px] text-slate-600 mt-0.5">Seen: {new Date(u.last_seen).toLocaleDateString()}</span>}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="truncate max-w-[160px] text-slate-300 font-semibold">Top: {u.most_visited_page || '—'}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">Duration: {Math.floor(u.total_time_spent / 60)}m {u.total_time_spent % 60}s</div>
                      </td>
                      <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleExpand(u.id)} className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" title="Inspect Telemetry"><Eye size={12} /></button>
                          <button onClick={() => setGrantModalUser(u)} className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-all" title="Grant subscription"><Gift size={12} /></button>
                          {u.subscription_tier !== 'free' && (
                            <button onClick={() => handleRevoke(u)} className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-red-400 hover:bg-white/10 transition-all" title="Revoke subscription"><XCircle size={12} /></button>
                          )}
                          <button onClick={() => handleToggleActive(u)} className={`p-1.5 rounded-lg bg-white/5 border border-white/5 transition-all hover:bg-white/10 ${u.is_active ? 'text-slate-400 hover:text-red-400' : 'text-red-400 hover:text-green-400'}`} title={u.is_active ? 'Ban User' : 'Unban User'}>
                            {u.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Telemetry History Drawer */}
                    {expandedId === u.id && (
                      <tr className="bg-slate-950/40 border-b border-white/5">
                        <td colSpan={5} className="py-5 px-8">
                          {detailLoading ? (
                            <div className="flex justify-center py-6"><Loader size={32} /></div>
                          ) : userDetail ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                              {/* Left detail column */}
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">Activity Totals</h5>
                                <div className="text-[11px] space-y-1.5">
                                  <p className="text-slate-400">Total session duration: <span className="font-bold text-white">{Math.floor(userDetail.total_time_spent / 60)}m {userDetail.total_time_spent % 60}s</span></p>
                                  <p className="text-slate-400">Total payments value: <span className="font-bold text-emerald-400">KES {userDetail.total_spent.toLocaleString()}</span></p>
                                  <p className="text-slate-400">Origin country: <span className="font-bold text-white">{userDetail.user.country || 'Unknown'}</span></p>
                                  <p className="text-slate-400">Account status: <span className={`font-bold ${userDetail.user.is_active ? 'text-green-400' : 'text-red-400'}`}>{userDetail.user.is_active ? 'Active' : 'Banned/Disabled'}</span></p>
                                  <p className="text-slate-400">Registered on: <span className="font-semibold text-slate-300">{userDetail.user.created_at ? new Date(userDetail.user.created_at).toLocaleDateString() : '—'}</span></p>
                                </div>
                              </div>

                              {/* Center detail column */}
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">Navigation Metrics</h5>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                  {userDetail.pages.map(p => (
                                    <div key={p.path} className="flex justify-between text-[10px] border-b border-white/[0.02] pb-1">
                                      <span className="text-slate-300 truncate mr-2" title={p.path}>{p.path}</span>
                                      <span className="text-slate-500 shrink-0 font-bold">{p.visits} visits • {Math.floor(p.total_time / 60)}m</span>
                                    </div>
                                  ))}
                                  {userDetail.pages.length === 0 && <p className="text-[11px] text-slate-600">No telemetry route updates yet.</p>}
                                </div>
                              </div>

                              {/* Right detail column */}
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">Transaction History</h5>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                  {userDetail.payments.map(p => (
                                    <div key={p.id} className="flex justify-between items-center text-[10px] border-b border-white/[0.02] pb-1">
                                      <div>
                                        <span className="font-bold text-white">KES {p.amount.toLocaleString()}</span>
                                        <span className="text-slate-500 block text-[9px]">{p.method.toUpperCase()} • {p.reference || 'No Ref'}</span>
                                      </div>
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                        p.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                        p.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                      }`}>{p.status}</span>
                                    </div>
                                  ))}
                                  {userDetail.payments.length === 0 && <p className="text-[11px] text-slate-600">No payment logs found.</p>}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">No users match the search terms.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination */}
          {total > 50 && (
            <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-t border-white/10 text-xs text-slate-400">
              <button 
                onClick={() => setPage(p => Math.max(p - 1, 1))} 
                disabled={page === 1}
                className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <span>Page {page} of {Math.ceil(total / 50)}</span>
              <button 
                onClick={() => setPage(p => p + 1)} 
                disabled={page * 50 >= total}
                className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grant Override modal */}
      {grantModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <form onSubmit={handleGrantSubmit} className="clay-card rounded-2xl p-6 border border-white/10 max-w-sm w-full space-y-4 bg-slate-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h4 className="text-sm font-bold text-white">Override Subscription Entitlement</h4>
              <button type="button" onClick={() => setGrantModalUser(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div>
              <p className="text-xs text-slate-400">Directly override subscription entitlement settings for: <span className="font-bold text-indigo-300 block mt-0.5">{grantModalUser.email}</span></p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Tier</label>
                <select value={grantTier} onChange={e => setGrantTier(e.target.value)} className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full focus:outline-none">
                  {availableTiers.filter(t => t.tier_id !== 'free').map(t => (
                    <option key={t.tier_id} value={t.tier_id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Duration Days</label>
                <input type="number" min="1" value={grantDays} onChange={e => setGrantDays(Number(e.target.value) || 30)} className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={granting} className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg">
                {granting ? 'Overriding...' : 'Grant Subscription'}
              </button>
              <button type="button" onClick={() => setGrantModalUser(null)} className="px-4 py-2.5 bg-white/5 text-slate-300 border border-white/5 rounded-xl text-xs hover:bg-white/10 transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TIPS TAB
// ═══════════════════════════════════════════════════════════════

function TipsTab() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    fixtureId: '', homeTeam: '', awayTeam: '', league: '', matchDate: new Date().toISOString().slice(0, 16),
    prediction: '', odds: '1.75', bookmaker: 'Betway', confidence: 3, reasoning: '', category: 'gg' as const,
    isFree: false, notify: false,
  });

  const fetchTips = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllTips();
      setTips(all);
    } catch {
      toast.error('Failed to load tips log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTips(); }, [fetchTips]);

  const handleDelete = async (id: string) => {
    if (!confirm('Confirm deletion of this prediction?')) return;
    const ok = await deleteTip(id);
    if (ok) {
      toast.success('Tip deleted');
      fetchTips();
    } else {
      toast.error('Failed to delete tip');
    }
  };

  const handleResult = async (id: string, result: 'won' | 'lost' | 'void') => {
    const res = await updateTip(id, { result });
    if (res) {
      toast.success(`Tip marked as ${result.toUpperCase()}`);
      fetchTips();
    }
  };

  const startEdit = (tip: Tip) => {
    setForm({
      fixtureId: String(tip.fixtureId),
      homeTeam: tip.homeTeam,
      awayTeam: tip.awayTeam,
      league: tip.league,
      matchDate: tip.matchDate.slice(0, 16),
      prediction: tip.prediction,
      odds: tip.odds,
      bookmaker: tip.bookmaker || 'Betway',
      confidence: tip.confidence,
      reasoning: tip.reasoning,
      category: tip.category as 'free' | 'gg' | 'over25',
      isFree: tip.isFree,
      notify: false,
    });
    setEditingId(tip.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.homeTeam || !form.awayTeam || !form.league || !form.matchDate || !form.prediction) {
      toast.error('Fill in all required fields');
      return;
    }

    const payload: TipMutationInput = {
      fixtureId: parseInt(form.fixtureId) || Math.floor(Math.random() * 900000) + 100000,
      homeTeam: form.homeTeam,
      awayTeam: form.awayTeam,
      league: form.league,
      matchDate: form.matchDate,
      prediction: form.prediction,
      odds: form.odds,
      bookmaker: form.bookmaker,
      confidence: form.confidence,
      reasoning: form.reasoning,
      category: form.isFree ? 'free' : form.category,
      isFree: form.isFree || form.category === 'free',
      notify: form.notify,
    };

    let result;
    if (editingId) {
      result = await updateTip(editingId, payload);
      if (result) toast.success('Prediction updated');
    } else {
      result = await addTip(payload);
      if (result) toast.success('Prediction published');
    }

    if (result) {
      setShowForm(false);
      setEditingId(null);
      setForm({
        fixtureId: '', homeTeam: '', awayTeam: '', league: '', matchDate: new Date().toISOString().slice(0, 16),
        prediction: '', odds: '1.75', bookmaker: 'Betway', confidence: 3, reasoning: '', category: 'gg',
        isFree: false, notify: false,
      });
      fetchTips();
    } else {
      toast.error('Could not save tip');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-400">Publish, modify or resolve game predictions categorized by subscription levels.</p>
        <div className="w-40">
          <AnimatedButton 
            onClick={() => {
              setEditingId(null);
              setShowForm(!showForm);
            }} 
          >
            {editingId ? 'Edit Mode' : 'Add Tip'}
          </AnimatedButton>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="clay-card rounded-2xl p-5 border border-white/10 space-y-4 bg-slate-900 shadow-2xl">
          <h4 className="text-xs font-bold text-white border-b border-white/5 pb-2 uppercase tracking-wide">
            {editingId ? 'Edit Prediction Pick' : 'Add New Tip Pick'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Home Team *</label>
              <input value={form.homeTeam} onChange={e => setForm({...form, homeTeam: e.target.value})} placeholder="Home Team" className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full focus:outline-none focus:border-indigo-500/50" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Away Team *</label>
              <input value={form.awayTeam} onChange={e => setForm({...form, awayTeam: e.target.value})} placeholder="Away Team" className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full focus:outline-none focus:border-indigo-500/50" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">League Name *</label>
              <input value={form.league} onChange={e => setForm({...form, league: e.target.value})} placeholder="League" className="bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs w-full focus:outline-none focus:border-indigo-500/50" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Match Kickoff Time *</label>
              <input type="datetime-local" value={form.matchDate} onChange={e => setForm({...form, matchDate: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full focus:outline-none" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prediction Pick *</label>
              <input value={form.prediction} onChange={e => setForm({...form, prediction: e.target.value})} placeholder="e.g. GG / Home Win" className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full focus:outline-none focus:border-indigo-500/50" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Odds Ratio *</label>
              <input value={form.odds} onChange={e => setForm({...form, odds: e.target.value})} placeholder="1.80" className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full focus:outline-none focus:border-indigo-500/50" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bookmaker</label>
              <input value={form.bookmaker} onChange={e => setForm({...form, bookmaker: e.target.value})} placeholder="Betway" className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fixture ID</label>
              <input type="number" value={form.fixtureId} onChange={e => setForm({...form, fixtureId: e.target.value})} placeholder="Fixture ID" className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Confidence Rating</label>
              <select value={form.confidence} onChange={e => setForm({...form, confidence: Number(e.target.value)})} className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full focus:outline-none">
                <option value={1}>1/5 - Low</option>
                <option value={2}>2/5 - Fair</option>
                <option value={3}>3/5 - Good</option>
                <option value={4}>4/5 - High</option>
                <option value={5}>5/5 - VIP Lock</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Analysis Detail / Reasoning</label>
            <textarea value={form.reasoning} onChange={e => setForm({...form, reasoning: e.target.value})} placeholder="Enter brief justification arguments..." className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full min-h-[80px] focus:outline-none resize-y" />
          </div>
          <div className="flex flex-wrap gap-6 items-center bg-white/5 p-4 rounded-xl border border-white/5">
            <AnimatedCheckbox
              id="isFreeCheck"
              checked={form.isFree}
              onChange={e => setForm({...form, isFree: e.target.checked})}
              label="Mark as Free Tip"
            />
            {!form.isFree && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-semibold">VIP Level:</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value as 'gg' | 'over25'})} className="bg-slate-950 border border-white/10 rounded-lg py-1 px-2 text-white text-xs focus:outline-none">
                  <option value="gg">GG VIP Pack</option>
                  <option value="over25">Over 2.5 VIP Pack</option>
                </select>
              </div>
            )}
            <AnimatedCheckbox
              id="notifyCheck"
              checked={form.notify}
              onChange={e => setForm({...form, notify: e.target.checked})}
              label="Telegram broadcast alert"
            />
            <div className="ml-auto flex gap-4 items-center">
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }} 
                className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 px-4 py-2 rounded-lg text-xs font-bold transition-all h-[36px]"
              >
                Cancel
              </button>
              <div className="w-36">
                <AnimatedButton type="submit">
                  {editingId ? 'Save' : 'Publish'}
                </AnimatedButton>
              </div>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {tips.map(tip => (
            <div key={tip.id} className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/40 shadow-xl hover:border-white/20 transition-all">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2.5 py-0.5 rounded-md border border-white/5">{tip.league}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                    tip.isFree ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                  }`}>
                    {tip.isFree ? 'Free' : tip.category.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-500">{new Date(tip.matchDate).toLocaleDateString()} {new Date(tip.matchDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {tip.homeTeam} vs {tip.awayTeam}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Prediction: <span className="text-indigo-300 font-bold">{tip.prediction}</span> @ <span className="text-emerald-400 font-bold">{tip.odds}</span> ({tip.bookmaker || 'Betway'})
                </div>
              </div>

              <div className="flex gap-2 items-center shrink-0 w-full sm:w-auto justify-end border-t border-white/5 pt-3 sm:pt-0 sm:border-t-0">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wide ${
                  tip.result === 'won' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                  tip.result === 'lost' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                  tip.result === 'void' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                  'bg-white/10 text-slate-400 border border-white/5'
                }`}>{tip.result}</span>

                {tip.result === 'pending' && (
                  <>
                    <button onClick={() => handleResult(tip.id, 'won')} className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all" title="Mark Won">
                      <Check size={14} />
                    </button>
                    <button onClick={() => handleResult(tip.id, 'lost')} className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all" title="Mark Lost">
                      <X size={14} />
                    </button>
                  </>
                )}
                <button onClick={() => startEdit(tip)} className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all" title="Edit">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(tip.id)} className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {tips.length === 0 && (
            <div className="text-center py-16 text-slate-500 font-medium">No published predictions match current filters.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  REVENUE TAB
// ═══════════════════════════════════════════════════════════════

interface AdminPayment {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  method: string;
  status: string;
  reference: string | null;
  transaction_id: string | null;
  item_type: string;
  item_id: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

function RevenueTab() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const p = status === 'all' ? undefined : status;
      const res = await apiClient.get<{ payments: AdminPayment[] }>('/admin/payments', {
        params: { status: p }
      });
      // Filter locally by search email/reference
      let list = res.data.payments || [];
      if (search) {
        const term = search.toLowerCase();
        list = list.filter(item => 
          (item.email && item.email.toLowerCase().includes(term)) ||
          (item.reference && item.reference.toLowerCase().includes(term)) ||
          (item.phone && item.phone.includes(term))
        );
      }
      setPayments(list);
    } catch {
      toast.error('Failed to load transactions log');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalCompleted = useMemo(() => {
    return payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  return (
    <div className="space-y-4">
      {/* Header aggregates card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-slate-950/40">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Loaded Entries</span>
          <span className="text-xl font-black text-white">{payments.length}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-slate-950/40">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Completed Value</span>
          <span className="text-xl font-black text-emerald-400">KES {totalCompleted.toLocaleString()}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-slate-950/40">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Conversion Efficiency</span>
          <span className="text-xl font-black text-indigo-400">
            {payments.length > 0 ? ((payments.filter(p => p.status === 'completed').length / payments.length) * 100).toFixed(0) : 0}%
          </span>
        </div>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search transactions by reference, email..." 
            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-xs w-full focus:outline-none" 
          />
        </div>

        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 text-[10px] font-bold">
          {['all', 'completed', 'pending', 'failed'].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                status === s ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader size={48} /></div>
      ) : (
        <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden bg-slate-950/40 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-slate-300 font-bold uppercase select-none">
                  <th className="py-3.5 px-6">Transaction ID</th>
                  <th className="py-3.5 px-6">User / Account</th>
                  <th className="py-3.5 px-6">Gate / Method</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Reference</th>
                  <th className="py-3.5 px-6">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                    <td className="py-3.5 px-6 font-bold text-white">TXN-{p.id}</td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-200">{p.email || 'System Override'}</div>
                      <div className="text-[10px] text-slate-500">{p.phone || '—'}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-black uppercase text-[9px] text-slate-400">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-white">KES {p.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        p.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                        p.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                        'bg-red-500/20 text-red-400 border border-red-500/20'
                      }`}>{p.status}</span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-400">{p.reference || '—'}</td>
                    <td className="py-3.5 px-6 text-slate-500">{new Date(p.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">No transaction entries found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PRICING TAB
// ═══════════════════════════════════════════════════════════════

function PricingTab() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [tierForm, setTierForm] = useState({ price_2wk: 0, price_4wk: 0 });
  const [showForm, setShowForm] = useState(false);
  const [newForm, setNewForm] = useState({
    tier_id: '', name: '', description: '', price_2wk: 300, price_4wk: 500,
    categories: [] as string[], popular: false,
  });

  const loadTiers = () => {
    getPricingTiers().then(setTiers);
  };

  useEffect(() => { loadTiers(); }, []);

  const startEdit = (tier: SubscriptionTier) => {
    setEditingTier(tier.tier_id);
    setTierForm({ price_2wk: tier.price_2wk, price_4wk: tier.price_4wk });
  };

  const saveEdit = async (tierId: string) => {
    const res = await updatePricingTier(tierId, {
      price_2wk: tierForm.price_2wk,
      price_4wk: tierForm.price_4wk,
    });
    if (res) {
      toast.success('Pricing tier updated');
      loadTiers();
      setEditingTier(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.tier_id || !newForm.name) {
      toast.error('Tier ID and Name are required');
      return;
    }
    const res = await addPricingTier(newForm as any);
    if (res) {
      toast.success('Pricing tier added');
      setShowForm(false);
      setNewForm({ tier_id: '', name: '', description: '', price_2wk: 300, price_4wk: 500, categories: [], popular: false });
      loadTiers();
    }
  };

  const handleDelete = async (tierId: string) => {
    if (!confirm(`Delete the "${tierId}" tier? This is permanent.`)) return;
    const ok = await deletePricingTier(tierId);
    if (ok) {
      toast.success('Pricing tier deleted');
      loadTiers();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-400">Configure cost matrices for different prediction groups.</p>
        <div className="w-40">
          <AnimatedButton onClick={() => setShowForm(!showForm)}>
            Add Tier
          </AnimatedButton>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="clay-card rounded-2xl p-5 border border-white/10 space-y-4 max-w-xl bg-slate-900 shadow-2xl">
          <h4 className="text-xs font-bold text-white border-b border-white/5 pb-2 uppercase tracking-wide">Add Pricing Package</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tier Code ID *</label>
              <input value={newForm.tier_id} onChange={e => setNewForm({...newForm, tier_id: e.target.value})} placeholder="e.g. mega" className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full focus:outline-none focus:border-indigo-500/50" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Display Label *</label>
              <input value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})} placeholder="e.g. Mega Pack" className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full focus:outline-none focus:border-indigo-500/50" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">2 Weeks Pack Price (KES) *</label>
              <input type="number" value={newForm.price_2wk} onChange={e => setNewForm({...newForm, price_2wk: Number(e.target.value) || 0})} className="bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs w-full focus:outline-none" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">4 Weeks Pack Price (KES) *</label>
              <input type="number" value={newForm.price_4wk} onChange={e => setNewForm({...newForm, price_4wk: Number(e.target.value) || 0})} className="bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs w-full focus:outline-none" required />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
            <input value={newForm.description} onChange={e => setNewForm({...newForm, description: e.target.value})} placeholder="Description details..." className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs w-full focus:outline-none" />
          </div>
          <div className="flex gap-4 items-center bg-white/5 p-4 rounded-xl">
            <AnimatedCheckbox
              id="popCheck"
              checked={newForm.popular}
              onChange={e => setNewForm({...newForm, popular: e.target.checked})}
              label="Highlight badge"
            />
            <div className="ml-auto flex gap-4 items-center">
              <button type="button" onClick={() => setShowForm(false)} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 px-4 py-2 rounded-lg text-xs font-bold transition-all h-[36px]">Cancel</button>
              <div className="w-32">
                <AnimatedButton type="submit">
                  Create
                </AnimatedButton>
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map(tier => (
          <div key={tier.tier_id} className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col justify-between bg-slate-950/40 shadow-xl hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2.5 py-0.5 rounded-md border border-white/5">{tier.tier_id}</span>
                <div className="flex gap-1">
                  {editingTier === tier.tier_id ? (
                    <>
                      <button onClick={() => saveEdit(tier.tier_id)} className="p-1 rounded bg-green-500/20 text-green-400 border border-green-500/20 hover:bg-green-500/30 transition-all"><Check size={12} /></button>
                      <button onClick={() => setEditingTier(null)} className="p-1 rounded bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 transition-all"><X size={12} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(tier)} className="p-1 rounded bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 transition-all"><Edit size={12} /></button>
                      {tier.tier_id !== 'free' && (
                        <button onClick={() => handleDelete(tier.tier_id)} className="p-1 rounded bg-white/5 border border-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all"><Trash2 size={12} /></button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                {tier.name}
                {tier.popular && <span className="bg-amber-500 text-amber-950 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Popular</span>}
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 min-h-[32px]">{tier.description || 'No description provided.'}</p>
            </div>

            <div className="mt-5 pt-4 border-t border-white/5 space-y-3">
              {editingTier === tier.tier_id ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">2 Wks Price</label>
                    <input type="number" value={tierForm.price_2wk} onChange={e => setTierForm({...tierForm, price_2wk: Number(e.target.value) || 0})} className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-white text-xs w-full focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">4 Wks Price</label>
                    <input type="number" value={tierForm.price_4wk} onChange={e => setTierForm({...tierForm, price_4wk: Number(e.target.value) || 0})} className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-white text-xs w-full focus:outline-none" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-center bg-black/20 p-2.5 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">2 Weeks</span>
                    <span className="text-xs font-black text-white">KES {tier.price_2wk.toLocaleString()}</span>
                  </div>
                  <div className="border-l border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">4 Weeks</span>
                    <span className="text-xs font-black text-white">KES {tier.price_4wk.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BROADCAST TAB
// ═══════════════════════════════════════════════════════════════

function BroadcastTab() {
  const [form, setForm] = useState({ title: '', body: '', url: '/', targetTier: 'all', targetCountry: '' });
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ targeted_users: number; emails_sent: number; total_subscriptions: number } | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.body) {
      toast.error('Title and message are required');
      return;
    }
    setIsSending(true);
    try {
      const res = await adminService.broadcastPush({
        title: form.title,
        body: form.body,
        url: form.url,
        target_tier: form.targetTier,
        target_country: form.targetCountry || undefined,
      });
      toast.success(`Broadcast sent successfully!`);
      setResult(res);
      setForm({ title: '', body: '', url: '/', targetTier: 'all', targetCountry: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Broadcast failure');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Device Notification Preview */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-3.5">
          <Smartphone className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notification Preview</span>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-white/5 flex items-start gap-3 shadow-inner">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">{form.title || 'Notification Title'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{form.body || 'Compose details below. Click redirection will follow click URL redirection value...'}</p>
            <p className="text-[9px] text-slate-500 mt-1 font-semibold uppercase tracking-wider">winvirahisi.com • now</p>
          </div>
        </div>
      </div>

      {/* Composer form */}
      <form onSubmit={handleBroadcast} className="clay-card rounded-2xl p-6 border border-white/10 space-y-5 bg-slate-900 shadow-2xl">
        <div className="pt-2">
          <AnimatedInput
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
            labelText="Push Alert Title"
            required
          />
        </div>
        <div>
          <AnimatedTextArea
            value={form.body}
            onChange={e => setForm({...form, body: e.target.value})}
            labelText="Push Message Body"
            rows={3}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <AnimatedInput
              value={form.url}
              onChange={e => setForm({...form, url: e.target.value})}
              labelText="Redirection Click URL"
            />
          </div>
          <div className="pb-6">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">Target Entitlement</label>
            <select value={form.targetTier} onChange={e => setForm({...form, targetTier: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs w-full focus:outline-none h-[38px]">
              <option value="all">Everyone (All Tiers)</option>
              <option value="free">Free Users Only</option>
              <option value="standard">Standard VIP Only</option>
              <option value="premium">Premium VIP Only</option>
            </select>
          </div>
          <div>
            <AnimatedInput
              value={form.targetCountry}
              onChange={e => setForm({...form, targetCountry: e.target.value})}
              labelText="Target Country Code"
              maxLength={2}
            />
          </div>
        </div>
        <div className="pt-2 border-t border-white/5">
          <AnimatedButton type="submit" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send Broadcast'}
          </AnimatedButton>
        </div>
      </form>

      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-400 font-semibold space-y-1">
          <p>✅ Broadcast Sent Successfully!</p>
          <p className="text-slate-300">Targeted Users: <span className="font-bold text-white">{result.targeted_users}</span></p>
          <p className="text-slate-300">Push Subscriptions: <span className="font-bold text-white">{result.total_subscriptions}</span></p>
        </div>
      )}
    </div>
  );
}
