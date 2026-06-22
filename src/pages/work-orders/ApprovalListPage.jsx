import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Search, ChevronLeft, ChevronRight, Image as ImageIcon, Eye, CheckCircle2, Clock, XCircle, MoreHorizontal, X } from 'lucide-react';

const ApprovalListPage = () => {
  const { status } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [entries, setEntries] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  
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
  const [woList, setWoList] = useState([]);

  useEffect(() => {
    fetchWO();
  }, [status]);

  const fetchWO = async () => {
    try {
      const role = localStorage.getItem('userRole') || 'USER';
      const userId = localStorage.getItem('userId') || '';
      const res = await api.get(`/work-orders?status=${status || 'all'}&role=${role}&user_id=${userId}`);
      setWoList(res.data);
    } catch (error) {
      console.error('Gagal mengambil data WO:', error);
    }
  };

  const getPageTitle = () => {
    switch(status) {
      case 'menunggu-uh': return 'Menunggu Persetujuan UH';
      case 'menunggu-sh': return 'Menunggu Persetujuan SH';
      case 'rejected': return 'Informasi Rejected / Ditolak';
      case 'approved': return 'Pengajuan yang di Acc / Approved';
      case 'on-progress': return 'Status Progress Pekerjaan';
      case 'selesai': return 'Pekerjaan yang Telah Selesai';
      default: return 'Daftar Pengajuan Work Order';
    }
  };

  const getPageDescription = () => {
    switch(status) {
      case 'menunggu-uh': return 'Daftar pengajuan yang sedang menunggu persetujuan dari Unit Head.';
      case 'menunggu-sh': return 'Daftar pengajuan yang sedang menunggu persetujuan dari Section Head CGA.';
      case 'rejected': return 'Daftar pengajuan yang telah ditolak.';
      case 'approved': return 'Daftar pengajuan yang telah disetujui.';
      case 'on-progress': return 'Daftar pekerjaan yang saat ini sedang dalam proses pengerjaan.';
      case 'selesai': return 'Daftar pekerjaan infrastruktur yang telah selesai dikerjakan.';
      default: return 'Kelola seluruh daftar pengajuan.';
    }
  };

  // Derive statuses for each WO from its approvals
  const getStatusUH = (wo) => {
    const diketahui = wo.approvals?.find(a => a.approval_type === 'DIKETAHUI');
    if (diketahui) return diketahui.status;
    return 'PENDING';
  };

  const getStatusSH = (wo) => {
    const disetujui = wo.approvals?.find(a => a.approval_type === 'DISETUJUI');
    if (disetujui) return disetujui.status;
    return 'PENDING';
  };

  // Search Logic
  const filteredData = woList.filter(item => {
    const matchSearch = (item.no_wo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.requester?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchDate = filterDate ? (item.createdAt && item.createdAt.startsWith(filterDate)) : true;
    
    return matchSearch && matchDate;
  });
  
  const totalPages = Math.ceil(filteredData.length / entries) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * entries, currentPage * entries);

  // Render Status Pill
  const renderStatus = (statusValue) => {
    switch(statusValue) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider border border-red-100">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider border border-amber-100">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <button 
            onClick={() => navigate('/dashboard-infra')}
            className="text-xs font-bold text-slate-400 flex items-center gap-1 hover:text-[#E58032] transition-colors mb-2"
          >
            <ChevronLeft className="w-3 h-3" /> Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-black text-[#052334]">{getPageTitle()}</h1>
          <p className="text-slate-500 text-sm mt-1">{getPageDescription()}</p>
        </div>
      </div>

      {/* Tabel Kontrol */}
      <div className="bg-white p-5 rounded-t-xl border border-b-0 border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 w-full md:w-auto">
            Show 
            <select 
              className="bg-slate-50 border border-slate-200 text-[#052334] rounded-lg p-2 focus:outline-none focus:border-[#E58032] transition-colors" 
              onChange={(e) => { setEntries(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            entries
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
              <input 
                type="date"
                title="Filter berdasarkan Tanggal Pengajuan"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] focus:ring-1 focus:ring-[#E58032] transition-all"
                value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari No WO, Nama, atau Jenis..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] focus:ring-1 focus:ring-[#E58032] transition-all" 
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-b-xl border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] mb-6 overflow-hidden">
        <div className="overflow-x-auto max-w-full custom-scrollbar pb-2">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1400px]">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200/80">
              {['on-progress', 'selesai'].includes(status) ? (
                <tr>
                  <th className="px-5 py-4 font-bold text-center w-12">No</th>
                  <th className="px-5 py-4 font-bold">No. WO FSE</th>
                  <th className="px-5 py-4 font-bold">Nama</th>
                  <th className="px-5 py-4 font-bold">NRP/Jabatan</th>
                  <th className="px-5 py-4 font-bold">Jenis Pengajuan</th>
                  <th className="px-5 py-4 font-bold">Sect/Dept</th>
                  <th className="px-5 py-4 font-bold text-center">Gambar Temuan</th>
                  <th className="px-5 py-4 font-bold text-center">Gambar After Perbaikan</th>
                  <th className="px-5 py-4 font-bold">Tgl Pengajuan</th>
                  <th className="px-5 py-4 font-bold">Tgl Pelaksanaan</th>
                  <th className="px-5 py-4 font-bold">Tgl Selesai Pekerjaan</th>
                  <th className="px-5 py-4 font-bold text-center">Status Pekerjaan</th>
                  <th className="px-5 py-4 font-bold text-center sticky right-0 bg-slate-50/90 backdrop-blur-sm shadow-[-5px_0_10px_rgba(0,0,0,0.02)]">Detail</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-5 py-4 font-bold text-center w-12">No</th>
                  <th className="px-5 py-4 font-bold">No. WO FSE</th>
                  <th className="px-5 py-4 font-bold">Nama</th>
                  <th className="px-5 py-4 font-bold">NRP/Jabatan</th>
                  <th className="px-5 py-4 font-bold">Jenis Pengajuan</th>
                  <th className="px-5 py-4 font-bold">Sect/Dept</th>
                  <th className="px-5 py-4 font-bold">Tgl Pengajuan</th>
                  <th className="px-5 py-4 font-bold text-center">Gambar Temuan</th>
                  <th className="px-5 py-4 font-bold text-center">Status UH</th>
                  <th className="px-5 py-4 font-bold text-center">Status SH (CGA)</th>
                  <th className="px-5 py-4 font-bold text-center sticky right-0 bg-slate-50/90 backdrop-blur-sm shadow-[-5px_0_10px_rgba(0,0,0,0.02)]">Detail</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4 text-sm font-medium text-slate-400 text-center">{(currentPage - 1) * entries + index + 1}</td>
                    <td className="px-5 py-4 text-sm font-bold text-[#3298A0]">{item.no_wo || '-'}</td>
                    <td className="px-5 py-4 text-sm font-bold text-[#052334]">{item.requester?.full_name || '-'}</td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-500">{item.requester?.nrp || '-'}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#052334]">{item.title}</td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-500">{item.requester?.department || '-'}</td>
                    
                    {['on-progress', 'selesai'].includes(status) ? (
                      <>
                        <td className="px-5 py-4 text-center">
                          {item.lampiran_urls && item.lampiran_urls.length > 0 ? (
                            <div 
                              onClick={() => openImageViewer(item.lampiran_urls)}
                              className="w-12 h-10 mx-auto rounded-md overflow-hidden cursor-pointer border border-slate-200 hover:ring-2 hover:ring-[#E58032] transition-all relative group"
                            >
                              <img src={item.lampiran_urls[0]} alt="Thumbnail" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ImageIcon className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-10 mx-auto rounded-md border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-300">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {item.progress?.lampiran_hasil_url ? (
                            <div 
                              onClick={() => openImageViewer(item.progress.lampiran_hasil_url)}
                              className="w-12 h-10 mx-auto rounded-md overflow-hidden cursor-pointer border border-slate-200 hover:ring-2 hover:ring-emerald-500 transition-all relative group"
                            >
                              <img src={item.progress.lampiran_hasil_url} alt="After" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ImageIcon className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-10 mx-auto rounded-md border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-300 text-xs font-bold">
                              -
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-500">{new Date(item.createdAt).toISOString().split('T')[0]}</td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-500">{item.progress?.startedAt ? new Date(item.progress.startedAt).toISOString().split('T')[0] : '-'}</td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-500">{item.progress?.completedAt ? new Date(item.progress.completedAt).toISOString().split('T')[0] : '-'}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            item.progress?.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-700' :
                            item.status === 'ON_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.progress?.status === 'SELESAI' ? 'Selesai' : (item.status === 'ON_PROGRESS' ? 'On Progress' : item.status)}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-4 text-sm font-medium text-slate-500">{new Date(item.createdAt).toISOString().split('T')[0]}</td>
                        <td className="px-5 py-4 text-center">
                          {item.lampiran_urls && item.lampiran_urls.length > 0 ? (
                            <div 
                              onClick={() => openImageViewer(item.lampiran_urls)}
                              className="w-12 h-10 mx-auto rounded-md overflow-hidden cursor-pointer border border-slate-200 hover:ring-2 hover:ring-[#E58032] transition-all relative group"
                            >
                              <img src={item.lampiran_urls[0]} alt="Thumbnail" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ImageIcon className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-10 mx-auto rounded-md border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-300">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">{renderStatus(getStatusUH(item))}</td>
                        <td className="px-5 py-4 text-center">{renderStatus(getStatusSH(item))}</td>
                      </>
                    )}
                    
                    <td className="px-5 py-4 text-center sticky right-0 bg-white group-hover:bg-slate-50/50 transition-colors shadow-[-5px_0_10px_rgba(0,0,0,0.02)] border-l border-slate-50">
                      <button 
                        onClick={() => navigate(['on-progress', 'selesai'].includes(status) ? `/progress-detail/${item.id}` : `/approval-detail/${item.id}`, { state: { sourceStatus: status } })}
                        className="bg-[#052334] hover:bg-[#0A3349] text-white p-2 rounded-lg text-xs font-bold transition-colors mx-auto block shadow-md shadow-[#052334]/10" title="Lihat Detail">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                        <MoreHorizontal className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className="text-slate-800 font-bold text-lg mb-1">Belum Ada Data</h3>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        Tidak ada pengajuan yang ditemukan untuk <span className="font-bold text-[#E58032]">{getPageTitle()}</span> saat ini.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-slate-500">
        <div>
          Showing {paginatedData.length === 0 ? 0 : (currentPage - 1) * entries + 1} to {Math.min(currentPage * entries, filteredData.length)} of {filteredData.length} entries
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
            className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600"/>
          </button>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages}
            className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-600"/>
          </button>
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
      
      {/* Custom scrollbar style */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default ApprovalListPage;
