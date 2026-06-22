import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ClipboardList, Calendar, CheckCircle, XCircle, ChevronDown, 
  Send, User as UserIcon, MapPin, Truck, AlertTriangle, Image as ImageIcon, Camera, Settings, ArrowLeft, Loader2, Printer
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import P2HPrintTemplate from '../../components/coal-transport/P2HPrintTemplate';

// 19 Item Checklist
const checklistItems = [
  "BAN, VELG & BAUT RODA",
  "OLI MESIN (ENGINE OIL)",
  "AIR RADIATOR",
  "APAR",
  "SABUK PENGAMAN (SEAT BELT DRIVER)",
  "SABUK PENGAMAN (SEAT BELT PENUMPANG)",
  "SPION",
  "KLAKSON & ALARM MUNDUR",
  "PANEL KONTROL (SPEEDOMETER, FUEL INDICATOR, DLL)",
  "BRAKE SYSTEM",
  "STREERING SYSTEM",
  "LAMPU - LAMPU (KERJA, STROBE, SIGN, DLL)",
  "BATTERY",
  "AIR CONDITIONER (AC)",
  "WIPER",
  "V-BELT",
  "KACA DEPAN SAMPING",
  "BUGGY WHIP 4 M",
  "SYSTEM 4WD"
];

// 4 Kriteria Pemeriksaan
const checkTypes = [
  "Kondisi yang tidak normal",
  "Kebocoran (oli, air, udara)",
  "Check level",
  "Check fungsi"
];

// Komponen Input Header Custom (Diekstrak ke luar agar tidak remount terus-menerus)
const HeaderInput = ({ label, field, type = 'text', placeholder, value, onChange }) => (
  <div className="flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#3298A0]/30 focus-within:border-[#3298A0] transition-all">
    <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    </div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      className="w-full px-3 py-2 text-sm text-slate-500 font-medium focus:outline-none bg-slate-100 cursor-not-allowed"
      placeholder={placeholder}
      disabled
    />
  </div>
);

const DetailApprovalP2HPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbStatus, setDbStatus] = useState('PENDING_REVIEW');
  const [gambarUrl, setGambarUrl] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);

  // State Header
  const [headerData, setHeaderData] = useState({
    tanggal: '', noLambung: '', lokasiParkir: '',
    shift: '', jenisUnit: '', areaKerja: '',
    namaDriver: localStorage.getItem('userName') || '', kmAwal: '', expStiker: '',
    nrpDriver: '', kmAkhir: '',
    supplier: '', noPolisi: ''
  });

  // Authenticate role
  const userRole = localStorage.getItem('userRole') || 'USER';
  const isPengawas = ['ADMIN', 'ADMIN_TRANSPORT', 'USER'].includes(userRole);

  // State Matrix Checklist
  // Format: matrix[checkTypeIndex][itemIndex] = 'V' | 'X' | ''
  const [matrix, setMatrix] = useState(() => {
    const init = {};
    checkTypes.forEach((_, tIdx) => {
      init[tIdx] = {};
      checklistItems.forEach((_, iIdx) => {
        init[tIdx][iIdx] = 'V'; // Default V (Tidak bermasalah)
      });
    });
    return init;
  });

  // State Bugar Selamat
  const [jamIstirahat, setJamIstirahat] = useState('>=6');
  const [bugarChecks, setBugarChecks] = useState({
    obat: false,
    masalah: false,
    sehat: false,
    psm: false,
    keluarDomisili: ''
  });

  // State P5M & Keputusan
  const [isiP5m, setIsiP5m] = useState('');
  const [driverSiap, setDriverSiap] = useState('siap');
  const [keputusanAkhir, setKeputusanAkhir] = useState('layak');

  // State Signatures
  const [ttd, setTtd] = useState({
    namaDriver: '', nrpDriver: '',
    namaPengawas: localStorage.getItem('userName') || '', nrpPengawas: '',
    keterangan: ''
  });

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await api.get(`/coal-transport/p2h/${id}`);
        const data = response.data.data;

        // Set Header
        setHeaderData({
          tanggal: data.tanggal ? data.tanggal.split('T')[0] : '',
          noLambung: data.no_lambung || '',
          lokasiParkir: data.lokasi_parkir || '',
          shift: data.shift || '',
          jenisUnit: data.jenis_unit || '',
          areaKerja: data.area_kerja || '',
          namaDriver: data.nama_driver || '',
          nrpDriver: data.nrp_driver || '',
          kmAwal: data.km_awal || '',
          kmAkhir: data.km_akhir || '',
          supplier: data.supplier || '',
          noPolisi: data.no_polisi || '',
          expStiker: data.exp_stiker ? data.exp_stiker.split('T')[0] : ''
        });

        // Set Matrix
        if (data.matrix_checklist) {
          setMatrix(typeof data.matrix_checklist === 'string' ? JSON.parse(data.matrix_checklist) : data.matrix_checklist);
        }

        // Set Bugar Sehat
        setJamIstirahat(data.jam_istirahat || '>=6');
        if (data.bugar_sehat) {
          setBugarChecks(typeof data.bugar_sehat === 'string' ? JSON.parse(data.bugar_sehat) : data.bugar_sehat);
        }

        // Set P5M
        setIsiP5m(data.isi_p5m || '');
        setDriverSiap(data.driver_siap || 'siap');

        // Set Pengawas info
        setKeputusanAkhir(data.keputusan_akhir || 'layak');
        setTtd(prev => ({
          ...prev,
          namaDriver: data.nama_driver || '',
          nrpDriver: data.nrp_driver || '',
          namaPengawas: data.nama_pengawas || prev.namaPengawas,
          nrpPengawas: data.nrp_pengawas || '',
          keterangan: data.keterangan_pengawas || ''
        }));

        setDbStatus(data.status);
        if (data.gambar_url) {
          setGambarUrl(`https://86ce88096edf1bc9-182-8-130-249.serveousercontent.com${data.gambar_url}`); // Assumes backend runs on 5000 and serves statically
        }
        if (data.latitude && data.longitude) {
          setGpsLocation({ lat: data.latitude, lng: data.longitude });
        }
      } catch (error) {
        console.error('Error fetching P2H detail:', error);
        Swal.fire('Error', 'Gagal mengambil data P2H dari server', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleHeaderChange = (field, value) => {
    setHeaderData(prev => ({ ...prev, [field]: value }));
  };

  const handleMatrixChange = (tIdx, iIdx, value) => {
    setMatrix(prev => ({
      ...prev,
      [tIdx]: {
        ...prev[tIdx],
        [iIdx]: value
      }
    }));
  };

  const handleBugarCheck = (field) => {
    setBugarChecks(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleTtdChange = (field, value) => {
    setTtd(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        keputusan_akhir: keputusanAkhir,
        nama_pengawas: ttd.namaPengawas,
        nrp_pengawas: ttd.nrpPengawas,
        keterangan_pengawas: ttd.keterangan,
        status: keputusanAkhir === 'layak' ? 'APPROVED' : 'REJECTED'
      };

      await api.put(`/coal-transport/p2h/${id}/review`, payload);

      Swal.fire({
        title: 'Approval Tersimpan!',
        text: `Keputusan untuk P2H ${headerData.noLambung} berhasil disimpan.`,
        icon: 'success',
        confirmButtonColor: '#3298A0'
      }).then(() => {
        navigate('/coal/data-p2h');
      });
    } catch (error) {
      console.error('Error reviewing P2H:', error);
      Swal.fire('Gagal!', 'Terjadi kesalahan saat menyimpan review P2H.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto pb-12 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4 text-[#3298A0]">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="font-bold tracking-wider">Memuat Detail P2H...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-7xl mx-auto pb-12 print:hidden">
      {/* Top Navigation */}
      <button 
        onClick={() => navigate('/coal/data-p2h')}
        className="flex items-center gap-2 text-slate-500 hover:text-[#3298A0] transition-colors font-bold text-sm mb-6 print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Data P2H
      </button>

      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center items-start gap-3">
            <h1 className="text-xl md:text-2xl font-black text-[#052334] flex items-start sm:items-center gap-2 sm:gap-3 leading-tight">
              <ClipboardList className="w-6 h-6 md:w-7 md:h-7 shrink-0 text-[#3298A0] mt-0.5 sm:mt-0" />
              <span>Review Dokumen P2H: <span className="text-[#3298A0]">{id ? id.substring(0,8).toUpperCase() : 'P2H'}</span></span>
            </h1>
            <span className={`px-3 py-1 text-[11px] md:text-xs whitespace-nowrap font-bold rounded-full border ${
              dbStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
              dbStatus === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' :
              'bg-amber-100 text-amber-700 border-amber-200'
            }`}>
              {dbStatus === 'APPROVED' ? 'Disetujui' : dbStatus === 'REJECTED' ? 'Ditolak' : 'Menunggu Review'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Formulir ini dikirimkan oleh driver. Silakan periksa matrix dan isi keputusan Anda di bawah.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#052334] text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all print:hidden"
        >
          <Printer className="w-4 h-4" />
          CETAK PDF
        </button>
      </div>

      <div id="p2h-document" className="pb-4">
      {/* ================= SECTION 1: HEADER INFORMASI ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-3 bg-[#052334] text-white flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#3298A0]" />
          <h2 className="text-sm font-bold tracking-wide">INFORMASI UNIT & DRIVER</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-4">
              <HeaderInput label="Hari / Tanggal" field="tanggal" type="date" value={headerData.tanggal} onChange={handleHeaderChange} />
              <HeaderInput label="Shift" field="shift" placeholder="Cth: Shift 1" value={headerData.shift} onChange={handleHeaderChange} />
              <HeaderInput label="Nama Driver" field="namaDriver" placeholder="Nama lengkap" value={headerData.namaDriver} onChange={handleHeaderChange} />
              <HeaderInput label="NRP Driver" field="nrpDriver" placeholder="NRP Driver" value={headerData.nrpDriver} onChange={handleHeaderChange} />
              <HeaderInput label="Supplier" field="supplier" placeholder="Nama Supplier" value={headerData.supplier} onChange={handleHeaderChange} />
            </div>
            <div className="space-y-4">
              <HeaderInput label="No Lambung" field="noLambung" placeholder="Cth: DT-001" value={headerData.noLambung} onChange={handleHeaderChange} />
              <HeaderInput label="Jenis Unit" field="jenisUnit" placeholder="Cth: Dump Truck" value={headerData.jenisUnit} onChange={handleHeaderChange} />
              <HeaderInput label="No Polisi" field="noPolisi" placeholder="KT 1234 XX" value={headerData.noPolisi} onChange={handleHeaderChange} />
              <HeaderInput label="Lokasi Parkir" field="lokasiParkir" placeholder="Lokasi Parkir" value={headerData.lokasiParkir} onChange={handleHeaderChange} />
              <HeaderInput label="Area Kerja" field="areaKerja" placeholder="Cth: PIT A" value={headerData.areaKerja} onChange={handleHeaderChange} />
            </div>
            <div className="space-y-4">
              <HeaderInput label="Exp Stiker Adaro" field="expStiker" type="date" value={headerData.expStiker} onChange={handleHeaderChange} />
              <HeaderInput label="KM Awal" field="kmAwal" type="number" placeholder="0" value={headerData.kmAwal} onChange={handleHeaderChange} />
              <HeaderInput label="KM Akhir" field="kmAkhir" type="number" placeholder="0" value={headerData.kmAkhir} onChange={handleHeaderChange} />
              <HeaderInput label="Jarak Tempuh" field="jarakTempuh" type="number" placeholder="0" value={((parseFloat(headerData.kmAkhir) || 0) > (parseFloat(headerData.kmAwal) || 0)) ? ((parseFloat(headerData.kmAkhir) || 0) - (parseFloat(headerData.kmAwal) || 0)) : 0} onChange={() => {}} />
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION 2: MATRIX PEMERIKSAAN ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-4 py-3 bg-[#052334] text-white flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#3298A0] shrink-0" />
            <h2 className="text-sm font-bold tracking-wide leading-tight">ITEM PEMERIKSAAN SARANA</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1"><span className="text-emerald-400">V</span> : Tidak Bermasalah</span>
            <span className="flex items-center gap-1"><span className="text-red-400">X</span> : Bermasalah</span>
          </div>
        </div>
        
        {/* DESKTOP VIEW (Table) */}
        <div className="hidden lg:block overflow-x-auto custom-scrollbar p-0">
          <table className="w-full border-collapse min-w-max text-sm">
            <tbody>
              <tr>
                <td rowSpan={5} className="bg-slate-50 border border-slate-300 p-4 text-left w-64 min-w-[220px] md:sticky relative md:left-0 z-10 md:z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)] align-top">
                  <div className="text-[11px] font-bold text-[#052334] uppercase mb-1">BERI TANDA :</div>
                  <div className="text-xs text-slate-600 mb-6">
                    <span className="font-bold">V</span> : Tidak bermasalah<br/>
                    <span className="font-bold">X</span> : Bermasalah
                  </div>
                  <div className="text-[11px] font-bold text-[#052334] uppercase mb-1">KODE PEMERIKSAAN</div>
                  <div className="text-xs font-medium text-slate-600">
                    <span className="font-bold text-emerald-600">A</span> : Boleh Dijalankan<br/>
                    <span className="font-bold text-red-600">AA</span> : Stop (Jangan Operasi)
                  </div>
                </td>
                <td className="bg-slate-50 border border-slate-300 p-2 text-left font-bold text-[11px] text-[#052334] uppercase min-w-[150px] sticky left-0 md:left-[220px] z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  ITEM
                </td>
                {checklistItems.map((item, idx) => (
                  <td key={idx} className="bg-slate-50 border border-slate-300 p-2 text-center align-top max-w-[100px] whitespace-normal">
                    <span className="text-[10px] font-bold text-[#052334] leading-tight block">{item}</span>
                  </td>
                ))}
              </tr>
              {checkTypes.map((checkLabel, tIdx) => (
                <tr key={tIdx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="bg-white border border-slate-300 p-2 text-xs font-medium text-slate-700 sticky left-0 md:left-[220px] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    {checkLabel}
                  </td>
                  {checklistItems.map((_, iIdx) => {
                    const val = matrix[tIdx][iIdx];
                    return (
                      <td key={iIdx} className="border border-slate-300 p-1 text-center bg-slate-50/50">
                        <select
                          value={val}
                          disabled
                          className={`w-full text-center appearance-none text-xs font-bold py-1 px-2 rounded cursor-not-allowed focus:outline-none ${
                            val === 'V' 
                              ? 'text-[#052334] bg-transparent' 
                              : val === 'X' || val === 'AA'
                                ? 'text-red-600 bg-transparent'
                              : val === 'A'
                                ? 'text-emerald-600 bg-transparent'
                                : 'text-slate-400 bg-transparent'
                          }`}
                        >
                          <option value="V">V</option>
                          <option value="X">X</option>
                          <option value="A">A</option>
                          <option value="AA">AA</option>
                          <option value="">-</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW (Cards) Detail */}
        <div className="block lg:hidden bg-slate-50 p-4 space-y-3">
          {checklistItems.map((item, iIdx) => {
            const hasIssue = checkTypes.some((_, tIdx) => matrix[tIdx][iIdx] === 'X' || matrix[tIdx][iIdx] === 'AA');
            return (
              <div key={iIdx} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${hasIssue ? 'border-red-300' : 'border-slate-200'}`}>
                <div className={`px-4 py-2.5 flex justify-between items-center ${hasIssue ? 'bg-red-50' : 'bg-slate-50 border-b border-slate-200'}`}>
                  <span className={`text-xs font-bold leading-tight pr-4 ${hasIssue ? 'text-red-700' : 'text-[#052334]'}`}>
                    {iIdx + 1}. {item}
                  </span>
                  {hasIssue ? (
                    <span className="shrink-0 bg-red-100 text-red-700 p-1 rounded-full"><AlertTriangle className="w-3.5 h-3.5" /></span>
                  ) : (
                    <span className="shrink-0 bg-emerald-100 text-emerald-700 p-1 rounded-full"><CheckCircle className="w-3.5 h-3.5" /></span>
                  )}
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {checkTypes.map((checkLabel, tIdx) => {
                    const val = matrix[tIdx][iIdx];
                    return (
                      <div key={tIdx} className="bg-slate-50 border border-slate-100 p-2 rounded-lg flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-tight mb-1">{checkLabel}</span>
                        <span className={`text-xs font-black inline-block px-2 py-0.5 rounded text-center ${
                          val === 'V' || val === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= SECTION 3: BUGAR SELAMAT ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-3 bg-[#052334] text-white flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#3298A0]" />
          <h2 className="text-sm font-bold tracking-wide">CHECKLIST BUGAR SELAMAT</h2>
        </div>
        <div className="p-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Pernyataan Driver</p>
          
          <div className="mb-6">
            <p className="text-sm font-bold text-[#052334] mb-3">1. Telah beristirahat sebelum awal shift selama:</p>
            <select value={jamIstirahat} disabled className="px-3 py-2 border border-slate-200 rounded text-sm font-bold text-slate-500 focus:outline-none bg-slate-100 cursor-not-allowed appearance-none">
              <option value=">=6">&ge; 6 Jam</option>
              <option value="5">5 Jam</option>
              <option value="<5">&lt; 5 Jam</option>
            </select>
          </div>

          <div className="space-y-3">
            {[
              { id: 'obat', label: '2. Tidak konsumsi obat penyebab ngantuk' },
              { id: 'masalah', label: '3. Tidak ada masalah pribadi' },
              { id: 'sehat', label: '4. Sehat & fit' },
              { id: 'psm', label: '5. Sudah dilakukan PSM' }
            ].map(item => (
              <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={bugarChecks[item.id]} 
                  disabled
                  className="w-4 h-4 text-[#3298A0] border-slate-300 rounded focus:ring-[#3298A0] cursor-not-allowed" 
                />
                <span className="text-sm font-bold text-[#052334] transition-colors">{item.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 border-t pt-4">
            <p className="text-sm font-bold text-[#052334] mb-3">6. Apakah kemarin off dan melakukan perjalanan keluar kabupaten domisili (Tabalong, Balangan Dan Bartim) ?</p>
            <div className="space-y-3 pl-4">
              <label className="flex items-center gap-3 cursor-not-allowed group">
                <input 
                  type="radio" 
                  checked={bugarChecks.keluarDomisili === 'Ya'} 
                  disabled
                  className="w-4 h-4 text-[#3298A0] border-slate-300 focus:ring-[#3298A0] cursor-not-allowed" 
                />
                <span className="text-sm font-bold text-[#052334] transition-colors">Ya</span>
              </label>
              <label className="flex items-center gap-3 cursor-not-allowed group">
                <input 
                  type="radio" 
                  checked={bugarChecks.keluarDomisili === 'Tidak'} 
                  disabled
                  className="w-4 h-4 text-[#3298A0] border-slate-300 focus:ring-[#3298A0] cursor-not-allowed" 
                />
                <span className="text-sm font-bold text-[#052334] transition-colors">Tidak</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION 4: ISI P5M & KEPUTUSAN ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-100 border-b border-slate-200">
            <h2 className="text-sm font-bold text-[#052334] tracking-wide text-center">ISI P5M</h2>
          </div>
          <div className="p-4">
            <textarea
              value={isiP5m}
              disabled
              rows={4}
              className="w-full px-4 py-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-sm focus:outline-none cursor-not-allowed resize-none"
              placeholder="Driver tidak mengisi catatan P5M..."
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#052334] tracking-wide">KESIAPAN DRIVER</h2>
          </div>
          <div className={`p-6 flex-grow flex flex-col justify-center space-y-4`}>
            {dbStatus !== 'PENDING_REVIEW' ? (
              <div className={`p-4 border rounded-xl flex items-center gap-4 ${driverSiap === 'siap' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                {driverSiap === 'siap' ? <CheckCircle className="w-8 h-8 text-emerald-500" /> : <AlertTriangle className="w-8 h-8 text-red-500" />}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status Kesiapan</p>
                  <p className={`text-sm font-bold ${driverSiap === 'siap' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {driverSiap === 'siap' ? 'Driver siap bekerja' : 'Driver tidak siap bekerja, wajib lapor ke koordinator'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <label className={`flex items-center gap-3 cursor-pointer group p-3 border rounded-lg transition-colors hover:bg-emerald-50 hover:border-emerald-200`}>
                  <input type="radio" name="driverSiap" value="siap" checked={driverSiap === 'siap'} onChange={() => setDriverSiap('siap')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">Driver siap bekerja</span>
                </label>
                <label className={`flex items-start gap-3 cursor-pointer group p-3 border rounded-lg transition-colors hover:bg-red-50 hover:border-red-200`}>
                  <input type="radio" name="driverSiap" value="tidak_siap" checked={driverSiap === 'tidak_siap'} onChange={() => setDriverSiap('tidak_siap')} className="w-4 h-4 mt-0.5 text-red-600 focus:ring-red-600" />
                  <span className="text-sm font-bold text-red-700 leading-tight">Driver tidak siap bekerja, wajib lapor ke koordinator lapangan dan tidak diijinkan mengemudi</span>
                </label>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================= SECTION 5: FINAL KEPUTUSAN & SIGNATURE ================= */}
      {dbStatus !== 'PENDING_REVIEW' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6 relative group">
          {/* Watermark / Stamp */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] rotate-[-12deg] pointer-events-none text-8xl font-black transition-transform duration-500 group-hover:scale-110 ${dbStatus === 'APPROVED' ? 'text-emerald-600' : 'text-red-600'}`}>
            {dbStatus === 'APPROVED' ? 'APPROVED' : 'REJECTED'}
          </div>
          
          <div className={`px-6 py-4 border-b flex items-center justify-between z-10 relative ${dbStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <h2 className={`text-sm font-bold tracking-wide flex items-center gap-2 ${dbStatus === 'APPROVED' ? 'text-emerald-800' : 'text-red-800'}`}>
              <CheckCircle className="w-5 h-5" />
              DOKUMEN FINAL - KEPUTUSAN PENGAWAS
            </h2>
            <span className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-widest ${dbStatus === 'APPROVED' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(5,150,105,0.4)]' : 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'}`}>
              {dbStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 relative z-10 bg-white/80 backdrop-blur-sm">
            <div className="p-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Keputusan Akhir</p>
              <p className={`text-xl font-black uppercase tracking-wide ${keputusanAkhir === 'layak' ? 'text-emerald-600' : 'text-red-600'}`}>
                {keputusanAkhir === 'layak' ? 'Layak Operasi' : 'Tidak Layak'}
              </p>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Disahkan Oleh</p>
              <p className="text-base font-black text-[#052334] mb-0.5">{ttd.namaPengawas || '-'}</p>
              <p className="text-xs font-bold text-[#3298A0] font-mono">NRP: {ttd.nrpPengawas || '-'}</p>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Driver / Operator</p>
              <p className="text-base font-black text-[#052334] mb-0.5">{ttd.namaDriver || '-'}</p>
              <p className="text-xs font-bold text-[#3298A0] font-mono">NRP: {ttd.nrpDriver || '-'}</p>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Catatan Khusus</p>
              <p className="text-sm font-medium text-slate-600 italic">
                {ttd.keterangan ? `"${ttd.keterangan}"` : 'Tidak ada catatan.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            
            {/* Kolom 1: Keputusan Final */}
            <div className={`p-5 flex flex-col justify-center space-y-4`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Keputusan Akhir</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="keputusanAkhir" value="layak" checked={keputusanAkhir === 'layak'} onChange={() => setKeputusanAkhir('layak')} disabled={!isPengawas} className="w-4 h-4 text-emerald-600 focus:ring-emerald-600 disabled:opacity-50" />
                <span className="text-sm font-bold text-emerald-700">Layak dioperasikan</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="keputusanAkhir" value="tidak_layak" checked={keputusanAkhir === 'tidak_layak'} onChange={() => setKeputusanAkhir('tidak_layak')} disabled={!isPengawas} className="w-4 h-4 text-red-600 focus:ring-red-600 disabled:opacity-50" />
                <span className="text-sm font-bold text-red-700">Tidak layak dioperasikan</span>
              </label>
            </div>

            {/* Kolom 2: TTD Driver */}
            <div className="p-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Tanda Tangan Driver</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nama Driver</label>
                  <input type="text" value={ttd.namaDriver} disabled className="w-full px-3 py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded text-sm focus:outline-none cursor-not-allowed" placeholder="Ketik nama untuk TTD" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">NRP Driver</label>
                  <input type="text" value={ttd.nrpDriver} disabled className="w-full px-3 py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded text-sm focus:outline-none cursor-not-allowed" placeholder="NRP Driver" />
                </div>
              </div>
            </div>

            {/* Kolom 3: TTD Pengawas */}
            <div className="p-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Tanda Tangan Pengawas</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nama Pengawas</label>
                  <input type="text" value={ttd.namaPengawas} onChange={(e) => handleTtdChange('namaPengawas', e.target.value)} disabled={!isPengawas} className={`w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#3298A0] bg-slate-50 disabled:cursor-not-allowed`} placeholder="Ketik nama untuk TTD" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">NRP Pengawas</label>
                  <input type="text" value={ttd.nrpPengawas} onChange={(e) => handleTtdChange('nrpPengawas', e.target.value)} disabled={!isPengawas} className={`w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#3298A0] bg-slate-50 disabled:cursor-not-allowed`} placeholder="NRP Pengawas" />
                </div>
              </div>
            </div>

            {/* Kolom 4: Keterangan */}
            <div className="p-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Keterangan Tambahan</p>
              <textarea
                value={ttd.keterangan}
                onChange={(e) => handleTtdChange('keterangan', e.target.value)}
                disabled={!isPengawas}
                rows={4}
                className={`w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#3298A0] resize-none bg-slate-50 disabled:cursor-not-allowed`}
                placeholder="Tulis catatan temuan di sini..."
              />
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ================= SECTION 6: UPLOAD & SUBMIT ================= */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 print:hidden">
        <div className="flex-1 w-full flex flex-col md:flex-row gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lampiran Gambar Absensi/Kondisi</label>
            <div className="flex items-center gap-3">
              {gambarUrl ? (
                <a 
                  href={gambarUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-[#3298A0] hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <ImageIcon className="w-4 h-4" />
                  Lihat Lampiran Driver
                </a>
              ) : (
                <>
                  <button disabled className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-400 cursor-not-allowed">
                    <ImageIcon className="w-4 h-4" />
                    Lihat Lampiran Driver
                  </button>
                  <span className="text-xs text-slate-500 italic">Gambar tidak tersedia</span>
                </>
              )}
            </div>
          </div>

          {userRole !== 'DRIVER' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lokasi GPS Saat Submit</label>
              <div className="flex items-center gap-3">
                {gpsLocation ? (
                  <a 
                    href={`https://www.google.com/maps?q=${gpsLocation.lat},${gpsLocation.lng}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-[#3298A0] hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    Buka di Google Maps
                  </a>
                ) : (
                  <>
                    <button disabled className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-400 cursor-not-allowed">
                      <MapPin className="w-4 h-4" />
                      Buka di Google Maps
                    </button>
                    <span className="text-xs text-slate-500 italic">Lokasi GPS tidak tersedia</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {dbStatus === 'PENDING_REVIEW' && isPengawas ? (
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full md:w-auto px-8 py-3.5 ${isSubmitting ? 'bg-slate-400' : 'bg-[#3298A0] hover:bg-[#248B96]'} text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-[#3298A0]/30 flex items-center justify-center gap-2`}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> MENYIMPAN...</>
            ) : (
              <><Send className="w-4 h-4" /> SIMPAN KEPUTUSAN APPROVAL</>
            )}
          </button>
        ) : (
          <button 
            onClick={() => navigate('/coal/data-p2h')}
            className="w-full md:w-auto px-8 py-3.5 bg-slate-800 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-slate-800/30 hover:bg-slate-700 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> KEMBALI KE DATA P2H
          </button>
        )}
      </div>

      {/* Styling Custom Scrollbar Matrix */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { size: landscape; margin: 5mm; }
        }
      `}</style>
    </div>
    
    <P2HPrintTemplate data={{
      headerData,
      matrix,
      bugarChecks,
      isiP5m,
      driverSiap,
      keputusanAkhir,
      ttd,
      jamIstirahat
    }} />
    </>
  );
};

export default DetailApprovalP2HPage;
