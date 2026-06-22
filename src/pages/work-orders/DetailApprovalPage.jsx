import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { ChevronLeft, X, Upload, Download, Printer, User, Briefcase, MapPin, Image as ImageIcon, ClipboardCheck, PenTool, Settings, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

const DetailApprovalPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const sourceStatus = location.state?.sourceStatus || '';
  
  // State untuk data WO dari API
  const [wo, setWo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Modal TTD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeApprovalType, setActiveApprovalType] = useState(null);
  const [tanggalApproval, setTanggalApproval] = useState('');
  const [statusApprove, setStatusApprove] = useState('');
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [alasanTolak, setAlasanTolak] = useState('');

  // State Modal Image Lightbox
  const [selectedImage, setSelectedImage] = useState(null);

  // State Modal Progress
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [tanggalPelaksanaan, setTanggalPelaksanaan] = useState('');
  const [tanggalUpdateStatus, setTanggalUpdateStatus] = useState('');
  const [progressStatus, setProgressStatus] = useState('');

  // Fungsionalitas Upload & Download
  const fileInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const defaultImage = "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=600&auto=format&fit=crop";
  const [lampiranImage, setLampiranImage] = useState(defaultImage);
  
  const [savedSignatures, setSavedSignatures] = useState(() => {
    const saved = localStorage.getItem('gact_signatures');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchWO();
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isModalOpen) setIsModalOpen(false);
        if (isProgressModalOpen) setIsProgressModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isProgressModalOpen]);

  const fetchWO = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/work-orders/${id}`);
      setWo(res.data);
      if (res.data.lampiran_urls && res.data.lampiran_urls.length > 0) {
        setLampiranImage(res.data.lampiran_urls[0]);
      } else {
        setLampiranImage(defaultImage);
      }
    } catch (error) {
      console.error('Gagal mengambil detail WO:', error);
    } finally {
      setLoading(false);
    }
  };

  // Derive status from WO data
  const isDiketahuiApproved = wo?.approvals?.some(a => a.approval_type === 'DIKETAHUI' && a.status === 'APPROVED') || false;
  const isDisetujuiApproved = wo?.approvals?.some(a => a.approval_type === 'DISETUJUI' && a.status === 'APPROVED') || false;
  const isDiketahuiRejected = wo?.approvals?.some(a => a.approval_type === 'DIKETAHUI' && a.status === 'REJECTED') || false;
  const isDisetujuiRejected = wo?.approvals?.some(a => a.approval_type === 'DISETUJUI' && a.status === 'REJECTED') || false;
  const isProgressClosed = wo?.status === 'CLOSED';

  // Layout flags
  let pageTitle = 'Detail Pengajuan Work Order';
  if (sourceStatus === 'menunggu-sh') pageTitle = 'Status Approval SH';
  else if (sourceStatus === 'menunggu-uh') pageTitle = 'Status Approval UH';
  else if (sourceStatus === 'rejected') pageTitle = 'Dokumen Ditolak (Rejected)';
  else if (sourceStatus === 'all') pageTitle = 'Dokumen Work Order';
  else if (sourceStatus === 'on-progress' || sourceStatus === 'selesai' || sourceStatus === 'approved') pageTitle = 'Dokumen Approved';

  const isProgressLayout = sourceStatus === 'on-progress' || sourceStatus === 'selesai';
  
  const userRole = localStorage.getItem('userRole') || 'USER';
  const isReadOnlyUH = userRole === 'ADMIN' ? false : (userRole === 'UH_CGA' ? false : true);
  const isReadOnlySH = userRole === 'ADMIN' ? false : (userRole === 'SH_CGA' ? false : true);

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setLampiranImage(imageUrl);
      Swal.fire({ title: 'Berhasil', text: `File "${file.name}" berhasil dipilih (Preview Lokal).`, icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
  };

  const handleDownloadClick = () => {
    const link = document.createElement('a');
    link.href = lampiranImage;
    link.download = 'Lampiran_Dokumen_WO.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('signature', file);

    try {
      const res = await api.post('/upload-signature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUrl = res.data.url;
      
      const updatedSigs = [newUrl, ...savedSignatures].slice(0, 2);
      setSavedSignatures(updatedSigs);
      localStorage.setItem('gact_signatures', JSON.stringify(updatedSigs));
      setSelectedSignature(newUrl); // Auto select

    } catch (error) {
      Swal.fire({ title: 'Gagal', text: 'Gagal mengupload tanda tangan', icon: 'error' });
      console.error(error);
    }
  };

  const openApprovalModal = (type) => {
    setActiveApprovalType(type);
    setIsModalOpen(true);
    setTanggalApproval('');
    setStatusApprove('');
    setSelectedSignature(null);
    setAlasanTolak('');
  };

  const handleSimpanApproval = async () => {
    if (!tanggalApproval || !statusApprove || !selectedSignature) {
      Swal.fire({ title: 'Perhatian', text: 'Harap lengkapi tanggal, status, dan pilih tanda tangan!', icon: 'warning' });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/work-orders/${id}/approval`, {
        approval_type: activeApprovalType,
        status: statusApprove,
        reject_reason: alasanTolak || null,
        signature_url: selectedSignature
      });
      setIsModalOpen(false);
      fetchWO(); // Refresh data
      window.dispatchEvent(new Event('refreshNotifications')); // Trigger notif update
      Swal.fire({ title: 'Berhasil', text: 'Persetujuan berhasil disimpan!', icon: 'success' });
    } catch (error) {
      Swal.fire({ title: 'Gagal', text: 'Gagal menyimpan persetujuan!', icon: 'error' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimpanProgress = async () => {
    if (!tanggalPelaksanaan || !tanggalUpdateStatus || !progressStatus) {
      Swal.fire({ title: 'Perhatian', text: 'Harap lengkapi tanggal pelaksanaan, penyelesaian, dan status!', icon: 'warning' });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/work-orders/${id}/progress`, {
        status: progressStatus,
        tgl_pelaksanaan: tanggalPelaksanaan,
        tgl_selesai: tanggalUpdateStatus
      });
      setIsProgressModalOpen(false);
      fetchWO(); // Refresh data
      window.dispatchEvent(new Event('refreshNotifications')); // Trigger notif update
      Swal.fire({ title: 'Berhasil', text: 'Status pekerjaan berhasil diupdate!', icon: 'success' });
    } catch (error) {
      Swal.fire({ title: 'Gagal', text: 'Gagal mengupdate status!', icon: 'error' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable Field Component
  const DetailField = ({ label, value }) => (
    <div>
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3298A0]" />
      </div>
    );
  }

  if (!wo) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 font-medium">Work Order tidak ditemukan.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-[#3298A0] font-bold hover:underline">Kembali</button>
      </div>
    );
  }

  // Get approver names from approvals data
  const approvalDiketahui = wo.approvals?.find(a => a.approval_type === 'DIKETAHUI');
  const approvalDisetujui = wo.approvals?.find(a => a.approval_type === 'DISETUJUI');
  const namaDiketahui = approvalDiketahui?.approver?.full_name || 'Anas Baharudin. E';
  const namaDisetujui = approvalDisetujui?.approver?.full_name || 'M. Gazali Rahman';
  const tglDiketahui = approvalDiketahui ? new Date(approvalDiketahui.approvedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
  const tglDisetujui = approvalDisetujui ? new Date(approvalDisetujui.approvedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

  return (
    <div className="bg-[#f4f7f9] min-h-screen pb-16 font-sans">
      
      {/* Top Navigation Bar */}
      <div className="max-w-4xl mx-auto pt-10 px-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#052334] transition-colors"
        >
          <div className="bg-white p-1.5 rounded-md shadow-sm border border-slate-200 group-hover:border-[#3298A0] transition-colors">
            <ChevronLeft className="w-4 h-4 group-hover:text-[#3298A0]" />
          </div>
          Kembali ke List
        </button>
      </div>

      {/* Main Card Container */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
        
        {/* Top Accent Gradient Line */}
        <div className="h-2 w-full bg-gradient-to-r from-[#052334] via-[#3298A0] to-[#E58032]"></div>

        {/* Card Header */}
        <div className="p-8 md:p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-6">
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#3298A0]/10 rounded-lg">
                <ClipboardCheck className="w-6 h-6 text-[#3298A0]" />
              </div>
              <h1 className="text-2xl font-bold text-[#052334]">{pageTitle}</h1>
            </div>
            <p className="text-sm text-slate-500 ml-12">Formulir digital pengajuan perbaikan / pemeliharaan infrastruktur.</p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="text-[10px] font-bold text-slate-400 tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              FORM NO: ADMO/CGA/20/F-001
            </div>
            {sourceStatus === 'all' && (
              <button 
                onClick={() => window.open(`/cetak-pdf/${id}`, '_blank')}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" /> Cetak PDF
              </button>
            )}
            {isProgressLayout && !isProgressClosed && (
              <>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button 
                  onClick={handleUploadClick}
                  className="flex items-center gap-2 bg-[#3bb2eb]/10 hover:bg-[#3bb2eb]/20 text-[#3bb2eb] border border-[#3bb2eb]/30 px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-sm"
                >
                  <Upload className="w-4 h-4" /> Upload Hasil
                </button>
              </>
            )}
          </div>

        </div>

        {/* Card Body - Content Sections */}
        <div className="p-8 md:p-10 space-y-10">
          
          {/* Section 1: Informasi Pekerjaan */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-800">
                {isProgressLayout ? 'Jenis Pekerjaan' : 'Jenis Pengajuan'}
              </h3>
            </div>
            <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DetailField label={isProgressLayout ? 'Pekerjaan' : 'Pengajuan'} value={wo.title} />
              <DetailField label="Tanggal Pengajuan" value={new Date(wo.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <DetailField label="No. Work Order" value={wo.no_wo || '(Belum ada)'} />
            </div>
          </section>

          {/* Section 2: Diajukan Oleh */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-800">Pemohon (Diajukan Oleh)</h3>
            </div>
            <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DetailField label="Nama Lengkap" value={wo.requester?.full_name || '-'} />
              <DetailField label="NRP / Jabatan" value={wo.requester?.nrp || '-'} />
              <DetailField label="Departemen" value={wo.requester?.department || '-'} />
              <DetailField label="Kontak (HP/Email)" value={wo.requester?.contact || '-'} />
            </div>
          </section>

          {/* Section 3: Detail Lokasi */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-800">Detail Lokasi & Keluhan</h3>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[11px] tracking-wider">No</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[11px] tracking-wider">Lokasi</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[11px] tracking-wider">Bangunan</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[11px] tracking-wider">Keluhan / Permintaan</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">1</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{wo.area?.name || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {wo.bangunans && wo.bangunans.length > 0 
                        ? wo.bangunans.map((b, i) => `${i + 1}. ${b.name}`).join(', ') 
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{wo.description}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Lampiran Visual */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <ImageIcon className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-800">Lampiran Visual</h3>
            </div>
            <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 flex flex-wrap gap-4">
              
              {/* Looping semua lampiran temuan */}
              {wo.lampiran_urls && wo.lampiran_urls.length > 0 ? (
                wo.lampiran_urls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm inline-block">
                    <img 
                      src={url} 
                      alt={`Lampiran Temuan ${idx + 1}`} 
                      className="max-w-[400px] w-full max-h-[300px] object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => setSelectedImage(url)}>
                      <button 
                        className="bg-white text-[#052334] px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all"
                      >
                        <ImageIcon className="w-4 h-4" /> Buka Gambar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400 italic p-4 bg-slate-100 rounded-lg border border-slate-200">
                  Tidak ada lampiran foto temuan.
                </div>
              )}
              
              {/* Preview Upload Progress (jika ada file lokal yang diupload) */}
              {lampiranImage !== defaultImage && !wo.lampiran_urls?.includes(lampiranImage) && (
                <div className="relative group rounded-xl overflow-hidden border-2 border-emerald-400 shadow-sm inline-block">
                  <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">
                    PREVIEW HASIL
                  </div>
                  <img 
                    src={lampiranImage} 
                    alt="Preview Progress" 
                    className="max-w-[400px] w-full max-h-[300px] object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isProgressLayout && (
                      <button 
                        onClick={handleDownloadClick}
                        className="bg-white text-[#052334] px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all"
                      >
                        <Download className="w-4 h-4" /> Download Gambar
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 5: Persetujuan / Status Pekerjaan */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <PenTool className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-800">
                {isProgressLayout ? 'Status Eksekusi Pekerjaan' : 'Verifikasi & Persetujuan'}
              </h3>
            </div>

            {isProgressLayout ? (
              
              // ------------------- PROGRESS LAYOUT -------------------
              <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm text-center w-full max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-2">Section Head Unit</h4>
                <p className="text-lg font-black text-[#052334] mb-1">{wo.requester?.full_name || '-'}</p>
                <div className="text-xs text-slate-400 mb-6 font-medium">
                  {isProgressClosed 
                    ? `Diupdate pada: ${wo.progress?.completedAt ? new Date(wo.progress.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}` 
                    : 'Belum ada update status'}
                </div>
                
                <div className="min-h-[60px] flex items-center justify-center border-t border-slate-100 pt-6 mt-6">
                  {isProgressClosed ? (
                    <div className="bg-emerald-50 text-emerald-600 px-8 py-2.5 rounded-full text-sm font-black tracking-widest uppercase border border-emerald-200 flex items-center gap-2 cursor-default">
                      <ClipboardCheck className="w-4 h-4" /> SELESAI
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsProgressModalOpen(true)}
                      className="bg-gradient-to-r from-[#E58032] to-[#f59e0b] hover:from-[#d9772b] hover:to-[#d97706] text-white px-8 py-3 rounded-xl text-xs font-black tracking-widest border border-orange-500 shadow-[0_4px_14px_0_rgba(229,128,50,0.39)] transition-all uppercase flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 animate-spin-slow" /> Update Progress
                    </button>
                  )}
                </div>
              </div>

            ) : (

              // ------------------- APPROVAL LAYOUT -------------------
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Kolom 1: Diketahui Oleh */}
                <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm text-center relative overflow-hidden">
                  {isDiketahuiApproved && <div className="absolute top-0 right-0 w-2 h-full bg-emerald-400"></div>}
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Diketahui Oleh</h4>
                  <p className="text-xs font-bold text-slate-800 uppercase mb-4">Section Head User</p>
                  
                  <div className="min-h-[120px] flex flex-col items-center justify-center my-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                    {isDiketahuiApproved ? (
                      <img src={approvalDiketahui?.signature_url || ""} alt="Signature" className="h-16 mix-blend-multiply" />
                    ) : isDiketahuiRejected ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-red-600 px-4 py-2 bg-red-50 rounded-lg border border-red-200 shadow-sm uppercase tracking-wider flex items-center gap-2 mb-2">
                          <X className="w-4 h-4" /> REJECTED
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium text-center italic">"{approvalDiketahui?.reject_reason || 'Tidak ada alasan penolakan'}"</p>
                      </div>
                    ) : (
                      isReadOnlyUH ? (
                        <span className="text-xs font-bold text-slate-400 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm uppercase tracking-wider flex items-center gap-2">
                          <X className="w-3 h-3" /> Menunggu TTD
                        </span>
                      ) : (
                        <button 
                          onClick={() => openApprovalModal('DIKETAHUI')}
                          className="bg-[#fecb16] hover:bg-[#eab308] text-[#052334] px-6 py-2.5 rounded-lg text-xs font-black tracking-widest shadow-sm transition-all hover:-translate-y-0.5 uppercase border border-yellow-400"
                        >
                          Beri Persetujuan
                        </button>
                      )
                    )}
                  </div>
                  
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-sm font-black text-[#052334] uppercase tracking-wide">{namaDiketahui}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      {isDiketahuiApproved ? `Tgl: ${tglDiketahui}` : '-'}
                    </p>
                  </div>
                </div>

                {/* Kolom 2: Disetujui Oleh */}
                <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm text-center relative overflow-hidden">
                  {isDisetujuiApproved && <div className="absolute top-0 right-0 w-2 h-full bg-emerald-400"></div>}
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Disetujui Oleh</h4>
                  <p className="text-xs font-bold text-slate-800 uppercase mb-4">Section Head CGA</p>
                  
                  <div className="min-h-[120px] flex flex-col items-center justify-center my-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                    {isDisetujuiApproved ? (
                      <img src={approvalDisetujui?.signature_url || ""} alt="Signature" className="h-16 mix-blend-multiply" />
                    ) : isDisetujuiRejected ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-red-600 px-4 py-2 bg-red-50 rounded-lg border border-red-200 shadow-sm uppercase tracking-wider flex items-center gap-2 mb-2">
                          <X className="w-4 h-4" /> REJECTED
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium text-center italic">"{approvalDisetujui?.reject_reason || 'Tidak ada alasan penolakan'}"</p>
                      </div>
                    ) : (
                      isReadOnlySH ? (
                        <span className="text-xs font-bold text-slate-400 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm uppercase tracking-wider flex items-center gap-2">
                          <X className="w-3 h-3" /> Menunggu TTD
                        </span>
                      ) : (
                        <button 
                          onClick={() => openApprovalModal('DISETUJUI')}
                          className="bg-[#fecb16] hover:bg-[#eab308] text-[#052334] px-6 py-2.5 rounded-lg text-xs font-black tracking-widest shadow-sm transition-all hover:-translate-y-0.5 uppercase border border-yellow-400"
                        >
                          Beri Persetujuan
                        </button>
                      )
                    )}
                  </div>
                  
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-sm font-black text-[#052334] uppercase tracking-wide">{namaDisetujui}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      {isDisetujuiApproved ? `Tgl: ${tglDisetujui}` : '-'}
                    </p>
                  </div>
                </div>

              </div>
            )}
          </section>

        </div>
      </div>

      {/* ================= MODAL PERSETUJUAN ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Persetujuan Pengajuan Perbaikan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSimpanApproval(); }}>
              <div className="p-6 space-y-5 bg-slate-50/30">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide">Tanggal {activeApprovalType}</label>
                  <input 
                    type="date"
                    value={tanggalApproval}
                    onChange={(e) => setTanggalApproval(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-2 focus:ring-[#3298A0]/20 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide">Status Keputusan</label>
                  <select 
                    value={statusApprove}
                    onChange={(e) => setStatusApprove(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#3298A0] focus:ring-2 focus:ring-[#3298A0]/20 transition-all shadow-sm cursor-pointer"
                  >
                    <option value="">-- Pilih Keputusan --</option>
                    <option value="APPROVED">Diizinkan (Approved)</option>
                    <option value="REJECTED">Ditolak (Rejected)</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">Pilih Tanda Tangan</label>
                    <button 
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      className="text-[10px] font-bold text-[#3298A0] hover:text-[#052334] flex items-center gap-1 transition-colors bg-[#3298A0]/10 px-2 py-1 rounded"
                    >
                      <Upload className="w-3 h-3" /> Upload TTD Baru
                    </button>
                    <input type="file" accept="image/*" ref={signatureInputRef} onChange={handleSignatureUpload} className="hidden" />
                  </div>
                  <div className="border border-slate-200 bg-white rounded-xl p-3 flex gap-3 overflow-x-auto shadow-sm min-h-[88px] custom-scrollbar pb-2">
                    {savedSignatures.length > 0 ? (
                      savedSignatures.map((sig, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedSignature(sig)} 
                          className={`w-24 h-16 rounded-lg cursor-pointer flex items-center justify-center p-2 transition-all ${selectedSignature === sig ? 'bg-[#3298A0]/10 border-2 border-[#3298A0]' : 'bg-slate-50 border border-slate-200 hover:border-[#3298A0]/50'}`}
                        >
                          <img src={sig} alt={`Signature ${idx + 1}`} className="max-h-full max-w-full opacity-70 mix-blend-multiply" />
                        </div>
                      ))
                    ) : (
                      <div className="w-full flex items-center justify-center text-xs text-slate-400 font-medium">
                        Belum ada tanda tangan yang tersimpan. Klik Upload.
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide">Alasan Penolakan (Opsional)</label>
                  <textarea 
                    value={alasanTolak}
                    onChange={(e) => setAlasanTolak(e.target.value)}
                    placeholder="Isi jika status ditolak..."
                    disabled={statusApprove === 'APPROVED'}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 h-24 resize-none focus:outline-none focus:border-[#3298A0] focus:ring-2 focus:ring-[#3298A0]/20 transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                  ></textarea>
                </div>
              </div>
              <div className="bg-white border-t border-slate-100 px-6 py-4 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="bg-[#052334] hover:bg-[#083b57] text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> MENYIMPAN...
                    </>
                  ) : 'Konfirmasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL UPDATE PROGRESS ================= */}
      {isProgressModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsProgressModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Update Status Pekerjaan</h3>
              <button onClick={() => setIsProgressModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSimpanProgress(); }}>
              <div className="p-6 space-y-5 bg-slate-50/30">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide">Tanggal Pelaksanaan (Mulai)</label>
                  <input 
                    type="date"
                    value={tanggalPelaksanaan}
                    onChange={(e) => setTanggalPelaksanaan(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#E58032] focus:ring-2 focus:ring-[#E58032]/20 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide">Tanggal Penyelesaian (Selesai)</label>
                  <input 
                    type="date"
                    value={tanggalUpdateStatus}
                    onChange={(e) => setTanggalUpdateStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#E58032] focus:ring-2 focus:ring-[#E58032]/20 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide">Status Akhir</label>
                  <select 
                    value={progressStatus}
                    onChange={(e) => setProgressStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#E58032] focus:ring-2 focus:ring-[#E58032]/20 transition-all shadow-sm cursor-pointer"
                  >
                    <option value="">-- Pilih --</option>
                    <option value="SELESAI">Pekerjaan Selesai (Closed)</option>
                    <option value="DIBATALKAN">Dibatalkan</option>
                  </select>
                </div>
              </div>
              <div className="bg-white border-t border-slate-100 px-6 py-4 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="bg-[#E58032] hover:bg-[#d9772b] text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> MENYIMPAN...
                    </>
                  ) : 'Simpan Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL IMAGE LIGHTBOX ================= */}
      {selectedImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-red-500 transition-colors bg-black/50 p-2 rounded-full" onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}>
            <X className="w-6 h-6" />
          </button>
          <img src={selectedImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default DetailApprovalPage;
