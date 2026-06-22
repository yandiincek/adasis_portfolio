import React from 'react';

// 19 Item Checklist
const checklistItems = [
  "BAN, VELG & BAUT RODA",
  "OLI MESIN (ENGINE OIL)",
  "AIR RADIATOR",
  "APAR",
  "SABUK PENGAMAN (SEAT BELT DRIVER)",
  "SABUK PENGAMAN (SEAT BELT PENUMPANG)",
  "SPION",
  "KLAKSON & ALARM MUNDUR",
  "PANEL KONTROL (SPEEDOMETER, FUEL INDICATOR, DLL)",
  "BRAKE SYSTEM",
  "STREERING SYSTEM",
  "LAMPU - LAMPU (KERJA, STROBE, SIGN, DLL)",
  "BATTERY",
  "AIR CONDITIONER (AC)",
  "WIPER",
  "V-BELT",
  "KACA DEPAN SAMPING",
  "BUGGY WHIP 4 M",
  "SYSTEM 4WD"
];

// 4 Kriteria Pemeriksaan
const checkTypes = [
  "1. KONDISI YANG TIDAK NORMAL",
  "2. KEBOCORAN (OLI, AIR, UDARA)",
  "3. CHECK LEVEL",
  "4. CHECK FUNGSI"
];

export default function P2HPrintTemplate({ data }) {
  if (!data) return null;

  const {
    headerData,
    matrix,
    bugarChecks,
    isiP5m,
    driverSiap,
    keputusanAkhir,
    ttd,
    jamIstirahat
  } = data;

  return (
    <div className="hidden print:block w-full bg-white text-black font-sans text-[9px] leading-tight" style={{ width: '100%', maxWidth: '100%' }}>
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b-2 border-black pb-1 mb-1">
        <div className="flex items-center gap-2">
          {/* Logo Placeholder Kiri */}
          <div className="font-black text-xl text-teal-800 tracking-tighter italic">AlamTri<span className="text-orange-500">*</span><br/><span className="text-sm font-normal text-teal-600 not-italic">geo</span></div>
        </div>
        <div className="text-center">
          <h1 className="font-black text-lg uppercase">CHECKLIST P2H SARANA & BUGAR SELAMAT DRIVER SARANA</h1>
        </div>
        <div className="flex items-center gap-4 text-right">
          {/* Logo Placeholder Kanan */}
          <div className="font-bold text-teal-600 text-xs text-right">
            ZERO ACCIDENT MINDSET<br/>
            AlamTri Transport SIS Call Center<br/>
            <span className="text-black font-black">0813 4647 6803</span>
          </div>
        </div>
      </div>

      {/* INFORMASI SECTION */}
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 mb-1">
        {/* Kolom 1 */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1 font-bold w-[100px] uppercase">HARI / TANGGAL</td>
              <td className="border border-black px-2 py-1 font-bold">: {headerData.tanggal}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold uppercase">SHIFT</td>
              <td className="border border-black px-2 py-1 font-bold">: {headerData.shift}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold uppercase">NAMA DRIVER</td>
              <td className="border border-black px-2 py-1 font-bold">: {headerData.namaDriver}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold uppercase">NRP DRIVER</td>
              <td className="border border-black px-2 py-1 font-bold">: {headerData.nrpDriver}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold uppercase">SUPLIER</td>
              <td className="border border-black px-2 py-1 font-bold">: {headerData.supplier}</td>
            </tr>
          </tbody>
        </table>

        {/* Kolom 2 */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1 font-bold w-[120px] uppercase">NO LAMBUNG</td>
              <td className="border border-black px-2 py-1 font-bold">: {headerData.noLambung}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold uppercase">JENIS UNIT</td>
              <td className="border border-black px-2 py-1 font-bold">: {headerData.jenisUnit}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold uppercase">KILOMETER AWAL</td>
              <td className="border border-black px-2 py-1 font-bold">: {headerData.kmAwal}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold uppercase">KILOMETER AKHIR</td>
              <td className="border border-black px-2 py-1 font-bold">: {headerData.kmAkhir}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold uppercase">NOMOR POLISI</td>
              <td className="border border-black px-2 py-1 font-bold">: {headerData.noPolisi}</td>
            </tr>
          </tbody>
        </table>

        {/* Kolom 3 */}
        <div className="flex flex-col justify-between pt-1">
          <div className="flex flex-col mb-2">
            <span className="font-bold uppercase mb-1">LOKASI PARKIR KENDARAAN:</span>
            <div className="flex items-center gap-4 px-2">
              <label className="flex items-center gap-1 font-bold"><div className="w-4 h-4 border border-black flex items-center justify-center">{headerData.lokasiParkir?.toLowerCase().includes('area') ? 'V' : ''}</div> AREA KERJA</label>
              <label className="flex items-center gap-1 font-bold"><div className="w-4 h-4 border border-black flex items-center justify-center">{headerData.lokasiParkir?.toLowerCase().includes('mess') ? 'V' : ''}</div> MESS</label>
            </div>
            <div className="mt-2 font-bold ml-2">{headerData.lokasiParkir && !headerData.lokasiParkir?.toLowerCase().includes('area') && !headerData.lokasiParkir?.toLowerCase().includes('mess') ? headerData.lokasiParkir : ''}</div>
          </div>
          <div className="flex flex-col font-bold">
            <span className="uppercase">EXPIRED STIKER AKSES ADARO :</span>
            <span className="border-b border-dashed border-black pb-1 mt-1">{headerData.expStiker}</span>
          </div>
        </div>
      </div>

      {/* MAIN TABLE */}
      <table className="w-full border-collapse border-2 border-black">
        <thead>
          <tr>
            <th className="border border-black py-1 font-black uppercase w-[220px]">KODE PEMERIKSAAN</th>
            <th colSpan="19" className="border border-black py-1 font-black uppercase">PEMERIKSAAN</th>
            <th className="border border-black py-1 font-black uppercase w-[350px]">CHECKLIST BUGAR SELAMAT</th>
          </tr>
        </thead>
        <tbody>
          {/* ROW 2 */}
          <tr>
            {/* KODE PEMERIKSAAN TEXT */}
            <td className="border border-black p-1 align-top text-[10px] font-bold leading-tight">
              <div className="mb-2">
                <span className="font-black">BERI TANDA :</span><br/>
                V : APABILA TIDAK BERMASALAH<br/>
                X : APABILA BERMASALAH
              </div>
              <div>
                <span className="font-black">KODE BAHAYA :</span><br/>
                AA : STOP (TIDAK BOLEH DIOPERASIKAN)<br/>
                A : BOLEH DIJALANKAN UNTUK DILAKUKAN PERBAIKAN SEGERA
              </div>
            </td>
            
            {/* VERTICAL ITEMS */}
            {checklistItems.map((item, idx) => (
              <td key={idx} className="border border-black p-0.5 align-bottom text-center w-[25px] max-w-[25px]">
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-[8px] font-black tracking-tighter whitespace-nowrap h-[130px] mx-auto flex items-center">
                  {item}
                </div>
              </td>
            ))}
            
            {/* BUGAR SELAMAT (rowSpan=3) */}
            <td rowSpan="3" className="border border-black p-2 align-top text-[10px] font-bold">
              <div className="mb-1 uppercase font-black">PERNYATAAN DRIVER :</div>
              <div className="mb-1">1. TELAH BERISTIRAHAT SEBELUM AWAL SHIFT, SELAMA :</div>
              <div className="flex flex-col gap-1 mb-2 ml-4">
                <label className="flex items-center gap-2"><div className="w-4 h-4 border border-black flex items-center justify-center text-xs">{jamIstirahat === '>=6' ? 'V' : ''}</div> 6 JAM ATAU LEBIH DARI 6 JAM (SESUAI STANDAR BUGAR SELAMAT)</label>
                <label className="flex items-center gap-2"><div className="w-4 h-4 border border-black flex items-center justify-center text-xs">{jamIstirahat === '5' ? 'V' : ''}</div> 5 JAM (WAJIB KONSELING PENGAWAS/USER)</label>
                <label className="flex items-center gap-2"><div className="w-4 h-4 border border-black flex items-center justify-center text-xs">{jamIstirahat === '<5' ? 'V' : ''}</div> KURANG DARI 5 JAM (TIDAK DIIJINKAN MENGEMUDIKAN KENDARAAN)</label>
              </div>
              <div className="flex items-start gap-2 mb-2">
                <div className="w-4 h-4 border border-black flex items-center justify-center text-xs shrink-0 mt-0.5">{bugarChecks.obat ? 'V' : ''}</div>
                <div className="leading-tight">2. TIDAK MENGKONSUMSI OBAT-OBATAN YANG DAPAT MENYEBABKAN NGANTUK DALAM PERIODE 8 JAM SEBELUM MENGEMUDI</div>
              </div>
              <div className="flex items-start gap-2 mb-2">
                <div className="w-4 h-4 border border-black flex items-center justify-center text-xs shrink-0 mt-0.5">{bugarChecks.masalah ? 'V' : ''}</div>
                <div className="leading-tight">3. TIDAK MEMILIKI MASALAH PRIBADI, KELUARGA, ATAU PEKERJAAN YANG DAPAT MEMPENGARUHI KONSENTRASI SELAMA MENGEMUDI</div>
              </div>
              <div className="flex items-start gap-2 mb-2">
                <div className="w-4 h-4 border border-black flex items-center justify-center text-xs shrink-0 mt-0.5">{bugarChecks.sehat ? 'V' : ''}</div>
                <div className="leading-tight">4. DALAM KONDISI SEHAT DAN FIT UNTUK MENGEMUDIKAN KENDARAAN</div>
              </div>
              <div className="flex items-start gap-2 mb-2">
                <div className="w-4 h-4 border border-black flex items-center justify-center text-xs shrink-0 mt-0.5">{bugarChecks.psm ? 'V' : ''}</div>
                <div className="leading-tight">5. SUDAH DILAKUKAN PSM OLEH USER / PENGAWAS</div>
              </div>
              <div className="flex flex-col gap-1 mb-2">
                <div className="leading-tight">6. APAKAH KEMARIN OFF DAN MELAKUKAN PERJALANAN KELUAR KABUPATEN DOMISILI (TABALONG, BALANGAN DAN BARTIM) ?</div>
                <div className="flex flex-col gap-1 ml-4 mt-0.5">
                  <label className="flex items-center gap-2"><div className="w-4 h-4 border border-black flex items-center justify-center text-xs shrink-0">{bugarChecks.keluarDomisili === 'Ya' ? 'V' : ''}</div> YA</label>
                  <label className="flex items-center gap-2"><div className="w-4 h-4 border border-black flex items-center justify-center text-xs shrink-0">{bugarChecks.keluarDomisili === 'Tidak' ? 'V' : ''}</div> TIDAK</label>
                </div>
              </div>

              {/* ISI PSM BOX */}
              <div className="border border-black mt-1 h-[45px] flex flex-col">
                <div className="border-b border-black text-center font-black py-0.5 uppercase bg-gray-100">ISI PSM</div>
                <div className="p-1 whitespace-pre-wrap flex-grow">{isiP5m}</div>
              </div>
            </td>
          </tr>

          {/* ROW 3: KODE BAHAYA */}
          <tr>
            <td className="border border-black px-2 py-0.5 font-black text-center uppercase text-[9px]">KODE BAHAYA</td>
            {checklistItems.map((_, idx) => (
              <td key={idx} className="border border-black text-center font-bold text-[8px] bg-gray-200"></td>
            ))}
          </tr>

          {/* ROW 4: ITEM NUMBER */}
          <tr>
            <td className="border border-black px-2 py-0.5 font-black text-center uppercase text-[9px]">ITEM YANG HARUS DIPERIKSA</td>
            {checklistItems.map((_, idx) => (
              <td key={idx} className="border border-black text-center font-black text-[10px]">{idx + 1}</td>
            ))}
          </tr>

          {/* ROW 5: 1. Kondisi Tidak Normal */}
          <tr>
            <td className="border border-black px-2 py-1 font-bold uppercase">{checkTypes[0]}</td>
            {checklistItems.map((_, iIdx) => (
              <td key={iIdx} className="border border-black text-center font-black text-sm">
                {matrix && matrix[0] ? matrix[0][iIdx] : ''}
              </td>
            ))}
            {/* Keputusan Pengawas rowSpan=2 */}
            <td rowSpan="2" className="border border-black p-0 align-top">
              <div className="border-b border-black text-center font-black py-1 uppercase bg-gray-100">KEPUTUSAN PENGAWAS / USER</div>
              <div className="p-2 space-y-2">
                <label className="flex items-center gap-2 font-bold leading-tight">
                  <div className="w-4 h-4 border border-black flex items-center justify-center text-xs shrink-0">{driverSiap === 'siap' ? 'V' : ''}</div> 
                  DRIVER SIAP UNTUK BEKERJA
                </label>
                <label className="flex items-start gap-2 font-bold leading-tight">
                  <div className="w-4 h-4 border border-black flex items-center justify-center text-xs shrink-0">{driverSiap === 'tidak_siap' ? 'V' : ''}</div> 
                  DRIVER TIDAK SIAP UNTUK BEKERJA, WAJIB LAPOR KE KOORDINATOR LAPANGAN DAN TIDAK DIIJINKAN MENGEMUDI
                </label>
              </div>
            </td>
          </tr>

          {/* ROW 6: 2. Kebocoran */}
          <tr>
            <td className="border border-black px-2 py-1 font-bold uppercase">{checkTypes[1]}</td>
            {checklistItems.map((_, iIdx) => (
              <td key={iIdx} className="border border-black text-center font-black text-sm">
                {matrix && matrix[1] ? matrix[1][iIdx] : ''}
              </td>
            ))}
          </tr>

          {/* ROW 7: 3. Check Level */}
          <tr>
            <td className="border border-black px-2 py-1 font-bold uppercase">{checkTypes[2]}</td>
            {checklistItems.map((_, iIdx) => (
              <td key={iIdx} className="border border-black text-center font-black text-sm">
                {matrix && matrix[2] ? matrix[2][iIdx] : ''}
              </td>
            ))}
            {/* Keterangan rowSpan=3 */}
            <td rowSpan="3" className="border border-black p-0 align-top">
               <div className="border-b border-black text-center font-black py-1 uppercase bg-gray-100">KETERANGAN</div>
               <div className="p-2 whitespace-pre-wrap">{ttd?.keterangan}</div>
            </td>
          </tr>

          {/* ROW 8: 4. Check Fungsi */}
          <tr>
            <td className="border border-black px-2 py-1 font-bold uppercase">{checkTypes[3]}</td>
            {checklistItems.map((_, iIdx) => (
              <td key={iIdx} className="border border-black text-center font-black text-sm">
                {matrix && matrix[3] ? matrix[3][iIdx] : ''}
              </td>
            ))}
          </tr>

          {/* ROW 9: Bottom Signatures */}
          <tr>
            <td colSpan="6" className="border border-black p-0 align-top">
               <div className="border-b border-black text-center font-black py-1 uppercase bg-gray-100">KEPUTUSAN PENGAWAS / USER</div>
               <div className="p-2 flex flex-col justify-center h-full gap-1 font-bold uppercase">
                 <label className="flex items-center gap-2">
                   <div className="w-4 h-4 border border-black flex items-center justify-center text-xs">{keputusanAkhir === 'layak' ? 'V' : ''}</div> LAYAK DIOPERASIKAN
                 </label>
                 <label className="flex items-center gap-2">
                   <div className="w-4 h-4 border border-black flex items-center justify-center text-xs">{keputusanAkhir === 'tidak_layak' ? 'V' : ''}</div> TIDAK LAYAK DIOPERASIKAN
                 </label>
               </div>
            </td>
            <td colSpan="7" className="border border-black p-0 align-top">
               <div className="border-b border-black text-center font-black py-1 uppercase bg-gray-100">TANDA TANGAN DRIVER</div>
               <div className="flex flex-col justify-end p-2 h-[50px] font-bold uppercase text-[9px]">
                  <div>NAMA : {headerData.namaDriver}</div>
                  <div>NRP  : {headerData.nrpDriver}</div>
               </div>
            </td>
            <td colSpan="7" className="border border-black p-0 align-top">
               <div className="border-b border-black text-center font-black py-1 uppercase bg-gray-100">TANDA TANGAN PENGAWAS / USER</div>
               <div className="flex flex-col justify-end p-2 h-[50px] font-bold uppercase text-[9px]">
                  <div>NAMA : {ttd?.namaPengawas}</div>
                  <div>NRP  : {ttd?.nrpPengawas}</div>
               </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      {/* Keterangan paling bawah */}
      <div className="border-2 border-black border-t-0 text-center font-black py-1.5 uppercase text-xs">
        CHECKLIST P2H & BUGAR SELAMAT INI SAYA ISI DENGAN SEBENAR-BENARNYA DAN SAYA BERSEDIA DIKENAKAN SANKSI SESUAI DENGAN PERATURAN YANG BERLAKU APABILA SAYA TERBUKTI BERBOHONG
      </div>
    </div>
  );
}
