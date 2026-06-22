import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, FileText, User, MapPin, Save, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

// DetailField moved outside
const DetailField = ({ label, value }) => (
  <div>
    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
    <div className="text-sm font-semibold text-slate-800">{value}</div>
  </div>
);

const FormIsiNoWOPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [generatedWO, setGeneratedWO] = useState('');
  const [wo, setWo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatLocalDate = (utcDateString) => {
    if (!utcDateString) return '';
    const date = new Date(utcDateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchWO();
  }, [id]);

  async function fetchWO() {
    try {
      setLoading(true);
      const res = await api.get(`/work-orders/${id}`);
      setWo(res.data);
      
      // Ambil seluruh WO untuk menghitung urutan
      const allWoRes = await api.get('/work-orders');
      const allWos = allWoRes.data;

      // Generate No. WO otomatis berdasarkan urutan tahun ini
      const date = new Date();
      const year = date.getFullYear();
      
      const wosWithNumber = allWos.filter(w => w.no_wo && w.no_wo.includes(`/${year}`));
      const sequence = String(wosWithNumber.length + 1).padStart(3, '0');
      
      const monthRomans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
      const romanMonth = monthRomans[date.getMonth()];
      
      setGeneratedWO(`${sequence}/CGA/WO/${romanMonth}/${year}`);
    } catch (error) {
      console.error('Gagal mengambil detail WO:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!generatedWO.trim()) {
      Swal.fire({ title: 'Perhatian!', text: 'No. WO tidak boleh kosong!', icon: 'warning', confirmButtonColor: '#E58032' });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.patch(`/work-orders/${id}/no-wo`, {
        no_wo: generatedWO
      });
      window.dispatchEvent(new Event('refreshNotifications'));
      Swal.fire({ title: 'Berhasil!', text: 'Nomor WO berhasil disimpan!', icon: 'success', confirmButtonColor: '#052334' }).then(() => {
        navigate('/isi-no-wo');
      });
    } catch (error) {
      Swal.fire({ title: 'Gagal!', text: 'Gagal menyimpan No. WO!', icon: 'error', confirmButtonColor: '#E58032' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E58032]" />
      </div>
    );
  }

  if (!wo) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 font-medium">Work Order tidak ditemukan.</p>
        <button onClick={() => navigate('/isi-no-wo')} className="mt-4 text-sm text-[#E58032] font-bold hover:underline">Kembali</button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/isi-no-wo')} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#052334]">Update Nomor Work Order</h1>
          <p className="text-slate-500 text-sm mt-1">Review data pengajuan dan tetapkan Nomor WO resmi.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden mb-10">
        
        <div className="bg-[#052334] p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden">
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

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          
          <section>
            <h3 className="text-sm font-black text-[#052334] uppercase tracking-widest border-b border-slate-100 pb-2 mb-6 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#E58032]" /> 1. Informasi Pengajuan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Pengajuan Perbaikan</label>
                <input type="text" value={wo.title} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Tanggal Pengajuan</label>
                <input type="date" value={formatLocalDate(wo.createdAt)} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-not-allowed" />
              </div>
              {/* INPUT NOMOR WO YANG AKTIF & OTOMATIS */}
              <div>
                <label className="block text-xs font-black text-[#E58032] mb-2">No. Work Order (Otomatis)</label>
                <input 
                  type="text" 
                  value={generatedWO}
                  onChange={(e) => setGeneratedWO(e.target.value)}
                  className="w-full px-4 py-2.5 bg-orange-50/50 border-2 border-[#E58032]/50 rounded-lg text-sm text-[#052334] font-black focus:outline-none focus:border-[#E58032] focus:ring-2 focus:ring-[#E58032]/20 transition-all shadow-inner" 
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black text-[#052334] uppercase tracking-widest border-b border-slate-100 pb-2 mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-[#E58032]" /> 2. Diajukan Oleh
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Nama Lengkap</label>
                <input type="text" value={wo.requester?.full_name || '-'} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">NRP / Jabatan</label>
                <input type="text" value={wo.requester?.nrp || '-'} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Section / Departemen</label>
                <input type="text" value={wo.requester?.department || '-'} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">No. HP / Email</label>
                <input type="text" value={wo.requester?.contact || '-'} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-not-allowed" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black text-[#052334] uppercase tracking-widest border-b border-slate-100 pb-2 mb-6 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#E58032]" /> 3. Detail Pengajuan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Area</label>
                <input type="text" value={wo.area?.name || '-'} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Bangunan</label>
                <input type="text" value={wo.bangunans && wo.bangunans.length > 0 ? wo.bangunans.map((b, i) => `${i + 1}. ${b.name}`).join(', ') : '-'} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-not-allowed" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Keluhan / Permintaan</label>
              <textarea rows="3" value={wo.description} disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-not-allowed resize-none"></textarea>
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => navigate('/isi-no-wo')} className="px-6 py-3 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting || !generatedWO.trim()} className="px-8 py-3 rounded-lg text-sm font-bold text-white bg-[#052334] hover:bg-[#0A3349] shadow-lg shadow-[#052334]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> MENYIMPAN...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan Nomor WO
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </>
  );
};

export default FormIsiNoWOPage;