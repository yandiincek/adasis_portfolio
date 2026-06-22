import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create P2H
export const createP2H = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Parse JSON fields if they are sent as strings
    let matrixChecklist = data.matrix_checklist;
    let bugarSehat = data.bugar_sehat;

    if (typeof matrixChecklist === 'object' && matrixChecklist !== null) {
      matrixChecklist = JSON.stringify(matrixChecklist);
    }
    if (typeof bugarSehat === 'object' && bugarSehat !== null) {
      bugarSehat = JSON.stringify(bugarSehat);
    }

    // Handle uploaded file
    let gambarUrl = data.gambar_url || null;
    if (req.file) {
      gambarUrl = `/uploads/${req.file.filename}`;
    }

    // Convert date string to DateTime if provided
    let tanggal = new Date();
    if (data.tanggal) {
      tanggal = new Date(data.tanggal);
    }
    let expStiker = null;
    if (data.exp_stiker) {
      expStiker = new Date(data.exp_stiker);
    }

    const newP2H = await prisma.p2HForm.create({
      data: {
        unit_id: data.unit_id || null,
        tanggal,
        shift: data.shift || null,
        lokasi_parkir: data.lokasi_parkir || null,
        area_kerja: data.area_kerja || null,
        
        no_lambung: data.no_lambung || null,
        jenis_unit: data.jenis_unit || null,
        nama_driver: data.nama_driver || null,
        nrp_driver: data.nrp_driver || null,
        km_awal: data.km_awal && !isNaN(parseFloat(data.km_awal)) ? parseFloat(data.km_awal) : null,
        km_akhir: data.km_akhir && !isNaN(parseFloat(data.km_akhir)) ? parseFloat(data.km_akhir) : null,
        exp_stiker: expStiker,
        supplier: data.supplier || null,
        no_polisi: data.no_polisi || null,

        matrix_checklist: matrixChecklist || null,

        jam_istirahat: data.jam_istirahat || null,
        bugar_sehat: bugarSehat || null,
        
        isi_p5m: data.isi_p5m || null,
        driver_siap: data.driver_siap || null,
        
        keputusan_akhir: data.keputusan_akhir || null,
        nama_pengawas: data.nama_pengawas || null,
        nrp_pengawas: data.nrp_pengawas || null,
        keterangan_pengawas: data.keterangan_pengawas || null,
        
        status: data.status || 'PENDING_REVIEW',
        gambar_url: gambarUrl,
        latitude: data.latitude && !isNaN(parseFloat(data.latitude)) ? parseFloat(data.latitude) : null,
        longitude: data.longitude && !isNaN(parseFloat(data.longitude)) ? parseFloat(data.longitude) : null
      }
    });

    res.status(201).json({
      message: 'P2H form submitted successfully',
      data: newP2H
    });
  } catch (error: any) {
    console.error('Error creating P2H:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get All P2H
export const getAllP2H = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    let whereClause = {};
    if (status) {
      whereClause = { status: String(status) };
    }

    const p2hForms = await prisma.p2HForm.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        unit: true // Include related Sarana if linked
      }
    });

    res.status(200).json({
      message: 'Successfully retrieved P2H forms',
      data: p2hForms
    });
  } catch (error: any) {
    console.error('Error getting P2H forms:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get P2H by ID
export const getP2HById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const p2hForm = await prisma.p2HForm.findUnique({
      where: { id },
      include: {
        unit: true
      }
    });

    if (!p2hForm) {
      return res.status(404).json({ message: 'P2H form not found' });
    }

    res.status(200).json({
      message: 'Successfully retrieved P2H form',
      data: p2hForm
    });
  } catch (error: any) {
    console.error('Error getting P2H by ID:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Review P2H (Pengawas)
export const reviewP2H = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      keputusan_akhir, 
      nama_pengawas, 
      nrp_pengawas, 
      keterangan_pengawas, 
      status 
    } = req.body;

    const existing = await prisma.p2HForm.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'P2H form not found' });
    }

    const updatedP2H = await prisma.p2HForm.update({
      where: { id },
      data: {
        keputusan_akhir: keputusan_akhir !== undefined ? keputusan_akhir : existing.keputusan_akhir,
        nama_pengawas: nama_pengawas !== undefined ? nama_pengawas : existing.nama_pengawas,
        nrp_pengawas: nrp_pengawas !== undefined ? nrp_pengawas : existing.nrp_pengawas,
        keterangan_pengawas: keterangan_pengawas !== undefined ? keterangan_pengawas : existing.keterangan_pengawas,
        status: status !== undefined ? status : existing.status,
      }
    });

    res.status(200).json({
      message: 'P2H form reviewed successfully',
      data: updatedP2H
    });
  } catch (error: any) {
    console.error('Error reviewing P2H:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
