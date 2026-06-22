import React, { useState, useEffect } from 'react';
import { Fuel, Calendar, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const DataKuponBBMPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const userRole = localStorage.getItem('userRole') || 'USER';
  const userName = localStorage.getItem('userName') || '';
  const userDepartment = localStorage.getItem('userDepartment') || '';

  const allowedRoles = ['ADMIN', 'ADMINISTRATOR', 'ADMIN_TRANSPORT', 'ADMIN_VENDOR', 'DRIVER', 'FUELMAN'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/coal-transport/kupon-bbm');
      let fetchedData = response.data || [];

      // Filter based on roles
      if (userRole === 'ADMIN_VENDOR') {
        fetchedData = fetchedData.filter(item => item.supplier === userDepartment);
      } else if (userRole === 'DRIVER') {
        const userNrp = localStorage.getItem('userNrp') || '';
        fetchedData = fetchedData.filter(item =>
          (item.nrp_driver && item.nrp_driver === userNrp) ||
          (item.nama_driver && item.nama_driver.toLowerCase() === userName.toLowerCase())
        );
      }

      setData(fetchedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id, roleType) => {
    const { value: formValues } = await Swal.fire({
      title: 'Persetujuan Kupon',
      html: `
        <div class="text-left space-y-4 mt-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Keputusan</label>
            <select id="swal-status" class="w-full px-3 py-2 border rounded focus:outline-none focus:border-[#3298A0]">
              <option value="APPROVED">Setujui</option>
              <option value="REJECTED">Tolak</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Nama Approver</label>
            <input id="swal-name" class="w-full px-3 py-2 border rounded focus:outline-none focus:border-[#3298A0]" value="${userName}" />
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#3298A0',
      preConfirm: () => {
        return {
          status: document.getElementById('swal-status').value,
          approver_name: document.getElementById('swal-name').value
        }
      }
    });

    if (formValues) {
      try {
        const endpoint = roleType === 'gact' ? 'approve-gact' : 'approve-fuelman';
        await api.put(`/coal-transport/kupon-bbm/${id}/${endpoint}`, formValues);
        Swal.fire('Berhasil!', 'Status berhasil diperbarui.', 'success');
        fetchData();
      } catch (error) {
        console.error(error);
        Swal.fire('Gagal!', 'Terjadi kesalahan saat memperbarui status.', 'error');
      }
    }
  };

  const filteredData = data.filter(item =>
    (item.no_lambung || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.nama_driver || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatusBadge = ({ status, approver }) => {
    if (status === 'APPROVED') {
      return (
        <div>
          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">APPROVED</span>
          <div className="text-[10px] text-slate-500 mt-1">{approver}</div>
        </div>
      );
    }
    if (status === 'REJECTED') {
      return (
        <div>
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold">REJECTED</span>
          <div className="text-[10px] text-slate-500 mt-1">{approver}</div>
        </div>
      );
    }
    return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold">PENDING</span>;
  };

  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-[#052334] mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 mb-6 max-w-md">
          Maaf, Anda tidak memiliki akses ke halaman ini.
        </p>
        <button onClick={() => navigate(-1)} className="bg-[#052334] hover:bg-[#083b57] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#052334] flex items-center gap-3">
          <Fuel className="w-7 h-7 text-[#3298A0]" />
          Data Kupon Tambahan BBM
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Rekapitulasi riwayat pengajuan kupon tambahan bahan bakar unit sarana.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari No Lambung atau Nama Driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3298A0]/30 focus:border-[#3298A0] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal & Jam</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Driver</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unit & Supplier</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jumlah Fuel</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider max-w-xs">Alasan</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approval GA</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approval Fuelman</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-[#052334] font-bold">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(item.tanggal).toLocaleDateString('id-ID')}
                      </div>
                      <div className="text-[11px] text-slate-500 ml-6">{item.jam} WITA</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold text-[#052334]">{item.nama_driver}</div>
                      <div className="text-[11px] text-slate-500">{item.nrp_driver}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold text-[#3298A0]">{item.no_lambung}</div>
                      <div className="text-[11px] text-slate-500">{item.supplier} - {item.no_polisi}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold text-[#052334]">{item.jumlah_fuel ? `${item.jumlah_fuel} L` : '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-600 max-w-xs truncate" title={item.alasan}>
                        {item.alasan}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status_approval_gact} approver={item.approver_gact} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status_approval_fuelman} approver={item.approver_fuelman} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {userRole === 'ADMIN_TRANSPORT' || userRole === 'ADMINISTRATOR' || userRole === 'ADMIN' ? (
                          <button
                            onClick={() => handleApprove(item.id, 'gact')}
                            className="bg-[#052334] text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-800 transition-colors text-center"
                          >
                            Set GA
                          </button>
                        ) : null}

                        {['ADMIN', 'ADMINISTRATOR', 'FUELMAN'].includes(userRole) && item.status_approval_gact === 'APPROVED' ? (
                          <button
                            onClick={() => handleApprove(item.id, 'fuelman')}
                            className="bg-[#3298A0] text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-[#248B96] transition-colors text-center"
                          >
                            Set Fuelman
                          </button>
                        ) : null}

                        {!(['ADMIN', 'ADMINISTRATOR', 'ADMIN_TRANSPORT', 'FUELMAN'].includes(userRole)) && (
                          <span className="text-[10px] text-slate-400 italic">No Action</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500">Tidak ada data ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default DataKuponBBMPage;
