import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X, Loader2, Edit, Play, Megaphone, Link2, Image as ImageIcon } from 'lucide-react';
import { adminService, type AdPost } from '../../services/adminService';
import { toast } from 'sonner';
import Loader from '../../components/Loader';
import { AnimatedCheckbox, AnimatedInput, AnimatedButton } from '../../components/AnimatedElements';

export function AdsTab() {
  const [ads, setAds] = useState<AdPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdPost | null>(null);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [category, setCategory] = useState('Promo');
  const [isActive, setIsActive] = useState(true);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAds();
      setAds(data);
    } catch {
      toast.error('Failed to load ad posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const handleOpenModal = (ad?: AdPost) => {
    if (ad) {
      setEditingAd(ad);
      setTitle(ad.title);
      setImageUrl(ad.image_url || '');
      setLinkUrl(ad.link_url || '');
      setCategory(ad.category || 'Promo');
      setIsActive(ad.is_active);
    } else {
      setEditingAd(null);
      setTitle(''); setImageUrl(''); setLinkUrl('');
      setCategory('Promo'); setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) { toast.error("Title is required"); return; }
    try {
      const payload = { title, image_url: imageUrl || undefined, link_url: linkUrl || undefined, category, is_active: isActive };
      if (editingAd) {
        await adminService.updateAd(editingAd.id, payload);
        toast.success('Ad updated successfully');
      } else {
        await adminService.createAd(payload);
        toast.success('Ad created successfully');
      }
      setIsModalOpen(false);
      fetchAds();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save ad');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    try { await adminService.deleteAd(id); toast.success('Ad deleted'); fetchAds(); }
    catch { toast.error('Failed to delete ad'); }
  };

  const toggleActive = async (id: number, cur: boolean) => {
    try { await adminService.updateAd(id, { is_active: !cur }); toast.success(`Ad ${!cur ? 'activated' : 'deactivated'}`); fetchAds(); }
    catch { toast.error('Failed to toggle ad status'); }
  };

  if (loading) {
    return (<div className="flex flex-col items-center justify-center py-20"><Loader size={48} label="Loading promo ads..." /></div>);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">Manage Ads</h2>
          <p className="text-xs text-slate-400 mt-1">Create and manage promotional banner slides</p>
        </div>
        <div className="w-48">
          <AnimatedButton onClick={() => handleOpenModal()}>
            Create Ad
          </AnimatedButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map(ad => (
          <div key={ad.id} className={`glass-panel p-0 rounded-2xl overflow-hidden hover:border-emerald-500/20 transition-all bg-slate-950/40 border ${ad.is_active ? 'border-emerald-500/25 shadow-emerald-500/5' : 'border-white/10'} flex flex-col`}>
            <div className="relative h-44 w-full bg-slate-950/80 border-b border-white/5 flex items-center justify-center overflow-hidden">
              {ad.image_url ? (
                <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-600"><ImageIcon size={28} /><span className="text-[10px] uppercase font-bold tracking-wider">No Image</span></div>
              )}
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md ${ad.is_active ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border border-white/5 text-slate-400'}`}>
                  {ad.is_active ? 'Active' : 'Inactive'}
                </span>
                {ad.category && <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-slate-950/80 text-slate-300 rounded-md border border-white/10 backdrop-blur-xs">{ad.category}</span>}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-sm leading-snug mb-2 line-clamp-2">{ad.title}</h3>
                {ad.link_url && <a href={ad.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-400 transition-colors mb-4 truncate max-w-full"><Link2 size={12} className="shrink-0" /> {ad.link_url}</a>}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <button onClick={() => toggleActive(ad.id, ad.is_active)} className={`flex items-center gap-1.5 text-[10px] font-bold cursor-pointer transition-colors ${ad.is_active ? 'text-slate-400 hover:text-white' : 'text-emerald-400 hover:text-emerald-300'}`}>
                  {ad.is_active ? <><X size={12} /> Deactivate</> : <><Play size={12} /> Activate</>}
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleOpenModal(ad)} className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(ad.id)} className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {ads.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-2xl bg-slate-950/20">
            <Megaphone className="w-10 h-10 mb-3 text-slate-600" />
            <p className="text-xs">No promotional slides configured.</p>
            <button onClick={() => handleOpenModal()} className="mt-3 text-emerald-400 font-bold hover:text-emerald-300 text-xs cursor-pointer">Create one now</button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{editingAd ? 'Edit Promo Ad' : 'Create Promo Ad'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="pt-2">
                <AnimatedInput type="text" required value={title} onChange={e => setTitle(e.target.value)} labelText="Title Text" />
              </div>
              <div>
                <AnimatedInput type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} labelText="Image URL" />
              </div>
              <div>
                <AnimatedInput type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} labelText="Target Link" />
              </div>
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <AnimatedInput type="text" value={category} onChange={e => setCategory(e.target.value)} labelText="Category Tag" />
                </div>
                <div className="pt-2 pl-2">
                  <AnimatedCheckbox checked={isActive} onChange={e => setIsActive(e.target.checked)} label="Active" />
                </div>
              </div>
              <div className="flex justify-end items-center gap-4 pt-4 border-t border-white/5 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                <div className="w-36">
                  <AnimatedButton type="submit">
                    {editingAd ? 'Save' : 'Create'}
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
