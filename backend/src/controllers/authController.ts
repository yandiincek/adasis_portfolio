import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/database';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username dan password wajib diisi' });
      return;
    }
    
    const user = await prisma.user.findFirst({ where: { username: username.toLowerCase() } });
    
    if (!user) {
      res.status(401).json({ error: 'Username tidak ditemukan' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      // Izinkan bypass "dummy" untuk akun lama yang belum diganti hash-nya sementara
      if (password === 'dummy' && user.password_hash === 'dummy') {
        res.json(user);
        return;
      }
      res.status(401).json({ error: 'Password salah' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat login' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, username, password, role, nrp, department, email } = req.body;
    
    if (!full_name || !username || !password || !role) {
      res.status(400).json({ error: 'Semua field (Nama, Username, Password, Level) wajib diisi' });
      return;
    }

    // Cek apakah username sudah ada
    const existingUser = await prisma.user.findFirst({ where: { username: username.toLowerCase() } });
    if (existingUser) {
      res.status(400).json({ error: 'Username sudah digunakan, silakan pilih yang lain' });
      return;
    }

    // Enkripsi password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        full_name,
        password_hash,
        role,
        nrp,
        department,
        email,
      }
    });

    // Jangan kembalikan hash password
    const { password_hash: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat mendaftar' });
  }
};

export const getUserByNrp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nrp } = req.params;
    if (!nrp) {
      res.status(400).json({ error: 'NRP wajib diisi' });
      return;
    }

    const user = await prisma.user.findFirst({ where: { nrp } });
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mencari data' });
  }
};
