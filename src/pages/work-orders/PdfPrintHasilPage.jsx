import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { Loader2, Printer } from 'lucide-react';
import logoAlamTri from '../../assets/logo-alamtri.png';

const PdfPrintHasilPage = () => {
  const { id } = useParams();
  const [wo, setWo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWO = async () => {
      try {
        const res = await api.get(`/work-orders/${id}`);
        setWo(res.data);
      } catch (error) {
        console.error('Error fetching WO:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWO();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#E58032]" /></div>;
  }

  if (!wo) {
    return <div className="min-h-screen flex items-center justify-center">Data tidak ditemukan.</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };
  
  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const headerBgClass = "bg-[#d1d5db] print:bg-[#d1d5db] !bg-[#d1d5db]";

  return (
    <div className="bg-white min-h-screen p-8 print:p-0 text-black font-serif text-sm selection:bg-blue-200 flex justify-center">
      
      {/* Tombol Print (Sembunyi saat diprint) */}
      <div className="fixed top-6 right-6 print:hidden z-50">
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#052334] hover:bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl font-bold transition-all hover:-translate-y-1 group"
        >
          <Printer className="w-5 h-5 group-hover:animate-bounce" /> Print Laporan Selesai
        </button>
      </div>

      <div className="w-[760px] bg-white">
        
        {/* Form Number (Di luar kotak utama) */}
        <div className="text-right text-[10px] mb-1 font-sans pr-1">
          Form No. ADMO/CGA/20/F-002
        </div>

        <div className="border-[2px] border-black p-5">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="w-32"></div>
            
            <div className="flex-1 text-center mt-2">
              <h1 className="text-[18px] font-bold uppercase tracking-tight">BERITA ACARA PENYELESAIAN PEKERJAAN / WORK ORDER</h1>
              <p className="text-[15px] mt-1">Section GA Coal Transport - Departemen GA</p>
            </div>
            
            <div className="w-32 flex justify-end">
              <img src={logoAlamTri} alt="AlamTri Geo Logo" className="h-10 object-contain" />
            </div>
          </div>

          {/* Table 1: No WO & Tgl Pengajuan */}
          <div className="flex border-[2px] border-black w-full mb-3">
            <div className={`w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px] uppercase flex items-center ${headerBgClass}`}>Tanggal Pengajuan</div>
            <div className="w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px] flex items-center">{formatDate(wo.createdAt)}</div>
            <div className={`w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px] leading-tight uppercase ${headerBgClass}`}>No. Work Order</div>
            <div className="w-[25%] p-1.5 font-bold text-[12px] flex items-center">{wo.no_wo || '-'}</div>
          </div>

          {/* Table 2: Detail Pekerjaan */}
          <div className="border-[2px] border-black w-full mb-3">
            <div className={`${headerBgClass} font-bold text-center py-1 border-b-[2px] border-black text-[13px]`}>
              INFORMASI PEKERJAAN
            </div>
            <div className="flex border-b-[2px] border-black">
              <div className={`w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px] uppercase ${headerBgClass}`}>Nama Pekerjaan</div>
              <div className="w-[75%] p-1.5 font-bold text-[12px]">{wo.title}</div>
            </div>
            <div className="flex border-b-[2px] border-black">
              <div className={`w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px] uppercase ${headerBgClass}`}>Lokasi / Bangunan</div>
              <div className="w-[75%] p-1.5 font-bold text-[12px]">
                {wo.area?.name} / {wo.bangunans && wo.bangunans.length > 0 ? wo.bangunans.map((b, i) => `${i + 1}. ${b.name}`).join(', ') : '-'}
              </div>
            </div>
            <div className="flex">
              <div className={`w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px] uppercase ${headerBgClass}`}>Pemohon</div>
              <div className="w-[75%] p-1.5 font-bold text-[12px]">
                {wo.requester?.full_name} ({wo.requester?.department})
              </div>
            </div>
          </div>

          {/* Table 3: Waktu Pelaksanaan */}
          <div className="border-[2px] border-black w-full mb-3">
            <div className={`${headerBgClass} font-bold text-center py-1 border-b-[2px] border-black text-[13px]`}>
              WAKTU PELAKSANAAN
            </div>
            <div className="flex border-b-[2px] border-black text-center font-bold text-[12px]">
              <div className={`w-1/2 border-r-[2px] border-black p-1.5 uppercase ${headerBgClass}`}>Mulai Dikerjakan</div>
              <div className={`w-1/2 p-1.5 uppercase ${headerBgClass}`}>Selesai Dikerjakan</div>
            </div>
            <div className="flex text-center font-bold text-[13px]">
              <div className="w-1/2 border-r-[2px] border-black p-2">
                {wo.progress?.startedAt ? `${formatDate(wo.progress.startedAt)} Jam ${formatTime(wo.progress.startedAt)}` : '-'}
              </div>
              <div className="w-1/2 p-2 text-emerald-700">
                {wo.progress?.completedAt ? `${formatDate(wo.progress.completedAt)} Jam ${formatTime(wo.progress.completedAt)}` : '-'}
              </div>
            </div>
          </div>

          {/* Table 4: Lampiran Hasil */}
          <div className="border-[2px] border-black w-full mb-3">
            <div className={`${headerBgClass} font-bold text-center py-1 border-b-[2px] border-black text-[13px]`}>
              FOTO HASIL PERBAIKAN / PENYELESAIAN
            </div>
            <div className="p-2 flex items-center justify-center min-h-[200px] print:min-h-[150px]">
              {wo.progress?.lampiran_hasil_url ? (
                <img 
                  src={wo.progress.lampiran_hasil_url} 
                  alt="Hasil Pekerjaan" 
                  className="max-w-[90%] max-h-[280px] print:max-h-[220px] object-contain border-[2px] border-black shadow-md p-1"
                />
              ) : (
                <div className="text-gray-400 italic">Tidak ada foto hasil pekerjaan</div>
              )}
            </div>
          </div>

          {/* Table 5: Signatures / Tanda Terima */}
          <div className="border-[2px] border-black w-full mb-3">
            <div className={`${headerBgClass} font-bold text-center py-1 border-b-[2px] border-black text-[13px]`}>
              PERNYATAAN PENYELESAIAN
            </div>
            <div className="p-3 text-[12px] font-bold border-b-[2px] border-black">
              Pekerjaan tersebut di atas telah diselesaikan dengan baik oleh Tim Infrastruktur (GACT) sesuai dengan permintaan pada Work Order.
            </div>
            <div className="flex text-center text-[12px]">
              {/* Dikerjakan Oleh */}
              <div className="w-1/2 flex flex-col border-r-[2px] border-black">
                <div className={`${headerBgClass} border-b-[2px] border-black py-1 font-bold`}>DIKERJAKAN OLEH,</div>
                <div className="flex-1 flex items-center justify-center min-h-[60px] p-1 border-b-[2px] border-black">
                  <span className="font-bold text-slate-800 italic text-lg opacity-80" style={{ fontFamily: 'cursive' }}>
                    Tim Infrastruktur GACT
                  </span>
                </div>
                <div className="py-1 font-bold">Tim Infrastruktur (GACT)</div>
              </div>

              {/* Diterima Oleh */}
              <div className="w-1/2 flex flex-col">
                <div className={`${headerBgClass} border-b-[2px] border-black py-1 font-bold`}>MENGETAHUI / MENERIMA,</div>
                <div className="flex-1 flex items-center justify-center min-h-[60px] p-1 border-b-[2px] border-black">
                  <span className="font-bold text-slate-800 italic text-lg opacity-80" style={{ fontFamily: 'cursive' }}>
                    {wo.requester?.full_name || '-'}
                  </span>
                </div>
                <div className="py-1 font-bold">{wo.requester?.full_name || 'Pemohon'}</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        /* Memastikan warna background gray tetap tercetak di PDF */
        @media print {
          @page {
            margin: 0.2cm;
            size: A4 portrait;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PdfPrintHasilPage;
