import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, X, Loader2, Edit, Play, Target, Link2, Gift,
  Calendar, Upload, Video, Image as ImageIcon, Sparkles, Palette, Save
} from 'lucide-react';
import { adminService, type Campaign } from '../../services/adminService';
import { toast } from 'sonner';
import Loader from '../../components/Loader';
import { CosmicToggle, AnimatedButton } from '../../components/AnimatedElements';

function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3">
      <span className="text-xs font-bold text-slate-300">{label}</span>
      <CosmicToggle checked={checked} onChange={onChange} />
    </div>
  );
}

function FileDropZone({ label, accept, currentUrl, onUploaded }: { label: string; accept: string; currentUrl: string; onUploaded: (u: string) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try { const res = await adminService.uploadCampaignAsset(file); onUploaded(res.url); toast.success(`${label} uploaded`); }
    catch { toast.error(`Failed to upload ${label}`); }
    finally { setUploading(false); }
  };

  const isVideo = accept.includes('video');
  const Icon = isVideo ? Video : ImageIcon;

  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
        className={`relative border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${dragOver ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:border-white/20 bg-slate-950/40'}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2"><Loader size={24} /><span className="text-[10px] text-slate-400">Uploading...</span></div>
        ) : currentUrl ? (
          <div className="flex items-center gap-2 text-left justify-between">
            <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[10px] text-slate-300 truncate flex-1">{currentUrl}</span>
            <button type="button" onClick={e => { e.stopPropagation(); onUploaded(''); }} className="text-slate-500 hover:text-red-400"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1"><Upload className="w-5 h-5 text-slate-500" /><span className="text-[10px] text-slate-500">Drop here or <span className="text-emerald-400 font-bold">browse</span></span></div>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>
      <input type="text" value={currentUrl} onChange={e => onUploaded(e.target.value)} className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-emerald-500 transition-all" placeholder="or paste a URL..." />
    </div>
  );
}

export function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [incentiveType, setIncentiveType] = useState('extra_days');
  const [incentiveValue, setIncentiveValue] = useState(15);
  const [assetVideoUrl, setAssetVideoUrl] = useState('');
  const [assetImageUrl, setAssetImageUrl] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [bannerText, setBannerText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [themeColorHex, setThemeColorHex] = useState('');
  const [useSplashScreen, setUseSplashScreen] = useState(false);
  const [useFloatingBadge, setUseFloatingBadge] = useState(false);
  const [useParticleEffects, setUseParticleEffects] = useState(false);
  const [useCustomIcons, setUseCustomIcons] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try { const data = await adminService.getCampaigns(); setCampaigns(data); }
    catch { toast.error('Failed to load campaigns'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleOpenModal = (c?: Campaign) => {
    if (c) {
      setEditingCampaign(c); setSlug(c.slug); setTitle(c.title);
      setDescription(c.description || '');
      setStartDate(c.start_date.split('.')[0].slice(0, 16));
      setEndDate(c.end_date.split('.')[0].slice(0, 16));
      setIncentiveType(c.incentive_type); setIncentiveValue(c.incentive_value);
      setAssetVideoUrl(c.asset_video_url || ''); setAssetImageUrl(c.asset_image_url || '');
      setOgImageUrl(c.og_image_url || ''); setBannerText(c.banner_text || '');
      setIsActive(c.is_active); setThemeColorHex(c.theme_color_hex || '');
      setUseSplashScreen(c.use_splash_screen); setUseFloatingBadge(c.use_floating_badge);
      setUseParticleEffects(c.use_particle_effects); setUseCustomIcons(c.use_custom_icons);
    } else {
      setEditingCampaign(null); setSlug(''); setTitle(''); setDescription('');
      const now = new Date(); const nw = new Date(); nw.setDate(now.getDate() + 7);
      setStartDate(now.toISOString().slice(0, 16)); setEndDate(nw.toISOString().slice(0, 16));
      setIncentiveType('extra_days'); setIncentiveValue(15);
      setAssetVideoUrl(''); setAssetImageUrl(''); setOgImageUrl('');
      setBannerText(''); setIsActive(true); setThemeColorHex('');
      setUseSplashScreen(false); setUseFloatingBadge(false);
      setUseParticleEffects(false); setUseCustomIcons(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !startDate || !endDate) { toast.error("Please fill all required fields"); return; }
    try {
      const payload = {
        slug, title, description: description || undefined,
        start_date: new Date(startDate).toISOString(), end_date: new Date(endDate).toISOString(),
        incentive_type: incentiveType, incentive_value: incentiveValue,
        asset_video_url: assetVideoUrl || undefined, asset_image_url: assetImageUrl || undefined,
        og_image_url: ogImageUrl || undefined, banner_text: bannerText || undefined,
        is_active: isActive, theme_color_hex: themeColorHex || undefined,
        use_splash_screen: useSplashScreen, use_floating_badge: useFloatingBadge,
        use_particle_effects: useParticleEffects, use_custom_icons: useCustomIcons,
      };
      if (editingCampaign) { await adminService.updateCampaign(editingCampaign.id, payload); toast.success('Campaign updated'); }
      else { await adminService.createCampaign(payload); toast.success('Campaign created'); }
      setIsModalOpen(false); fetchCampaigns();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed to save campaign'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this campaign?')) return;
    try { await adminService.deleteCampaign(id); toast.success('Campaign deleted'); fetchCampaigns(); }
    catch { toast.error('Failed to delete campaign'); }
  };

  const toggleActive = async (id: number, cur: boolean) => {
    try { await adminService.updateCampaign(id, { is_active: !cur }); toast.success(`Campaign ${!cur ? 'activated' : 'deactivated'}`); fetchCampaigns(); }
    catch { toast.error('Failed to toggle campaign'); }
  };

  const copyCampaignLink = (s: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/?c=${s}`)
      .then(() => toast.success('Campaign link copied!'))
      .catch(() => toast.error('Failed to copy'));
  };

  if (loading) return (<div className="flex flex-col items-center justify-center py-20"><Loader size={48} label="Loading campaigns..." /></div>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">Manage Campaigns</h2>
          <p className="text-xs text-slate-400 mt-1">Configure user sign-up incentives and splash assets</p>
        </div>
        <div className="w-56">
          <AnimatedButton onClick={() => handleOpenModal()}>
            Create Campaign
          </AnimatedButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {campaigns.map(c => {
          const fx = [c.use_splash_screen, c.use_floating_badge, c.use_particle_effects, c.use_custom_icons].filter(Boolean).length;
          return (
            <div key={c.id} className={`glass-panel p-5 rounded-2xl bg-slate-950/40 border ${c.is_active ? 'border-emerald-500/25' : 'border-white/10'} hover:border-emerald-500/20 transition-all flex flex-col justify-between`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-md mb-2 ${c.is_active ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border border-white/5 text-slate-400'}`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                    <h3 className="font-bold text-white text-base leading-tight">{c.title}</h3>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">/{c.slug}</div>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded flex items-center gap-1">
                    <Gift size={12} />
                    {c.incentive_type === 'extra_days' ? `+${c.incentive_value} Days` : `${c.incentive_value}% Off`}
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-xs text-slate-400">
                  <div className="flex items-start gap-2">
                    <Calendar size={13} className="text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <div>Start: <span className="text-slate-300">{new Date(c.start_date).toLocaleString()}</span></div>
                      <div>End: <span className="text-slate-300">{new Date(c.end_date).toLocaleString()}</span></div>
                    </div>
                  </div>
                  {c.banner_text && <div className="text-[11px] bg-slate-950/50 p-2 rounded-lg text-slate-300 border border-white/5"><strong>Banner:</strong> {c.banner_text}</div>}
                </div>

                {fx > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {c.use_splash_screen && <span className="text-[8px] font-bold uppercase bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Splash</span>}
                    {c.use_floating_badge && <span className="text-[8px] font-bold uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Badge</span>}
                    {c.use_particle_effects && <span className="text-[8px] font-bold uppercase bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Particles</span>}
                    {c.use_custom_icons && <span className="text-[8px] font-bold uppercase bg-pink-500/10 border border-pink-500/20 text-pink-400 px-2 py-0.5 rounded">Icons</span>}
                    {c.theme_color_hex && <span className="text-[8px] font-bold uppercase bg-slate-800 border border-white/5 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.theme_color_hex }} /> Theme</span>}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-1.5 mb-4 p-3 bg-slate-950/50 rounded-xl border border-white/5">
                  {[
                    { label: 'Clicks', value: c.click_count || 0, color: 'text-blue-400' },
                    { label: 'Logins', value: c.login_count || 0, color: 'text-purple-400' },
                    { label: 'Sales', value: c.purchase_count || 0, color: 'text-amber-400' },
                    { label: 'Revenue', value: `KES ${c.revenue_generated || 0}`, color: 'text-emerald-400' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-[8px] font-bold text-slate-500 uppercase">{s.label}</div>
                      <div className={`text-xs font-bold mt-0.5 ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <button onClick={() => toggleActive(c.id, c.is_active)} className={`flex items-center gap-1.5 text-[10px] font-bold cursor-pointer transition-colors ${c.is_active ? 'text-slate-400 hover:text-white' : 'text-emerald-400 hover:text-emerald-300'}`}>
                  {c.is_active ? <><X size={12} /> Deactivate</> : <><Play size={12} /> Activate</>}
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={() => copyCampaignLink(c.slug)} className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"><Link2 size={14} /></button>
                  <button onClick={() => handleOpenModal(c)} className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          );
        })}
        {campaigns.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-2xl bg-slate-950/20">
            <Target className="w-10 h-10 mb-3 text-slate-600" />
            <p className="text-xs">No campaigns configured.</p>
            <button onClick={() => handleOpenModal()} className="mt-3 text-emerald-400 font-bold hover:text-emerald-300 text-xs cursor-pointer">Launch your first campaign</button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh] shadow-2xl backdrop-blur-md">
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md p-5 border-b border-white/5 z-10 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Title *</label>
                  <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g. Christmas Promotion" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">URL Slug *</label>
                  <input type="text" required value={slug} onChange={e => setSlug(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g. xmas-vip" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none" placeholder="Campaign description..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Date *</label>
                  <input type="datetime-local" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">End Date *</label>
                  <input type="datetime-local" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </div>
              <div className="p-4 bg-slate-950/40 border border-emerald-500/20 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Incentive Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
                    <select value={incentiveType} onChange={e => setIncentiveType(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer">
                      <option value="extra_days">Bonus Days (Extra Subscription)</option>
                      <option value="discount">Discount Percentage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Value</label>
                    <input type="number" required value={incentiveValue} onChange={e => setIncentiveValue(Number(e.target.value))} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Banner Text</label>
                <input type="text" value={bannerText} onChange={e => setBannerText(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="🎉 Special: Get bonus days!" />
              </div>
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2"><Upload size={13} /> Media Assets</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileDropZone label="Campaign Video" accept="video/*" currentUrl={assetVideoUrl} onUploaded={setAssetVideoUrl} />
                  <FileDropZone label="Campaign Image" accept="image/*" currentUrl={assetImageUrl} onUploaded={setAssetImageUrl} />
                </div>
                <FileDropZone label="OG Share Image" accept="image/*" currentUrl={ogImageUrl} onUploaded={setOgImageUrl} />
              </div>
              <div className="space-y-3 pt-4 border-t border-white/5">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2"><Sparkles size={13} /> Visual Effects</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ToggleSwitch label="Splash Screen" checked={useSplashScreen} onChange={setUseSplashScreen} />
                  <ToggleSwitch label="Floating Badge" checked={useFloatingBadge} onChange={setUseFloatingBadge} />
                  <ToggleSwitch label="Particle Effects" checked={useParticleEffects} onChange={setUseParticleEffects} />
                  <ToggleSwitch label="Custom Icons" checked={useCustomIcons} onChange={setUseCustomIcons} />
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2"><Palette size={13} /> Theme Color</h4>
                <div className="flex items-center gap-4">
                  <input type="color" value={themeColorHex || '#10b981'} onChange={e => setThemeColorHex(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent" />
                  <input type="text" value={themeColorHex} onChange={e => setThemeColorHex(e.target.value)} className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" placeholder="#EAB308" />
                  {themeColorHex && <button type="button" onClick={() => setThemeColorHex('')} className="text-xs text-slate-500 hover:text-red-400 cursor-pointer">Clear</button>}
                </div>
              </div>
              <ToggleSwitch label="Campaign Active" checked={isActive} onChange={setIsActive} />
              <div className="flex justify-end items-center gap-4 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                <div className="w-44">
                  <AnimatedButton type="submit">
                    {editingCampaign ? 'Save' : 'Launch'}
                  </AnimatedButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
