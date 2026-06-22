import React, { useState, useEffect } from 'react';
import { Calendar, Search, Download, BarChart2 } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import api from '../../api/axios';

const ReportPAAfterPage = () => {
  const [reportData, setReportData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterByType, setFilterByType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const [filterMonth, setFilterMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [filterYear, setFilterYear] = useState(String(today.getFullYear()));
  const [filterWeek, setFilterWeek] = useState('');
  
  const [summaryData, setSummaryData] = useState(null);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/coal-transport/report-pa?month=${filterMonth}&year=${filterYear}&week=${filterWeek}`);
      setReportData(response.data || []);
    } catch (error) {
      console.error('Error fetching PA reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const url = filterArea 
        ? `/coal-transport/report-pa/summary?month=${filterMonth}&year=${filterYear}&area=${encodeURIComponent(filterArea)}`
        : `/coal-transport/report-pa/summary?month=${filterMonth}&year=${filterYear}`;
      const summaryRes = await api.get(url);
      setSummaryData(summaryRes.data);
    } catch (error) {
      console.error('Error fetching PA summary:', error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterMonth, filterYear, filterWeek]);

  useEffect(() => {
    fetchSummary();
  }, [filterMonth, filterYear, filterArea]);

  const filteredData = reportData.filter(item => {
    const searchMatch = (item.no_lambung || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (item.jenis_unit || '').toLowerCase().includes(searchQuery.toLowerCase());
    const areaMatch = filterArea ? item.area === filterArea : true;
    const supplierMatch = filterSupplier ? item.supplier === filterSupplier : true;
    const byTypeMatch = filterByType ? item.by_type === filterByType : true;
    return searchMatch && areaMatch && supplierMatch && byTypeMatch;
  });

  const uniqueAreas = [...new Set(reportData.map(item => item.area).filter(Boolean))];
  const uniqueSuppliers = [...new Set(reportData.map(item => item.supplier).filter(Boolean))];
  const uniqueByTypes = [...new Set(reportData.map(item => item.by_type).filter(Boolean))];

  const getMonthName = (monthStr) => {
    const date = new Date(2000, parseInt(monthStr) - 1, 1);
    return date.toLocaleString('id-ID', { month: 'long' });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#052334] flex items-center gap-3">
          <BarChart2 className="w-7 h-7 text-[#3298A0]" />
          Report PA After Backup
        </h1>
        <p className="text-slate-500 text-sm mt-1 mb-6">
          Persentase Ketersediaan Fisik (Physical Availability) SETELAH memperhitungkan unit pengganti (backup).
        </p>
        
        {/* KPI SUMMARY TABLE */}
        {summaryData && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm mb-6 overflow-hidden">
            <div className="bg-slate-50 py-3 px-4 border-b border-slate-200 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#3298A0]" />
              <h2 className="text-[#052334] font-black text-sm uppercase tracking-wider">KPI Summary By Type {filterArea && filterArea !== 'Semua Area' ? `(${filterArea})` : ''}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th className="bg-white text-slate-500 font-bold py-3 px-4 border-b border-slate-200 text-[11px] uppercase tracking-wider text-left w-1/5">By Type</th>
                    <th className="bg-white text-slate-500 font-bold py-3 px-4 border-b border-slate-200 text-[11px] uppercase tracking-wider">Minggu 1</th>
                    <th className="bg-white text-slate-500 font-bold py-3 px-4 border-b border-slate-200 text-[11px] uppercase tracking-wider">Minggu 2</th>
                    <th className="bg-white text-slate-500 font-bold py-3 px-4 border-b border-slate-200 text-[11px] uppercase tracking-wider">Minggu 3</th>
                    <th className="bg-white text-slate-500 font-bold py-3 px-4 border-b border-slate-200 text-[11px] uppercase tracking-wider">Minggu 4</th>
                  </tr>
                </thead>
                <tbody>
                  {['SHIFT 1', 'SHIFT 2'].map(shift => {
                    const shiftData = summaryData.W1?.after?.[shift];
                    if (!shiftData) return null;
                    const types = Object.keys(shiftData).sort();
                    
                    return (
                      <React.Fragment key={shift}>
                        <tr>
                          <td className="bg-slate-50/80 font-bold py-2 px-4 border-b border-slate-100 text-[#052334] text-xs uppercase tracking-wider text-left">{shift}</td>
                          {['W1', 'W2', 'W3', 'W4'].map(w => {
                            const avgPA = (() => {
                               let totalPA = 0, count = 0;
                               Object.values(summaryData[w]?.after?.[shift] || {}).forEach(pa => { if (pa !== null) { totalPA += pa; count++; } });
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
                                const pa = summaryData[w]?.after?.[shift]?.[type];
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
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm mb-6">
        <div className="flex flex-col gap-4 p-4 border-b border-slate-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari No Lambung atau Jenis Unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] cursor-pointer"
              >
                <option value="">Semua Area</option>
                {uniqueAreas.map((area, idx) => (
                  <option key={idx} value={area}>{area}</option>
                ))}
              </select>

              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] cursor-pointer"
              >
                <option value="">Semua Supplier</option>
                {uniqueSuppliers.map((supplier, idx) => (
                  <option key={idx} value={supplier}>{supplier}</option>
                ))}
              </select>

              <select
                value={filterByType}
                onChange={(e) => setFilterByType(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] cursor-pointer"
              >
                <option value="">Semua By Type</option>
                {uniqueByTypes.map((type, idx) => (
                  <option key={idx} value={type}>{type}</option>
                ))}
              </select>

              <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] cursor-pointer"
                >
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] cursor-pointer"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
                <select
                  value={filterWeek}
                  onChange={(e) => setFilterWeek(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] cursor-pointer"
                >
                  <option value="">Sebulan Penuh</option>
                  <option value="1">Minggu 1 (Tgl 1-7)</option>
                  <option value="2">Minggu 2 (Tgl 8-14)</option>
                  <option value="3">Minggu 3 (Tgl 15-21)</option>
                  <option value="4">Minggu 4 (Tgl 22-Akhir Bulan)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10">No</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky left-[52px] bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">No Lambung</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jenis Unit</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Area</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Supplier</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">By Type</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Shift Status</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Total Jam Tersedia</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Jam BD (Real)</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Jam BD Tdk Tercover</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">PA After Backup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="11" className="px-4 py-8 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, index) => {
                  // Warna bar progress
                  const paVal = parseFloat(item.pa_after_persen);
                  let colorClass = "bg-emerald-500";
                  if (paVal < 80) colorClass = "bg-red-500";
                  else if (paVal < 95) colorClass = "bg-amber-500";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 text-sm text-slate-600 sticky left-0 bg-white z-10 group-hover:bg-slate-50">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-bold text-[#052334] sticky left-[52px] bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50">{item.no_lambung}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.jenis_unit}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-center">{item.area}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-center">{item.supplier}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-center">{item.by_type}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-600">
                          {item.shift_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-medium text-slate-600">{item.total_jam_tersedia} Jam</td>
                      <td className="px-4 py-3 text-sm text-center text-slate-500">{item.jam_bd_real} Jam</td>
                      <td className="px-4 py-3 text-sm text-center font-bold text-red-500">{item.jam_bd_setelah_backup} Jam</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 justify-center w-full">
                          <span className="text-sm font-bold w-12 text-right">{item.pa_after_persen}%</span>
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${Math.min(100, Math.max(0, paVal))}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="11" className="px-4 py-8 text-center text-slate-500">Tidak ada data sarana.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default ReportPAAfterPage;
