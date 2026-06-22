import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Swal from 'sweetalert2';

const KepemilikanPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entries, setEntries] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // State untuk data dari database
  const [dataList, setDataList] = useState([]);
  
  useEffect(() => {
    fetchKepemilikan();
  }, []);

  const fetchKepemilikan = async () => {
    try {
      const res = await api.get('/kepemilikan');
      const formatted = res.data.map((item) => ({
        id: item.id,
        name: item.name,
        date: new Date(item.createdAt).toISOString().split('T')[0]
      }));
      setDataList(formatted);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDataName, setNewDataName] = useState('');

  const filteredData = dataList.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredData.length / entries) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * entries, currentPage * entries);

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#052334]">Master Data Kepemilikan</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data entitas perusahaan atau vendor pemilik aset.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#052334] hover:bg-[#0A3349] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-[#052334]/10 transition-colors">
          <Plus className="w-4 h-4" /> Tambah Data Kepemilikan
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            Show 
            <select 
              className="bg-slate-50 border border-slate-200 text-[#052334] rounded-lg p-2 focus:outline-none focus:border-[#E58032] transition-colors" 
              onChange={(e) => { setEntries(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
            </select>
            entries
          </div>
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari perusahaan..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#052334] focus:outline-none focus:border-[#E58032] focus:ring-1 focus:ring-[#E58032] transition-all" 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden mb-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200/80">
            <tr>
              <th className="px-8 py-4 font-bold">No</th>
              <th className="px-8 py-4 font-bold">Perusahaan</th>
              <th className="px-8 py-4 font-bold">Tanggal Input</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4 text-sm font-medium text-slate-500">{(currentPage - 1) * entries + index + 1}</td>
                  <td className="px-8 py-4 text-sm font-bold text-[#052334]">{item.name}</td>
                  <td className="px-8 py-4 text-sm font-medium text-slate-500">{item.date}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" className="px-8 py-8 text-center text-sm text-slate-400 font-medium">Data tidak ditemukan</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-slate-500">
        <div>Showing {paginatedData.length === 0 ? 0 : (currentPage - 1) * entries + 1} to {Math.min(currentPage * entries, filteredData.length)} of {filteredData.length} entries</div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronLeft className="w-4 h-4 text-slate-600"/></button>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4 text-slate-600"/></button>
        </div>
      </div>

      {/* Modal Tambah Data */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Tambah Data Kepemilikan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newDataName.trim()) { 
                Swal.fire({ title: 'Perhatian', text: 'Data tidak boleh kosong!', icon: 'warning', confirmButtonColor: '#E58032' }); 
                return; 
              }
              try {
                await api.post('/kepemilikan', { name: newDataName });
                fetchKepemilikan();
                setIsModalOpen(false);
                setNewDataName('');
                Swal.fire({ title: 'Berhasil!', text: 'Data kepemilikan berhasil ditambahkan!', icon: 'success', confirmButtonColor: '#052334', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
              } catch (error) {
                Swal.fire({ title: 'Gagal', text: 'Gagal menyimpan ke database!', icon: 'error', confirmButtonColor: '#E58032' });
                console.error(error);
              }
            }}>
              <div className="p-6">
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide">Nama Perusahaan / Vendor</label>
                <input 
                  type="text" 
                  value={newDataName}
                  onChange={(e) => setNewDataName(e.target.value)}
                  placeholder="Masukkan nama entitas..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#E58032] focus:ring-2 focus:ring-[#E58032]/20 transition-all"
                />
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-[#052334] hover:bg-[#0A3349] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default KepemilikanPage;