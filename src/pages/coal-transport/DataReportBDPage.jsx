import React, { useState, useEffect, useRef } from 'react';
import { Search, FileOutput, Filter, Calendar, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import api from '../../api/axios';

const DataReportBDPage = () => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [reportData, setReportData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterTanggalAwal, setFilterTanggalAwal] = useState(todayStr);
  const [filterTanggalAkhir, setFilterTanggalAkhir] = useState(todayStr);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/coal-transport/report-breakdown');
      setReportData(response.data || []);
    } catch (error) {
      console.error('Error fetching breakdown reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredData = reportData.filter(item => {
    const matchSearch = (item.no_lambung || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.keterangan_bd || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Normalisasi format (menyamakan "Shift 1" dengan "Shift-1")
    const normalizeStr = (str) => (str || '').toString().toLowerCase().replace(/[- ]/g, '');
    const matchShift = filterShift ? normalizeStr(item.shift) === normalizeStr(filterShift) : true;
    const matchArea = filterArea ? item.area === filterArea : true;

    // Role Filtering Logic
    const userRole = localStorage.getItem('userRole');
    const userDepartment = localStorage.getItem('userDepartment');
    const matchRole = userRole === 'ADMIN_VENDOR' ? item.supplier === userDepartment : true;

    // Date Filtering Logic
    let matchDate = true;
    if (filterTanggalAwal || filterTanggalAkhir) {
      const itemDate = new Date(item.tanggal);
      itemDate.setHours(0, 0, 0, 0);

      if (filterTanggalAwal) {
        const start = new Date(filterTanggalAwal);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) matchDate = false;
      }

      if (filterTanggalAkhir) {
        const end = new Date(filterTanggalAkhir);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) matchDate = false;
      }
    }

    return matchSearch && matchShift && matchArea && matchDate && matchRole;
  }).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  const uniqueAreas = [...new Set(reportData.map(item => item.area).filter(Boolean))].filter(a => a !== '-');

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk di-export.");
      return;
    }

    // 1. Siapkan meta data report (Header Perusahaan)
    const titleRow = ["PT ALAMTRI RESOURCES INDONESIA TBK"];
    const subtitleRow = ["LAPORAN SARANA BREAKDOWN (BD)"];

    // Filter info
    let filterDateStr = "Semua Waktu";
    if (filterTanggalAwal && filterTanggalAkhir) {
      filterDateStr = `${filterTanggalAwal} s/d ${filterTanggalAkhir}`;
    } else if (filterTanggalAwal) {
      filterDateStr = `Mulai ${filterTanggalAwal}`;
    } else if (filterTanggalAkhir) {
      filterDateStr = `Hingga ${filterTanggalAkhir}`;
    }

    const metaFilterRow = ["Rentang Waktu", ": " + filterDateStr];
    const metaShiftRow = ["Shift", ": " + (filterShift || "Semua Shift")];
    const metaPrintRow = ["Tanggal Cetak", ": " + new Date().toLocaleString('id-ID')];

    const emptyRow = [];

    // 2. Siapkan Header Tabel
    const tableHeader = [
      'NO', 'TANGGAL LAPORAN', 'SHIFT', 'NO LAMBUNG', 'JENIS UNIT',
      'AREA', 'SECTION', 'SUPPLIER', 'KETERANGAN BD', 'PENGGANTI', 'LAMA BD'
    ];

    // 3. Siapkan Data
    const exportData = filteredData.map((item, index) => ([
      index + 1,
      new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }),
      item.shift,
      item.no_lambung,
      item.jenis_unit || '-',
      item.area || '-',
      item.section || '-',
      item.supplier || '-',
      item.keterangan_bd || '-',
      item.pengganti || 'Tidak ada backup',
      item.lama_bd || '-'
    ]));

    // Gabungkan semuanya ke dalam array of arrays (AoA)
    const wsData = [
      titleRow,
      subtitleRow,
      emptyRow,
      metaFilterRow,
      metaShiftRow,
      metaPrintRow,
      emptyRow,
      tableHeader,
      ...exportData
    ];

    // Buat worksheet dari array
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // 4. Tambahkan Style (Border, Warna Header, dll)
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        const cell = worksheet[cellRef];

        if (!cell) continue;

        // Default style for table data (from row 7 which is index 7)
        if (R >= 7) {
          // Bikin border untuk semua cell tabel
          cell.s = {
            border: {
              top: { style: 'thin', color: { rgb: "000000" } },
              bottom: { style: 'thin', color: { rgb: "000000" } },
              left: { style: 'thin', color: { rgb: "000000" } },
              right: { style: 'thin', color: { rgb: "000000" } }
            },
            alignment: { vertical: 'center', horizontal: C === 0 || C === 2 || C === 9 || C === 10 ? 'center' : 'left', wrapText: true }
          };

          // Khusus Header (Baris 7) buat bold dan background
          if (R === 7) {
            cell.s.font = { bold: true, color: { rgb: "FFFFFF" } };
            cell.s.fill = { fgColor: { rgb: "3298A0" } };
            cell.s.alignment.horizontal = 'center';
          }
        } else if (R === 0 || R === 1) { // Title and Subtitle
          cell.s = {
            font: { bold: true, sz: R === 0 ? 14 : 12, color: { rgb: "052334" } },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        } else if (R >= 3 && R <= 5) {
          cell.s = { font: { bold: true } };
        }
      }
    }

    // 5. Styling lebar kolom (Column Widths) supaya rapi seperti excel profesional
    worksheet['!cols'] = [
      { wch: 5 },   // NO
      { wch: 22 },  // TANGGAL
      { wch: 10 },  // SHIFT
      { wch: 15 },  // NO LAMBUNG
      { wch: 20 },  // JENIS UNIT
      { wch: 20 },  // AREA
      { wch: 25 },  // SECTION
      { wch: 30 },  // SUPPLIER
      { wch: 40 },  // KETERANGAN BD
      { wch: 20 },  // PENGGANTI
      { wch: 15 }   // LAMA BD
    ];

    // 5. Merge cell untuk Title dan Subtitle agar rata tengah (opsional jika lib dukung alignment, kalau tidak setidaknya menyatu)
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Merge baris 0, kolom 0-10
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }  // Merge baris 1, kolom 0-10
    ];

    // 6. Buat Workbook dan simpan
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data BD');

    // Penamaan file dinamis
    let fileName = 'Report_Breakdown_Alamtri';
    if (filterTanggalAwal && filterTanggalAkhir) {
      fileName += `_${filterTanggalAwal}_sd_${filterTanggalAkhir}`;
    }
    fileName += '.xlsx';

    XLSX.writeFile(workbook, fileName);
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        let headerRowIndex = -1;
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (row && row.length > 0 && String(row[1] || '').toUpperCase().includes('TANGGAL LAPORAN')) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          alert('Format Excel tidak valid. Pastikan ada kolom "TANGGAL LAPORAN" di header tabel (kolom kedua).');
          return;
        }

        const payload = [];
        for (let i = headerRowIndex + 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0 || !row[3]) continue;

          let tanggalStr = row[1];
          let finalTanggal = new Date();
          if (typeof tanggalStr === 'number') {
            finalTanggal = new Date(Math.round((tanggalStr - 25569) * 86400 * 1000));
          } else if (typeof tanggalStr === 'string') {
            finalTanggal = new Date(tanggalStr);
          }

          payload.push({
            tanggal: finalTanggal,
            shift: row[2] || 'Shift 1',
            no_lambung: row[3] || '-',
            jenis_unit: row[4] || null,
            section: row[5] || null,
            supplier: row[6] || null,
            keterangan_bd: row[7] || null,
            pengganti: row[8] && row[8] !== 'Tidak ada backup' ? row[8] : null,
            lama_bd: row[9] || null
          });
        }

        if (payload.length === 0) {
          alert('Tidak ada data baris yang valid ditemukan untuk di-import.');
          return;
        }

        setIsLoading(true);
        await api.post('/coal-transport/report-breakdown/bulk', payload);
        alert(`Berhasil meng-import ${payload.length} baris data report breakdown!`);
        fetchReports();
      } catch (error) {
        console.error('Error importing excel:', error);
        alert('Terjadi kesalahan saat memproses file Excel.');
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#052334] flex items-center gap-3">
          <FileOutput className="w-7 h-7 text-[#3298A0]" />
          Data Report Breakdown (BD)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Rekapitulasi seluruh laporan sarana breakdown dari Shift 1 dan Shift 2.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm mb-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 p-4 border-b border-slate-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari No Lambung atau Keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Mulai:</span>
                <input
                  type="date"
                  value={filterTanggalAwal}
                  onChange={(e) => setFilterTanggalAwal(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Sampai:</span>
                <input
                  type="date"
                  value={filterTanggalAkhir}
                  onChange={(e) => setFilterTanggalAkhir(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0]"
                />
              </div>

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

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  className="w-full md:w-40 pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] cursor-pointer"
                >
                  <option value="">Semua Shift</option>
                  <option value="Shift 1">SHIFT 1</option>
                  <option value="Shift 2">SHIFT 2</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportExcel}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-[#052334] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition-all hover:shadow-lg"
                >
                  <Upload className="w-4 h-4" /> Import Excel
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 transition-all hover:shadow-lg"
                >
                  <Download className="w-4 h-4" /> Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Laporan</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Shift</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">No Lambung</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jenis Unit</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Area</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Section</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Keterangan BD</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pengganti</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lama BD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${item.shift === 'Shift 1' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                        {item.shift}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-[#052334]">{item.no_lambung}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.jenis_unit || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.area || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.section || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.supplier || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.keterangan_bd || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.pengganti && item.pengganti !== 'Tidak ada backup'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-50 text-red-500'
                        }`}>
                        {item.pengganti || 'Tidak ada backup'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-medium">{item.lama_bd || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data report breakdown.
                  </td>
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

export default DataReportBDPage;
