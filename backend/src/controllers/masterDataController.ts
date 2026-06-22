import { Request, Response } from 'express';
import prisma from '../config/database';

export const getAreas = async (req: Request, res: Response) => {
  try {
    const areas = await prisma.area.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data area' });
  }
};

export const createArea = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) { res.status(400).json({ error: 'Nama area tidak boleh kosong' }); return; }
    const newArea = await prisma.area.create({ data: { name } });
    res.status(201).json(newArea);
  } catch (error) {
    res.status(500).json({ error: 'Gagal menambahkan area baru' });
  }
};

export const getJenisBangunan = async (req: Request, res: Response) => {
  try {
    const data = await prisma.jenisBangunan.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data jenis bangunan' });
  }
};

export const createJenisBangunan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) { res.status(400).json({ error: 'Nama tidak boleh kosong' }); return; }
    const newData = await prisma.jenisBangunan.create({ data: { name } });
    res.status(201).json(newData);
  } catch (error) {
    res.status(500).json({ error: 'Gagal menambahkan jenis bangunan' });
  }
};

export const getKepemilikan = async (req: Request, res: Response) => {
  try {
    const data = await prisma.kepemilikan.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data kepemilikan' });
  }
};

export const createKepemilikan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) { res.status(400).json({ error: 'Nama tidak boleh kosong' }); return; }
    const newData = await prisma.kepemilikan.create({ data: { name } });
    res.status(201).json(newData);
  } catch (error) {
    res.status(500).json({ error: 'Gagal menambahkan kepemilikan' });
  }
};

export const getBangunan = async (req: Request, res: Response) => {
  try {
    const data = await prisma.bangunan.findMany({
      include: { area: true, jenis: true, kepemilikan: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data bangunan' });
  }
};

export const createBangunan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, area_id, jenis_id, kepemilikan_id } = req.body;
    if (!name || !area_id || !jenis_id || !kepemilikan_id) {
      res.status(400).json({ error: 'Semua field harus diisi' }); return;
    }
    const newData = await prisma.bangunan.create({
      data: { name, area_id: parseInt(area_id), jenis_id: parseInt(jenis_id), kepemilikan_id: parseInt(kepemilikan_id) }
    });
    res.status(201).json(newData);
  } catch (error) {
    res.status(500).json({ error: 'Gagal menambahkan bangunan' });
  }
};
