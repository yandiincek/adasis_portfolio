import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, Calendar, CheckCircle, XCircle, ChevronDown, 
  Send, User as UserIcon, MapPin, Truck, AlertTriangle, Image as ImageIcon, Camera, Settings, Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

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
      className="w-full px-3 py-2 text-sm text-[#052334] font-medium focus:outline-none"
      placeholder={placeholder}
    />
  </div>
);

const FormP2HPage = () => {
  const navigate = useNavigate();
  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // State Header
  const [headerData, setHeaderData] = useState({
    tanggal: getTodayString(), noLambung: '', lokasiParkir: '',
    shift: '', jenisUnit: '', areaKerja: '',
    namaDriver: localStorage.getItem('userName') || '', kmAwal: '', expStiker: '',
    nrpDriver: localStorage.getItem('userNrp') || '', kmAkhir: '',
    supplier: '', noPolisi: ''
  });

  const userRole = localStorage.getItem('userRole') || 'USER';
  const allowedRoles = ['DRIVER', 'ADMIN', 'ADMINISTRATOR'];
  const isPengawas = ['ADMIN', 'ADMINISTRATOR'].includes(userRole);
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
    namaDriver: localStorage.getItem('userName') || '', nrpDriver: localStorage.getItem('userNrp') || '',
    namaPengawas: '', nrpPengawas: '',
    keterangan: ''
  });

  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saranasList, setSaranasList] = useState([]);

  useEffect(() => {
    // Fetch data sarana untuk autofill
    api.get('/coal-transport/sarana')
      .then(res => {
        setSaranasList(res.data.data || res.data || []);
      })
      .catch(err => console.error('Gagal memuat data sarana:', err));
  }, []);

  const handleHeaderChange = (field, value) => {
    setHeaderData(prev => {
      const next = { ...prev, [field]: value };
      
      // Autofill logika ketika noLambung berubah
      if (field === 'noLambung') {
        const found = saranasList.find(s => 
          s.no_lambung && s.no_lambung.toLowerCase() === value.toLowerCase()
        );
        if (found) {
          next.jenisUnit = found.tipe_unit || next.jenisUnit;
          next.noPolisi = found.no_polisi || next.noPolisi;
          next.supplier = found.supplier || next.supplier;
        }
      }
      
      return next;
    });
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

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      let lat = null;
      let lng = null;
      try {
        const position = await getLocation();
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (err) {
        console.warn('GPS location not captured:', err.message);
        const result = await Swal.fire({
          title: 'Lokasi GPS Tidak Terdeteksi!',
          text: 'Kami gagal mendapatkan lokasi GPS Anda. Pastikan GPS/Location aktif di perangkat Anda dan browser memiliki izin (permission) untuk mengakses lokasi.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Kirim Tanpa GPS',
          cancelButtonText: 'Batal Kirim',
          confirmButtonColor: '#e3342f',
          cancelButtonColor: '#3298A0'
        });
        
        if (!result.isConfirmed) {
          setIsSubmitting(false);
          return;
        }
      }

      const formData = new FormData();

      Object.keys(headerData).forEach(key => {
        if (headerData[key]) {
          const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          formData.append(snakeKey, headerData[key]);
        }
      });

      formData.append('matrix_checklist', JSON.stringify(matrix));
      formData.append('jam_istirahat', jamIstirahat);
      formData.append('bugar_sehat', JSON.stringify(bugarChecks));

      if (isiP5m) formData.append('isi_p5m', isiP5m);
      if (driverSiap) formData.append('driver_siap', driverSiap);
      if (keputusanAkhir) formData.append('keputusan_akhir', keputusanAkhir);

      // Append Signatures (except namaDriver and nrpDriver which are already in headerData)
      if (ttd.namaPengawas) formData.append('nama_pengawas', ttd.namaPengawas);
      if (ttd.nrpPengawas) formData.append('nrp_pengawas', ttd.nrpPengawas);
      if (ttd.keterangan) formData.append('keterangan_pengawas', ttd.keterangan);

      formData.append('status', 'PENDING_REVIEW');

      if (lat && lng) {
        formData.append('latitude', lat);
        formData.append('longitude', lng);
      }

      if (file) {
        formData.append('gambar', file);
      }

      await api.post('/coal-transport/p2h', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Swal.fire({
        title: 'Berhasil!',
        text: `P2H untuk unit ${headerData.noLambung || 'terpilih'} berhasil disubmit.`,
        icon: 'success',
        confirmButtonColor: '#3298A0'
      }).then(() => {
        navigate('/coal/data-p2h');
      });
      
      // Optional reset state
      // setHeaderData({...})
    } catch (error) {
      console.error('Error submitting P2H:', error);
      Swal.fire({
        title: 'Gagal!',
        text: 'Terjadi kesalahan saat menyimpan data P2H.',
        icon: 'error',
        confirmButtonColor: '#e3342f'
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-[#052334] mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 mb-6 max-w-md">
          Maaf, formulir P2H hanya dapat diakses oleh Driver dan Admin Transport.
        </p>
        <button onClick={() => navigate(-1)} className="bg-[#052334] hover:bg-[#083b57] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#052334] flex items-start sm:items-center gap-2 sm:gap-3 leading-tight">
            <ClipboardList className="w-6 h-6 md:w-7 md:h-7 shrink-0 text-[#3298A0] mt-0.5 sm:mt-0" />
            <span>Checklist P2H & Bugar Selamat</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Formulir pemeriksaan kendaraan harian dan pernyataan kesiapan driver secara terpadu.
          </p>
        </div>
        
        {/* Role Toggle for Demo (Removed, now using real roles) */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mx-2">Role Anda:</span>
          <span className="px-3 py-1.5 rounded text-xs font-bold bg-[#3298A0] text-white shadow">
            {userRole}
          </span>
        </div>
      </div>

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
                      <td key={iIdx} className="border border-slate-300 p-1 text-center">
                        <select
                          value={val}
                          onChange={(e) => handleMatrixChange(tIdx, iIdx, e.target.value)}
                          className={`w-full text-center appearance-none text-xs font-bold py-1 px-2 rounded cursor-pointer focus:outline-none ${
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

        {/* MOBILE VIEW (Cards) */}
        <div className="block lg:hidden bg-slate-50 p-4 space-y-4">
          {checklistItems.map((item, iIdx) => {
            const hasIssue = checkTypes.some((_, tIdx) => matrix[tIdx][iIdx] === 'X' || matrix[tIdx][iIdx] === 'AA');
            
            return (
              <div key={iIdx} className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${hasIssue ? 'border-red-300' : 'border-slate-200'}`}>
                <div className={`px-4 py-3 flex justify-between items-center ${hasIssue ? 'bg-red-50' : 'bg-slate-50 border-b border-slate-200'}`}>
                  <span className={`text-xs font-bold leading-tight pr-4 ${hasIssue ? 'text-red-700' : 'text-[#052334]'}`}>
                    {iIdx + 1}. {item}
                  </span>
                  {hasIssue ? (
                    <span className="shrink-0 bg-red-100 text-red-700 p-1 rounded-full"><AlertTriangle className="w-3.5 h-3.5" /></span>
                  ) : (
                    <span className="shrink-0 bg-emerald-100 text-emerald-700 p-1 rounded-full"><CheckCircle className="w-3.5 h-3.5" /></span>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  {checkTypes.map((checkLabel, tIdx) => {
                    const val = matrix[tIdx][iIdx];
                    return (
                      <div key={tIdx} className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{checkLabel}</label>
                        <div className="flex bg-slate-100/80 p-1 rounded-lg gap-1 border border-slate-200/50">
                          {['V', 'X', 'A', 'AA'].map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleMatrixChange(tIdx, iIdx, opt)}
                              className={`flex-1 py-2 text-xs font-black rounded-md transition-all ${
                                val === opt 
                                  ? opt === 'V' || opt === 'A' 
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                    : 'bg-red-500 text-white shadow-md shadow-red-500/20'
                                  : 'text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
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
            <div className="space-y-3 pl-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="istirahat" value=">=6" checked={jamIstirahat === '>=6'} onChange={() => setJamIstirahat('>=6')} className="w-4 h-4 text-[#3298A0] border-slate-300 focus:ring-[#3298A0]" />
                <span className="text-sm font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">&ge; 6 Jam <span className="font-normal text-slate-500">(Sesuai standar bugar selamat)</span></span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="istirahat" value="5" checked={jamIstirahat === '5'} onChange={() => setJamIstirahat('5')} className="w-4 h-4 text-amber-500 border-slate-300 focus:ring-amber-500" />
                <span className="text-sm font-bold text-amber-700 group-hover:text-amber-800 transition-colors">5 Jam <span className="font-normal text-slate-500">(Wajib konseling pengawas/user)</span></span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="istirahat" value="<5" checked={jamIstirahat === '<5'} onChange={() => setJamIstirahat('<5')} className="w-4 h-4 text-red-500 border-slate-300 focus:ring-red-500" />
                <span className="text-sm font-bold text-red-700 group-hover:text-red-800 transition-colors">&lt; 5 Jam <span className="font-normal text-slate-500">(Tidak diijinkan mengemudikan kendaraan)</span></span>
              </label>
            </div>
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
                  onChange={() => handleBugarCheck(item.id)} 
                  className="w-4 h-4 text-[#3298A0] border-slate-300 rounded focus:ring-[#3298A0]" 
                />
                <span className="text-sm font-bold text-[#052334] group-hover:text-[#3298A0] transition-colors">{item.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 border-t pt-4">
            <p className="text-sm font-bold text-[#052334] mb-3">6. Apakah kemarin off dan melakukan perjalanan keluar kabupaten domisili (Tabalong, Balangan Dan Bartim) ?</p>
            <div className="space-y-3 pl-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="keluarDomisili" 
                  value="Ya" 
                  checked={bugarChecks.keluarDomisili === 'Ya'} 
                  onChange={() => setBugarChecks(prev => ({ ...prev, keluarDomisili: 'Ya' }))} 
                  className="w-4 h-4 text-[#3298A0] border-slate-300 focus:ring-[#3298A0]" 
                />
                <span className="text-sm font-bold text-[#052334] group-hover:text-[#3298A0] transition-colors">Ya</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="keluarDomisili" 
                  value="Tidak" 
                  checked={bugarChecks.keluarDomisili === 'Tidak'} 
                  onChange={() => setBugarChecks(prev => ({ ...prev, keluarDomisili: 'Tidak' }))} 
                  className="w-4 h-4 text-[#3298A0] border-slate-300 focus:ring-[#3298A0]" 
                />
                <span className="text-sm font-bold text-[#052334] group-hover:text-[#3298A0] transition-colors">Tidak</span>
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
              onChange={(e) => setIsiP5m(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] transition-all resize-none"
              placeholder="Tuliskan catatan P5M di sini..."
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#052334] tracking-wide">KEPUTUSAN PENGAWAS / USER</h2>
            {!isPengawas && <span className="text-[10px] font-bold text-red-500 uppercase bg-red-50 px-2 py-0.5 rounded border border-red-100">Khusus Pengawas</span>}
          </div>
          <div className={`p-6 flex-grow flex flex-col justify-center space-y-4 ${!isPengawas ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className={`flex items-center gap-3 cursor-pointer group p-3 border rounded-lg transition-colors ${!isPengawas ? 'bg-slate-50' : 'hover:bg-emerald-50 hover:border-emerald-200'}`}>
              <input type="radio" name="driverSiap" value="siap" disabled={!isPengawas} checked={driverSiap === 'siap'} onChange={() => setDriverSiap('siap')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">Driver siap bekerja</span>
            </label>
            <label className={`flex items-start gap-3 cursor-pointer group p-3 border rounded-lg transition-colors ${!isPengawas ? 'bg-slate-50' : 'hover:bg-red-50 hover:border-red-200'}`}>
              <input type="radio" name="driverSiap" value="tidak_siap" disabled={!isPengawas} checked={driverSiap === 'tidak_siap'} onChange={() => setDriverSiap('tidak_siap')} className="w-4 h-4 mt-0.5 text-red-600 focus:ring-red-600" />
              <span className="text-sm font-bold text-red-700 leading-tight">Driver tidak siap bekerja, wajib lapor ke koordinator lapangan dan tidak diijinkan mengemudi</span>
            </label>
          </div>
        </div>
      </div>

      {/* ================= SECTION 5: FINAL KEPUTUSAN & SIGNATURE ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* Kolom 1: Keputusan Final */}
          <div className={`p-5 flex flex-col justify-center space-y-4 ${!isPengawas ? 'opacity-50 pointer-events-none' : ''}`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Keputusan Akhir {!isPengawas && <span className="text-red-500 ml-1">(Pengawas)</span>}</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="keputusanAkhir" value="layak" disabled={!isPengawas} checked={keputusanAkhir === 'layak'} onChange={() => setKeputusanAkhir('layak')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">Layak dioperasikan</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="keputusanAkhir" value="tidak_layak" disabled={!isPengawas} checked={keputusanAkhir === 'tidak_layak'} onChange={() => setKeputusanAkhir('tidak_layak')} className="w-4 h-4 text-red-600 focus:ring-red-600" />
              <span className="text-sm font-bold text-red-700">Tidak layak dioperasikan</span>
            </label>
          </div>

          {/* Kolom 2: TTD Driver */}
          <div className="p-5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Tanda Tangan Driver</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nama Driver</label>
                <input type="text" value={ttd.namaDriver} onChange={(e) => handleTtdChange('namaDriver', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#3298A0]" placeholder="Ketik nama untuk TTD" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">NRP Driver</label>
                <input type="text" value={ttd.nrpDriver} onChange={(e) => handleTtdChange('nrpDriver', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#3298A0]" placeholder="NRP Driver" />
              </div>
            </div>
          </div>

          {/* Kolom 3: TTD Pengawas */}
          <div className="p-5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Tanda Tangan Pengawas {!isPengawas && <span className="text-red-500 ml-1">(Pengawas)</span>}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nama Pengawas</label>
                <input type="text" value={ttd.namaPengawas} disabled={!isPengawas} onChange={(e) => handleTtdChange('namaPengawas', e.target.value)} className={`w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#3298A0] ${!isPengawas ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50'}`} placeholder="Ketik nama untuk TTD" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">NRP Pengawas</label>
                <input type="text" value={ttd.nrpPengawas} disabled={!isPengawas} onChange={(e) => handleTtdChange('nrpPengawas', e.target.value)} className={`w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#3298A0] ${!isPengawas ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50'}`} placeholder="NRP Pengawas" />
              </div>
            </div>
          </div>

          {/* Kolom 4: Keterangan */}
          <div className="p-5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Keterangan Tambahan {!isPengawas && <span className="text-red-500 ml-1">(Pengawas)</span>}</p>
            <textarea
              value={ttd.keterangan}
              disabled={!isPengawas}
              onChange={(e) => handleTtdChange('keterangan', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#3298A0] resize-none ${!isPengawas ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50'}`}
              placeholder="Tulis catatan temuan di sini..."
            />
          </div>
        </div>
      </div>

      {/* ================= SECTION 6: UPLOAD & SUBMIT ================= */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upload Gambar Absensi/Kondisi</label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
              <Camera className="w-4 h-4 text-[#3298A0]" />
              Pilih File
              <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            </label>
            <span className="text-xs text-slate-400">{file ? file.name : 'Belum ada file terpilih'}</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full md:w-auto min-w-[250px] ${isSubmitting ? 'bg-slate-400' : 'bg-[#3298A0] hover:bg-[#248B96]'} text-white px-8 py-3.5 rounded-xl text-sm font-bold tracking-wide shadow-lg shadow-[#3298A0]/20 transition-all hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2`}
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> MENYIMPAN...</>
          ) : (
            <><Send className="w-4 h-4" /> SIMPAN CHECKLIST P2H</>
          )}
        </button>
      </div>

      {/* Styling Custom Scrollbar Matrix */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default FormP2HPage;
