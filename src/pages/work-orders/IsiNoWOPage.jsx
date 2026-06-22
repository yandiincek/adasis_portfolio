import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Search, ChevronLeft, ChevronRight, Edit, Image as ImageIcon, X } from 'lucide-react';

const IsiNoWOPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [entries, setEntries] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [woList, setWoList] = useState([]);

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
    fetchPendingWO();
  }, []);

  async function fetchPendingWO() {
    try {
      // Ambil WO yang sudah APPROVED tapi belum punya No. WO
      const role = localStorage.getItem('userRole') || 'USER';
      const userId = localStorage.getItem('userId') || '';
      const res = await api.get(`/work-orders?no_wo=null&role=${role}&user_id=${userId}`);
      setWoList(res.data);
    } catch (error) {
      console.error('Gagal mengambil data:', error);
    }
  };

  const filteredData = woList.filter(item => 
    (item.requester?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredData.length / entries) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * entries, currentPage * entries);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#052334]">Update Nomor Work Order</h1>
        <p className="text-slate-500 text-sm mt-1">Daftar pengajuan yang telah disetujui dan menunggu penugasan No. WO.</p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            Show 
            <select className="bg-slate-50 border border-slate-200 text-[#052334] rounded-lg p-2 focus:outline-none focus:border-[#E58032] transition-colors" onChange={(e) => { setEntries(Number(e.target.value)); setCurrentPage(1); }}>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
            entries
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
              <input 
                type="date"
                title="Filter berdasarkan Tanggal Pengajuan"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] transition-all"
                value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari No WO atau Nama..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] transition-all" 
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden mb-6 overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200/80">
            <tr>
              <th className="px-6 py-4 font-bold">No</th>
              <th className="px-6 py-4 font-bold">Nama</th>
              <th className="px-6 py-4 font-bold">NRP/Jabatan</th>
              <th className="px-6 py-4 font-bold">Jenis Pengajuan</th>
              <th className="px-6 py-4 font-bold">Sect/Dept</th>
              <th className="px-6 py-4 font-bold">Tgl Pengajuan</th>
              <th className="px-6 py-4 font-bold text-center">Gambar Temuan</th>
              <th className="px-6 py-4 font-bold text-center">Status</th>
              <th className="px-6 py-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{(currentPage - 1) * entries + index + 1}</td>
                  <td className="px-6 py-4 text-sm font-bold text-[#052334]">{item.requester?.full_name || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{item.requester?.nrp || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{item.title}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{item.requester?.department || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{new Date(item.createdAt).toISOString().split('T')[0]}</td>
                  <td className="px-6 py-4 text-center">
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
                  <td className="px-6 py-4 text-center">
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Pending WO</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => navigate(`/isi-no-wo/form/${item.id}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#E58032] hover:bg-[#D97706] text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-[#E58032]/20"
                    >
                      <Edit className="w-3.5 h-3.5" /> Isi No WO
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="px-5 py-20 text-center">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                      <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-slate-800 font-bold text-lg mb-1">Belum Ada Data</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      Tidak ada pengajuan yang menunggu No. WO saat ini.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex justify-between items-center text-sm font-medium text-slate-500">
        <div>Showing {paginatedData.length === 0 ? 0 : (currentPage - 1) * entries + 1} to {Math.min(currentPage * entries, filteredData.length)} of {filteredData.length} entries</div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronLeft className="w-4 h-4 text-slate-600"/></button>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4 text-slate-600"/></button>
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
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default IsiNoWOPage;