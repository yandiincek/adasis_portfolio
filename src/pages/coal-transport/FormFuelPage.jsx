import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Fuel, Truck, ChevronDown, Send, Calendar, User as UserIcon, Clock, 
  Droplets, Gauge, Search, AlertTriangle
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import RouteCalculatorMap from '../../components/maps/RouteCalculatorMap';

const fuelTypeOptions = [
  { value: 'solar', label: 'Solar (B30)', color: '#E58032' }
];

const FormFuelPage = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'USER';
  const allowedRoles = ['DRIVER', 'FUELMAN', 'ADMIN', 'ADMINISTRATOR'];
  const [unitOptions, setUnitOptions] = useState([]);
  const [unitDataMap, setUnitDataMap] = useState({});
  const [saranaIds, setSaranaIds] = useState({});

  const [selectedUnit, setSelectedUnit] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.addEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [driverName, setDriverName] = useState(localStorage.getItem('userName') || '');
  const [nrp, setNrp] = useState('');
  const [fuelmanName, setFuelmanName] = useState('');
  const [fuelmanNrp, setFuelmanNrp] = useState('');
  const [jadwalRute, setJadwalRute] = useState('');
  const [fuelType, setFuelType] = useState('solar');
  const [tanggalPengisian, setTanggalPengisian] = useState(new Date().toISOString().split('T')[0]);
  const [jamPengisian, setJamPengisian] = useState(new Date().toTimeString().slice(0, 5));
  
  const [kmAwal, setKmAwal] = useState('');
  const [kmAkhir, setKmAkhir] = useState('');
  
  const [jumlahLiter, setJumlahLiter] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [saranaRes, quotaRes] = await Promise.all([
          api.get('/coal-transport/sarana'),
          api.get('/coal-transport/fuel-quotas')
        ]);
        
        const quotaMap = {};
        quotaRes.data.forEach(q => {
          if (q.unit_id) {
            quotaMap[q.unit_id] = q;
          }
        });

        const newUnitOptions = [];
        const newUnitDataMap = {};
        const newSaranaIds = {};

        saranaRes.data.forEach(unit => {
          if (unit.no_lambung) {
            newUnitOptions.push(unit.no_lambung);
            newSaranaIds[unit.no_lambung] = unit.id;
            
            const quota = quotaMap[unit.id];
            
            // Ambil ratio dari quota (excel), jika tidak ada fallback ke master Sarana
            let ratio = 1;
            if (quota && quota.ratio) {
              ratio = parseFloat(quota.ratio) || 1;
            } else {
              const ratioStr = unit.fuel_ratio_kontrak_terbaru || unit.fuel_ratio_kontrak_lama;
              if (ratioStr && typeof ratioStr === 'string' && ratioStr.includes(':')) {
                ratio = parseFloat(ratioStr.split(':')[1].replace(',', '.')) || 1;
              } else if (ratioStr) {
                if (typeof ratioStr === 'string') {
                  ratio = parseFloat(ratioStr.replace(',', '.')) || 1;
                } else {
                  ratio = parseFloat(ratioStr) || 1;
                }
              }
            }

            newUnitDataMap[unit.no_lambung] = {
              planFuel: quota ? (quota.kartu_kuota || 0) : 0,
              planRatio: ratio
            };
          }
        });

        setUnitOptions(newUnitOptions);
        setUnitDataMap(newUnitDataMap);
        setSaranaIds(newSaranaIds);
      } catch (error) {
        console.error('Error fetching data for form:', error);
      }
    };
    fetchData();
  }, []);

  // Perhitungan Fuel
  const unitData = selectedUnit ? unitDataMap[selectedUnit] || { planFuel: 0, planRatio: 1 } : null;
  const planFuel = unitData ? unitData.planFuel : 0;
  const planRatio = unitData ? unitData.planRatio : 1;

  const numKmAwal = parseFloat(kmAwal) || 0;
  const numKmAkhir = parseFloat(kmAkhir) || 0;
  
  const jarakTempuh = numKmAkhir > numKmAwal ? numKmAkhir - numKmAwal : 0;
  const fuelDibutuhkan = jarakTempuh / planRatio;
  
  // Kelebihan fuel = Plan Fuel - Fuel Dibutuhkan
  // Jika positif = Hemat BBM. Jika negatif = Boros (Melebihi Plan)
  const kelebihanFuel = planFuel - fuelDibutuhkan;
  
  // Maksimal Boleh Mengisi
  let bolehMengisi = 0;
  if (selectedUnit) {
    if (kelebihanFuel < 0) {
      // Jika minus (fuel dibutuhkan melebihi plan), maka boleh mengisi = plan fuel + kelebihan fuel (minus ditambah plus = berkurang)
      bolehMengisi = Math.max(0, planFuel + kelebihanFuel);
    } else {
      // Jika lebih/sama dengan 0, boleh mengisi = plan fuel
      bolehMengisi = planFuel;
    }
  }

  const selectedFuelColor = fuelTypeOptions.find(f => f.value === fuelType)?.color || '#3298A0';

  const filteredUnitOptions = unitOptions.filter(u => u.toLowerCase().includes(unitSearch.toLowerCase()));

  const handleSubmit = async () => {
    if (!selectedUnit || !jumlahLiter) {
      Swal.fire({ title: 'Peringatan', text: 'Pilih unit dan isi jumlah liter terlebih dahulu.', icon: 'warning', confirmButtonColor: '#E58032' });
      return;
    }

    setIsSubmitting(true);
    try {
      const recordData = {
        unit_id: saranaIds[selectedUnit],
        tanggal: tanggalPengisian,
        jam: jamPengisian,
        petugas_name: driverName,
        petugas_nrp: nrp,
        fuelman_name: fuelmanName,
        fuelman_nrp: fuelmanNrp,
        jadwal_rute: parseFloat(jadwalRute) || 0,
        jenis_bbm: fuelTypeOptions.find(f => f.value === fuelType)?.label || 'Solar',
        liter: parseFloat(jumlahLiter),
        km_awal: parseFloat(kmAwal) || 0,
        km_akhir: parseFloat(kmAkhir) || 0,
        catatan: catatan
      };
      await api.post('/coal-transport/fuel-records', recordData);

      Swal.fire({
        title: 'Berhasil!',
        html: `Pengisian fuel untuk unit <b>${selectedUnit}</b> sebanyak <b>${jumlahLiter} Liter</b> berhasil dicatat ke Database.`,
        icon: 'success',
        confirmButtonColor: '#E58032'
      });
      
      // Reset form
      setKmAwal('');
      setKmAkhir('');
      setJumlahLiter('');
      setSelectedUnit('');
    } catch (error) {
      console.error(error);
      Swal.fire({ title: 'Gagal', text: 'Terjadi kesalahan saat menyimpan data ke database.', icon: 'error', confirmButtonColor: '#E58032' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-[#052334] mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 mb-6 max-w-md">
          Maaf, formulir pengisian fuel hanya dapat diakses oleh Driver, Fuelman, dan Administrator.
        </p>
        <button onClick={() => navigate(-1)} className="bg-[#052334] hover:bg-[#083b57] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#052334] flex items-center gap-3">
          <Fuel className="w-7 h-7 text-[#E58032]" />
          Form Pengisian Fuel
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Catat setiap pengisian bahan bakar kendaraan Coal Transport.
        </p>
      </div>

      {/* Info Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 mb-6 flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-[#E58032]" />
          <span className="text-slate-600 font-medium">{today}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <UserIcon className="w-4 h-4 text-[#E58032]" />
          <span className="text-slate-600 font-medium">{driverName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-[#E58032]" />
          <span className="text-slate-600 font-medium">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info Petugas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-bold text-[#052334] border-b border-slate-200 pb-2">Informasi Driver</h3>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Nama Driver</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] transition-all"
                    placeholder="Nama lengkap driver"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">NRP Driver</label>
                <input
                  type="text"
                  value={nrp}
                  onChange={(e) => setNrp(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] transition-all"
                  placeholder="Nomor registrasi pegawai"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-bold text-[#052334] border-b border-slate-200 pb-2">Informasi Fuelman</h3>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Nama Fuelman</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fuelmanName}
                    onChange={(e) => setFuelmanName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E58032]/30 focus:border-[#E58032] transition-all"
                    placeholder="Nama lengkap fuelman"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">NRP Fuelman</label>
                <input
                  type="text"
                  value={fuelmanNrp}
                  onChange={(e) => setFuelmanNrp(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E58032]/30 focus:border-[#E58032] transition-all"
                  placeholder="NRP fuelman"
                />
              </div>
            </div>
          </div>

          {/* Unit */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 mb-6">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Unit Kendaraan</label>
            <div className="relative" ref={dropdownRef}>
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E58032]/30 focus:border-[#E58032] transition-all cursor-pointer flex items-center justify-between"
              >
                <span className={selectedUnit ? "text-[#052334]" : "text-slate-400"}>
                  {selectedUnit || "Pilih Unit..."}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 flex flex-col">
                  <div className="p-2 border-b border-slate-100 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Cari nomor unit..."
                      value={unitSearch}
                      onChange={(e) => setUnitSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-[#E58032] focus:bg-white transition-colors"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto custom-scrollbar">
                    {filteredUnitOptions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500 text-center">Unit tidak ditemukan</div>
                    ) : (
                      filteredUnitOptions.map(u => (
                        <div 
                          key={u}
                          className={`px-4 py-2 text-sm cursor-pointer hover:bg-orange-50 hover:text-[#E58032] transition-colors ${selectedUnit === u ? 'bg-orange-50 text-[#E58032] font-bold' : 'text-slate-700'}`}
                          onClick={() => {
                            setSelectedUnit(u);
                            setIsDropdownOpen(false);
                            setUnitSearch('');
                          }}
                        >
                          {u}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Data Operasional & Rute */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <h3 className="text-sm font-bold text-[#052334] flex items-center gap-2 mb-4">
              <Gauge className="w-4 h-4 text-[#E58032]" />
              Data Operasional & Rute
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Jadwal Rute Hari Ini (KM)</label>
                <div className="relative mb-3">
                  <input
                    type="number"
                    value={jadwalRute}
                    onChange={(e) => setJadwalRute(e.target.value)}
                    className="w-full px-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E58032]/30 focus:border-[#E58032] transition-all"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KM</span>
                </div>
                <button 
                  onClick={() => setIsMapOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-[#052334] rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  📍 Hitung Jarak via Peta (GPS)
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Waktu Pengisian</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={tanggalPengisian}
                    onChange={(e) => setTanggalPengisian(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E58032]/30 focus:border-[#E58032] transition-all"
                  />
                  <input
                    type="time"
                    value={jamPengisian}
                    onChange={(e) => setJamPengisian(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E58032]/30 focus:border-[#E58032] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Jarak Tempuh / KM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">KM Awal</label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={kmAwal}
                  onChange={(e) => setKmAwal(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E58032]/30 focus:border-[#E58032] transition-all"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KM</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">KM Akhir Aktual Fuel</label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={kmAkhir}
                  onChange={(e) => setKmAkhir(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E58032]/30 focus:border-[#E58032] transition-all"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KM</span>
              </div>
            </div>
          </div>

          {/* Jarak Tempuh & Kalkulasi (Read Only Display) */}
          {selectedUnit && (
            <div className="bg-[#E58032]/5 rounded-xl border border-[#E58032]/20 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plan Fuel (Kuota)</p>
                <p className="text-lg font-black text-[#052334]">{planFuel > 0 ? planFuel.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0'} Ltr</p>
                <p className="text-[10px] text-slate-400 font-bold">Ratio: {planRatio}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jarak Tempuh</p>
                <p className="text-lg font-black text-[#052334]">{jarakTempuh} KM</p>
                <p className="text-[10px] text-slate-400 font-bold">Akhir - Awal</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fuel Dibutuhkan</p>
                <p className="text-lg font-black text-[#052334]">{fuelDibutuhkan.toFixed(2)} Ltr</p>
                <p className="text-[10px] text-slate-400 font-bold">Jarak / Ratio</p>
              </div>
            </div>
          )}

          {/* Jumlah Liter (Input) */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Jumlah Pengisian Aktual (Liter)</label>
            <div className="relative">
              <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={jumlahLiter}
                onChange={(e) => setJumlahLiter(e.target.value)}
                className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border rounded-lg text-sm font-bold focus:outline-none transition-all border-slate-200 focus:border-[#E58032] focus:ring-2 focus:ring-[#E58032]/30 text-[#052334]"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Liter</span>
            </div>
          </div>

          {/* Catatan */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Catatan</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E58032]/30 focus:border-[#E58032] transition-all resize-none"
              placeholder="Catatan tambahan..."
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full bg-[#E58032] hover:bg-[#d9772b] text-white py-3.5 rounded-xl text-sm font-bold tracking-wide shadow-lg shadow-[#E58032]/20 transition-all hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 mb-10"
          >
            <Send className="w-4 h-4" />
            SUBMIT PENGISIAN FUEL
          </button>
        </div>

        {/* Right: Summary Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 sticky top-24">
            <h3 className="text-sm font-bold text-[#052334] mb-4 pb-3 border-b border-slate-100">
              📋 Ringkasan Pengisian
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Unit</span>
                <span className="text-sm font-bold text-[#052334]">{selectedUnit || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Jumlah</span>
                <span className="text-sm font-bold text-[#052334]">{jumlahLiter || '0'} Liter</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">KM Awal</span>
                <span className="text-sm font-bold text-[#052334]">{kmAwal || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">KM Akhir</span>
                <span className="text-sm font-bold text-[#052334]">{kmAkhir || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Petugas</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#052334] block">{driverName || '-'}</span>
                  {nrp && <span className="text-[10px] text-slate-400 font-bold block">NRP: {nrp}</span>}
                </div>
              </div>

              {/* Visual Fuel Indicator */}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border-4 mb-2" style={{ borderColor: selectedFuelColor, backgroundColor: `${selectedFuelColor}10` }}>
                    <span className="text-lg font-black" style={{ color: selectedFuelColor }}>{jumlahLiter || '0'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Liter</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMapOpen && (
        <RouteCalculatorMap 
          onClose={() => setIsMapOpen(false)}
          onDistanceCalculated={(dist) => {
            setJadwalRute(dist.toFixed(2));
            setIsMapOpen(false);
          }}
        />
      )}
    </>
  );
};

export default FormFuelPage;
