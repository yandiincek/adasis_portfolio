import { useState, useEffect } from 'react';
import {
  Fuel, Search, ChevronDown, Download, Eye, Calendar, Filter,
  Truck, Droplets, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../api/axios';
import * as XLSX from 'xlsx-js-style';

// Summary per unit (bisa dihitung dinamis dari data aslinya nanti, untuk sekarang kita simpan dummy atau biarkan dinamis)
const dummyPerUnit = [];

const DataFuelPage = () => {
  const [fuelRecords, setFuelRecords] = useState([]);
  const [perUnitData, setPerUnitData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('7hari');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [uniqueSuppliers, setUniqueSuppliers] = useState([]);

  const fuelTypeColors = {
    'Solar': '#E58032',
    'Bensin': '#3298A0',
    'Dexlite': '#6366f1',
    'Solar (B30)': '#E58032'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recordsRes, quotasRes] = await Promise.all([
          api.get('/coal-transport/fuel-records'),
          api.get('/coal-transport/fuel-quotas')
        ]);

        const quotaMap = {};
        quotasRes.data.forEach(q => {
          if (q.unit_id) quotaMap[q.unit_id] = q;
        });

        const userRole = localStorage.getItem('userRole');
        const userName = localStorage.getItem('userName');
        const userDepartment = localStorage.getItem('userDepartment');
        
        let fetchedRecords = recordsRes.data || [];
        if (userRole === 'DRIVER') {
          fetchedRecords = fetchedRecords.filter(item => item.petugas_name === userName);
        } else if (userRole === 'ADMIN_VENDOR') {
          fetchedRecords = fetchedRecords.filter(item => item.unit?.supplier === userDepartment);
        }

        const formatted = fetchedRecords.map(item => {
          const quota = item.unit_id ? quotaMap[item.unit_id] : null;

          let planRatio = 1;
          if (quota && quota.ratio) {
            planRatio = parseFloat(quota.ratio) || 1;
          } else if (item.unit) {
            const rStr = item.unit.fuel_ratio_kontrak_terbaru || item.unit.fuel_ratio_kontrak_lama;
            if (rStr && typeof rStr === 'string' && rStr.includes(':')) {
              planRatio = parseFloat(rStr.split(':')[1].replace(',', '.')) || 1;
            } else if (rStr) {
              planRatio = parseFloat(rStr.toString().replace(',', '.')) || 1;
            }
          }

          const planFuel = quota ? (quota.kartu_kuota || 0) : 0;
          const liter = item.liter || 0;
          const kmAwal = item.km_awal || 0;
          const kmAkhir = item.km_akhir || 0;
          const jarak = kmAkhir > kmAwal ? kmAkhir - kmAwal : 0;

          const actRatio = liter > 0 ? (jarak / liter) : 0;
          const fuelDibutuhkan = planRatio > 0 ? (jarak / planRatio) : 0;
          const kelebihanFuel = planRatio > 0 ? fuelDibutuhkan - liter : 0;

          let bolehMengisi = 0;
          if (kelebihanFuel < 0) {
            bolehMengisi = Math.max(0, planFuel + kelebihanFuel);
          } else {
            bolehMengisi = planFuel;
          }

          const sisaBolehMengisi = Math.max(0, bolehMengisi - liter);
          const keterangan = actRatio < planRatio ? 'Boros' : 'Hemat';
          
          // Kolom Baru
          const fuelman = item.fuelman_name || '-';
          const nrpFuelman = item.fuelman_nrp || '-';
          const planJarak = item.jadwal_rute || 0;
          const safetyFuel = 50;
          const tangkiBerkurang = planRatio > 0 ? (jarak / planRatio) - liter : 0;
          const penguranganSafetyFuel = safetyFuel + tangkiBerkurang;
          const rekomendasiIsi = planRatio > 0 ? (planJarak / planRatio) : 0;

          return {
            id: item.id,
            tanggal: new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }),
            jam: item.jam || '-',
            unit: item.unit?.no_lambung || '-',
            fuelman,
            nrpFuelman,
            driver: item.petugas_name || '-',
            nrp: item.petugas_nrp || '-',
            jenis: item.jenis_bbm || '-',
            liter,
            kmAwal,
            kmAkhir,
            jarak,
            planRatio,
            safetyFuel,
            penguranganSafetyFuel,
            tangkiBerkurang,
            planFuel,
            actRatio,
            kelebihanFuel,
            sisaBolehMengisi,
            keterangan,
            planJarak,
            rekomendasiIsi,
            lokasi: item.unit?.tempat_refueling || item.unit?.lokasi || '-',
            supplier: item.unit?.supplier || '-'
          };
        });
        setFuelRecords(formatted);

        const uSuppliers = [...new Set(formatted.map(item => item.supplier).filter(s => s !== '-'))];
        setUniqueSuppliers(uSuppliers.sort());

        // Agregasi Chart
        const unitMap = {};
        formatted.forEach(r => {
          if (!unitMap[r.unit]) unitMap[r.unit] = 0;
          unitMap[r.unit] += r.liter;
        });
        const chartData = Object.keys(unitMap).map(k => ({ unit: k, total: unitMap[k] })).sort((a, b) => b.total - a.total).slice(0, 10);
        setPerUnitData(chartData);

      } catch (err) {
        console.error('Failed to fetch fuel records', err);
      }
    };
    fetchData();
  }, []);

  const filtered = fuelRecords.filter(r => {
    const matchSearch = r.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.nrp && r.nrp.includes(searchQuery));

    const matchSupplier = supplierFilter ? r.supplier === supplierFilter : true;

    return matchSearch && matchSupplier;
  });

  const totalLiter = filtered.reduce((acc, r) => acc + r.liter, 0);

  const handleExportExcel = () => {
    if (filtered.length === 0) return;

    const dataToExport = filtered.map((r, idx) => ({
      'No': idx + 1,
      'No Lambung': r.unit,
      'Supplier': r.supplier,
      'Fuelman (NRP)': `${r.fuelman} (${r.nrpFuelman})`,
      'Driver (NRP)': `${r.driver} (${r.nrp})`,
      'Plan Ratio': r.planRatio,
      'KM Awal': r.kmAwal,
      'KM Akhir': r.kmAkhir,
      'Actual Fuel (Liter)': r.liter,
      'Jarak Tempuh (KM)': r.jarak,
      'Act Ratio': r.actRatio,
      'Status Efisiensi': r.keterangan,
      'Jadwal Rute (Km)': r.planJarak,
      'Kelebihan Fuel (L)': r.kelebihanFuel,
      'Tanggal Pengisian': r.tanggal,
      'Jam Pengisian': r.jam
    }));

    const header = Object.keys(dataToExport[0]);
    const worksheetData = [header, ...dataToExport.map(Object.values)];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "052334" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    for (let i = 0; i < header.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = headerStyle;
    }

    const wscols = header.map(() => ({ wch: 20 }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Fuel");

    XLSX.writeFile(wb, `Data_Pengisian_Fuel_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#052334]">Data Pengisian Fuel</h1>
          <p className="text-slate-500 text-sm mt-1">
            Riwayat dan laporan pengisian bahan bakar kendaraan.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Total Pengisian (Data Terlihat)', value: filtered.length, unit: 'Transaksi', color: 'border-[#3298A0]', textColor: 'text-[#3298A0]' },
          { label: 'Total Volume Solar', value: totalLiter.toLocaleString(), unit: 'Liter', color: 'border-[#E58032]', textColor: 'text-[#E58032]' }
        ].map((s, i) => (
          <div key={i} className={`bg-white p-5 rounded-xl border-l-4 ${s.color} shadow-sm flex items-center justify-between`}>
            <div>
              <p className="text-xs font-semibold text-slate-500">{s.label}</p>
              <div className="flex items-end gap-1.5 mt-1">
                <h2 className={`text-2xl font-black ${s.textColor}`}>{s.value}</h2>
                <span className="text-xs text-slate-400 pb-0.5">{s.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart: Fuel per Unit */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-sm font-bold text-[#052334]">Konsumsi Fuel per Unit</h4>
            <p className="text-xs text-slate-500 mt-1">Total liter per kendaraan (7 hari terakhir)</p>
          </div>
          <div className="p-2 bg-[#E58032]/10 rounded-lg">
            <TrendingUp className="w-4 h-4 text-[#E58032]" />
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perUnitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="unit" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#052334' }}
                formatter={(value) => [`${value} Liter`, 'Volume']}
              />
              <Bar dataKey="total" name="Total Liter" fill="#E58032" radius={[6, 6, 0, 0]} barSize={32} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm mb-6">
        {/* Toolbar */}
        <div className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari unit atau driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E58032]/30 focus:border-[#E58032] transition-all"
              />
            </div>
            {localStorage.getItem('userRole') !== 'ADMIN_VENDOR' && (
              <div className="relative md:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E58032]/30 focus:border-[#E58032] transition-all appearance-none text-[#052334] font-medium"
                >
                  <option value="">Semua Supplier</option>
                  {uniqueSuppliers.map((sup, idx) => (
                    <option key={idx} value={sup}>{sup}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>
          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-[#052334] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-[#083b57] transition-all hover:shadow-lg">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">No</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">No Lambung</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">Supplier</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">Fuelman (NRP)</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">Driver (NRP)</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">Plan Ratio</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">KM Awal</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">KM Akhir</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">Actual Fuel</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">Jarak Tempuh</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">Act Ratio</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">Status Efesiensi</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">Jadwal Rute (Km)</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">Kelebihan Fuel (L)</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-3 whitespace-nowrap">Waktu Pengisian</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, idx) => (
                <tr key={record.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors whitespace-nowrap">
                  <td className="px-2 py-3 text-xs text-slate-400 font-bold text-center">{idx + 1}</td>
                  <td className="px-2 py-3 text-center">
                    <span className="text-xs font-bold text-[#052334]">{record.unit}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">{record.supplier}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-600 font-medium">{record.fuelman}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{record.nrpFuelman}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-600 font-medium">{record.driver}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{record.nrp}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-xs text-center font-bold text-slate-600 bg-slate-50/50">{record.planRatio?.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                  <td className="px-2 py-3 text-xs text-center font-mono text-slate-500">{record.kmAwal?.toLocaleString('id-ID')}</td>
                  <td className="px-2 py-3 text-xs text-center font-mono text-slate-500">{record.kmAkhir?.toLocaleString('id-ID')}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold text-[#E58032] bg-[#E58032]/5">{record.liter?.toLocaleString('id-ID')}</td>
                  <td className="px-2 py-3 text-xs text-center font-mono font-bold text-slate-600">{record.jarak?.toLocaleString('id-ID')}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold text-blue-600 bg-blue-50/30">{record.actRatio?.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                  <td className="px-2 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${record.keterangan === 'Hemat' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {record.keterangan}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-xs text-center font-bold text-slate-600">{record.planJarak?.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                  <td className={`px-2 py-3 text-xs text-center font-bold ${record.kelebihanFuel < 0 ? 'text-red-600 bg-red-50/50' : 'text-emerald-600 bg-emerald-50/50'}`}>
                    {record.kelebihanFuel > 0 ? '+' : ''}{record.kelebihanFuel?.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-3 text-xs text-center text-slate-500 font-medium">
                    {record.tanggal} {record.jam}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-400 font-medium">Menampilkan {filtered.length} dari {fuelRecords.length} data</p>
          <p className="text-xs font-bold text-[#052334]">Total Volume: <span className="text-[#E58032]">{totalLiter.toLocaleString()} Liter</span></p>
        </div>
      </div>
    </>
  );
};

export default DataFuelPage;
