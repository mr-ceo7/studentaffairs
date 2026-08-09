import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Smartphone, Mail, Phone, Save, AlertTriangle } from 'lucide-react';
import { adminService, type SMSSettings, type EmailSettings, type SupportSettings } from '../../services/adminService';
import { toast } from 'sonner';
import Loader from '../../components/Loader';
import { CosmicToggle, AnimatedInput, AnimatedTextArea, AnimatedButton } from '../../components/AnimatedElements';

export function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [savingSms, setSavingSms] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingSupport, setSavingSupport] = useState(false);

  const [smsSettings, setSmsSettings] = useState<SMSSettings>({ SMS_SRC: '', SMS_ENABLED: false, SMS_TEMPLATE: '' });
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({ SMTP_EMAIL: '', SMTP_PASSWORD: '' });
  const [supportSettings, setSupportSettings] = useState<SupportSettings>({ SUPPORT_EMAIL: '', SUPPORT_WHATSAPP: '', SUPPORT_WHATSAPP_NUMBER: '' });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [sms, email, support] = await Promise.all([
        adminService.getSmsSettings(),
        adminService.getEmailSettings(),
        adminService.getSupportSettings(),
      ]);
      setSmsSettings(sms);
      setEmailSettings({ SMTP_EMAIL: email.SMTP_EMAIL, SMTP_PASSWORD: email.SMTP_PASSWORD || '' });
      setSupportSettings(support);
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSaveSms = async () => {
    setSavingSms(true);
    try { const u = await adminService.updateSmsSettings(smsSettings); setSmsSettings(u); toast.success('SMS settings saved'); }
    catch { toast.error('Failed to save SMS settings'); }
    finally { setSavingSms(false); }
  };

  const handleSaveEmail = async () => {
    setSavingEmail(true);
    try { const u = await adminService.updateEmailSettings(emailSettings); setEmailSettings({ SMTP_EMAIL: u.SMTP_EMAIL, SMTP_PASSWORD: u.SMTP_PASSWORD || '' }); toast.success('Email settings saved'); }
    catch { toast.error('Failed to save email settings'); }
    finally { setSavingEmail(false); }
  };

  const handleSaveSupport = async () => {
    setSavingSupport(true);
    try { const u = await adminService.updateSupportSettings(supportSettings); setSupportSettings(u); toast.success('Support contacts saved'); }
    catch { toast.error('Failed to save support settings'); }
    finally { setSavingSupport(false); }
  };

  if (loading) return (<div className="flex flex-col items-center justify-center py-20"><Loader size={48} label="Loading settings..." /></div>);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight font-display">System Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Configure notification systems and customer support contacts</p>
      </div>

      {/* SMS Gateway */}
      <div className="glass-panel p-6 rounded-2xl bg-slate-950/40 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400"><Smartphone size={18} /></div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">SMS / OTP Gateway</h3>
              <p className="text-xs text-slate-400">AdvantaSMS dispatch configuration</p>
            </div>
          </div>
          <div className="w-36 shrink-0">
            <AnimatedButton onClick={handleSaveSms} disabled={savingSms}>
              {savingSms ? 'Saving...' : 'Save SMS'}
            </AnimatedButton>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-950/60 border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${smsSettings.SMS_ENABLED ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
            <div>
              <p className="text-xs font-bold text-white">Enable SMS Alerts</p>
              <p className="text-[10px] text-slate-500">Toggle OTP SMS delivery</p>
            </div>
          </div>
          <CosmicToggle
            checked={smsSettings.SMS_ENABLED}
            onChange={(val) => setSmsSettings({ ...smsSettings, SMS_ENABLED: val })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <AnimatedInput
              type="text"
              value={smsSettings.SMS_SRC}
              onChange={e => setSmsSettings({ ...smsSettings, SMS_SRC: e.target.value.toUpperCase() })}
              maxLength={11}
              labelText="Sender ID (SMS_SRC)"
            />
            <span className="text-[9px] text-slate-500 block -mt-3 mb-2">Max 11 characters.</span>
          </div>
          <div className="pb-6">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">SMS Provider</label>
            <div className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-mono select-none h-[38px] flex items-center">advantasms.com</div>
          </div>
        </div>

        <div>
          <AnimatedTextArea
            value={smsSettings.SMS_TEMPLATE}
            onChange={e => setSmsSettings({ ...smsSettings, SMS_TEMPLATE: e.target.value })}
            rows={2}
            labelText="Message Template"
          />
          <span className="text-[9px] text-slate-500 block -mt-3">Placeholders: <strong className="text-white">{'{code}'}</strong> and <strong className="text-white">{'{url}'}</strong></span>
        </div>

        <div>
          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Live Preview</label>
          <div className="bg-slate-950 border border-white/5 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed max-w-lg">
            <div className="flex gap-2 text-[10px] text-slate-500 mb-2">
              <span className="font-bold text-cyan-400">{smsSettings.SMS_SRC || 'SENDER'}</span>
              <span>• just now</span>
            </div>
            <p>{smsSettings.SMS_TEMPLATE ? smsSettings.SMS_TEMPLATE.replace('{code}', '495810').replace('{url}', 'winvirahisi.co.ke') : '—'}</p>
          </div>
        </div>
      </div>

      {/* SMTP Email */}
      <div className="glass-panel p-6 rounded-2xl bg-slate-950/40 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400"><Mail size={18} /></div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">App Email (SMTP)</h3>
              <p className="text-xs text-slate-400">Google SMTP app settings</p>
            </div>
          </div>
          <div className="w-40 shrink-0">
            <AnimatedButton onClick={handleSaveEmail} disabled={savingEmail}>
              {savingEmail ? 'Saving...' : 'Save SMTP'}
            </AnimatedButton>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <AnimatedInput
              type="email"
              value={emailSettings.SMTP_EMAIL}
              onChange={e => setEmailSettings({ ...emailSettings, SMTP_EMAIL: e.target.value })}
              labelText="Gmail Address"
            />
          </div>
          <div>
            <AnimatedInput
              type="password"
              value={emailSettings.SMTP_PASSWORD}
              onChange={e => setEmailSettings({ ...emailSettings, SMTP_PASSWORD: e.target.value })}
              labelText="App Password"
            />
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-xs text-slate-300">
          <AlertTriangle size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">How to generate a Gmail App Password:</p>
            <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-slate-400">
              <li>Open your Google Account → <strong>Security</strong></li>
              <li>Turn ON <strong>2-Step Verification</strong></li>
              <li>Search for "App passwords" and select it</li>
              <li>Create a new app and paste the 16-character code here</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Support Contact */}
      <div className="glass-panel p-6 rounded-2xl bg-slate-950/40 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><Phone size={18} /></div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Support Contacts</h3>
              <p className="text-xs text-slate-400">Public support information</p>
            </div>
          </div>
          <div className="w-44 shrink-0">
            <AnimatedButton onClick={handleSaveSupport} disabled={savingSupport}>
              {savingSupport ? 'Saving...' : 'Save Contacts'}
            </AnimatedButton>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <AnimatedInput
              type="email"
              value={supportSettings.SUPPORT_EMAIL}
              onChange={e => setSupportSettings({ ...supportSettings, SUPPORT_EMAIL: e.target.value })}
              labelText="Support Email"
            />
          </div>
          <div>
            <AnimatedInput
              type="text"
              value={supportSettings.SUPPORT_WHATSAPP_NUMBER}
              onChange={e => setSupportSettings({ ...supportSettings, SUPPORT_WHATSAPP_NUMBER: e.target.value })}
              labelText="WhatsApp Number"
            />
          </div>
          <div>
            <AnimatedInput
              type="url"
              value={supportSettings.SUPPORT_WHATSAPP}
              onChange={e => setSupportSettings({ ...supportSettings, SUPPORT_WHATSAPP: e.target.value })}
              labelText="WhatsApp Chat Link"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
