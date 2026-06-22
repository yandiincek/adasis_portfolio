import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  ArrowLeft, UploadCloud, FileText, User, 
  MapPin, Calendar, CheckCircle2, Search, ChevronDown, Check, Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';

const PengajuanWOPage = () => {
  const navigate = useNavigate();

  // State untuk file upload dinamis per bangunan
  const [files, setFiles] = useState({});
  const [fileNames, setFileNames] = useState({});
  
  const getLocalDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localNow = new Date(now.getTime() - (offset * 60 * 1000));
    return localNow.toISOString().split('T')[0];
  };

  // State untuk data dropdown dari API
  const [areas, setAreas] = useState([]);
  const [bangunanList, setBangunanList] = useState([]);

  // State untuk form
  const [formData, setFormData] = useState({
    title: '',
    requester_name: '',
    requester_nrp: '',
    requester_dept: '',
    requester_contact: '',
    area_id: '',
    bangunan_ids: [],
    description: ''
  });

  const [isBangunanOpen, setIsBangunanOpen] = useState(false);
  const [bangunanSearch, setBangunanSearch] = useState('');
  const dropdownRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsBangunanOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  async function fetchDropdowns() {
    try {
      const [resArea, resBangunan] = await Promise.all([
        api.get('/areas'),
        api.get('/bangunan')
      ]);
      setAreas(resArea.data);
      setBangunanList(resBangunan.data);
    } catch (error) {
      console.error('Gagal mengambil data dropdown:', error);
    }
  }

  const handleChange = (e) => {
    if (e.target.name === 'area_id') {
      setFormData({ ...formData, area_id: e.target.value, bangunan_ids: [] });
      setBangunanSearch('');
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // Autofill saat user mengetik NRP dengan debounce 500ms
  useEffect(() => {
    const nrpVal = formData.requester_nrp;
    if (!nrpVal) return;
    
    // Ambil angka saja jika formatnya "12345 / Jabatan"
    const nrpOnly = nrpVal.split(' ')[0].split('/')[0].trim();
    
    // Minimal 4 karakter baru mulai query ke server untuk mencegah spam API
    if (nrpOnly.length < 4) return;

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/users/by-nrp/${nrpOnly}`);
        if (res.data) {
          setFormData(prev => ({
            ...prev,
            requester_name: res.data.full_name || prev.requester_name,
            requester_dept: res.data.department || prev.requester_dept,
            requester_contact: res.data.contact || res.data.email || prev.requester_contact,
          }));
        }
      } catch (error) {
        // Jika tidak ditemukan, abaikan saja
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.requester_nrp]);

  const toggleBangunan = (id) => {
    setFormData(prev => {
      const current = prev.bangunan_ids;
      const newIds = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
      return { ...prev, bangunan_ids: newIds };
    });
  };

  const filteredBangunanList = bangunanList.filter(b => 
    b.area_id === parseInt(formData.area_id) && 
    b.name.toLowerCase().includes(bangunanSearch.toLowerCase())
  );

  const handleFileChangeDynamic = (e, bangunanId) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        Swal.fire({ title: 'Gagal!', text: 'Ukuran file melebihi batas maksimal 5MB!', icon: 'error', confirmButtonColor: '#E58032' });
        return;
      }
      setFileNames(prev => ({ ...prev, [bangunanId]: selectedFile.name }));
      setFiles(prev => ({ ...prev, [bangunanId]: selectedFile }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.area_id || formData.bangunan_ids.length === 0) {
      Swal.fire({ title: 'Perhatian!', text: 'Harap isi semua field yang wajib (Judul, Keluhan, Area, Bangunan)!', icon: 'warning', confirmButtonColor: '#E58032' });
      return;
    }
    setIsSubmitting(true);
    
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'bangunan_ids') {
        submitData.append(key, JSON.stringify(formData[key]));
      } else {
        submitData.append(key, formData[key]);
      }
    });

    const userId = localStorage.getItem('userId');
    if (userId) {
      submitData.append('requester_id', userId);
    }
    
    Object.values(files).forEach(fileObj => {
      submitData.append('lampiran_temuan', fileObj);
    });

    try {
      await api.post('/work-orders', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Swal.fire({ title: 'Berhasil!', text: 'Pengajuan Work Order berhasil dikirim!', icon: 'success', confirmButtonColor: '#052334' }).then(() => {
        navigate('/dashboard-infra');
      });
    } catch (error) {
      Swal.fire({ title: 'Gagal!', text: 'Gagal mengirim pengajuan!', icon: 'error', confirmButtonColor: '#E58032' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header Halaman */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/dashboard-infra')} 
          className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#052334]">Pengajuan WO Baru</h1>
          <p className="text-slate-500 text-sm mt-1">Isi formulir di bawah ini untuk membuat Work Order baru.</p>
        </div>
      </div>

      {/* Kertas Form Utama */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden mb-10">
        
        {/* Kop Form (Header Form) */}
        <div className="bg-[#052334] p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden">
          {/* Efek Latar Belakang */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-16"></div>
          
          <div className="relative z-10">
            <h2 className="text-xl font-black tracking-wide">FORM PENGAJUAN PEKERJAAN / WORK ORDER INFRASTRUKTUR</h2>
            <p className="text-[#E58032] font-semibold text-sm mt-1">Section GACT - Departemen GA</p>
          </div>
          <div className="relative z-10 mt-4 md:mt-0 bg-white/10 px-4 py-2 rounded-lg border border-white/20">
            <span className="text-xs font-medium text-slate-300">Form No.</span>
            <p className="text-sm font-bold tracking-wider">ADMO/CGA/20/F-001</p>
          </div>
        </div>

        {/* Isi Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          
          {/* Bagian 1: Pengajuan Perbaikan */}
          <section>
            <h3 className="text-sm font-black text-[#052334] uppercase tracking-widest border-b border-slate-100 pb-2 mb-6 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#E58032]" /> 1. Informasi Pengajuan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Pengajuan Perbaikan *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Contoh: Perbaikan AC Rusak" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] focus:ring-1 focus:ring-[#E58032] transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Tanggal Pengajuan</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input type="date" value={getLocalDate()} disabled className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium cursor-not-allowed transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">No. Work Order</label>
                <input type="text" value="(Otomatis setelah disetujui)" readOnly className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-400 cursor-not-allowed font-medium italic" />
              </div>
            </div>
          </section>

          {/* Bagian 2: Diajukan Oleh */}
          <section>
            <h3 className="text-sm font-black text-[#052334] uppercase tracking-widest border-b border-slate-100 pb-2 mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-[#E58032]" /> 2. Diajukan Oleh
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">NRP / Jabatan</label>
                <input 
                  type="text" 
                  name="requester_nrp" 
                  value={formData.requester_nrp} 
                  onChange={handleChange} 
                  placeholder="Contoh: 123456 / Staff IT" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Nama Lengkap</label>
                <input type="text" name="requester_name" value={formData.requester_name} onChange={handleChange} placeholder="Masukkan nama..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Section / Departemen</label>
                <input type="text" name="requester_dept" value={formData.requester_dept} onChange={handleChange} placeholder="Masukkan departemen..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">No. HP / Email</label>
                <input type="text" name="requester_contact" value={formData.requester_contact} onChange={handleChange} placeholder="Masukkan kontak aktif..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] transition-all" />
              </div>
            </div>
          </section>

          {/* Bagian 3: Detail Pengajuan */}
          <section>
            <h3 className="text-sm font-black text-[#052334] uppercase tracking-widest border-b border-slate-100 pb-2 mb-6 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#E58032]" /> 3. Detail Pengajuan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Area *</label>
                <select name="area_id" value={formData.area_id} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] transition-all">
                  <option value="">-- Pilih Area --</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Bangunan *</label>
                <div className="relative" ref={dropdownRef}>
                  <div 
                    className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm transition-all cursor-pointer flex justify-between items-center ${!formData.area_id ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#E58032]'}`}
                    onClick={() => formData.area_id && setIsBangunanOpen(!isBangunanOpen)}
                  >
                    <span className={formData.bangunan_ids.length > 0 ? "text-[#052334]" : "text-slate-400"}>
                      {formData.bangunan_ids.length > 0 
                        ? `${formData.bangunan_ids.length} bangunan dipilih` 
                        : (formData.area_id ? "-- Pilih Bangunan --" : "-- Pilih Area Terlebih Dahulu --")}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isBangunanOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {isBangunanOpen && formData.area_id && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                      <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Cari bangunan..." 
                          className="w-full bg-transparent text-sm focus:outline-none"
                          value={bangunanSearch}
                          onChange={(e) => setBangunanSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto p-2">
                        {filteredBangunanList.length > 0 ? (
                          filteredBangunanList.map(b => (
                            <div 
                              key={b.id} 
                              className={`px-3 py-2 text-sm rounded-md cursor-pointer flex items-center gap-3 transition-colors ${formData.bangunan_ids.includes(b.id) ? 'bg-[#E58032]/10 text-[#E58032] font-semibold' : 'hover:bg-slate-100 text-slate-600'}`}
                              onClick={() => toggleBangunan(b.id)}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${formData.bangunan_ids.includes(b.id) ? 'border-[#E58032] bg-[#E58032]' : 'border-slate-300'}`}>
                                {formData.bangunan_ids.includes(b.id) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              {b.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-4 text-sm text-center text-slate-500 italic">
                            Tidak ada bangunan ditemukan
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* Tampilkan bangunan yang dipilih secara berurutan bernomor */}
                {formData.bangunan_ids.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {formData.bangunan_ids.map((id, index) => {
                      const b = bangunanList.find(b => b.id === id);
                      return b ? (
                        <div key={id} className="text-xs text-[#052334] font-medium flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#E58032]/10 text-[#E58032] flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          {b.name}
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 mb-2">Keluhan / Permintaan *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Jelaskan detail keluhan atau permintaan Anda di sini..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] transition-all resize-none"></textarea>
            </div>

            {/* Upload Lampiran Dinamis */}
            {formData.bangunan_ids.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formData.bangunan_ids.map((id, index) => {
                  const b = bangunanList.find(b => b.id === id);
                  const fileName = fileNames[id];
                  return (
                    <div key={id}>
                      <label className="block text-xs font-bold text-slate-500 mb-2 truncate">
                        Lampiran {index + 1}: {b?.name || `Bangunan ${index + 1}`}
                      </label>
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${fileName ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                          {fileName ? (
                            <>
                              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 mx-auto" />
                              <p className="text-sm font-bold text-emerald-700 truncate w-full">{fileName}</p>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-8 h-8 text-slate-400 mb-2 mx-auto" />
                              <p className="text-sm text-slate-500 font-medium">Upload foto temuan</p>
                              <p className="text-xs text-slate-400 mt-1">Max 5MB</p>
                            </>
                          )}
                        </div>
                        <input type="file" accept="image/png, image/jpeg, application/pdf" className="hidden" onChange={(e) => handleFileChangeDynamic(e, id)} />
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <UploadCloud className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-500">Form upload lampiran akan muncul di sini</p>
                <p className="text-xs text-slate-400 mt-1">Silakan pilih bangunan terlebih dahulu pada field di atas.</p>
              </div>
            )}
          </section>

          {/* Tombol Aksi (Footer Form) */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => navigate('/dashboard-infra')} className="px-6 py-3 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-lg text-sm font-bold text-white bg-[#052334] hover:bg-[#0A3349] shadow-lg shadow-[#052334]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> MENGIRIM...
                </>
              ) : 'Submit Pengajuan'}
            </button>
          </div>

        </form>
      </div>
    </>
  );
};

export default PengajuanWOPage;