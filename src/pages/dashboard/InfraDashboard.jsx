import { useState, useEffect } from "react";
import api from '../../api/axios';
import {
  FileText,
  CheckCircle,
  XCircle,
  Settings,
  UserCog,
  UserCheck,
  Wrench,
  TrendingUp,
  PieChart as PieChartIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const InfraDashboard = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('all'); // all, weekly, monthly, yearly
  const [stats, setStats] = useState({
    menungguUH: 0,
    menungguSH: 0,
    rejected: 0,
    approved: 0,
    total: 0,
    onProgress: 0,
    closed: 0
  });

  useEffect(() => {
    fetchStats();
  }, [timeFilter]);

  const fetchStats = async () => {
    try {
      const role = localStorage.getItem('userRole') || 'USER';
      const userId = localStorage.getItem('userId') || '';
      const res = await api.get(`/work-orders/stats?filter=${timeFilter}&role=${role}&user_id=${userId}`);
      setStats(res.data);
    } catch (error) {
      console.error('Gagal mengambil statistik:', error);
    }
  };

  const statusCards = [
    {
      title: "Menunggu Persetujuan UH",
      count: stats.menungguUH,
      bgIcon: "bg-[#3298A0]/10",
      icon: <UserCog className="w-5 h-5 text-[#3298A0]" />,
      path: "/approval-list/menunggu-uh"
    },
    {
      title: "Menunggu Persetujuan SH",
      count: stats.menungguSH,
      bgIcon: "bg-blue-50",
      icon: <UserCheck className="w-5 h-5 text-blue-600" />,
      path: "/approval-list/menunggu-sh"
    },
    {
      title: "Rejected",
      count: stats.rejected,
      bgIcon: "bg-red-50",
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      path: "/approval-list/rejected"
    },
    {
      title: "Total Pengajuan",
      count: stats.total,
      bgIcon: "bg-slate-100",
      icon: <FileText className="w-5 h-5 text-slate-600" />,
      path: "/approval-list/all"
    },
    {
      title: "Dalam Pengerjaan (On Progress)",
      count: stats.onProgress,
      bgIcon: "bg-[#E58032]/10",
      icon: <Settings className="w-5 h-5 text-[#E58032]" />,
      path: "/approval-list/on-progress"
    },
    {
      title: "Selesai (Close)",
      count: stats.closed,
      bgIcon: "bg-emerald-50",
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      path: "/approval-list/selesai"
    },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#052334]">
          Infrastruktur Portal
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau dan kelola seluruh aktivitas Work Order infrastruktur Anda.
        </p>
      </div>

      {/* Tombol Aksi Utama - Banner Style */}
      <div 
        className="mb-10 bg-gradient-to-r from-[#052334] to-[#0a3a56] p-8 md:p-10 rounded-2xl shadow-xl shadow-[#052334]/15 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-[#052334]/20 hover:-translate-y-1" 
        onClick={() => navigate("/pengajuan-wo")}
      >
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full -translate-y-40 translate-x-20 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute bottom-0 right-32 w-40 h-40 bg-white opacity-5 rounded-full translate-y-16 group-hover:scale-150 transition-transform duration-700 delay-100"></div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="p-4 bg-white/10 border border-white/20 rounded-xl backdrop-blur-md shadow-inner group-hover:bg-white/20 transition-colors">
            <FileText className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-wide drop-shadow-sm">
              Buat Pengajuan Work Order
            </h3>
            <p className="text-slate-300 text-sm mt-1.5 max-w-md leading-relaxed">
              Ajukan formulir permintaan perbaikan, perawatan, atau laporan kerusakan infrastruktur dengan mudah dan cepat.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 mt-6 md:mt-0 w-full md:w-auto">
          <button className="w-full md:w-auto bg-[#E58032] hover:bg-[#d9772b] text-white px-8 py-3.5 rounded-xl text-sm font-bold tracking-widest shadow-lg shadow-[#E58032]/30 transition-all group-hover:shadow-[#E58032]/50 flex items-center justify-center gap-3">
            ISI FORMULIR
            <svg className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        Status & Informasi Approval
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {statusCards.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.path)}
            className="group bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:border-[#3298A0]/30 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex justify-between items-center relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-150 group-hover:opacity-10 transition-all duration-500 pointer-events-none">
              {item.icon}
            </div>
            <div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${item.bgIcon}`}
              >
                {item.icon}
              </div>
              <p className="text-xs font-semibold text-slate-500">
                {item.title}
              </p>
            </div>
            <h2 className="text-3xl font-black text-[#052334]">{item.count}</h2>
          </div>
        ))}
      </div>

      {/* --- Bagian Chart / Grafik Statistik --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Analitik & Statistik Work Order
        </h3>
        
        {/* Toggle Filter Waktu */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {[
            { id: 'weekly', label: '7 Hari' },
            { id: 'monthly', label: 'Bulan Ini' },
            { id: 'yearly', label: 'Tahun Ini' },
            { id: 'all', label: 'Semua' }
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
        
        {/* Bar Chart: Grafik Keseluruhan */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-[#052334]">Distribusi Status Work Order</h4>
              <p className="text-xs text-slate-500 mt-1">Perbandingan volume pengajuan di tiap fase</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Total', value: stats.total, color: '#94a3b8' },
                  { name: 'Menunggu', value: stats.menungguUH + stats.menungguSH, color: '#3b82f6' },
                  { name: 'Disetujui', value: stats.approved, color: '#f59e0b' },
                  { name: 'Ditolak', value: stats.rejected, color: '#ef4444' },
                  { name: 'Dikerjakan', value: stats.onProgress, color: '#E58032' },
                  { name: 'Selesai', value: stats.closed, color: '#10b981' }
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#052334', marginBottom: '4px' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1500}>
                  {
                    [
                      { name: 'Total', value: stats.total, color: '#94a3b8' },
                      { name: 'Menunggu', value: stats.menungguUH + stats.menungguSH, color: '#3b82f6' },
                      { name: 'Disetujui', value: stats.approved, color: '#f59e0b' },
                      { name: 'Ditolak', value: stats.rejected, color: '#ef4444' },
                      { name: 'Dikerjakan', value: stats.onProgress, color: '#E58032' },
                      { name: 'Selesai', value: stats.closed, color: '#10b981' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Persentase Keberhasilan/Komposisi */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-[#052334]">Komposisi Realisasi Pekerjaan</h4>
              <p className="text-xs text-slate-500 mt-1">Status work order aktif saat ini</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <PieChartIcon className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {stats.total === 0 ? (
              <p className="text-sm text-slate-400 italic">Belum ada data pengajuan</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }} />
                  <Pie
                    data={[
                      { name: 'Selesai (Closed)', value: stats.closed, color: '#10b981' },
                      { name: 'Sedang Dikerjakan', value: stats.onProgress, color: '#E58032' },
                      { name: 'Disetujui (Tunggu No WO)', value: stats.approved, color: '#f59e0b' },
                      { name: 'Menunggu Approval', value: stats.menungguUH + stats.menungguSH, color: '#3b82f6' },
                      { name: 'Ditolak', value: stats.rejected, color: '#ef4444' }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={1500}
                    stroke="none"
                  >
                    {[
                      { name: 'Selesai (Closed)', value: stats.closed, color: '#10b981' },
                      { name: 'Sedang Dikerjakan', value: stats.onProgress, color: '#E58032' },
                      { name: 'Disetujui (Tunggu No WO)', value: stats.approved, color: '#f59e0b' },
                      { name: 'Menunggu Approval', value: stats.menungguUH + stats.menungguSH, color: '#3b82f6' },
                      { name: 'Ditolak', value: stats.rejected, color: '#ef4444' }
                    ].filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
      </div>
    </>
  );
};

export default InfraDashboard;
