import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { Loader2, Printer } from 'lucide-react';
import logoAlamTri from '../../assets/logo-alamtri.png';

const PdfPrintPage = () => {
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

  const diketahui = wo.approvals?.find(a => a.approval_type === 'DIKETAHUI');
  const disetujui = wo.approvals?.find(a => a.approval_type === 'DISETUJUI');

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  const headerBgClass = "bg-[#d1d5db] print:bg-[#d1d5db] !bg-[#d1d5db]";

  return (
    <div className="bg-white min-h-screen p-8 print:p-0 text-black font-serif text-sm selection:bg-blue-200 flex justify-center">
      
      {/* Tombol Print (Sembunyi saat diprint) */}
      <div className="fixed top-6 right-6 print:hidden z-50">
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#052334] hover:bg-[#E58032] text-white px-6 py-3 rounded-xl shadow-2xl font-bold transition-all hover:-translate-y-1 group"
        >
          <Printer className="w-5 h-5 group-hover:animate-bounce" /> Print Dokumen
        </button>
      </div>

      <div className="w-[760px] bg-white">
        
        {/* Form Number (Di luar kotak utama) */}
        <div className="text-right text-[10px] mb-1 font-sans pr-1">
          Form No. ADMO/CGA/20/F-001
        </div>

        <div className="border-[2px] border-black p-5">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="w-32"></div>
            
            <div className="flex-1 text-center mt-2">
              <h1 className="text-[18px] font-bold uppercase tracking-tight">FORM PENGAJUAN PEKERJAAN / WORK ORDER INFRASTRUKTUR</h1>
              <p className="text-[15px] mt-1">Section GA Coal Transport - Departemen GA</p>
            </div>
            
            <div className="w-32 flex justify-end">
              <img src={logoAlamTri} alt="AlamTri Geo Logo" className="h-10 object-contain" />
            </div>
          </div>

          {/* Table 1: Jenis Pengajuan */}
          <div className="border-[2px] border-black w-full mb-3">
            <div className={`${headerBgClass} font-bold text-center py-1 border-b-[2px] border-black text-[13px]`}>
              JENIS PENGAJUAN
            </div>
            <div className="flex border-b-[2px] border-black">
              <div className="w-[30%] border-r-[2px] border-black p-1.5 font-bold text-[12px] uppercase">Pengajuan</div>
              <div className="w-[70%] p-1.5 font-bold text-[12px]">{wo.title}</div>
            </div>
            <div className="flex">
              <div className="w-[30%] border-r-[2px] border-black p-1.5 font-bold text-[12px] uppercase">Lain - Lain</div>
              <div className="w-[70%] p-1.5 font-bold text-[12px]"></div>
            </div>
          </div>

          {/* Table 2: Tanggal & No WO */}
          <div className="flex border-[2px] border-black w-full mb-3">
            <div className={`w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px] uppercase flex items-center ${headerBgClass}`}>Tanggal Pengajuan</div>
            <div className="w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px] flex items-center">{formatDate(wo.createdAt)}</div>
            <div className={`w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px] leading-tight uppercase ${headerBgClass}`}>
              No. Work Order
              <div className="text-[9px] font-normal italic normal-case">* DIISI OLEH CGA</div>
            </div>
            <div className="w-[25%] p-1.5 font-bold text-[12px] flex items-center">{wo.no_wo || '-'}</div>
          </div>

          {/* Table 3: Diajukan Oleh */}
          <div className="border-[2px] border-black w-full mb-3">
            <div className={`${headerBgClass} font-bold text-center py-1 border-b-[2px] border-black text-[13px]`}>
              DIAJUKAN OLEH
            </div>
            <div className="flex border-b-[2px] border-black">
              <div className={`w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px] uppercase ${headerBgClass}`}>Nama</div>
              <div className="w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px]">{wo.requester?.full_name || '-'}</div>
              <div className={`w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px] uppercase ${headerBgClass}`}>Section / Departemen</div>
              <div className="w-[25%] p-1.5 font-bold text-[12px]">{wo.requester?.department || '-'}</div>
            </div>
            <div className="flex">
              <div className={`w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px] uppercase ${headerBgClass}`}>NRP / Jabatan</div>
              <div className="w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px]">{wo.requester?.nrp || '-'}</div>
              <div className={`w-[25%] border-r-[2px] border-black p-1.5 font-bold text-[12px] uppercase ${headerBgClass}`}>No. HP / Email</div>
              <div className="w-[25%] p-1.5 font-bold text-[12px]">{wo.requester?.contact || '-'}</div>
            </div>
          </div>

          {/* Table 4: Detail Pengajuan */}
          <div className="border-[2px] border-black w-full mb-3">
            <div className={`${headerBgClass} font-bold text-center py-1 border-b-[2px] border-black text-[13px]`}>
              DETAIL PENGAJUAN
            </div>
            <div className={`flex border-b-[2px] border-black font-bold text-center text-[12px] uppercase ${headerBgClass}`}>
              <div className="w-12 border-r-[2px] border-black py-1">No.</div>
              <div className="w-[25%] border-r-[2px] border-black py-1">Lokasi</div>
              <div className="w-[35%] border-r-[2px] border-black py-1">Bangunan</div>
              <div className="w-auto flex-1 py-1">Keluhan / Permintaan</div>
            </div>
            <div className="flex font-bold text-center text-[12px]">
              <div className="w-12 border-r-[2px] border-black py-1.5">1</div>
              <div className="w-[25%] border-r-[2px] border-black py-1.5">{wo.area?.name || '-'}</div>
              <div className="w-[35%] border-r-[2px] border-black py-1.5 text-left pl-3">
                {wo.bangunans && wo.bangunans.length > 0 
                  ? wo.bangunans.map((b, i) => `${i + 1}. ${b.name}`).join(', ') 
                  : '-'}
              </div>
              <div className="w-auto flex-1 py-1.5 text-left pl-3">{wo.description}</div>
            </div>
          </div>

          {/* Table 5: Lampiran */}
          <div className="border-[2px] border-black w-full mb-3">
            <div className={`${headerBgClass} font-bold text-center py-1 border-b-[2px] border-black text-[13px]`}>
              LAMPIRAN (FOTO/LAYOUT/DESIGN/TEMUAN INSPEKSI)
            </div>
            <div className={`p-3 grid gap-4 min-h-[160px] ${
              !wo.lampiran_urls || wo.lampiran_urls.length === 0 ? 'grid-cols-1' :
              wo.lampiran_urls.length === 1 ? 'grid-cols-1 place-items-center' :
              wo.lampiran_urls.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {wo.lampiran_urls && wo.lampiran_urls.length > 0 ? (
                wo.lampiran_urls.map((url, idx) => (
                  <img 
                    key={idx}
                    src={url} 
                    alt={`Lampiran ${idx + 1}`} 
                    className={`object-cover border-[1px] border-black ${
                      wo.lampiran_urls.length === 1 ? 'w-[80%] h-64' : 'w-full h-40'
                    }`}
                  />
                ))
              ) : (
                <div className="w-[80%] mx-auto h-40 border-[1px] border-black flex items-center justify-center text-gray-400">
                  Tidak ada lampiran foto temuan
                </div>
              )}
            </div>
          </div>

          {/* Table 6: Signatures */}
          <div className="flex border-[2px] border-black w-full text-center text-[12px]">
            {/* USER */}
            <div className="w-1/3 flex flex-col border-r-[2px] border-black">
              <div className={`${headerBgClass} border-b-[2px] border-black py-1 font-bold`}>DIAJUKAN OLEH,</div>
              <div className="border-b-[2px] border-black py-1 text-left px-2 font-bold">
                Tgl. {formatDate(wo.createdAt)}
              </div>
              <div className="flex-1 flex items-center justify-center min-h-[80px] p-1 border-b-[2px] border-black">
                <span className="font-bold text-slate-800 italic text-lg opacity-80" style={{ fontFamily: 'cursive' }}>
                  {wo.requester?.full_name || '-'}
                </span>
              </div>
              <div className="border-b-[2px] border-black py-1 font-bold">{wo.requester?.full_name || '-'}</div>
              <div className="py-1 font-bold">User</div>
            </div>

            {/* SECTION HEAD USER */}
            <div className="w-1/3 flex flex-col border-r-[2px] border-black">
              <div className={`${headerBgClass} border-b-[2px] border-black py-1 font-bold`}>DIKETAHUI OLEH,</div>
              <div className="border-b-[2px] border-black py-1 text-left px-2 font-bold">
                Tgl. {diketahui?.status === 'APPROVED' ? formatDate(diketahui.createdAt) : '-'}
              </div>
              <div className="flex-1 flex items-center justify-center min-h-[80px] p-1 border-b-[2px] border-black">
                {diketahui?.signature_url && diketahui.status === 'APPROVED' && (
                  <img src={diketahui.signature_url} alt="Sig" className="h-14 mix-blend-multiply" />
                )}
              </div>
              <div className="border-b-[2px] border-black py-1 font-bold">{diketahui?.approver?.full_name || 'Anas Baharudin Effendy'}</div>
              <div className="py-1 font-bold">Section Head User</div>
            </div>

            {/* SECTION HEAD CGA */}
            <div className="w-1/3 flex flex-col">
              <div className={`${headerBgClass} border-b-[2px] border-black py-1 font-bold`}>DISETUJUI OLEH,</div>
              <div className="border-b-[2px] border-black py-1 text-left px-2 font-bold">
                Tgl. {disetujui?.status === 'APPROVED' ? formatDate(disetujui.createdAt) : '-'}
              </div>
              <div className="flex-1 flex items-center justify-center min-h-[80px] p-1 border-b-[2px] border-black">
                {disetujui?.signature_url && disetujui.status === 'APPROVED' && (
                  <img src={disetujui.signature_url} alt="Sig" className="h-14 mix-blend-multiply" />
                )}
              </div>
              <div className="border-b-[2px] border-black py-1 font-bold">{disetujui?.approver?.full_name || 'M. Gazali Rahman'}</div>
              <div className="py-1 font-bold">Section Head CGA</div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        /* Memastikan warna background gray tetap tercetak di PDF */
        @media print {
          @page {
            margin: 0.5cm;
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

export default PdfPrintPage;
