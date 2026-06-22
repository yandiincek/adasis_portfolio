import { Request, Response } from 'express';
import prisma from '../config/database';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const queryMonth = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const queryYear = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

    const currentMonth = queryMonth !== undefined ? queryMonth - 1 : today.getMonth();
    const currentYear = queryYear !== undefined ? queryYear : today.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const firstDayOfNextMonth = new Date(currentYear, currentMonth + 1, 1);
    
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const firstDayOfPrevMonth = new Date(previousYear, previousMonth, 1);
    
    const areaFilter = req.query.area as string;
    const supplierFilter = req.query.supplier as string;

    const saranaWhere: any = {};
    if (areaFilter) saranaWhere.area = areaFilter;
    if (supplierFilter) saranaWhere.supplier = supplierFilter;

    // 1. Total Unit Sarana
    const saranaList = await prisma.sarana.findMany({
      where: Object.keys(saranaWhere).length > 0 ? saranaWhere : undefined
    });
    const totalSarana = saranaList.length;
    
    const validLambungs = saranaList.map(s => s.no_lambung).filter(Boolean) as string[];
    const validUnitIds = saranaList.map(s => s.id);

    const hasFilters = !!(areaFilter || supplierFilter);

    // ==========================================
    // PARALLEL QUERY EXECUTION
    // ==========================================
    const promises: Promise<any>[] = [];

    // 0: breakdownsToday
    promises.push(prisma.reportBreakdown.findMany({
      where: { tanggal: { gte: today, lt: tomorrow }, ...(hasFilters && { no_lambung: { in: validLambungs } }) }
    }));

    // 1: p2hTodayList
    promises.push(prisma.p2HForm.findMany({
      where: { tanggal: { gte: today, lt: tomorrow }, ...(hasFilters && { no_lambung: { in: validLambungs } }) }
    }));

    // 2: recentP2H
    promises.push(prisma.p2HForm.findMany({
      where: { tanggal: { gte: today, lt: tomorrow }, ...(hasFilters && { no_lambung: { in: validLambungs } }) },
      orderBy: { createdAt: 'desc' },
      take: 5
    }));

    // 3: fuelCurrentMonth
    promises.push(prisma.fuelRecord.findMany({
      where: { tanggal: { gte: firstDayOfMonth, lt: firstDayOfNextMonth }, ...(hasFilters && { unit_id: { in: validUnitIds } }) }
    }));

    // 4: fuelPrevMonth
    promises.push(prisma.fuelRecord.findMany({
      where: { tanggal: { gte: firstDayOfPrevMonth, lt: firstDayOfMonth }, ...(hasFilters && { unit_id: { in: validUnitIds } }) }
    }));

    // 5-9: fuelChart
    const fuelChartDataConfig = [];
    for (let i = 4; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m < 0) { m += 12; y -= 1; }
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 1);
      fuelChartDataConfig.push({ start, end, m, y });
      promises.push(prisma.fuelRecord.findMany({
        where: { tanggal: { gte: start, lt: end }, ...(hasFilters && { unit_id: { in: validUnitIds } }) }
      }));
    }

    // 10-14: paChart
    const paChartDataConfig = [];
    for (let i = 4; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m < 0) { m += 12; y -= 1; }
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 1);
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      paChartDataConfig.push({ start, end, daysInMonth });
      promises.push(prisma.reportBreakdown.findMany({
        where: { tanggal: { gte: start, lt: end }, ...(hasFilters && { no_lambung: { in: validLambungs } }) }
      }));
    }

    // 15-18: weeklyKPI
    const weeks = [
      { start: 1, end: 8 },
      { start: 8, end: 15 },
      { start: 15, end: 22 },
      { start: 22, end: new Date(currentYear, currentMonth + 1, 0).getDate() + 1 }
    ];
    for (let i = 0; i < weeks.length; i++) {
      const wStart = new Date(currentYear, currentMonth, weeks[i].start);
      const wEnd = new Date(currentYear, currentMonth, weeks[i].end);
      promises.push(prisma.reportBreakdown.findMany({
        where: { tanggal: { gte: wStart, lt: wEnd }, ...(hasFilters && { no_lambung: { in: validLambungs } }) }
      }));
    }

    const results = await Promise.all(promises);

    let rIdx = 0;
    const breakdownsToday = results[rIdx++];
    const p2hTodayList = results[rIdx++];
    const recentP2H = results[rIdx++];
    const fuelCurrentMonth = results[rIdx++];
    const fuelPrevMonth = results[rIdx++];

    // ==========================================
    // PROCESSING RESULTS
    // ==========================================

    const breakdownLambungs = [...new Set(breakdownsToday.map((bd: any) => bd.no_lambung))];
    const operasionalSarana = totalSarana - breakdownLambungs.length;

    // 2. P2H Hari Ini
    const p2hCount = p2hTodayList.length;
    const p2hKepatuhan = totalSarana > 0 ? Math.round((p2hCount / totalSarana) * 100) : 0;
    
    let layak = 0, perbaikan = 0, tidakLayak = 0;
    p2hTodayList.forEach((p2h: any) => {
      const status = p2h.keputusan_akhir?.toLowerCase() || '';
      if (status.includes('tidak layak') || status.includes('stop')) tidakLayak++;
      else if (status.includes('perbaikan') || status.includes('rusak')) perbaikan++;
      else layak++;
    });

    // 3. Konsumsi Fuel
    const sumFuel = (records: any[]) => records.reduce((acc, curr) => acc + (curr.liter || 0), 0);
    const totalFuelCurrent = sumFuel(fuelCurrentMonth);
    const totalFuelPrev = sumFuel(fuelPrevMonth);
    let fuelTrend = 0;
    if (totalFuelPrev > 0) {
      fuelTrend = Math.round(((totalFuelCurrent - totalFuelPrev) / totalFuelPrev) * 100);
    }

    // Fuel Chart
    const fuelChart = [];
    for (let i = 0; i < 5; i++) {
      const records = results[rIdx++];
      const config = fuelChartDataConfig[i];
      let solar = 0, bensin = 0;
      records.forEach((r: any) => {
        if (r.jenis_bbm?.toLowerCase().includes('bensin') || r.jenis_bbm?.toLowerCase().includes('pertalite')) bensin += r.liter || 0;
        else solar += r.liter || 0;
      });
      fuelChart.push({
        bulan: config.start.toLocaleString('id-ID', { month: 'short' }),
        solar,
        bensin
      });
    }

    // 4. PA Trend Chart
    const paChart = [];
    for (let i = 0; i < 5; i++) {
      const monthBDs = results[rIdx++];
      const config = paChartDataConfig[i];
      
      let totalAvailableHours = 0;
      let totalBDBefore = 0;
      let totalBDAfter = 0;
      
      saranaList.forEach((sarana: any) => {
        const jamKerjaPerHari = sarana.shift === '1 Shift' ? 12 : 24;
        const maxJam = jamKerjaPerHari * config.daysInMonth;
        totalAvailableHours += maxJam;
        
        const sBDs = monthBDs.filter((b: any) => b.no_lambung === sarana.no_lambung);
        
        let bdReal = 0;
        let bdAfter = 0;
        sBDs.forEach((bd: any) => {
           let lamaBdNum = 0;
           if (bd.lama_bd) {
             let valStr = String(bd.lama_bd).replace(/,/g, '.').replace(/[^0-9.]/g, '');
             const parsed = parseFloat(valStr);
             if (!isNaN(parsed)) lamaBdNum = parsed;
           }
           bdReal += lamaBdNum;
           
           const hasBackup = bd.pengganti && bd.pengganti.trim() !== '' && bd.pengganti.trim().toLowerCase() !== 'tidak ada backup';
           if (!hasBackup) bdAfter += lamaBdNum;
        });
        
        totalBDBefore += bdReal;
        totalBDAfter += bdAfter;
      });
      
      let paBefore = 100;
      let paAfter = 100;
      if (totalAvailableHours > 0) {
        paBefore = Math.max(0, ((totalAvailableHours - totalBDBefore) / totalAvailableHours) * 100);
        paAfter = Math.max(0, ((totalAvailableHours - totalBDAfter) / totalAvailableHours) * 100);
      }
      
      paChart.push({
        bulan: config.start.toLocaleString('id-ID', { month: 'short' }),
        pa_before: parseFloat(paBefore.toFixed(2)),
        pa_after: parseFloat(paAfter.toFixed(2))
      });
    }

    // 5. Weekly KPI
    const weeklyKPI: any[] = [];
    for (let i = 0; i < weeks.length; i++) {
      const weekBDs = results[rIdx++];
      const daysInPeriod = weeks[i].end - weeks[i].start;

      let totalAvail = 0;
      let totalBdBefore = 0;
      let totalBdAfter = 0;

      saranaList.forEach((sarana: any) => {
        const jamKerja = (sarana.shift && String(sarana.shift).toLowerCase().includes('1')) ? 12 : 24;
        totalAvail += jamKerja * daysInPeriod;

        const sBDs = weekBDs.filter((b: any) => b.no_lambung === sarana.no_lambung);
        sBDs.forEach((bd: any) => {
          let lamaBdNum = 0;
          if (bd.lama_bd) {
            let valStr = String(bd.lama_bd).replace(/,/g, '.').replace(/[^0-9.]/g, '');
            const parsed = parseFloat(valStr);
            if (!isNaN(parsed)) lamaBdNum = parsed;
          }
          totalBdBefore += lamaBdNum;

          const hasBackup = bd.pengganti && bd.pengganti.trim() !== '' && bd.pengganti.trim().toLowerCase() !== 'tidak ada backup';
          if (!hasBackup) totalBdAfter += lamaBdNum;
        });
      });

      let paBefore = 100;
      let paAfter = 100;
      if (totalAvail > 0) {
        paBefore = Math.max(0, ((totalAvail - totalBdBefore) / totalAvail) * 100);
        paAfter = Math.max(0, ((totalAvail - totalBdAfter) / totalAvail) * 100);
      }

      weeklyKPI.push({
        minggu: `Minggu ${i + 1}`,
        pa_before: parseFloat(paBefore.toFixed(2)),
        pa_after: parseFloat(paAfter.toFixed(2))
      });
    }

    // 6. Expired Stickers & Expiring Soon (3 Months)
    const expiredStickers: any[] = [];
    const expiringSoonStickers: any[] = [];
    const threeMonthsFromNow = new Date(today);
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    saranaList.forEach(sarana => {
      if (sarana.kalender_stiker) {
        const d = new Date(sarana.kalender_stiker);
        if (!isNaN(d.getTime())) {
          if (d < today) {
            expiredStickers.push({
              no_lambung: sarana.no_lambung,
              expired_date: sarana.kalender_stiker,
              jenis_unit: sarana.jenis_unit,
              status: 'EXPIRED'
            });
          } else if (d <= threeMonthsFromNow) {
            expiringSoonStickers.push({
              no_lambung: sarana.no_lambung,
              expired_date: sarana.kalender_stiker,
              jenis_unit: sarana.jenis_unit,
              status: 'EXPIRING_SOON'
            });
          }
        }
      }
    });

    const pendingGACTResult: any = await prisma.$queryRaw`SELECT COUNT(*) as count FROM KuponTambahanBBM WHERE status_approval_gact = 'PENDING'`;
    const pendingFuelmanResult: any = await prisma.$queryRaw`SELECT COUNT(*) as count FROM KuponTambahanBBM WHERE status_approval_fuelman = 'PENDING'`;
    
    const pendingKuponGact = Number(pendingGACTResult[0]?.count || 0);
    const pendingKuponFuelman = Number(pendingFuelmanResult[0]?.count || 0);

    res.json({
      kpi: {
        totalSarana,
        operasionalSarana,
        breakdownCount: breakdownLambungs.length,
        breakdownUnits: breakdownLambungs.slice(0, 3).join(', ') + (breakdownLambungs.length > 3 ? '...' : ''),
        p2hCount,
        p2hKepatuhan,
        totalFuelCurrent,
        fuelTrend,
        pendingKuponGact,
        pendingKuponFuelman
      },
      charts: {
        fuel: fuelChart,
        pa: paChart,
        weeklyKPI: weeklyKPI,
        p2hStatus: [
          { name: 'Layak Operasi', value: layak, color: '#10b981' },
          { name: 'Perbaikan', value: perbaikan, color: '#f59e0b' },
          { name: 'Tidak Layak', value: tidakLayak, color: '#ef4444' }
        ],
        vehicleStatus: [
          { name: 'Operasional', value: operasionalSarana, color: '#10b981' },
          { name: 'Breakdown', value: breakdownLambungs.length, color: '#ef4444' }
        ]
      },
      recentP2H: recentP2H.map(p => ({
        id: p.id,
        unit: p.no_lambung || 'Unknown',
        driver: p.nama_driver || 'Unknown',
        status: p.keputusan_akhir || 'Layak',
        time: p.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      })),
      stickers: {
        expired: expiredStickers,
        expiringSoon: expiringSoonStickers
      }
    });

  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ message: 'Server error retrieving dashboard stats' });
  }
};
