import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Truck, Fuel, ClipboardList, Database, TrendingUp, AlertTriangle,
  CheckCircle, XCircle, Clock, ArrowUpRight, Activity, LineChart, BarChart2, Ticket
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList, LineChart as RechartsLineChart, Line, ComposedChart,
  AreaChart, Area
} from 'recharts';
import api from '../../api/axios';

const CoalDashboard = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('monthly');
  const [filterArea, setFilterArea] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  const months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ];

  const currentY = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentY - 2 + i);
  
  const [dashboardData, setDashboardData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const userRole = localStorage.getItem('userRole') || 'USER';
        const userDepartment = localStorage.getItem('userDepartment');
        const supplierParam = userRole === 'ADMIN_VENDOR' ? userDepartment : undefined;

        const params = {
          area: filterArea || undefined,
          month: filterMonth,
          year: filterYear,
          supplier: supplierParam
        };

        const [dashboardRes, summaryRes] = await Promise.all([
          api.get('/coal-transport/dashboard-stats', { params }),
          api.get('/coal-transport/report-pa/summary', { params })
        ]);

        setDashboardData(dashboardRes.data);
        setSummaryData(summaryRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardStats();
  }, [filterArea, filterMonth, filterYear]);

  const userRole = localStorage.getItem('userRole') || 'USER';

  const kpiCards = dashboardData ? [
    {
      title: 'Total Unit Sarana',
      value: dashboardData.kpi.totalSarana.toString(),
      subtitle: `${dashboardData.kpi.operasionalSarana} Operasional`,
      icon: Truck,
      iconBg: 'bg-[#3298A0]/10',
      iconColor: 'text-[#3298A0]',
      trend: 'Berdasarkan Master Data',
      trendUp: true,
    },
    {
      title: 'P2H Hari Ini',
      value: dashboardData.kpi.p2hCount.toString(),
      subtitle: `dari ${dashboardData.kpi.totalSarana} unit`,
      icon: ClipboardList,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      trend: `${dashboardData.kpi.p2hKepatuhan}% Kepatuhan`,
      trendUp: dashboardData.kpi.p2hKepatuhan >= 80,
      path: '/coal/data-p2h',
    },
    {
      title: 'Breakdown Terkini',
      value: dashboardData.kpi.breakdownCount.toString(),
      subtitle: dashboardData.kpi.breakdownUnits || 'Semua unit aman',
      icon: AlertTriangle,
      iconBg: dashboardData.kpi.breakdownCount > 0 ? 'bg-red-50' : 'bg-emerald-50',
      iconColor: dashboardData.kpi.breakdownCount > 0 ? 'text-red-500' : 'text-emerald-500',
      trend: dashboardData.kpi.breakdownCount > 0 ? 'Perlu penanganan segera' : 'Kondisi Optimal',
      trendUp: dashboardData.kpi.breakdownCount === 0,
      path: '/coal/data-report-bd',
    },
    {
      title: 'Approval Kupon GA',
      value: (dashboardData.kpi.pendingKuponGact || 0).toString(),
      subtitle: 'Menunggu Persetujuan',
      icon: Ticket,
      iconBg: (dashboardData.kpi.pendingKuponGact || 0) > 0 ? 'bg-amber-50' : 'bg-emerald-50',
      iconColor: (dashboardData.kpi.pendingKuponGact || 0) > 0 ? 'text-amber-500' : 'text-emerald-500',
      trend: (dashboardData.kpi.pendingKuponGact || 0) > 0 ? 'Butuh approval segera' : 'Semua telah disetujui',
      trendUp: (dashboardData.kpi.pendingKuponGact || 0) === 0,
      path: '/coal/data-kupon-bbm',
      roles: ['ADMIN_TRANSPORT', 'ADMINISTRATOR', 'ADMIN']
    },
    {
      title: 'Approval Kupon Fuelman',
      value: (dashboardData.kpi.pendingKuponFuelman || 0).toString(),
      subtitle: 'Menunggu Persetujuan',
      icon: Ticket,
      iconBg: (dashboardData.kpi.pendingKuponFuelman || 0) > 0 ? 'bg-amber-50' : 'bg-emerald-50',
      iconColor: (dashboardData.kpi.pendingKuponFuelman || 0) > 0 ? 'text-amber-500' : 'text-emerald-500',
      trend: (dashboardData.kpi.pendingKuponFuelman || 0) > 0 ? 'Butuh approval segera' : 'Semua telah disetujui',
      trendUp: (dashboardData.kpi.pendingKuponFuelman || 0) === 0,
      path: '/coal/data-kupon-bbm',
      roles: ['FUELMAN', 'ADMINISTRATOR', 'ADMIN']
    }
  ].filter(card => {
    if (card.roles && !card.roles.includes(userRole)) return false;
    if (userRole === 'DRIVER') return false;
    return true;
  }) : [];

  const quickActions = [
    {
      title: 'Data Sarana',
      desc: 'Kelola unit kendaraan dan alat berat',
      icon: Database,
      path: '/coal/data-sarana',
      color: '#3298A0',
      roles: ['ADMIN', 'ADMIN_TRANSPORT']
    },
    {
      title: 'Form P2H',
      desc: 'Inspeksi harian kendaraan',
      icon: ClipboardList,
      path: '/coal/form-p2h',
      color: '#10b981',
      roles: ['ADMIN', 'ADMIN_TRANSPORT', 'DRIVER']
    },
    {
      title: 'Data P2H',
      desc: 'Riwayat inspeksi P2H',
      icon: ClipboardList,
      path: '/coal/data-p2h',
      color: '#059669',
      roles: ['ADMIN', 'ADMIN_TRANSPORT', 'DRIVER', 'ADMIN_VENDOR']
    },
    {
      title: 'Pengisian Fuel',
      desc: 'Catat konsumsi bahan bakar',
      icon: Fuel,
      path: '/coal/form-fuel',
      color: '#E58032',
      roles: ['ADMIN', 'ADMIN_TRANSPORT', 'FUELMAN', 'DRIVER']
    },
    {
      title: 'Data Fuel',
      desc: 'Riwayat dan laporan fuel',
      icon: Database,
      path: '/coal/data-fuel',
      color: '#6366f1',
      roles: ['ADMIN', 'ADMIN_TRANSPORT', 'FUELMAN', 'DRIVER']
    },
    {
      title: 'Kupon BBM',
      desc: 'Pengajuan tambahan fuel',
      icon: Ticket,
      path: '/coal/form-kupon-bbm',
      color: '#f59e0b',
      roles: ['ADMIN', 'ADMINISTRATOR', 'DRIVER']
    },
    {
      title: 'Data Kupon BBM',
      desc: 'Riwayat pengajuan kupon BBM',
      icon: Ticket,
      path: '/coal/data-kupon-bbm',
      color: '#f59e0b',
      roles: ['ADMIN', 'ADMINISTRATOR', 'ADMIN_TRANSPORT', 'FUELMAN', 'DRIVER', 'ADMIN_VENDOR']
    },
  ].filter(action => !action.roles || action.roles.includes(userRole));

  const allStickerWarnings = dashboardData ? [
    ...(dashboardData.stickers?.expiringSoon || [])
  ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3298A0]"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4 mx-auto" />
        <h2 className="text-xl font-bold text-[#052334] mb-2">Gagal Memuat Data Dashboard</h2>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">
          Tidak dapat terhubung ke server. Pastikan API backend sedang berjalan atau periksa koneksi jaringan Anda.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-[#3298A0] text-white rounded-xl font-bold hover:bg-[#248B96] transition-colors shadow-sm"
        >
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Page Title & Filters */}
      <div className="mb-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#052334] tracking-tight">
            Coal Transport Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Monitoring operasional transportasi batubara, inspeksi kendaraan, dan konsumsi bahan bakar.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white/70 backdrop-blur-xl p-2 rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="px-4 py-2.5 bg-transparent hover:bg-slate-50/50 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 transition-all cursor-pointer text-[#052334]"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          
          <div className="w-px h-6 bg-slate-200"></div>
          
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="px-4 py-2.5 bg-transparent hover:bg-slate-50/50 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 transition-all cursor-pointer text-[#052334]"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <div className="w-px h-6 bg-slate-200"></div>

          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="px-4 py-2.5 bg-transparent hover:bg-slate-50/50 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 transition-all cursor-pointer text-[#052334] min-w-[140px]"
          >
            <option value="">Semua Area</option>
            <option value="MINING">Mining</option>
            <option value="HAULING">Hauling</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => card.path && navigate(card.path)}
              className={`p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden ${card.path ? 'cursor-pointer' : ''} ${
                i === 0 ? 'bg-gradient-to-br from-[#052334] to-[#0A3D59] text-white border-none' : 'bg-white'
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-white/10 to-transparent -mr-12 -mt-12 group-hover:scale-[1.8] transition-transform duration-700 ease-out" />
              
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${i === 0 ? 'bg-white/10 backdrop-blur-md' : card.iconBg} shadow-inner`}>
                <Icon className={`w-6 h-6 ${i === 0 ? 'text-white' : card.iconColor}`} />
              </div>
              <p className={`text-xs font-bold ${i === 0 ? 'text-blue-100/80' : 'text-slate-500'} mb-1.5 uppercase tracking-wider`}>{card.title}</p>
              <div className="flex items-end gap-2 mb-2">
                <h2 className={`text-4xl font-black tracking-tight ${i === 0 ? 'text-white' : 'text-[#052334]'}`}>{card.value}</h2>
                <span className={`text-xs font-semibold pb-1.5 ${i === 0 ? 'text-blue-200' : 'text-slate-400'}`}>{card.subtitle}</span>
              </div>
              <p className={`text-[11px] font-bold flex items-center gap-1 mt-3 py-1.5 px-2.5 rounded-lg inline-flex ${
                i === 0 ? 'bg-white/10 text-white' : (card.trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')
              }`}>
                <TrendingUp className={`w-3.5 h-3.5 ${!card.trendUp ? 'rotate-180' : ''}`} />
                {card.trend}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Action Buttons */}
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4 text-[#3298A0]" /> Navigasi Cepat
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link
              key={i}
              to={action.path}
              className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 text-left block relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${action.color}15`, border: `1px solid ${action.color}30` }}>
                    <Icon className="w-5 h-5" style={{ color: action.color }} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#052334] transition-colors" />
                  </div>
                </div>
                <h4 className="text-[15px] font-black text-[#052334] mb-1">{action.title}</h4>
                <p className="text-xs font-medium text-slate-400">{action.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {userRole !== 'DRIVER' && (
        <>
          {/* Charts Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Analitik Operasional
        </h3>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {[
            { id: 'weekly', label: '7 Hari' },
            { id: 'monthly', label: 'Bulan Ini' },
            { id: 'yearly', label: 'Tahun Ini' },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setTimeFilter(filter.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                timeFilter === filter.id 
                  ? 'bg-white text-[#052334] shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Area Chart: Trend PA */}
        <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div>
              <h4 className="text-[15px] font-black text-[#052334]">Trend Ketersediaan Sarana (PA)</h4>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">PA Before vs PA After Backup (%)</p>
            </div>
            <div className="p-2.5 bg-[#3298A0]/10 rounded-xl">
              <LineChart className="w-5 h-5 text-[#3298A0]" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.charts.pa} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBefore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAfter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3298A0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3298A0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 110]} />
                <Tooltip 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#052334', marginBottom: '8px' }}
                  formatter={(value) => [`${value}%`]}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                
                <Area type="monotone" dataKey="pa_before" name="PA Before Backup" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorBefore)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="pa_after" name="PA After Backup" stroke="#3298A0" strokeWidth={3} fillOpacity={1} fill="url(#colorAfter)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Konsumsi Fuel */}
        <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div>
              <h4 className="text-[15px] font-black text-[#052334]">Konsumsi Bahan Bakar</h4>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Solar vs Bensin (dalam Liter)</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <Fuel className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.charts.fuel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#052334', marginBottom: '4px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Bar dataKey="solar" name="Solar" fill="#E58032" radius={[6, 6, 0, 0]} barSize={24} animationDuration={1500} />
                <Bar dataKey="bensin" name="Bensin" fill="#3298A0" radius={[6, 6, 0, 0]} barSize={24} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${userRole !== 'ADMIN_VENDOR' ? 'lg:grid-cols-2' : ''} gap-6 mb-10`}>
        {/* KPI SUMMARY TABLE (Replaced Weekly KPI Chart) */}
        {userRole !== 'ADMIN_VENDOR' && (
          summaryData ? (
            <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-[450px]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h4 className="text-[15px] font-black text-[#052334]">KPI Summary By Type</h4>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Mingguan (Bulan Ini)</p>
              </div>
              <div className="p-2.5 bg-[#3298A0]/10 rounded-xl">
                <BarChart2 className="w-5 h-5 text-[#3298A0]" />
              </div>
            </div>
            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th className="bg-slate-50 text-slate-500 font-bold py-3 px-4 border-b border-slate-200 text-[11px] uppercase tracking-wider text-left w-1/5">By Type</th>
                    <th className="bg-slate-50 text-slate-500 font-bold py-3 px-4 border-b border-slate-200 text-[11px] uppercase tracking-wider">Minggu 1</th>
                    <th className="bg-slate-50 text-slate-500 font-bold py-3 px-4 border-b border-slate-200 text-[11px] uppercase tracking-wider">Minggu 2</th>
                    <th className="bg-slate-50 text-slate-500 font-bold py-3 px-4 border-b border-slate-200 text-[11px] uppercase tracking-wider">Minggu 3</th>
                    <th className="bg-slate-50 text-slate-500 font-bold py-3 px-4 border-b border-slate-200 text-[11px] uppercase tracking-wider">Minggu 4</th>
                  </tr>
                </thead>
                <tbody>
                  {['SHIFT 1', 'SHIFT 2'].map(shift => {
                    const shiftData = summaryData.W1?.before?.[shift];
                    if (!shiftData) return null;
                    const types = Object.keys(shiftData).sort();
                    if (types.length === 0) return null;
                    
                    return (
                      <React.Fragment key={shift}>
                        <tr>
                          <td className="bg-slate-50/80 font-bold py-2 px-4 border-b border-slate-100 text-[#052334] text-xs uppercase tracking-wider text-left">{shift}</td>
                          {['W1', 'W2', 'W3', 'W4'].map(w => {
                            const avgPA = (() => {
                               let totalPA = 0, count = 0;
                               Object.values(summaryData[w]?.before?.[shift] || {}).forEach(pa => { if (pa !== null) { totalPA += pa; count++; } });
                               return count > 0 ? (totalPA / count).toFixed(1) + '%' : '-';
                            })();
                            return <td key={w} className="bg-slate-50/80 font-bold py-2 px-4 border-b border-slate-100 text-center text-xs text-[#052334]">
                              {avgPA}
                            </td>
                          })}
                        </tr>
                        {types.map((type, idx) => {
                          const isLast = idx === types.length - 1;
                          const borderClass = isLast ? 'border-b-2 border-slate-200' : 'border-b border-slate-50';
                          return (
                            <tr key={type} className="hover:bg-slate-50 transition-colors">
                              <td className={`text-left px-4 py-3 font-medium text-slate-600 text-sm ${borderClass}`}>{type}</td>
                              {['W1', 'W2', 'W3', 'W4'].map(w => {
                                const pa = summaryData[w]?.before?.[shift]?.[type];
                                let displayVal = pa !== null ? `${Math.round(pa)}%` : '-';
                                const colorClass = pa === null ? 'text-slate-400' : (pa < 85 ? 'text-red-500' : 'text-emerald-600');
                                return <td key={w} className={`text-center px-4 py-3 text-sm font-bold ${borderClass} ${colorClass}`}>{displayVal}</td>
                              })}
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3298A0]"></div>
            </div>
          )
        )}

        {/* Expired Stickers List */}
        <div className={`bg-white p-7 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col ${userRole !== 'ADMIN_VENDOR' ? 'h-[450px]' : 'h-auto max-h-[450px]'}`}>
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div>
              <h4 className="text-[15px] font-black text-[#052334]">Informasi Akses Stiker</h4>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Stiker yang akan habis masa berlaku (3 bulan ke depan)</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100/50 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/30 custom-scrollbar p-1">
            {allStickerWarnings.length > 0 ? (
              <div className="p-3 space-y-2.5">
                {allStickerWarnings.map((s, idx) => {
                  const isExpired = s.status === 'EXPIRED';
                  return (
                    <div key={idx} className="group flex items-center justify-between p-3.5 bg-white rounded-xl border shadow-sm transition-all duration-300 border-amber-100/60 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center border bg-amber-50/50 border-amber-200/50 group-hover:bg-amber-100 transition-colors">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#052334] tracking-tight">{s.no_lambung}</p>
                          <p className="text-[11px] text-slate-500 font-medium truncate max-w-[120px]">{s.jenis_unit || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap ml-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 shadow-sm border border-amber-200/50">
                          Hampir Exp: {s.expired_date}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-400 mb-2" />
                <p className="text-sm font-bold text-slate-600">Aman Terkendali</p>
                <p className="text-xs text-slate-400">Tidak ada stiker sarana yang akan kedaluwarsa 3 bulan ke depan.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </>
      )}

      {/* Bottom Section: Pie Charts + Recent P2H Table */}
      <div className={`grid grid-cols-1 ${userRole !== 'DRIVER' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6 mb-10`}>
        {/* Pie Chart: Status Unit */}
        {userRole !== 'DRIVER' && (
          <>
            <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[420px]">
              <div className="shrink-0">
                <h4 className="text-[15px] font-black text-[#052334]">Status Unit Sarana Hari Ini</h4>
                <p className="text-[11px] text-slate-500 mt-1 font-medium mb-4">Kondisi armada saat ini</p>
              </div>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Pie
                      data={dashboardData.charts.vehicleStatus}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={1500}
                      stroke="none"
                    >
                      {dashboardData.charts.vehicleStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: P2H Status */}
            <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[420px]">
              <div className="shrink-0">
                <h4 className="text-[15px] font-black text-[#052334]">Hasil Inspeksi P2H Hari Ini</h4>
                <p className="text-[11px] text-slate-500 mt-1 font-medium mb-4">Ringkasan kelayakan unit</p>
              </div>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Pie
                      data={dashboardData.charts.p2hStatus}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={1500}
                      stroke="none"
                    >
                      {dashboardData.charts.p2hStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Recent P2H Table */}
        {userRole !== 'DRIVER' && (
          <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[420px]">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div>
                <h4 className="text-[15px] font-black text-[#052334]">P2H Terbaru</h4>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Inspeksi hari ini</p>
              </div>
              <Link 
                to="/coal/data-p2h"
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#3298A0] bg-[#3298A0]/10 hover:bg-[#3298A0] hover:text-white transition-all shadow-sm"
              >
                Lihat Semua →
              </Link>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {dashboardData.recentP2H.length > 0 ? dashboardData.recentP2H.map((item) => (
                <div key={item.id} className="group flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all duration-300">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Truck className="w-5 h-5 text-[#3298A0]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#052334] tracking-tight">{item.unit}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{item.driver}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg border shadow-sm ${
                      item.status?.toLowerCase().includes('layak') && !item.status?.toLowerCase().includes('tidak') ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                      item.status?.toLowerCase().includes('perbaikan') ? 'bg-amber-50 text-amber-700 border-amber-200/50' :
                      'bg-red-50 text-red-700 border-red-200/50'
                    }`}>
                      {item.status}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-300" /> {item.time}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                    <ClipboardList className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Belum Ada Inspeksi</p>
                  <p className="text-[11px] text-slate-400 max-w-[200px]">Data P2H yang disubmit hari ini akan muncul di sini.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CoalDashboard;
