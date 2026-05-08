import React, { useEffect, useState, useCallback } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Package, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { apiFetch } from '../lib/api';

const mockChartData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch('/api/dashboard/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Stats fetch failed');
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Real-time polling every 10 seconds for dashboard freshness (optimized from 5s)
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (!stats) return <div className="p-8 text-xs font-mono uppercase animate-pulse">Computing data vectors...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end border-b border-zinc-300 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">{t('dashboard')}</h1>
          <p className="label-micro mt-1 opacity-100 font-bold">Operation Metrics / System Status: Online</p>
        </div>
        <div className="text-right">
          <p className="label-micro">Terminal Node</p>
          <p className="font-mono text-sm font-bold">AISO-77-CAM</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('revenue')} value={`XAF ${stats.todayRevenue.toLocaleString()}`} icon={<TrendingUp size={20}/>} trend="+12.4%" color="text-green-600" />
        <StatCard title={t('stock')} value={stats.totalProducts} icon={<Package size={20}/>} trend="Stable" color="text-blue-600" />
        <StatCard title={t('sales')} value={stats.totalSales} icon={<ShoppingCart size={20}/>} trend="+3.1%" color="text-zinc-900" />
        <StatCard title={t('alerts')} value={stats.lowStock} icon={<AlertTriangle size={20}/>} trend="CRITICAL" color="text-red-600" isCritical={stats.lowStock > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 bg-white border border-zinc-300 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-black uppercase tracking-tight">Revenue Trajectory</h2>
            <select className="bg-zinc-100 border border-zinc-300 text-[10px] font-bold p-1 px-4 uppercase tracking-wider outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  cursor={{ fill: '#F5F5F5' }}
                  contentStyle={{ border: '1px solid #141414', borderRadius: 0, fontSize: 10, fontFamily: 'monospace' }} 
                />
                <Bar dataKey="sales" fill="#141414" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-zinc-300 p-8 shadow-sm">
          <h2 className="text-lg font-black uppercase tracking-tight mb-8">System Activity</h2>
          <div className="space-y-6">
            <ActivityItem time="12:44" user="ADMIN" action="Stock Update" detail="Assorted Nails (4 inch) +500" />
            <ActivityItem time="11:30" user="CASHIER" action="Sale Executed" detail="INV-20240508-A98" />
            <ActivityItem time="10:15" user="ADMIN" action="New Category" detail="Sanitary Ware added" />
            <ActivityItem time="09:00" user="SYSTEM" action="Backup Saved" detail="Daily backup complete" />
          </div>
          <button className="w-full mt-8 border border-zinc-300 p-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors">
            View Audit Logs
          </button>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon, trend, color, isCritical }: any) => (
  <div className={`bg-white border ${isCritical ? 'border-red-500 bg-red-50' : 'border-zinc-300'} p-6 shadow-sm`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 bg-zinc-100 rounded-sm ${color}`}>
        {icon}
      </div>
      <div className="text-right">
        <span className={`text-[10px] font-black uppercase tracking-widest ${isCritical ? 'text-red-600 animate-pulse' : 'text-zinc-400'}`}>
          {trend}
        </span>
      </div>
    </div>
    <p className="label-micro mb-1">{title}</p>
    <div className="text-2xl font-black tracking-tight font-mono">{value}</div>
  </div>
);

const ActivityItem = ({ time, user, action, detail }: any) => (
  <div className="flex gap-4 border-l border-zinc-200 pl-4 py-1 relative">
    <div className="absolute -left-[4.5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-300 border border-white" />
    <div className="text-[10px] font-mono font-bold text-zinc-400 w-10">{time}</div>
    <div className="flex-1">
      <div className="text-[10px] font-black uppercase text-zinc-900 leading-none mb-1">{action}</div>
      <div className="text-[11px] text-zinc-500 font-medium leading-tight">{detail}</div>
      <div className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest mt-1">BY {user}</div>
    </div>
  </div>
);
