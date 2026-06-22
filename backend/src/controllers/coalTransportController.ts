import { Request, Response } from 'express';
import prisma from '../config/database';

// ==========================================
// SARANA CONTROLLERS
// ==========================================

export const getSarana = async (req: Request, res: Response) => {
  try {
    const sarana = await prisma.sarana.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(sarana);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving sarana' });
  }
};

export const createSarana = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newSarana = await prisma.sarana.create({
      data
    });
    res.status(201).json(newSarana);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating sarana' });
  }
};

export const updateSarana = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Check if exists
    const existing = await prisma.sarana.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Sarana not found' });
    }

    const updatedSarana = await prisma.sarana.update({
      where: { id },
      data: {
        ...data,
        id: undefined, // ensure id is not overwritten
        createdAt: undefined,
        updatedAt: undefined
      }
    });
    res.json(updatedSarana);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating sarana' });
  }
};

export const deleteSarana = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if exists
    const existing = await prisma.sarana.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Sarana not found' });
    }

    await prisma.sarana.delete({
      where: { id }
    });
    
    res.json({ message: 'Sarana deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting sarana' });
  }
};

export const bulkCreateSarana = async (req: Request, res: Response) => {
  try {
    const dataArray = req.body;
    
    if (!Array.isArray(dataArray)) {
      return res.status(400).json({ message: 'Data must be an array' });
    }

    // Since SQLite/Postgres might have limitations on bulk creation size or relationships,
    // we use Prisma's createMany
    const created = await prisma.sarana.createMany({
      data: dataArray.map(item => ({
        ...item,
        id: undefined, // Let DB generate UUID
        tahun_pembuatan: item.tahun_pembuatan ? parseInt(item.tahun_pembuatan) : null
      })),
      skipDuplicates: true // Important for UUIDs or unique fields like no_lambung
    });

    res.status(201).json({ message: 'Bulk import successful', count: created.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error importing sarana' });
  }
};

// ==========================================
// FUEL QUOTA CONTROLLERS
// ==========================================

export const getFuelQuotas = async (req: Request, res: Response) => {
  try {
    const quotas = await prisma.fuelQuota.findMany({
      include: {
        unit: true // Include relation to Sarana
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(quotas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving fuel quotas' });
  }
};

export const bulkCreateFuelQuotas = async (req: Request, res: Response) => {
  try {
    const dataArray = req.body;
    
    if (!Array.isArray(dataArray)) {
      return res.status(400).json({ message: 'Data must be an array' });
    }

    console.log("Incoming payload 0:", JSON.stringify(dataArray[0]));

    // Fetch all Sarana to map no_lambung to unit_id
    const allSarana = await prisma.sarana.findMany({
      select: { id: true, no_lambung: true, fuel_ratio_kontrak_lama: true }
    });
    
    const saranaMap = new Map();
    allSarana.forEach(s => {
      if (s.no_lambung) saranaMap.set(s.no_lambung, s);
    });

    const validData = [];
    for (const item of dataArray) {
      const sarana = saranaMap.get(item.codeUnit);
      if (sarana) {
        const parseNum = (val: any) => {
          if (typeof val === 'number') return val;
          if (!val || val === '-') return 0;
          let s = String(val).trim();
          if (s.includes(',')) {
            s = s.replace(/\./g, '').replace(',', '.');
          }
          return parseFloat(s) || 0;
        };

        let plan_jarak = parseNum(item.plan_jarak);
        
        // Dapatkan ratio (dari excel, atau DB)
        let rawRatio = item.ratio || sarana.fuel_ratio_kontrak_lama;
        let ratioVal = 1;
        if (rawRatio) {
          if (typeof rawRatio === 'string' && rawRatio.includes(':')) {
            const parts = rawRatio.split(':');
            ratioVal = parseNum(parts[1]) || 1;
          } else {
            ratioVal = parseNum(rawRatio) || 1;
          }
        }
        
        // Rumus:
        // Permintaan Kuota Fuel (Ltr/Bulan) = Plan Jarak Tempuh (Km/Bulan) / Ratio
        // Plan Kuota Fuel (Ltr/Hari) = Permintaan Kuota Fuel (Ltr/Bulan) / days_in_month
        let calcPermintaan = plan_jarak / ratioVal;
        let days = item.days_in_month ? parseInt(item.days_in_month) : 30;
        let calcPlanHari = calcPermintaan / days;

        validData.push({
          unit_id: sarana.id,
          ratio: ratioVal,
          plan_jarak: plan_jarak,
          permintaan_kuota: calcPermintaan,
          plan_kuota_hari: calcPlanHari,
          kartu_kuota: parseNum(item.kartu_kuota),
          no_id: item.no_id,
          sap_code: item.sap_code,
          tempat_refueling: item.tempat_refueling
        });
      }
    }

    if (validData.length === 0) {
      return res.status(400).json({ message: 'No valid units found to attach quotas to.' });
    }

    const created = await prisma.fuelQuota.createMany({
      data: validData,
      skipDuplicates: true
    });

    res.status(201).json({ message: 'Bulk import successful', count: created.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error importing fuel quotas' });
  }
};

// ==========================================
// FUEL RECORD CONTROLLERS
// ==========================================

export const getFuelRecords = async (req: Request, res: Response) => {
  try {
    const records = await prisma.fuelRecord.findMany({
      include: {
        unit: true
      },
      orderBy: { tanggal: 'desc' }
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving fuel records' });
  }
};

export const createFuelRecord = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newRecord = await prisma.fuelRecord.create({
      data: {
        unit_id: data.unit_id,
        tanggal: new Date(data.tanggal),
        jam: data.jam,
        petugas_name: data.petugas_name,
        petugas_nrp: data.petugas_nrp,
        fuelman_name: data.fuelman_name,
        fuelman_nrp: data.fuelman_nrp,
        jadwal_rute: data.jadwal_rute ? parseFloat(data.jadwal_rute) : null,
        jenis_bbm: data.jenis_bbm,
        liter: data.liter ? parseFloat(data.liter) : null,
        km_awal: data.km_awal ? parseFloat(data.km_awal) : null,
        km_akhir: data.km_akhir ? parseFloat(data.km_akhir) : null
      }
    });
    res.status(201).json(newRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating fuel record' });
  }
};

// ==========================================
// REPORT BREAKDOWN CONTROLLERS
// ==========================================

export const getReportBreakdown = async (req: Request, res: Response) => {
  try {
    const records = await prisma.reportBreakdown.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Attach area from Sarana
    const saranaList = await prisma.sarana.findMany({
      select: { no_lambung: true, area: true }
    });
    const saranaMap = new Map();
    saranaList.forEach(s => {
      if (s.no_lambung) saranaMap.set(s.no_lambung.toUpperCase().trim(), s.area);
    });
    
    const enrichedRecords = records.map(record => ({
      ...record,
      area: saranaMap.get((record.no_lambung || '').toUpperCase().trim()) || '-'
    }));
    
    res.json(enrichedRecords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving report breakdown' });
  }
};

export const createReportBreakdown = async (req: Request, res: Response) => {
  try {
    const { shift, data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    // Fetch all Sarana to map properties
    const allSarana = await prisma.sarana.findMany({
      select: { no_lambung: true, jenis_unit: true, section: true, supplier: true }
    });
    const saranaMap = new Map();
    allSarana.forEach(s => {
      if (s.no_lambung) saranaMap.set(s.no_lambung.toUpperCase().trim(), s);
    });

    const payload = data.map((item: any) => {
      const lambung = item.noLambung ? String(item.noLambung).trim() : '-';
      const sarana = saranaMap.get(lambung.toUpperCase());

      return {
        shift,
        no_lambung: lambung,
        jenis_unit: sarana?.jenis_unit || item.jenisUnit || null,
        section: sarana?.section || item.section || null,
        supplier: sarana?.supplier || item.supplier || null,
        keterangan_bd: item.keteranganBd,
        pengganti: item.pengganti || 'Tidak ada backup',
        lama_bd: item.lamaBd
      };
    });

    const created = await prisma.reportBreakdown.createMany({
      data: payload,
    });

    res.status(201).json({ message: 'Report breakdown saved successfully', count: created.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating report breakdown' });
  }
};

export const bulkCreateReportBreakdown = async (req: Request, res: Response) => {
  try {
    const dataArray = req.body;
    
    if (!Array.isArray(dataArray)) {
      return res.status(400).json({ message: 'Data must be an array' });
    }

    // Fetch all Sarana to map properties
    const allSarana = await prisma.sarana.findMany({
      select: { no_lambung: true, jenis_unit: true, section: true, supplier: true }
    });
    const saranaMap = new Map();
    allSarana.forEach(s => {
      if (s.no_lambung) saranaMap.set(s.no_lambung.toUpperCase().trim(), s);
    });

    const payload = dataArray.map((item: any) => {
      const lambung = item.no_lambung ? String(item.no_lambung).trim() : '-';
      const sarana = saranaMap.get(lambung.toUpperCase());

      return {
        shift: item.shift || 'Shift 1',
        no_lambung: lambung,
        tanggal: item.tanggal ? new Date(item.tanggal) : new Date(),
        jenis_unit: sarana?.jenis_unit || item.jenis_unit || null,
        section: sarana?.section || item.section || null,
        supplier: sarana?.supplier || item.supplier || null,
        keterangan_bd: item.keterangan_bd || null,
        pengganti: item.pengganti || 'Tidak ada backup',
        lama_bd: item.lama_bd || null
      };
    });

    const created = await prisma.reportBreakdown.createMany({
      data: payload,
    });

    res.status(201).json({ message: 'Bulk import report breakdown successful', count: created.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error importing report breakdown' });
  }
};
