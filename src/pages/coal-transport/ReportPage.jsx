import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, FileOutput } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const ReportPage = () => {
  const [activeShift, setActiveShift] = useState('Shift 1');
  
  const initialRow = {
    noLambung: '',
    jenisUnit: '',
    section: '',
    supplier: '',
    keteranganBd: '',
    pengganti: '',
    lamaBd: ''
  };

  const [shift1Data, setShift1Data] = useState([{ ...initialRow, id: Date.now() }]);
  const [shift2Data, setShift2Data] = useState([{ ...initialRow, id: Date.now() + 1 }]);
  const [saranaList, setSaranaList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSarana = async () => {
      try {
        const response = await api.get('/coal-transport/sarana');
        setSaranaList(response.data || []);
      } catch (error) {
        console.error('Error fetching sarana:', error);
      }
    };
    fetchSarana();
  }, []);

  const currentData = activeShift === 'Shift 1' ? shift1Data : shift2Data;
  const setCurrentData = activeShift === 'Shift 1' ? setShift1Data : setShift2Data;

  const handleAddRow = () => {
    setCurrentData([...currentData, { ...initialRow, id: Date.now() }]);
  };

  const handleRemoveRow = (id) => {
    if (currentData.length > 1) {
      setCurrentData(currentData.filter(row => row.id !== id));
    }
  };

  const handleChange = (id, field, value) => {
    setCurrentData(currentData.map(row => {
      if (row.id === id) {
        let updatedRow = { ...row, [field]: value };
        
        // Auto-fill jika noLambung diubah dan cocok dengan data sarana
        if (field === 'noLambung') {
          const matchedSarana = saranaList.find(s => 
            s.no_lambung && s.no_lambung.toLowerCase() === value.toLowerCase()
          );
          if (matchedSarana) {
            updatedRow.jenisUnit = matchedSarana.jenis_unit || '';
            updatedRow.section = matchedSarana.section || '';
            updatedRow.supplier = matchedSarana.supplier || '';
          }
        }
        
        return updatedRow;
      }
      return row;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/coal-transport/report-breakdown', {
        shift: activeShift,
        data: currentData
      });
      
      Swal.fire({
        title: 'Berhasil!',
        text: `Data Report Sarana Breakdown ${activeShift} berhasil disimpan.`,
        icon: 'success',
        confirmButtonColor: '#3298A0'
      });
      
      // Reset form setelah berhasil
      setCurrentData([{ ...initialRow, id: Date.now() }]);
    } catch (error) {
      console.error('Gagal menyimpan report:', error);
      Swal.fire({
        title: 'Gagal!',
        text: 'Terjadi kesalahan saat menyimpan data.',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#052334] flex items-center gap-3">
          <FileOutput className="w-7 h-7 text-[#3298A0]" />
          Report Sarana Breakdown
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Form laporan data sarana breakdown (BD) harian untuk Shift 1 dan Shift 2.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveShift('Shift 1')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              activeShift === 'Shift 1'
                ? 'bg-[#3298A0]/10 text-[#3298A0] border-b-2 border-[#3298A0]'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            SHIFT 1
          </button>
          <button
            onClick={() => setActiveShift('Shift 2')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              activeShift === 'Shift 2'
                ? 'bg-[#3298A0]/10 text-[#3298A0] border-b-2 border-[#3298A0]'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            SHIFT 2
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">No Lambung</th>
                  <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jenis Unit</th>
                  <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Section</th>
                  <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Keterangan BD</th>
                  <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pengganti</th>
                  <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lama BD</th>
                  <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentData.map((row) => (
                  <tr key={row.id}>
                    <td className="p-2">
                      <input
                        type="text"
                        required
                        value={row.noLambung}
                        onChange={(e) => handleChange(row.id, 'noLambung', e.target.value)}
                        placeholder="DT-001"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#052334] focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        required
                        value={row.jenisUnit}
                        onChange={(e) => handleChange(row.id, 'jenisUnit', e.target.value)}
                        placeholder="Jenis Unit"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        required
                        value={row.section}
                        onChange={(e) => handleChange(row.id, 'section', e.target.value)}
                        placeholder="Section"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        required
                        value={row.supplier}
                        onChange={(e) => handleChange(row.id, 'supplier', e.target.value)}
                        placeholder="Supplier"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        required
                        value={row.keteranganBd}
                        onChange={(e) => handleChange(row.id, 'keteranganBd', e.target.value)}
                        placeholder="Keterangan"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.pengganti}
                        onChange={(e) => handleChange(row.id, 'pengganti', e.target.value)}
                        placeholder="Tidak ada backup"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        required
                        value={row.lamaBd}
                        onChange={(e) => handleChange(row.id, 'lamaBd', e.target.value)}
                        placeholder="1 Jam"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0]"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={currentData.length === 1}
                        className={`p-2 rounded-lg transition-colors ${
                          currentData.length === 1 
                            ? 'text-slate-300 cursor-not-allowed' 
                            : 'text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#3298A0] bg-[#3298A0]/10 rounded-lg hover:bg-[#3298A0]/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Baris
            </button>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-bold transition-all shadow-lg ${
                isSubmitting ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-[#3298A0] hover:bg-[#248B96] shadow-[#3298A0]/30'
              }`}
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : `Simpan Report ${activeShift}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportPage;
