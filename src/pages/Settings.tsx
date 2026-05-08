import React, { useEffect, useState } from 'react';
import { useTranslation, useLangStore } from '../lib/i18n';
import { Globe, Shield, Database, Monitor, Save } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function Settings() {
  const { t } = useTranslation();
  const { lang, setLang } = useLangStore();
  const [settings, setSettings] = useState<any>({
    storeName: 'BuildMaster Stock Pro',
    currency: 'XAF',
    vatRate: '19.25',
    stockAlertLevel: '10'
  });

  useEffect(() => {
    apiFetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) setSettings(data);
      })
      .catch(() => console.error('Settings fetch failed'));
  }, []);

  const saveSettings = async () => {
    try {
      const res = await apiFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      if (res.ok) alert(t('save') + ' OK');
      else alert('Failed to save settings. Check permissions.');
    } catch (e) {
      alert('Network error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-zinc-300 pb-6">
        <h1 className="text-4xl font-black uppercase tracking-tighter">{t('settings')}</h1>
        <p className="label-micro mt-1 font-bold">System Configuration & Preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-2">
          <SettingsTab icon={<Globe size={18}/>} label={t('language')} active />
          <SettingsTab icon={<Shield size={18}/>} label={t('security')} />
          <SettingsTab icon={<Monitor size={18}/>} label={t('appearance')} />
          <SettingsTab icon={<Database size={18}/>} label={t('backup')} />
        </div>

        <div className="md:col-span-3 bg-white border border-zinc-300 p-8 shadow-sm space-y-8">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2">
              Regional & Internationalization
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="label-micro">System Language</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setLang('en')}
                    className={`flex-1 p-2 text-xs font-bold border ${lang === 'en' ? 'bg-black text-white border-black' : 'border-zinc-300 hover:bg-zinc-50'}`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => setLang('fr')}
                    className={`flex-1 p-2 text-xs font-bold border ${lang === 'fr' ? 'bg-black text-white border-black' : 'border-zinc-300 hover:bg-zinc-50'}`}
                  >
                    Français
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="label-micro">Store Currency</label>
                <input 
                  type="text" 
                  value={settings.currency}
                  onChange={e => setSettings({...settings, currency: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 p-2 text-xs font-mono font-bold outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2">
              Financial Configuration
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="label-micro">VAT Rate (%)</label>
                <input 
                  type="number" 
                  value={settings.vatRate}
                  onChange={e => setSettings({...settings, vatRate: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 p-2 text-xs font-mono font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="label-micro">Default Stock Alert Level</label>
                <input 
                  type="number" 
                  value={settings.stockAlertLevel}
                  onChange={e => setSettings({...settings, stockAlertLevel: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 p-2 text-xs font-mono font-bold outline-none"
                />
              </div>
            </div>
          </section>

          <div className="pt-6 border-t border-zinc-100 flex justify-end">
            <button 
              onClick={saveSettings}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-3 uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <Save size={16} /> {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SettingsTab = ({ icon, label, active }: any) => (
  <button className={`w-full flex items-center gap-3 p-4 text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-black text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}>
    {icon}
    <span>{label}</span>
  </button>
);
