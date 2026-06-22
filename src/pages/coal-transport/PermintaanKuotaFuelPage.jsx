import { useState, useRef, useEffect } from 'react';
import { Fuel, Search, Filter, Download, Plus, MapPin, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../api/axios';

const dummyData = [
  {
    id: 1,
    codeUnit: 'DT-001',
    jenisUnit: 'Dump Truck',
    tipeUnit: 'Hino 500',
    section: 'Operation',
    noPolisi: 'DA 1234 AB',
    awalKontrak: '01/01/2026',
    akhirKontrak: '31/12/2026',
    ratio: '1:3',
    planJarak: '5000',
    permintaanKuota: '1500',
    planKuotaHari: '50',
    kartuKuota: '50',
    noId: 'ID-001',
    sapCode: 'SAP-1001',
    tempatRefueling: 'Fuel Station A'
  },
  {
    id: 2,
    codeUnit: 'EX-005',
    jenisUnit: 'Excavator',
    tipeUnit: 'PC 200',
    section: 'Mining',
    noPolisi: '-',
    awalKontrak: '15/02/2026',
    akhirKontrak: '15/02/2027',
    ratio: '1:5',
    planJarak: '2000',
    permintaanKuota: '400',
    planKuotaHari: '13',
    kartuKuota: '13',
    noId: 'ID-002',
    sapCode: 'SAP-1002',
    tempatRefueling: 'Mobile Refueler'
  }
];

const PermintaanKuotaFuelPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [daysInMonth, setDaysInMonth] = useState(30);
  const [dataList, setDataList] = useState([]);
  const fileInputRef = useRef(null);

  const fetchQuotas = async () => {
    try {
      const res = await api.get('/coal-transport/fuel-quotas');
      // format response to match table columns
      const formatted = res.data.map((item, index) => ({
        id: item.id,
        codeUnit: item.unit?.no_lambung || '-',
        jenisUnit: item.unit?.jenis_unit || '-',
        tipeUnit: item.unit?.tipe_unit || '-',
        section: item.unit?.section || '-',
        noPolisi: item.unit?.no_polisi || '-',
        awalKontrak: item.unit?.awal_kontrak || '-',
        akhirKontrak: item.unit?.akhir_kontrak || '-',
        ratio: item.ratio ? parseFloat(item.ratio).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : (item.unit?.fuel_ratio_kontrak_lama || '-'),
        planJarak: item.plan_jarak ? parseFloat(item.plan_jarak).toLocaleString('id-ID') : '0',
        rawPermintaanKuota: item.permintaan_kuota || 0,
        permintaanKuota: item.permintaan_kuota ? Math.round(item.permintaan_kuota).toLocaleString('id-ID') : '0',
        kartuKuota: item.kartu_kuota ? parseFloat(item.kartu_kuota).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0',
        noId: item.no_id || '-',
        sapCode: item.sap_code || '-',
        tempatRefueling: item.tempat_refueling || '-'
      }));
      setDataList(formatted);
    } catch (err) {
      console.error('Failed to fetch quotas', err);
    }
  };

  useEffect(() => {
    fetchQuotas();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const importedJson = XLSX.utils.sheet_to_json(ws);
      
      if (importedJson && importedJson.length > 0) {
        const getVal = (row, keywords) => {
          const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase())));
          return key ? row[key] : null;
        };

        const payload = importedJson.map((row) => ({
          codeUnit: getVal(row, ['Code Unit', 'No Lambung', 'CodeUnit']) || '-',
          ratio: getVal(row, ['Ratio', 'Rasio']) || null,
          plan_jarak: getVal(row, ['Plan Jarak', 'Jarak Tempuh']) || '0',
          permintaan_kuota: getVal(row, ['Permintaan', 'Permintaan Kuota', 'Permintaan Kouta']) || '0',
          plan_kuota_hari: getVal(row, ['Plan Kuota', 'Plan Kouta', 'Plan Hari']) || '0',
          kartu_kuota: getVal(row, ['Kartu', 'Karttu', 'Katu']) || '0',
          no_id: getVal(row, ['No ID', 'Noid', 'No Id']) || '-',
          sap_code: getVal(row, ['SAP Code', 'SAP', 'Sapcode']) || '-',
          tempat_refueling: getVal(row, ['Tempat', 'Refueling']) || '-',
          days_in_month: daysInMonth
        }));
        
        api.post('/coal-transport/fuel-quotas/bulk', payload)
          .then(res => {
            alert(`Berhasil import ${res.data.count} data kuota fuel!`);
            fetchQuotas();
          })
          .catch(err => {
            console.error(err);
            alert('Gagal mengimport kuota fuel. Pastikan Sarana sudah ada di database.');
          });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset
  };

  const filteredData = dataList.filter(item => 
    item.codeUnit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.jenisUnit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#052334] flex items-center gap-3">
            <Fuel className="w-7 h-7 text-[#3298A0]" />
            Permintaan Kuota Fuel Sarana
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Data rencana jarak tempuh dan manajemen permintaan kuota bahan bakar per unit sarana.
          </p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm text-slate-500 font-medium">Pembagi:</span>
            <select 
              value={daysInMonth}
              onChange={(e) => setDaysInMonth(parseInt(e.target.value))}
              className="px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 shadow-sm cursor-pointer"
            >
              <option value={28}>28 Hari</option>
              <option value={29}>29 Hari</option>
              <option value={30}>30 Hari</option>
              <option value={31}>31 Hari</option>
            </select>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#3298A0] text-white rounded-lg text-sm font-bold hover:bg-[#248B96] transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Tambah Data
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari Code Unit, Jenis, atau Section..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            <Filter className="w-4 h-4" />
            Filter Lanjutan
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr>
                {["No", "Code Unit", "Jenis Unit", "Tipe Unit", "Section", "No Polisi", "Awal Kontrak", "Akhir Kontrak", "Ratio", "Plan Jarak Tempuh (Km/Bulan)", "Permintaan Kuota Fuel (Ltr/Bulan)", "Plan Kuota Fuel (Ltr/Hari)", "Kartu Kuota Fuel (Ltr/Hari)", "No ID", "SAP Code", "Tempat Refueling"].map((head, idx) => (
                  <th key={idx} className="bg-slate-100 border-y border-r last:border-r-0 border-slate-200 px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap sticky top-0">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="16" className="px-4 py-12 text-center text-slate-500 text-sm">
                    Data tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-500 text-center">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-bold text-[#052334] bg-slate-50/50">{row.codeUnit}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.jenisUnit}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.tipeUnit}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-medium">{row.section}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.noPolisi}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{row.awalKontrak}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{row.akhirKontrak}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-600 text-center bg-slate-50/50">{row.ratio}</td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right">{row.planJarak}</td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right">{row.permintaanKuota}</td>
                    <td className="px-4 py-3 text-sm font-bold text-orange-600 text-right">
                      {Math.round(row.rawPermintaanKuota / daysInMonth).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-[#3298A0] text-right">{row.kartuKuota}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{row.noId}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{row.sapCode}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {row.tempatRefueling}
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

export default PermintaanKuotaFuelPage;
