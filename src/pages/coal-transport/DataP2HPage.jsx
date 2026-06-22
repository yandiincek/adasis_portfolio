import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, Search, Filter, Eye, CheckCircle, 
  XCircle, Clock, Truck, FileText, ChevronRight, Loader2, Download
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import * as XLSX from 'xlsx-js-style';

const getStatusStyle = (status) => {
  switch (status) {
    case 'Menunggu': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Disetujui': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Ditolak': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getKesiapanStyle = (kesiapan) => {
  return kesiapan === 'Siap Bekerja' 
    ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
    : 'text-red-600 bg-red-50 border-red-100';
};

const DataP2HPage = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterSupplier, setFilterSupplier] = useState('Semua');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchP2H = async () => {
      try {
        const response = await api.get('/coal-transport/p2h');
        let fetchedData = response.data.data || [];
        
        const userRole = localStorage.getItem('userRole');
        const userName = localStorage.getItem('userName');
        const userDepartment = localStorage.getItem('userDepartment');
        
        // Jika user adalah DRIVER, hanya tampilkan datanya sendiri
        if (userRole === 'DRIVER') {
          fetchedData = fetchedData.filter(item => item.nama_driver === userName);
        } else if (userRole === 'ADMIN_VENDOR') {
          fetchedData = fetchedData.filter(item => (item.unit?.supplier || item.supplier) === userDepartment);
        }

        const formattedData = fetchedData.map(item => ({
          id: item.id.substring(0, 8).toUpperCase(),
          fullId: item.id,
          rawDate: item.tanggal,
          tanggal: new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          noLambung: item.no_lambung || '-',
          driver: item.nama_driver || '-',
          shift: item.shift || '-',
          supplier: item.unit?.supplier || item.supplier || '-',
          kmAwal: parseFloat(item.km_awal) || 0,
          kmAkhir: parseFloat(item.km_akhir) || 0,
          kesiapan: item.driver_siap === 'siap' ? 'Siap Bekerja' : 'Tidak Siap',
          kondisi: item.keputusan_akhir === 'layak' ? 'A (Boleh Jalan)' : (item.keputusan_akhir === 'tidak_layak' ? 'AA (Stop)' : '-'),
          status: item.status === 'PENDING_REVIEW' ? 'Menunggu' : (item.status === 'APPROVED' ? 'Disetujui' : (item.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'))
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Error fetching P2H:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchP2H();
  }, []);

  const filteredData = data.filter(item => {
    const matchSearch = item.noLambung.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.driver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'Semua' || item.status === filterStatus;
    const matchSupplier = filterSupplier === 'Semua' || item.supplier === filterSupplier;
    return matchSearch && matchStatus && matchSupplier;
  });

  const uniqueSuppliers = ['Semua', ...new Set(data.map(item => item.supplier).filter(Boolean))];

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      Swal.fire('Info', 'Tidak ada data untuk diexport', 'info');
      return;
    }

    const formatExcelDate = (isoString) => {
      if (!isoString) return '-';
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
      const month = monthNames[d.getMonth()];
      const year = String(d.getFullYear()).slice(-2);
      return `${day}-${month}-${year}`;
    };

    const exportData = filteredData.map((item, index) => {
      const jarak = item.kmAkhir > item.kmAwal ? item.kmAkhir - item.kmAwal : 0;
      return {
        'No': index + 1,
        'Tanggal': formatExcelDate(item.rawDate),
        'No Lambung': item.noLambung,
        'Nama Driver': item.driver,
        'Supplier': item.supplier,
        'Km Awal': item.kmAwal,
        'Km Akhir': item.kmAkhir,
        'Jarak Tempuh': jarak
      };
    });

    const header = Object.keys(exportData[0]);
    const worksheetData = [header, ...exportData.map(Object.values)];
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

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, 'Data P2H');
    XLSX.writeFile(workbook, `Data_P2H_${new Date().getTime()}.xlsx`);
  };

  const handleReview = (id) => {
    navigate(`/coal/data-p2h/review/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#052334] flex items-center gap-3">
          <CheckSquare className="w-7 h-7 text-[#3298A0]" />
          Data Approval P2H
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Daftar pengajuan Checklist P2H dari driver yang menunggu review dan persetujuan pengawas.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total P2H', value: data.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Menunggu', value: data.filter(d => d.status === 'Menunggu').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Disetujui', value: data.filter(d => d.status === 'Disetujui').length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Ditolak', value: data.filter(d => d.status === 'Ditolak').length, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-[#052334]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari No Lambung atau Driver..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {localStorage.getItem('userRole') !== 'ADMIN_VENDOR' && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 focus:outline-none focus:border-[#3298A0] cursor-pointer"
              >
                {uniqueSuppliers.map(sup => (
                  <option key={sup} value={sup}>{sup === 'Semua' ? 'Semua Supplier' : sup}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden md:block" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 focus:outline-none focus:border-[#3298A0] cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
          <button
            onClick={handleExportExcel}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ID P2H</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unit / Lambung</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Driver</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Kesiapan & Kondisi</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status Approval</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-500 text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#3298A0]" />
                      <span>Memuat data P2H...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-500 text-sm">
                    Tidak ada data P2H yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-4 py-4 text-xs font-bold text-slate-700 font-mono">{row.id}</td>
                    <td className="px-4 py-4 text-xs text-slate-600">{row.tanggal}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-[#3298A0]/10 flex items-center justify-center">
                          <Truck className="w-3.5 h-3.5 text-[#3298A0]" />
                        </div>
                        <span className="text-sm font-bold text-[#052334]">{row.noLambung}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs font-bold text-slate-700">{row.driver}</div>
                      <div className="text-[10px] text-slate-500">{row.shift}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs font-bold text-slate-700">{row.supplier}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getKesiapanStyle(row.kesiapan)}`}>
                          {row.kesiapan}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">{row.kondisi}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(row.status)}`}>
                        {row.status === 'Menunggu' && <Clock className="w-3 h-3 mr-1" />}
                        {row.status === 'Disetujui' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {row.status === 'Ditolak' && <XCircle className="w-3 h-3 mr-1" />}
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button 
                        onClick={() => handleReview(row.fullId)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          row.status === 'Menunggu'
                            ? 'bg-[#3298A0] text-white hover:bg-[#248B96] hover:shadow-md'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {row.status === 'Menunggu' ? (
                          <>Review <ChevronRight className="w-3 h-3" /></>
                        ) : (
                          <>Lihat <Eye className="w-3 h-3" /></>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataP2HPage;
