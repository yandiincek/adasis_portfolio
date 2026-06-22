import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Upload, CheckCircle, Image as ImageIcon, Loader2, Info, Check, Clock, Save, X, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import Swal from 'sweetalert2';

const ProgressDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const sourceStatus = location.state?.sourceStatus || 'on-progress';
  
  const userRole = localStorage.getItem('userRole') || 'USER';
  const canUpdateProgress = userRole !== 'USER';

  const [wo, setWo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getLocalDatetime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localNow = new Date(now.getTime() - (offset * 60 * 1000));
    return localNow.toISOString().slice(0, 16);
  };
  
  const [tglPelaksanaan, setTglPelaksanaan] = useState(getLocalDatetime());
  const [tglSelesai, setTglSelesai] = useState(getLocalDatetime());
  const [isSavingStart, setIsSavingStart] = useState(false);

  // Image Viewer State
  const [viewerImages, setViewerImages] = useState([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openImageViewer = (lampiranUrls) => {
    const images = Array.isArray(lampiranUrls) ? lampiranUrls : [lampiranUrls].filter(Boolean);
    if (images.length > 0) {
      setViewerImages(images);
      setCurrentImageIndex(0);
      setIsViewerOpen(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isViewerOpen) return;
      if (e.key === 'Escape') setIsViewerOpen(false);
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex(prev => Math.max(0, prev - 1));
      }
      if (e.key === 'ArrowRight') {
        setCurrentImageIndex(prev => Math.min(viewerImages.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen, viewerImages.length]);

  useEffect(() => {
    fetchWO();
  }, [id]);

  async function fetchWO() {
    try {
      setLoading(true);
      const res = await api.get(`/work-orders/${id}`);
      setWo(res.data);
      if (res.data.progress?.startedAt) {
        setTglPelaksanaan(new Date(res.data.progress.startedAt).toISOString().slice(0, 16));
      }
    } catch (error) {
      console.error('Gagal mengambil data WO:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        Swal.fire({ title: 'Gagal!', text: 'Ukuran file melebihi batas maksimal 5MB!', icon: 'error', confirmButtonColor: '#E58032' });
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSaveStart = async (e) => {
    e.preventDefault();
    setIsSavingStart(true);
    try {
      await api.post(`/work-orders/${id}/start`, {
        tgl_pelaksanaan: tglPelaksanaan
      });
      fetchWO();
      Swal.fire({ title: 'Berhasil!', text: 'Tanggal Pelaksanaan berhasil disimpan!', icon: 'success', confirmButtonColor: '#052334' });
    } catch (error) {
      console.error(error);
      Swal.fire({ title: 'Gagal!', text: 'Terjadi kesalahan saat menyimpan tanggal pelaksanaan.', icon: 'error', confirmButtonColor: '#E58032' });
    } finally {
      setIsSavingStart(false);
    }
  };

  const handleSubmitProgress = async (e) => {
    e.preventDefault();
    if (!file) {
      Swal.fire({ title: 'Perhatian!', text: 'Harap unggah foto hasil perbaikan!', icon: 'warning', confirmButtonColor: '#E58032' });
      return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('lampiran_hasil', file);
    formData.append('tgl_selesai', tglSelesai);

    try {
      await api.post(`/work-orders/${id}/progress`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Swal.fire({ title: 'Berhasil!', text: 'Progress berhasil disimpan dan Work Order diselesaikan!', icon: 'success', confirmButtonColor: '#052334' }).then(() => {
        navigate('/dashboard-infra');
      });
    } catch (error) {
      console.error(error);
      Swal.fire({ title: 'Gagal!', text: 'Terjadi kesalahan saat menyimpan progress.', icon: 'error', confirmButtonColor: '#E58032' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    try {
      await api.post(`/work-orders/${id}/acknowledge`);
      Swal.fire({ title: 'Berhasil!', text: 'Anda telah menerima hasil pekerjaan ini.', icon: 'success', confirmButtonColor: '#052334' });
      fetchWO();
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (error) {
      console.error(error);
      Swal.fire({ title: 'Gagal!', text: 'Gagal melakukan konfirmasi.', icon: 'error', confirmButtonColor: '#E58032' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#E58032]" />
          <p className="text-sm font-medium text-slate-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!wo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Data Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mb-6">Work Order yang Anda cari mungkin sudah dihapus atau tidak tersedia.</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-[#052334] text-white font-bold rounded-lg hover:bg-[#0A3349] transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const isClosed = wo.status === 'CLOSED';
  const isRejected = wo.status === 'REJECTED' || wo.approvals?.some(a => a.status === 'REJECTED');
  const rejectedApproval = wo.approvals?.find(a => a.status === 'REJECTED');
  const rejectReason = rejectedApproval?.reject_reason || 'Pekerjaan ini telah ditolak.';

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen bg-slate-50/50">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/approval-list/${sourceStatus}`)}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#052334] flex items-center gap-3">
              Detail Progress Pekerjaan
              {isClosed && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> SELESAI
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              No. WO FSE: <span className="font-bold text-[#3298A0]">{wo.no_wo || '-'}</span>
            </p>
          </div>
        </div>
        {isClosed && (
          <button 
            onClick={() => window.open(`/cetak-pdf-hasil/${id}`, '_blank')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#052334] hover:bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-md transition-all shrink-0 hover:-translate-y-0.5"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan (PDF)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Info Pengajuan (Tabel Style) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-[#052334] px-6 py-3 border-b border-slate-200 flex items-center gap-2">
            <Info className="w-4 h-4 text-white" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Informasi Pengajuan</h3>
          </div>
          <div className="p-0">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <th className="w-1/3 md:w-1/4 px-6 py-3 text-slate-500 font-medium bg-slate-50/50">Pengajuan / Pekerjaan</th>
                  <td className="px-6 py-3 font-bold text-slate-800">{wo.title}</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <th className="w-1/3 md:w-1/4 px-6 py-3 text-slate-500 font-medium bg-slate-50/50">Tanggal Pengajuan</th>
                  <td className="px-6 py-3 font-medium text-slate-700">{new Date(wo.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <th className="w-1/3 md:w-1/4 px-6 py-3 text-slate-500 font-medium bg-slate-50/50">Diajukan Oleh</th>
                  <td className="px-6 py-3">
                    <div className="font-bold text-slate-800">{wo.requester?.full_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{wo.requester?.nrp} - {wo.requester?.department}</div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <th className="w-1/3 md:w-1/4 px-6 py-3 text-slate-500 font-medium bg-slate-50/50">Lokasi / Bangunan</th>
                  <td className="px-6 py-3 font-medium text-slate-700">
                    {wo.area?.name} / {wo.bangunans && wo.bangunans.length > 0 ? wo.bangunans.map((b, i) => `${i + 1}. ${b.name}`).join(', ') : '-'}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <th className="w-1/3 md:w-1/4 px-6 py-3 text-slate-500 font-medium bg-slate-50/50">Keluhan / Permintaan</th>
                  <td className="px-6 py-3 text-slate-700">{wo.description}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Gambar Sebelum & Sesudah */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Gambar Temuan (Before) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider text-center">Gambar Temuan (Before)</h3>
            </div>
            <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50/30">
              {wo.lampiran_urls && wo.lampiran_urls.length > 0 ? (
                <div className="w-full max-w-sm rounded-lg overflow-hidden border border-slate-200 shadow-sm relative group cursor-pointer" onClick={() => openImageViewer(wo.lampiran_urls)}>
                  <img src={wo.lampiran_urls[0]} alt="Temuan 1" className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  {wo.lampiran_urls.length > 1 && (
                    <div className="absolute top-2 right-2 bg-[#052334]/80 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                      1/{wo.lampiran_urls.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Tidak ada gambar temuan.</p>
                </div>
              )}
            </div>
          </div>

          {/* Gambar Hasil (After) atau Status Rejected */}
          {isRejected ? (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden flex flex-col">
              <div className="bg-red-50 px-6 py-3 border-b border-red-100">
                <h3 className="font-bold text-red-600 text-sm uppercase tracking-wider text-center">Status Pekerjaan</h3>
              </div>
              <div className="p-6 flex-1 flex flex-col items-center justify-center bg-red-50/30 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <X className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">Pekerjaan Dibatalkan (Rejected)</h4>
                <p className="text-sm text-slate-500 mb-4">Pengajuan Work Order ini telah ditolak sehingga tidak ada perbaikan yang akan dilakukan.</p>
                <div className="w-full bg-white border border-red-100 rounded-lg p-4 shadow-sm relative mt-2">
                  <span className="absolute -top-2.5 left-4 bg-red-50 px-2 text-[10px] font-bold text-red-500 uppercase tracking-wider border border-red-100 rounded">Alasan Penolakan</span>
                  <p className="text-sm font-medium text-slate-700 italic">"{rejectReason}"</p>
                </div>
              </div>
            </div>
          ) : (
          <div className="bg-white rounded-xl shadow-sm border border-[#E58032]/30 overflow-hidden flex flex-col">
            <div className="bg-[#E58032]/10 px-6 py-3 border-b border-[#E58032]/20">
              <h3 className="font-bold text-[#E58032] text-sm uppercase tracking-wider text-center">Gambar Perbaikan (After)</h3>
            </div>
            <div className="p-6 flex-1 flex flex-col bg-orange-50/10">
              
              {isClosed ? (
                // Tampilan Read-Only jika sudah selesai
                <div className="flex-1 flex flex-col items-center justify-center">
                  {wo.progress?.lampiran_hasil_url ? (
                    <div className="w-full max-w-sm rounded-lg overflow-hidden border border-emerald-200 shadow-sm relative group cursor-pointer ring-2 ring-emerald-500 ring-offset-2" onClick={() => openImageViewer([wo.progress.lampiran_hasil_url])}>
                      <img src={wo.progress.lampiran_hasil_url} alt="Hasil Perbaikan" className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-md">
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-sm font-medium">Tidak ada gambar hasil.</p>
                    </div>
                  )}
                  {wo.progress?.startedAt && (
                    <div className="mt-6 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Dilaksanakan: {new Date(wo.progress.startedAt).toLocaleString('id-ID')}
                    </div>
                  )}
                  {wo.progress?.completedAt && (
                    <div className="mt-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Diselesaikan: {new Date(wo.progress.completedAt).toLocaleString('id-ID')}
                    </div>
                  )}

                  {userRole === 'USER' && wo.progress && !wo.progress.is_acknowledged && (
                    <div className="mt-8 pt-6 border-t border-slate-200/60 w-full flex flex-col items-center">
                      <p className="text-xs text-slate-500 font-medium mb-3 text-center px-4">
                        Pekerjaan ini telah selesai. Silakan tekan tombol di bawah ini untuk konfirmasi penerimaan hasil.
                      </p>
                      <button
                        onClick={handleAcknowledge}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#052334] hover:bg-[#E58032] text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105"
                      >
                        <CheckCircle className="w-5 h-5" /> TERIMA HASIL PEKERJAAN
                      </button>
                    </div>
                  )}

                  {userRole === 'USER' && wo.progress?.is_acknowledged && (
                    <div className="mt-6 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      Hasil Telah Anda Konfirmasi
                    </div>
                  )}
                </div>
              ) : !wo.progress?.startedAt ? (
                // Tampilan Read Only atau Input Tanggal Pelaksanaan (Tahap 1)
                canUpdateProgress ? (
                  <form onSubmit={handleSaveStart} className="flex-1 flex flex-col items-center justify-center py-6">
                    <div className="w-full max-w-sm mx-auto mb-6">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal & Waktu Pelaksanaan</label>
                      <input 
                        type="datetime-local" 
                        required 
                        value={tglPelaksanaan} 
                        onChange={(e) => setTglPelaksanaan(e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] focus:ring-1 focus:ring-[#E58032] transition-all"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSavingStart}
                      className="w-full max-w-sm flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all"
                    >
                      {isSavingStart ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      SIMPAN TGL PELAKSANAAN
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-4 max-w-xs leading-relaxed">
                      Menyimpan tanggal pelaksanaan akan membuka fitur Upload Gambar Perbaikan.
                    </p>
                  </form>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">Menunggu Eksekusi Pekerjaan</h4>
                    <p className="text-sm text-slate-500">Work Order Anda telah disetujui. Tim terkait akan segera menjadwalkan dan melaksanakan pekerjaan ini.</p>
                  </div>
                )
              ) : (
                // Tampilan Read Only atau Upload jika sudah mulai dan masih On Progress (Tahap 2)
                canUpdateProgress ? (
                  <form onSubmit={handleSubmitProgress} className="flex-1 flex flex-col">
                    
                    <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex items-center gap-3 mb-6">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mulai Dilaksanakan</p>
                        <p className="text-sm font-bold text-slate-800">{new Date(wo.progress.startedAt).toLocaleString('id-ID')}</p>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center mb-6">
                      {preview ? (
                        <div className="w-full max-w-sm relative group">
                          <div className="rounded-lg overflow-hidden border-2 border-[#3298A0] shadow-md">
                            <img src={preview} alt="Preview Hasil" className="w-full h-64 object-cover" />
                          </div>
                          <label className="absolute -bottom-3 -right-3 bg-[#E58032] text-white p-3 rounded-full cursor-pointer shadow-lg hover:bg-[#D97706] transition-transform hover:scale-110">
                            <Upload className="w-5 h-5" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                          </label>
                        </div>
                      ) : (
                        <label className="w-full max-w-sm h-64 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 hover:border-[#E58032] transition-colors group">
                          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-[#E58032]" />
                          </div>
                          <span className="text-sm font-bold text-slate-600 group-hover:text-[#E58032]">Klik untuk Upload Foto Hasil</span>
                          <span className="text-xs text-slate-400 mt-2">Format: JPG, PNG (Max 5MB)</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      )}
                    </div>

                    <div className="w-full max-w-sm mx-auto mb-6">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal & Waktu Selesai Pekerjaan</label>
                      <input 
                        type="datetime-local" 
                        required 
                        value={tglSelesai} 
                        onChange={(e) => setTglSelesai(e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] focus:ring-1 focus:ring-[#E58032] transition-all"
                      />
                    </div>

                    <div className="mt-auto">
                      <button 
                        type="submit"
                        disabled={isSubmitting || !file}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold tracking-wide shadow-md shadow-emerald-600/20 transition-all"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            MENYIMPAN...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            SELESAIKAN PEKERJAAN
                          </>
                        )}
                      </button>
                      <p className="text-center text-xs text-slate-500 mt-3 font-medium">
                        Menekan tombol ini akan mengubah status Work Order menjadi <span className="font-bold text-emerald-600">SELESAI</span>.
                      </p>
                    </div>

                  </form>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8 animate-pulse" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">Pekerjaan Sedang Berlangsung</h4>
                    <p className="text-sm text-slate-500 mb-6">Tim infrastruktur telah mulai bekerja sejak:</p>
                    <div className="px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-[#052334] font-bold text-lg">
                      {new Date(wo.progress.startedAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                )
              )}

            </div>
          </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {isViewerOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-300"
          onClick={() => setIsViewerOpen(false)}
        >
          <button 
            onClick={() => setIsViewerOpen(false)}
            className="absolute top-6 right-6 md:top-8 md:right-8 text-white/70 hover:text-white p-2 transition-colors z-[110] bg-white/10 hover:bg-red-500/80 rounded-full backdrop-blur-sm"
          >
            <X className="w-6 h-6" />
          </button>

          {viewerImages.length > 1 && currentImageIndex > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev - 1); }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 z-[110] bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all hover:scale-110"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {viewerImages.length > 1 && currentImageIndex < viewerImages.length - 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev + 1); }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 z-[110] bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all hover:scale-110"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
          
          <div 
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center p-4 transition-transform duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={viewerImages[currentImageIndex]} 
              alt={`Preview ${currentImageIndex + 1}`} 
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            
            {viewerImages.length > 1 && (
              <div className="absolute bottom-[-30px] flex gap-2">
                {viewerImages.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressDetailPage;
