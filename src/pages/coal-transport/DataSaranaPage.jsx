import { useState, useRef, useEffect } from 'react';
import {
  Truck, Search, Plus, Filter, ChevronDown, Edit2, Trash2, Eye,
  CheckCircle, XCircle, AlertTriangle, Settings, FileSpreadsheet, Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import api from '../../api/axios';

// Data dummy sarana (Sesuai kolom yang diminta user)
const dummyUnits = [
  {
    id: 1,
    noLambung: 'DT-001',
    departemen: 'Operation',
    section: 'Coal Hauling',
    rute: 'PIT A - Port',
    userTujuan: 'Operation Dept',
    byJob: 'Hauling',
    byType: 'Heavy Duty',
    kodeSap: 'SAP-10101',
    lokasi: 'Port A',
    area: 'Site Kaltim',
    noPolisi: 'KT 1234 AB',
    noRangka: 'MHF1234567890',
    namaPemilik: 'PT Alamtri',
    merk: 'Hino',
    jenisUnit: 'Dump Truck',
    tipeUnit: '500 FM 260 JD',
    tahunPembuatan: 2022,
    umur: 2,
    unit: 'DT',
    awalKontrak: '01 Jan 2023',
    akhirKontrak: '31 Des 2026',
    alertMasaAkhirKontrak: 215,
    harga: 'Rp 25.000.000',
    kalenderExpiredAccessSticker: '31 Des 2024',
    stikerAlert: 215,
    supplier: 'Internal',
    legalitasActive: 'Kontrak',
    nomorKontrak: 'KONT-001/2023',
    shift: 'Shift 1 & 2',
    gps: 'Terpasang',
    overtime: 'Ya',
    fuelRatioByKontrak: '1:3',
    fuelRatioByKontrakTerbaru: '1:3.2',
    status: 'Operasional'
  },
  {
    id: 2,
    noLambung: 'DT-002',
    departemen: 'Operation',
    section: 'Coal Hauling',
    rute: 'PIT B - Port',
    userTujuan: 'Operation Dept',
    byJob: 'Hauling',
    byType: 'Heavy Duty',
    kodeSap: 'SAP-10102',
    lokasi: 'Port B',
    area: 'Site Kaltim',
    noPolisi: 'KT 5678 CD',
    noRangka: 'MHF9876543210',
    namaPemilik: 'PT Trans Kaltim',
    merk: 'Mitsubishi',
    jenisUnit: 'Dump Truck',
    tipeUnit: 'Fuso Fighter',
    tahunPembuatan: 2021,
    umur: 3,
    unit: 'DT',
    awalKontrak: '01 Mar 2022',
    akhirKontrak: '28 Feb 2025',
    alertMasaAkhirKontrak: 45,
    harga: 'Rp 22.500.000',
    kalenderExpiredAccessSticker: '28 Feb 2025',
    stikerAlert: 45,
    supplier: 'PT Trans Kaltim',
    legalitasActive: 'Kontrak',
    nomorKontrak: 'KONT-089/2022',
    shift: 'Shift 1',
    gps: 'Terpasang',
    overtime: 'Tidak',
    fuelRatioByKontrak: '1:2.8',
    fuelRatioByKontrakTerbaru: '1:2.9',
    status: 'Maintenance'
  }
];

const processUnit = (u) => {
  const currentYear = new Date().getFullYear();
  const currentDate = new Date();

  // Hitung Umur = current year - tahun pembuatan
  const umur = u.tahunPembuatan ? currentYear - parseInt(u.tahunPembuatan) : 0;

  // Helper parser tanggal format "31 Des 2026", "YYYY-MM-DD", "DD/MM/YYYY", atau "DD-MMM-YY"
  const parseDateStr = (dateStr) => {
    if (!dateStr || dateStr === '-') return null;
    const str = dateStr.toString().trim();

    // Format "01-Aug-25" atau "01-08-2025"
    if (str.includes('-')) {
      const p = str.split('-');
      if (p.length === 3) {
        const mMap = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
        let m = mMap[p[1]];
        if (m === undefined) m = parseInt(p[1]) - 1;
        let y = parseInt(p[2]);
        if (y < 100) y += 2000; // asumsikan 2000-an untuk 2 digit tahun
        if (!isNaN(y) && !isNaN(m) && !isNaN(parseInt(p[0]))) {
          return new Date(y, m, parseInt(p[0]));
        }
      }
    }

    // Format "31/07/2030"
    if (str.includes('/')) {
      const p = str.split('/');
      if (p.length === 3) {
        return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
      }
    }

    const months = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5, 'Jul': 6, 'Agt': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11, 'Dec': 11 };
    const parts = str.split(' ');
    if (parts.length >= 3) {
      return new Date(parseInt(parts[2]), months[parts[1]] || 0, parseInt(parts[0]));
    }
    // Coba fallback format native JS / Excel
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const getDaysDiff = (dateStr) => {
    const targetDate = parseDateStr(dateStr);
    if (!targetDate) return 0;
    const diffTime = targetDate.getTime() - currentDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const alertMasaAkhirKontrak = getDaysDiff(u.akhirKontrak);
  const stikerAlert = getDaysDiff(u.kalenderExpiredAccessSticker);

  return {
    ...u,
    umur,
    alertMasaAkhirKontrak,
    stikerAlert
  };
};

const initialUnits = dummyUnits.map(processUnit);

const statusConfig = {
  'Operasional': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, dotColor: 'bg-emerald-500' },
  'Maintenance': { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Settings, dotColor: 'bg-amber-500' },
  'Breakdown': { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, dotColor: 'bg-red-500' },
  'Standby': { color: 'bg-slate-50 text-slate-600 border-slate-200', icon: AlertTriangle, dotColor: 'bg-slate-400' },
};

const DataSaranaPage = () => {
  const userRole = localStorage.getItem('userRole') || 'USER';
  const [searchQuery, setSearchQuery] = useState('');
  const [unitsData, setUnitsData] = useState([]);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const formatDateToDDMMMYY = (yyyyMMdd) => {
    if (!yyyyMMdd) return '';
    const d = new Date(yyyyMMdd);
    if (isNaN(d.getTime())) return yyyyMMdd;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dd = String(d.getDate()).padStart(2, '0');
    const mmm = months[d.getMonth()];
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}-${mmm}-${yy}`;
  };

  // Add State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const initialFormState = {
    noLambung: '', departemen: '', section: '', rute: '', userTujuan: '', byJob: '', byType: '',
    kodeSap: '', lokasi: '', area: '', noPolisi: '', noRangka: '', namaPemilik: '', merk: '',
    jenisUnit: '', tipeUnit: '', tahunPembuatan: '', awalKontrak: '', akhirKontrak: '', harga: '',
    kalenderExpiredAccessSticker: '', supplier: '', legalitasActive: '', nomorKontrak: '', shift: '',
    gps: '', overtime: '', fuelRatioByKontrak: '', fuelRatioByKontrakTerbaru: '', status: 'Operasional'
  };
  const [addForm, setAddForm] = useState({ ...initialFormState });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleDeleteClick = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Sarana?',
      text: "Data sarana yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/coal-transport/sarana/${id}`);
        Swal.fire({ title: 'Terhapus!', text: 'Data sarana berhasil dihapus.', icon: 'success' });
        fetchSarana();
      } catch (error) {
        Swal.fire({ title: 'Gagal!', text: 'Terjadi kesalahan saat menghapus data.', icon: 'error' });
      }
    }
  };

  const handleEditClick = (unit) => {
    setEditForm({ ...unit });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put(`/coal-transport/sarana/${editForm.id}`, {
        no_lambung: editForm.noLambung,
        departemen: editForm.departemen,
        section: editForm.section,
        rute: editForm.rute,
        user_tujuan: editForm.userTujuan,
        by_job: editForm.byJob,
        by_type: editForm.byType,
        kode_sap: editForm.kodeSap,
        lokasi: editForm.lokasi,
        area: editForm.area,
        no_polisi: editForm.noPolisi,
        no_rangka: editForm.noRangka,
        nama_pemilik: editForm.namaPemilik,
        merk: editForm.merk,
        jenis_unit: editForm.jenisUnit,
        tipe_unit: editForm.tipeUnit,
        tahun_pembuatan: editForm.tahunPembuatan ? parseInt(editForm.tahunPembuatan) : null,
        awal_kontrak: editForm.awalKontrak,
        akhir_kontrak: editForm.akhirKontrak,
        harga: editForm.harga,
        kalender_stiker: editForm.kalenderExpiredAccessSticker,
        supplier: editForm.supplier,
        legalitas: editForm.legalitasActive,
        nomor_kontrak: editForm.nomorKontrak,
        shift: editForm.shift,
        gps: editForm.gps,
        overtime: editForm.overtime,
        fuel_ratio_kontrak_lama: editForm.fuelRatioByKontrak,
        fuel_ratio_kontrak_terbaru: editForm.fuelRatioByKontrakTerbaru
        // status dihilangkan dari form sesuai permintaan
      });
      Swal.fire({ title: 'Berhasil!', text: 'Data sarana berhasil diupdate.', icon: 'success' });
      setIsEditModalOpen(false);
      fetchSarana();
    } catch (error) {
      Swal.fire({ title: 'Gagal!', text: 'Terjadi kesalahan saat mengupdate data.', icon: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddClick = () => {
    setAddForm({ ...initialFormState });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post(`/coal-transport/sarana`, {
        no_lambung: addForm.noLambung,
        departemen: addForm.departemen,
        section: addForm.section,
        rute: addForm.rute,
        user_tujuan: addForm.userTujuan,
        by_job: addForm.byJob,
        by_type: addForm.byType,
        kode_sap: addForm.kodeSap,
        lokasi: addForm.lokasi,
        area: addForm.area,
        no_polisi: addForm.noPolisi,
        no_rangka: addForm.noRangka,
        nama_pemilik: addForm.namaPemilik,
        merk: addForm.merk,
        jenis_unit: addForm.jenisUnit,
        tipe_unit: addForm.tipeUnit,
        tahun_pembuatan: addForm.tahunPembuatan ? parseInt(addForm.tahunPembuatan) : null,
        awal_kontrak: addForm.awalKontrak,
        akhir_kontrak: addForm.akhirKontrak,
        harga: addForm.harga,
        kalender_stiker: addForm.kalenderExpiredAccessSticker,
        supplier: addForm.supplier,
        legalitas: addForm.legalitasActive,
        nomor_kontrak: addForm.nomorKontrak,
        shift: addForm.shift,
        gps: addForm.gps,
        overtime: addForm.overtime,
        fuel_ratio_kontrak_lama: addForm.fuelRatioByKontrak,
        fuel_ratio_kontrak_terbaru: addForm.fuelRatioByKontrakTerbaru,
        status: addForm.status || 'Operasional'
      });
      Swal.fire({ title: 'Berhasil!', text: 'Data sarana berhasil ditambahkan.', icon: 'success' });
      setIsAddModalOpen(false);
      fetchSarana();
    } catch (error) {
      Swal.fire({ title: 'Gagal!', text: 'Terjadi kesalahan saat menambah data.', icon: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter & Pagination State
  const [showFilter, setShowFilter] = useState(false);
  const [filterArea, setFilterArea] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fileInputRef = useRef(null);

  // Fetch data dari API
  const fetchSarana = async () => {
    try {
      const res = await api.get('/coal-transport/sarana');
      // Format data untuk menyesuaikan properti dengan state lokal dan proses umur
      const formatted = res.data.map(item => processUnit({
        ...item,
        noLambung: item.no_lambung,
        userTujuan: item.user_tujuan,
        byJob: item.by_job,
        byType: item.by_type,
        kodeSap: item.kode_sap,
        noPolisi: item.no_polisi,
        noRangka: item.no_rangka,
        namaPemilik: item.nama_pemilik,
        jenisUnit: item.jenis_unit,
        tipeUnit: item.tipe_unit,
        tahunPembuatan: item.tahun_pembuatan,
        awalKontrak: item.awal_kontrak,
        akhirKontrak: item.akhir_kontrak,
        kalenderExpiredAccessSticker: item.kalender_stiker,
        legalitasActive: item.legalitas,
        nomorKontrak: item.nomor_kontrak,
        fuelRatioByKontrak: item.fuel_ratio_kontrak_lama,
        fuelRatioByKontrakTerbaru: item.fuel_ratio_kontrak_terbaru
      }));
      setUnitsData(formatted);
    } catch (error) {
      console.error('Gagal mengambil data sarana:', error);
    }
  };

  useEffect(() => {
    fetchSarana();
  }, []);

  const filtered = unitsData.filter(unit => {
    const matchSearch = (unit.noLambung || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (unit.namaPemilik || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchArea = filterArea ? unit.area === filterArea : true;
    const matchSupplier = filterSupplier ? unit.supplier === filterSupplier : true;
    return matchSearch && matchArea && matchSupplier;
  });

  // Unique list of suppliers for the dropdown
  const uniqueSuppliers = Array.from(new Set(unitsData.map(u => u.supplier).filter(Boolean))).sort();

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterArea, filterSupplier, itemsPerPage]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (!rawRows || rawRows.length < 2) return;

      // 1. Cari baris pertama yang mengandung 'lambung'
      let headerStart = 0;
      let lambungCol = 0;
      for (let i = 0; i < Math.min(10, rawRows.length); i++) {
        const row = rawRows[i];
        if (!row) continue;
        const colIdx = row.findIndex(cell => typeof cell === 'string' && cell.toLowerCase().includes('lambung'));
        if (colIdx !== -1) {
          headerStart = i;
          lambungCol = colIdx;
          break;
        }
      }

      // 2. Cari baris data pertama (baris di bawah headerStart yang memiliki nilai di lambungCol)
      // Ini berguna untuk mengatasi Header Excel yang di-merge (lebih dari 1 baris)
      let dataStart = headerStart + 1;
      for (let i = headerStart + 1; i < rawRows.length; i++) {
        const cell = rawRows[i] ? rawRows[i][lambungCol] : undefined;
        if (cell !== undefined && cell !== null && String(cell).trim() !== '') {
          dataStart = i;
          break;
        }
      }

      // 3. Gabungkan semua teks dari headerStart sampai dataStart-1 menjadi satu header komposit
      const headers = [];
      const maxCols = Math.max(...rawRows.slice(headerStart, dataStart).map(r => r ? r.length : 0));
      for (let c = 0; c < maxCols; c++) {
        let h = [];
        for (let r = headerStart; r < dataStart; r++) {
          if (rawRows[r] && rawRows[r][c]) {
            h.push(String(rawRows[r][c]).trim());
          }
        }
        headers.push(h.join(' '));
      }

      // 4. Transformasi baris data menjadi array of objects berdasarkan header komposit
      const data = [];
      for (let i = dataStart; i < rawRows.length; i++) {
        const rowArray = rawRows[i];
        if (!rowArray || rowArray.length === 0) continue;

        const rowObj = {};
        let isEmpty = true;
        for (let c = 0; c < headers.length; c++) {
          rowObj[headers[c]] = rowArray[c];
          if (rowArray[c] !== undefined && rowArray[c] !== null && String(rowArray[c]).trim() !== '') {
            isEmpty = false;
          }
        }
        if (!isEmpty) data.push(rowObj);
      }

      if (data && data.length > 0) {
        // Fungsi helper untuk mengambil nilai dari key yang mengandung kata kunci tertentu
        const getVal = (row, keywords, exclude = []) => {
          const key = Object.keys(row).find(k => {
            const lowerK = k.toLowerCase();
            const matchKeyword = keywords.some(kw => lowerK.includes(kw.toLowerCase()));
            const matchExclude = exclude.length > 0 && exclude.some(ex => lowerK.includes(ex.toLowerCase()));
            return matchKeyword && !matchExclude;
          });
          return key && row[key] !== undefined && row[key] !== '' ? String(row[key]).trim() : '-';
        };

        // Helper untuk merubah angka serial Excel (misal: 47695) ke tanggal string 'DD-MMM-YY'
        const formatExcelDate = (val) => {
          if (val === '-' || !val) return '-';
          const num = Number(val);
          if (!isNaN(num) && num > 30000 && num < 100000) {
            const date = new Date(Math.round((num - 25569) * 86400 * 1000));
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dd = String(date.getDate()).padStart(2, '0');
            const mmm = monthNames[date.getMonth()];
            const yy = String(date.getFullYear()).slice(-2);
            return `${dd}-${mmm}-${yy}`;
          }
          return val; // Jika format sudah berupa string, kembalikan aslinya
        };

        const payload = data.map((row) => ({
          no_lambung: getVal(row, ['lambung']),
          departemen: getVal(row, ['departemen', 'dept']),
          section: getVal(row, ['section']),
          rute: getVal(row, ['rute']),
          user_tujuan: getVal(row, ['tujuan']),
          by_job: getVal(row, ['by job']),
          by_type: getVal(row, ['by type']),
          kode_sap: getVal(row, ['sap']),
          lokasi: getVal(row, ['lokasi']),
          area: getVal(row, ['area']),
          no_polisi: getVal(row, ['polisi']),
          no_rangka: getVal(row, ['rangka']),
          nama_pemilik: getVal(row, ['pemilik']),
          merk: getVal(row, ['merk']),
          jenis_unit: getVal(row, ['jenis unit']),
          tipe_unit: getVal(row, ['tipe unit']),
          tahun_pembuatan: parseInt(getVal(row, ['tahun'])) || new Date().getFullYear(),
          awal_kontrak: formatExcelDate(getVal(row, ['awal kontrak'])),
          akhir_kontrak: formatExcelDate(getVal(row, ['akhir kontrak'])),
          harga: getVal(row, ['harga']) !== '-' ? getVal(row, ['harga']) : '-',
          kalender_stiker: formatExcelDate(getVal(row, ['kalender', 'sticker', 'stiker'])),
          supplier: getVal(row, ['supplier']),
          legalitas: getVal(row, ['legalitas']),
          nomor_kontrak: getVal(row, ['nomor kontrak']),
          shift: getVal(row, ['shift']),
          gps: getVal(row, ['gps']),
          overtime: getVal(row, ['overtime']),
          fuel_ratio_kontrak_lama: getVal(row, ['ratio'], ['terbaru']),
          fuel_ratio_kontrak_terbaru: getVal(row, ['terbaru']),
          status: getVal(row, ['status']) === '-' ? 'Operasional' : getVal(row, ['status'])
        })).filter(item => item.no_lambung !== '-' && isNaN(Number(item.no_lambung))); // Abaikan baris kosong dan baris penomoran (seperti no_lambung: "1" atau "2")

        api.post('/coal-transport/sarana/bulk', payload)
          .then(res => {
            alert(`Berhasil import ${res.data.count || payload.length} data sarana ke Database!`);
            fetchSarana(); // Refresh data dari server
          })
          .catch(err => {
            console.error('Gagal import sarana:', err);
            alert('Gagal mengimport data sarana ke database.');
          });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#052334]">Data Sarana & Aset</h1>
        <p className="text-slate-500 text-sm mt-1">
          Database komprehensif seluruh unit kendaraan Coal Transport beserta legalitas.
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari No. Lambung, Pemilik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E58032]/30 focus:border-[#E58032] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 transition-all"
            >
              <Upload className="w-4 h-4" /> Import Excel
            </button>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <Filter className="w-4 h-4" /> Filter
            </button>
            {(userRole === 'ADMIN' || userRole === 'ADMINISTRATOR' || userRole === 'ADMIN_TRANSPORT') && (
              <button onClick={handleAddClick} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#052334] text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-[#083b57] transition-all hover:shadow-lg">
                <Plus className="w-4 h-4" /> Tambah Sarana
              </button>
            )}
          </div>
        </div>

        {/* Filter Section (Expandable) */}
        {showFilter && (
          <div className="bg-slate-50 border-b border-slate-100 p-4 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 mb-1">Area</label>
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E58032]/30"
              >
                <option value="">Semua Area</option>
                <option value="MINING">MINING</option>
                <option value="HAULING">HAULING</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 mb-1">Supplier</label>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E58032]/30"
              >
                <option value="">Semua Supplier</option>
                {uniqueSuppliers.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Table Container dengan custom scrollbar agar enak digeser */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse whitespace-nowrap min-w-max">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200">
                <th className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 sticky left-0 bg-[#f8fafc] z-20 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">No</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 sticky left-[50px] bg-[#f8fafc] z-10 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">No Lambung</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Departemen</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Section</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Rute</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">User/Tujuan</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">By Job</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">By Type</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Kode SAP</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Lokasi</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Area</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">No Polisi</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">No Rangka</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Nama Pemilik</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Merk</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Jenis Unit</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Tipe Unit</th>
                <th className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Tahun</th>
                <th className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Umur</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Awal Kontrak</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Akhir Kontrak</th>
                <th className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 bg-red-50/50">Alert Kontrak (Hari)</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Harga</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Kalender Access Sticker</th>
                <th className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 bg-amber-50/50">Stiker Alert (Hari)</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Supplier</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Legalitas</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Nomor Kontrak</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Shift</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">GPS</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Overtime</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Fuel Ratio Kontrak</th>
                <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Fuel Ratio Terbaru</th>
                <th className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 sticky right-0 bg-[#f8fafc] z-10 border-l border-slate-200 shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((unit, idx) => {
                const index = (currentPage - 1) * itemsPerPage + idx;
                const statusStyle = statusConfig[unit.status] || statusConfig['Standby'];
                return (
                  <tr key={unit.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-slate-50/70 z-20 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.01)] transition-colors text-center text-xs font-medium text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 sticky left-[50px] bg-white group-hover:bg-slate-50/70 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.01)] transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-[#3298A0]/10 flex items-center justify-center">
                          <Truck className="w-3.5 h-3.5 text-[#3298A0]" />
                        </div>
                        <span className="text-sm font-bold text-[#052334]">{unit.noLambung}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.departemen}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.section}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.rute}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.userTujuan}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.byJob}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.byType}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono">{unit.kodeSap}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.lokasi}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.area}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{unit.noPolisi}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">{unit.noRangka}</td>
                    <td className="px-4 py-3 text-xs font-bold text-[#052334]">{unit.namaPemilik}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.merk}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.jenisUnit}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.tipeUnit}</td>
                    <td className="px-4 py-3 text-xs text-center text-slate-600">{unit.tahunPembuatan}</td>
                    <td className="px-4 py-3 text-xs text-center text-slate-600">{unit.umur}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.awalKontrak}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-medium">{unit.akhirKontrak}</td>
                    <td className="px-4 py-3 text-xs text-center font-bold">
                      <span className={`px-2 py-1 rounded-md ${unit.alertMasaAkhirKontrak <= 60 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                        {unit.alertMasaAkhirKontrak}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.harga}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.kalenderExpiredAccessSticker}</td>
                    <td className="px-4 py-3 text-xs text-center font-bold">
                      <span className={`px-2 py-1 rounded-md ${unit.stikerAlert <= 60 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {unit.stikerAlert}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.supplier}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 bg-slate-50">{unit.legalitasActive}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono">{unit.nomorKontrak}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.shift}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-0.5 rounded ${unit.gps === 'Terpasang' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {unit.gps}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{unit.overtime}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600 bg-slate-50">{unit.fuelRatioByKontrak}</td>
                    <td className="px-4 py-3 text-xs font-mono font-bold text-amber-600 bg-amber-50/30">{unit.fuelRatioByKontrakTerbaru}</td>

                    <td className="px-4 py-3 text-center sticky right-0 bg-white group-hover:bg-slate-50/70 z-10 border-l border-slate-100 shadow-[-2px_0_5px_rgba(0,0,0,0.01)] transition-colors">
                      <div className="flex items-center justify-center gap-1.5">
                        <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat Detail">
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        {(userRole === 'ADMIN' || userRole === 'ADMINISTRATOR' || userRole === 'ADMIN_TRANSPORT') && (
                          <>
                            <button onClick={() => handleEditClick(unit)} className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                              <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                            <button onClick={() => handleDeleteClick(unit.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan="34" className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Entries per page */}
        <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-white rounded-b-xl">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E58032]/30"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-slate-500">
              dari {filtered.length} entri
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Sebelumnya
            </button>

            <div className="flex items-center gap-1 hidden md:flex">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${currentPage === pageNum
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-800">Tambah Data Sarana Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 bg-slate-50/30 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* 1. Informasi Dasar */}
                <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-[#E58032] mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Informasi Dasar & Identitas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">No. Lambung *</label>
                      <input type="text" required value={addForm.noLambung} onChange={(e) => setAddForm({...addForm, noLambung: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">No. Polisi</label>
                      <input type="text" value={addForm.noPolisi} onChange={(e) => setAddForm({...addForm, noPolisi: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">No. Rangka</label>
                      <input type="text" value={addForm.noRangka} onChange={(e) => setAddForm({...addForm, noRangka: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Kode SAP</label>
                      <input type="text" value={addForm.kodeSap} onChange={(e) => setAddForm({...addForm, kodeSap: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                  </div>
                </div>

                {/* 2. Spesifikasi Unit */}
                <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-[#E58032] mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Spesifikasi Unit</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Merk</label>
                      <input type="text" value={addForm.merk} onChange={(e) => setAddForm({...addForm, merk: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Jenis Unit</label>
                      <input type="text" value={addForm.jenisUnit} onChange={(e) => setAddForm({...addForm, jenisUnit: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Tipe Unit</label>
                      <input type="text" value={addForm.tipeUnit} onChange={(e) => setAddForm({...addForm, tipeUnit: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Tahun Pembuatan</label>
                      <input type="number" value={addForm.tahunPembuatan} onChange={(e) => setAddForm({...addForm, tahunPembuatan: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                  </div>
                </div>

                {/* 3. Operasional & Lokasi */}
                <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-[#E58032] mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Operasional & Lokasi</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Departemen</label>
                      <input type="text" value={addForm.departemen} onChange={(e) => setAddForm({...addForm, departemen: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Section</label>
                      <input type="text" value={addForm.section} onChange={(e) => setAddForm({...addForm, section: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Area</label>
                      <input type="text" value={addForm.area} onChange={(e) => setAddForm({...addForm, area: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Lokasi</label>
                      <input type="text" value={addForm.lokasi} onChange={(e) => setAddForm({...addForm, lokasi: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Rute</label>
                      <input type="text" value={addForm.rute} onChange={(e) => setAddForm({...addForm, rute: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">User Tujuan</label>
                      <input type="text" value={addForm.userTujuan} onChange={(e) => setAddForm({...addForm, userTujuan: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">By Job</label>
                      <input type="text" value={addForm.byJob} onChange={(e) => setAddForm({...addForm, byJob: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">By Type</label>
                      <input type="text" value={addForm.byType} onChange={(e) => setAddForm({...addForm, byType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                  </div>
                </div>

                {/* 4. Kepemilikan & Kontrak */}
                <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-[#E58032] mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Kepemilikan & Kontrak</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nama Pemilik</label>
                      <input type="text" value={addForm.namaPemilik} onChange={(e) => setAddForm({...addForm, namaPemilik: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Supplier</label>
                      <input type="text" value={addForm.supplier} onChange={(e) => setAddForm({...addForm, supplier: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Legalitas</label>
                      <input type="text" value={addForm.legalitasActive} onChange={(e) => setAddForm({...addForm, legalitasActive: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nomor Kontrak</label>
                      <input type="text" value={addForm.nomorKontrak} onChange={(e) => setAddForm({...addForm, nomorKontrak: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Awal Kontrak</label>
                      <div className="relative flex items-center">
                        <input type="text" value={addForm.awalKontrak} onChange={(e) => setAddForm({...addForm, awalKontrak: e.target.value})} placeholder="DD-MMM-YY" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                        <div className="absolute right-2 w-5 h-5 flex items-center justify-center overflow-hidden">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <input type="date" className="absolute right-0 top-0 opacity-0 cursor-pointer w-8 h-full" onChange={(e) => { if(e.target.value) setAddForm({...addForm, awalKontrak: formatDateToDDMMMYY(e.target.value)}) }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Akhir Kontrak</label>
                      <div className="relative flex items-center">
                        <input type="text" value={addForm.akhirKontrak} onChange={(e) => setAddForm({...addForm, akhirKontrak: e.target.value})} placeholder="DD-MMM-YY" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                        <div className="absolute right-2 w-5 h-5 flex items-center justify-center overflow-hidden">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <input type="date" className="absolute right-0 top-0 opacity-0 cursor-pointer w-8 h-full" onChange={(e) => { if(e.target.value) setAddForm({...addForm, akhirKontrak: formatDateToDDMMMYY(e.target.value)}) }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Harga</label>
                      <input type="text" value={addForm.harga} onChange={(e) => setAddForm({...addForm, harga: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Stiker Access Expired</label>
                      <div className="relative flex items-center">
                        <input type="text" value={addForm.kalenderExpiredAccessSticker} onChange={(e) => setAddForm({...addForm, kalenderExpiredAccessSticker: e.target.value})} placeholder="DD-MMM-YY" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                        <div className="absolute right-2 w-5 h-5 flex items-center justify-center overflow-hidden">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <input type="date" className="absolute right-0 top-0 opacity-0 cursor-pointer w-8 h-full" onChange={(e) => { if(e.target.value) setAddForm({...addForm, kalenderExpiredAccessSticker: formatDateToDDMMMYY(e.target.value)}) }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Fuel & Kelengkapan */}
                <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-[#E58032] mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">BBM & Kelengkapan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Fuel Ratio (Lama)</label>
                      <input type="text" value={addForm.fuelRatioByKontrak} onChange={(e) => setAddForm({...addForm, fuelRatioByKontrak: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Fuel Ratio (Terbaru)</label>
                      <input type="text" value={addForm.fuelRatioByKontrakTerbaru} onChange={(e) => setAddForm({...addForm, fuelRatioByKontrakTerbaru: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Shift</label>
                      <input type="text" value={addForm.shift} onChange={(e) => setAddForm({...addForm, shift: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Overtime</label>
                      <input type="text" value={addForm.overtime} onChange={(e) => setAddForm({...addForm, overtime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Status GPS</label>
                      <input type="text" value={addForm.gps} onChange={(e) => setAddForm({...addForm, gps: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                  </div>
                </div>

              </div>
              <div className="bg-white border-t border-slate-100 px-6 py-4 flex justify-end shrink-0">
                <button type="submit" disabled={isSaving} className="bg-[#052334] hover:bg-[#083b57] text-white px-8 py-2 rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50">
                  {isSaving ? 'Menyimpan...' : 'Tambah Sarana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsEditModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-800">Edit Data Sarana: {editForm.noLambung}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 bg-slate-50/30 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* 1. Informasi Dasar */}
                <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-[#E58032] mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Informasi Dasar & Identitas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">No. Lambung</label>
                      <input type="text" value={editForm.noLambung || ''} onChange={(e) => setEditForm({...editForm, noLambung: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">No. Polisi</label>
                      <input type="text" value={editForm.noPolisi || ''} onChange={(e) => setEditForm({...editForm, noPolisi: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">No. Rangka</label>
                      <input type="text" value={editForm.noRangka || ''} onChange={(e) => setEditForm({...editForm, noRangka: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Kode SAP</label>
                      <input type="text" value={editForm.kodeSap || ''} onChange={(e) => setEditForm({...editForm, kodeSap: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                  </div>
                </div>

                {/* 2. Spesifikasi Unit */}
                <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-[#E58032] mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Spesifikasi Unit</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Merk</label>
                      <input type="text" value={editForm.merk || ''} onChange={(e) => setEditForm({...editForm, merk: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Jenis Unit</label>
                      <input type="text" value={editForm.jenisUnit || ''} onChange={(e) => setEditForm({...editForm, jenisUnit: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Tipe Unit</label>
                      <input type="text" value={editForm.tipeUnit || ''} onChange={(e) => setEditForm({...editForm, tipeUnit: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Tahun Pembuatan</label>
                      <input type="number" value={editForm.tahunPembuatan || ''} onChange={(e) => setEditForm({...editForm, tahunPembuatan: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                  </div>
                </div>

                {/* 3. Operasional & Lokasi */}
                <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-[#E58032] mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Operasional & Lokasi</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Departemen</label>
                      <input type="text" value={editForm.departemen || ''} onChange={(e) => setEditForm({...editForm, departemen: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Section</label>
                      <input type="text" value={editForm.section || ''} onChange={(e) => setEditForm({...editForm, section: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Area</label>
                      <input type="text" value={editForm.area || ''} onChange={(e) => setEditForm({...editForm, area: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Lokasi</label>
                      <input type="text" value={editForm.lokasi || ''} onChange={(e) => setEditForm({...editForm, lokasi: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Rute</label>
                      <input type="text" value={editForm.rute || ''} onChange={(e) => setEditForm({...editForm, rute: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">User Tujuan</label>
                      <input type="text" value={editForm.userTujuan || ''} onChange={(e) => setEditForm({...editForm, userTujuan: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">By Job</label>
                      <input type="text" value={editForm.byJob || ''} onChange={(e) => setEditForm({...editForm, byJob: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">By Type</label>
                      <input type="text" value={editForm.byType || ''} onChange={(e) => setEditForm({...editForm, byType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                  </div>
                </div>

                {/* 4. Kepemilikan & Kontrak */}
                <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-[#E58032] mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Kepemilikan & Kontrak</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nama Pemilik</label>
                      <input type="text" value={editForm.namaPemilik || ''} onChange={(e) => setEditForm({...editForm, namaPemilik: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Supplier</label>
                      <input type="text" value={editForm.supplier || ''} onChange={(e) => setEditForm({...editForm, supplier: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Legalitas</label>
                      <input type="text" value={editForm.legalitasActive || ''} onChange={(e) => setEditForm({...editForm, legalitasActive: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nomor Kontrak</label>
                      <input type="text" value={editForm.nomorKontrak || ''} onChange={(e) => setEditForm({...editForm, nomorKontrak: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Awal Kontrak</label>
                      <div className="relative flex items-center">
                        <input type="text" value={editForm.awalKontrak || ''} onChange={(e) => setEditForm({...editForm, awalKontrak: e.target.value})} placeholder="DD-MMM-YY" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                        <div className="absolute right-2 w-5 h-5 flex items-center justify-center overflow-hidden">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <input type="date" className="absolute right-0 top-0 opacity-0 cursor-pointer w-8 h-full" onChange={(e) => { if(e.target.value) setEditForm({...editForm, awalKontrak: formatDateToDDMMMYY(e.target.value)}) }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Akhir Kontrak</label>
                      <div className="relative flex items-center">
                        <input type="text" value={editForm.akhirKontrak || ''} onChange={(e) => setEditForm({...editForm, akhirKontrak: e.target.value})} placeholder="DD-MMM-YY" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                        <div className="absolute right-2 w-5 h-5 flex items-center justify-center overflow-hidden">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <input type="date" className="absolute right-0 top-0 opacity-0 cursor-pointer w-8 h-full" onChange={(e) => { if(e.target.value) setEditForm({...editForm, akhirKontrak: formatDateToDDMMMYY(e.target.value)}) }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Harga</label>
                      <input type="text" value={editForm.harga || ''} onChange={(e) => setEditForm({...editForm, harga: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Stiker Access Expired</label>
                      <div className="relative flex items-center">
                        <input type="text" value={editForm.kalenderExpiredAccessSticker || ''} onChange={(e) => setEditForm({...editForm, kalenderExpiredAccessSticker: e.target.value})} placeholder="DD-MMM-YY" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                        <div className="absolute right-2 w-5 h-5 flex items-center justify-center overflow-hidden">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <input type="date" className="absolute right-0 top-0 opacity-0 cursor-pointer w-8 h-full" onChange={(e) => { if(e.target.value) setEditForm({...editForm, kalenderExpiredAccessSticker: formatDateToDDMMMYY(e.target.value)}) }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Fuel & Kelengkapan */}
                <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-[#E58032] mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">BBM & Kelengkapan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Fuel Ratio (Lama)</label>
                      <input type="text" value={editForm.fuelRatioByKontrak || ''} onChange={(e) => setEditForm({...editForm, fuelRatioByKontrak: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Fuel Ratio (Terbaru)</label>
                      <input type="text" value={editForm.fuelRatioByKontrakTerbaru || ''} onChange={(e) => setEditForm({...editForm, fuelRatioByKontrakTerbaru: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Shift</label>
                      <input type="text" value={editForm.shift || ''} onChange={(e) => setEditForm({...editForm, shift: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Overtime</label>
                      <input type="text" value={editForm.overtime || ''} onChange={(e) => setEditForm({...editForm, overtime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Status GPS</label>
                      <input type="text" value={editForm.gps || ''} onChange={(e) => setEditForm({...editForm, gps: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-all" />
                    </div>
                  </div>
                </div>

              </div>
              <div className="bg-white border-t border-slate-100 px-6 py-4 flex justify-end shrink-0">
                <button type="submit" disabled={isSaving} className="bg-[#052334] hover:bg-[#083b57] text-white px-8 py-2 rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50">
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styling untuk Custom Scrollbar agar tabel lebih rapi */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </>
  );
};

export default DataSaranaPage;
