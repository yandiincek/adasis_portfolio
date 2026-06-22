import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Fuel, Truck, ChevronDown, Send, Calendar, User as UserIcon, Clock, 
  Search, AlertTriangle
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const FormKuponBBMPage = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'USER';
  const allowedRoles = ['DRIVER', 'ADMIN', 'ADMINISTRATOR'];

  const [unitOptions, setUnitOptions] = useState([]);
  const [saranaData, setSaranaData] = useState({});

  const [selectedUnit, setSelectedUnit] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const dropdownRef = useRef(null);

  const [driverName, setDriverName] = useState(localStorage.getItem('userName') || '');
  const [nrpDriver, setNrpDriver] = useState(localStorage.getItem('userNrp') || '');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jam, setJam] = useState(new Date().toTimeString().slice(0, 5));
  
  const [supplier, setSupplier] = useState('');
  const [noPolisi, setNoPolisi] = useState('');
  const [jumlahFuel, setJumlahFuel] = useState('');
  const [alasan, setAlasan] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const saranaRes = await api.get('/coal-transport/sarana');
        const saranaList = saranaRes.data.data || saranaRes.data || [];
        
        const newUnitOptions = [];
        const newSaranaData = {};

        saranaList.forEach(unit => {
          if (unit.no_lambung) {
            newUnitOptions.push(unit.no_lambung);
            newSaranaData[unit.no_lambung] = {
              supplier: unit.supplier || '-',
              no_polisi: unit.no_polisi || '-'
            };
          }
        });

        setUnitOptions(newUnitOptions);
        setSaranaData(newSaranaData);
      } catch (error) {
        console.error('Error fetching data for form:', error);
      }
    };
    fetchData();
  }, []);

  const handleUnitSelect = (no_lambung) => {
    setSelectedUnit(no_lambung);
    setUnitSearch('');
    setIsDropdownOpen(false);
    
    if (saranaData[no_lambung]) {
      setSupplier(saranaData[no_lambung].supplier);
      setNoPolisi(saranaData[no_lambung].no_polisi);
    }
  };

  const filteredUnitOptions = unitOptions.filter(u => u.toLowerCase().includes(unitSearch.toLowerCase()));

  const handleSubmit = async () => {
    if (!selectedUnit || !alasan) {
      Swal.fire({ title: 'Peringatan', text: 'Pilih unit dan isi alasan terlebih dahulu.', icon: 'warning', confirmButtonColor: '#3298A0' });
      return;
    }

    setIsSubmitting(true);
    try {
      const recordData = {
        jam,
        nama_driver: driverName,
        nrp_driver: nrpDriver,
        no_lambung: selectedUnit,
        supplier,
        no_polisi: noPolisi,
        jumlah_fuel: jumlahFuel,
        alasan
      };
      
      await api.post('/coal-transport/kupon-bbm', recordData);

      Swal.fire({
        title: 'Berhasil!',
        html: `Form Kupon Tambahan BBM untuk unit <b>${selectedUnit}</b> berhasil diajukan.`,
        icon: 'success',
        confirmButtonColor: '#3298A0'
      }).then(() => {
        navigate('/coal/data-kupon-bbm');
      });
      
    } catch (error) {
      console.error(error);
      Swal.fire({ title: 'Gagal', text: 'Terjadi kesalahan saat menyimpan data.', icon: 'error', confirmButtonColor: '#e3342f' });
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
          Maaf, formulir ini hanya dapat diakses oleh Driver dan Administrator.
        </p>
        <button onClick={() => navigate(-1)} className="bg-[#052334] hover:bg-[#083b57] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#052334] flex items-center gap-3">
          <Fuel className="w-7 h-7 text-[#3298A0]" />
          Form Kupon Tambahan BBM
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Formulir pengajuan kupon tambahan bahan bakar jika ada keperluan mendesak.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 mb-6 flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-[#3298A0]" />
          <span className="text-slate-600 font-medium">{today}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-[#3298A0]" />
          <span className="text-slate-600 font-medium">{jam} WITA</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Nama Driver</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={driverName}
                disabled
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">NRP Driver</label>
            <input
              type="text"
              value={nrpDriver}
              disabled
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Unit Kendaraan (No Lambung)</label>
          <div className="relative" ref={dropdownRef}>
            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] transition-all cursor-pointer flex items-center justify-between"
            >
              <span className={selectedUnit ? "text-[#052334]" : "text-slate-400"}>
                {selectedUnit || "Pilih No Lambung..."}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 flex flex-col">
                <div className="p-2 border-b border-slate-100 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Cari nomor lambung..."
                    value={unitSearch}
                    onChange={(e) => setUnitSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-[#3298A0]"
                  />
                </div>
                <div className="overflow-y-auto custom-scrollbar p-1">
                  {filteredUnitOptions.length > 0 ? (
                    filteredUnitOptions.map((unit) => (
                      <div 
                        key={unit} 
                        onClick={() => handleUnitSelect(unit)}
                        className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#3298A0] font-medium rounded-md cursor-pointer transition-colors"
                      >
                        {unit}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-slate-400 text-center">Unit tidak ditemukan</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Supplier</label>
            <input
              type="text"
              value={supplier}
              disabled
              placeholder="Otomatis terisi..."
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">No Polisi</label>
            <input
              type="text"
              value={noPolisi}
              disabled
              placeholder="Otomatis terisi..."
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Jumlah Fuel (Liter)</label>
            <input
              type="number"
              value={jumlahFuel}
              onChange={(e) => setJumlahFuel(e.target.value)}
              placeholder="Contoh: 150"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Alasan Penambahan Fuel</label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={2}
              placeholder="Jelaskan alasan penambahan kupon BBM secara detail..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] transition-all resize-none"
            />
          </div>
        </div>
        
        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full md:w-auto min-w-[200px] ${isSubmitting ? 'bg-slate-400' : 'bg-[#3298A0] hover:bg-[#248B96]'} text-white px-8 py-3 rounded-xl text-sm font-bold tracking-wide shadow-lg shadow-[#3298A0]/20 transition-all flex items-center justify-center gap-2`}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'MENYIMPAN...' : 'KIRIM PENGAJUAN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormKuponBBMPage;
