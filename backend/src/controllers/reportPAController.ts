import { Request, Response } from 'express';
import prisma from '../config/database';

export const getReportPA = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    
    // Validasi parameter bulan dan tahun
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const targetMonth = parseInt(month as string, 10);
    const targetYear = parseInt(year as string, 10);
    const targetWeek = req.query.week ? parseInt(req.query.week as string, 10) : 0;
    
    // Tentukan tanggal awal dan akhir bulan/minggu
    let startDate = new Date(targetYear, targetMonth - 1, 1);
    let endDate = new Date(targetYear, targetMonth, 1); // Hari pertama bulan berikutnya

    // Hitung jumlah hari
    let daysInPeriod = new Date(targetYear, targetMonth, 0).getDate();

    if (targetWeek >= 1 && targetWeek <= 4) {
      if (targetWeek === 1) {
        startDate = new Date(targetYear, targetMonth - 1, 1);
        endDate = new Date(targetYear, targetMonth - 1, 8);
        daysInPeriod = 7;
      } else if (targetWeek === 2) {
        startDate = new Date(targetYear, targetMonth - 1, 8);
        endDate = new Date(targetYear, targetMonth - 1, 15);
        daysInPeriod = 7;
      } else if (targetWeek === 3) {
        startDate = new Date(targetYear, targetMonth - 1, 15);
        endDate = new Date(targetYear, targetMonth - 1, 22);
        daysInPeriod = 7;
      } else if (targetWeek === 4) {
        startDate = new Date(targetYear, targetMonth - 1, 22);
        endDate = new Date(targetYear, targetMonth, 1);
        const totalDays = new Date(targetYear, targetMonth, 0).getDate();
        daysInPeriod = totalDays - 21;
      }
    }

    // 1. Ambil semua data Master Sarana
    const saranaList = await prisma.sarana.findMany();

    // 2. Ambil semua data Breakdown di bulan tersebut
    const breakdowns = await prisma.reportBreakdown.findMany({
      where: {
        tanggal: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    // Buat map (dictionary) untuk memudahkan agregasi breakdown per no_lambung
    const bdMap = new Map();
    
    breakdowns.forEach(bd => {
      const lambung = bd.no_lambung;
      if (!bdMap.has(lambung)) {
        bdMap.set(lambung, {
          totalJamBdReal: 0,
          totalJamBdTercover: 0 // Jika ada backup, jam ini tidak dihitung (dianggap 0 lost time)
        });
      }

      // Parsing lama_bd untuk mengambil angka saja (misal "1.5 Jam" jadi 1.5)
      let lamaBdNum = 0;
      if (bd.lama_bd) {
        // Ambil karakter yang merupakan angka atau titik (desimal) atau koma
        let valStr = String(bd.lama_bd).replace(/,/g, '.').replace(/[^0-9.]/g, '');
        const parsed = parseFloat(valStr);
        if (!isNaN(parsed)) {
          lamaBdNum = parsed;
        }
      }

      const current = bdMap.get(lambung);
      current.totalJamBdReal += lamaBdNum;

      // Logika After Backup: Jika pengganti kosong atau 'Tidak ada backup', maka itu benar-benar lost time.
      const isAdaBackup = bd.pengganti && bd.pengganti.trim() !== '' && bd.pengganti.trim().toLowerCase() !== 'tidak ada backup';
      
      if (!isAdaBackup) {
        current.totalJamBdTercover += lamaBdNum;
      }
    });

    // 3. Proses perhitungan PA untuk masing-masing Sarana
    const result = saranaList.map(sarana => {
      // Tentukan jam kerja (default 24 jam)
      let jamKerjaPerHari = 24;
      if (sarana.shift) {
        const shiftStr = String(sarana.shift).toLowerCase();
        if (shiftStr.includes('1') || shiftStr === 'shift 1' || shiftStr === '1 shift') {
          jamKerjaPerHari = 12;
        }
      }

      const totalJamTersedia = jamKerjaPerHari * daysInPeriod;

      const bdData = bdMap.get(sarana.no_lambung) || { totalJamBdReal: 0, totalJamBdTercover: 0 };
      
      const paBefore = totalJamTersedia > 0 ? ((totalJamTersedia - bdData.totalJamBdReal) / totalJamTersedia) * 100 : 0;
      const paAfter = totalJamTersedia > 0 ? ((totalJamTersedia - bdData.totalJamBdTercover) / totalJamTersedia) * 100 : 0;

      return {
        id: sarana.id,
        no_lambung: sarana.no_lambung,
        jenis_unit: sarana.jenis_unit || '-',
        area: sarana.area || '-',
        supplier: sarana.supplier || '-',
        by_type: sarana.by_type || '-',
        shift_status: jamKerjaPerHari === 12 ? '1 Shift' : '2 Shift',
        total_jam_tersedia: totalJamTersedia,
        jam_bd_real: bdData.totalJamBdReal,
        jam_bd_setelah_backup: bdData.totalJamBdTercover, // Jam BD yang benar-benar tidak tercover
        pa_before_persen: paBefore.toFixed(2),
        pa_after_persen: paAfter.toFixed(2)
      };
    });

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating PA report' });
  }
};

export const getReportPASummary = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: 'Month and year are required' });

    const targetMonth = parseInt(month as string, 10);
    const targetYear = parseInt(year as string, 10);
    const areaFilter = req.query.area as string;
    const supplierFilter = req.query.supplier as string;

    const saranaWhere: any = {};
    if (areaFilter) saranaWhere.area = areaFilter;
    if (supplierFilter) saranaWhere.supplier = supplierFilter;

    const saranaList = await prisma.sarana.findMany(
      Object.keys(saranaWhere).length > 0 ? { where: saranaWhere } : undefined
    );

    const weeks = [
      { start: 1, end: 8 },
      { start: 8, end: 15 },
      { start: 15, end: 22 },
      { start: 22, end: null }
    ];

    const results = {
      W1: { before: {}, after: {} },
      W2: { before: {}, after: {} },
      W3: { before: {}, after: {} },
      W4: { before: {}, after: {} }
    };

    const weeksConfig = [];
    const promises = [];

    for (let i = 0; i < 4; i++) {
      const w = weeks[i];
      let startDate = new Date(targetYear, targetMonth - 1, w.start);
      let endDate = w.end ? new Date(targetYear, targetMonth - 1, w.end) : new Date(targetYear, targetMonth, 1);
      let daysInPeriod = w.end ? (w.end - w.start) : (new Date(targetYear, targetMonth, 0).getDate() - w.start + 1);

      weeksConfig.push({ startDate, endDate, daysInPeriod });
      promises.push(prisma.reportBreakdown.findMany({
        where: { tanggal: { gte: startDate, lt: endDate } }
      }));
    }

    const breakdownsResults = await Promise.all(promises);

    for (let i = 0; i < 4; i++) {
      const { daysInPeriod } = weeksConfig[i];
      const breakdowns = breakdownsResults[i];

      const bdMap = new Map();
      breakdowns.forEach((bd: any) => {
        const lambung = bd.no_lambung;
        if (!bdMap.has(lambung)) bdMap.set(lambung, { totalJamBdReal: 0, totalJamBdTercover: 0 });

        let lamaBdNum = 0;
        if (bd.lama_bd) {
          let valStr = String(bd.lama_bd).replace(/,/g, '.').replace(/[^0-9.]/g, '');
          const parsed = parseFloat(valStr);
          if (!isNaN(parsed)) lamaBdNum = parsed;
        }

        const current = bdMap.get(lambung);
        current.totalJamBdReal += lamaBdNum;

        const isAdaBackup = bd.pengganti && bd.pengganti.trim() !== '' && bd.pengganti.trim().toLowerCase() !== 'tidak ada backup';
        if (!isAdaBackup) {
          current.totalJamBdTercover += lamaBdNum;
        }
      });

      const agg: Record<string, Record<string, any>> = {
        'SHIFT 1': {},
        'SHIFT 2': {}
      };

      saranaList.forEach((sarana: any) => {
        const byType = (sarana.by_type || 'LV').toUpperCase().trim();
        let jamKerjaPerHari = 24;
        let shiftGroup = 'SHIFT 2'; // Default if 24 hours (2 shift)
        
        if (sarana.shift) {
          const shiftStr = String(sarana.shift).toLowerCase();
          if (shiftStr.includes('1') || shiftStr === 'shift 1' || shiftStr === '1 shift') {
            jamKerjaPerHari = 12;
            shiftGroup = 'SHIFT 1';
          }
        }

        if (!agg[shiftGroup][byType]) agg[shiftGroup][byType] = { avail: 0, real: 0, tercover: 0 };

        const totalJamTersedia = jamKerjaPerHari * daysInPeriod;
        const bdData = bdMap.get(sarana.no_lambung) || { totalJamBdReal: 0, totalJamBdTercover: 0 };

        agg[shiftGroup][byType].avail += totalJamTersedia;
        agg[shiftGroup][byType].real += bdData.totalJamBdReal;
        agg[shiftGroup][byType].tercover += bdData.totalJamBdTercover;
      });

      const weekKey = `W${i + 1}` as keyof typeof results;
      Object.keys(agg).forEach(shift => {
        results[weekKey].before[shift as keyof typeof results['W1']['before']] = {};
        results[weekKey].after[shift as keyof typeof results['W1']['after']] = {};
        
        Object.keys(agg[shift]).forEach(type => {
          const d = agg[shift][type];
          const paBefore = d.avail > 0 ? ((d.avail - d.real) / d.avail) * 100 : null;
          const paAfter = d.avail > 0 ? ((d.avail - d.tercover) / d.avail) * 100 : null;
          
          (results[weekKey].before as any)[shift][type] = paBefore;
          (results[weekKey].after as any)[shift][type] = paAfter;
        });
      });
    }

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating PA summary' });
  }
};
