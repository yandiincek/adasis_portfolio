import { Request, Response } from 'express';
import prisma from '../config/database';
import crypto from 'crypto';
import { sendEmailNotification, sendWhatsAppMessage } from '../utils/notification';

export const getKuponBbm = async (req: Request, res: Response) => {
  try {
    const data = await prisma.$queryRaw`SELECT * FROM KuponTambahanBBM ORDER BY createdAt DESC`;
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in getKuponBbm:', error);
    res.status(500).json({ message: 'Gagal mengambil data kupon bbm' });
  }
};

export const createKuponBbm = async (req: Request, res: Response) => {
  console.log('=> [API CALL] Endpoint createKuponBbm dipanggil oleh Frontend!');
  try {
    const { jam, nama_driver, nrp_driver, no_lambung, supplier, no_polisi, alasan, jumlah_fuel } = req.body;
    const id = crypto.randomUUID();

    await prisma.$executeRaw`
      INSERT INTO KuponTambahanBBM (
        id, jam, nama_driver, nrp_driver, no_lambung, supplier, no_polisi, jumlah_fuel, alasan, 
        status_approval_gact, status_approval_fuelman, tanggal, createdAt, updatedAt
      )
      VALUES (
        ${id}, ${jam || ''}, ${nama_driver || ''}, ${nrp_driver || ''}, ${no_lambung || ''}, 
        ${supplier || ''}, ${no_polisi || ''}, ${jumlah_fuel || ''}, ${alasan || ''}, 
        'PENDING', 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `;

    // --- Notifikasi ke GA ---
    const waGA = process.env.GACT_PHONE || '081234567890';
    const emailGA = process.env.GACT_EMAIL || 'ga@perusahaan.com';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkApproval = `${frontendUrl}/coal/data-kupon-bbm`;
    
    const msg = `[NOTIFIKASI BARU] Ada pengajuan Kupon BBM baru dari ${nama_driver} (Unit: ${no_lambung}) sebanyak ${jumlah_fuel} L.\n\nAlasan: ${alasan}.\n\nMohon segera klik link berikut untuk melakukan Approval:\n${linkApproval}`;
    const html = `<h3>Pengajuan Kupon BBM Baru</h3><p>Driver: <b>${nama_driver}</b></p><p>Unit: <b>${no_lambung}</b></p><p>Jumlah: <b>${jumlah_fuel} L</b></p><p>Alasan: ${alasan}</p><p>Harap segera login ke sistem untuk memproses:</p><a href="${linkApproval}" style="display: inline-block; padding: 10px 15px; background-color: #3298A0; color: white; text-decoration: none; border-radius: 5px;">Buka Halaman Approval</a>`;
    
    sendWhatsAppMessage(waGA, msg);
    sendEmailNotification(emailGA, 'Pengajuan Kupon BBM Baru', html);
    // ------------------------

    res.status(201).json({ message: 'Kupon berhasil dibuat', id });
  } catch (error) {
    console.error('Error in createKuponBbm:', error);
    res.status(500).json({ message: 'Gagal membuat data kupon bbm' });
  }
};

export const updateApprovalGact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, approver_name } = req.body;

    await prisma.$executeRaw`
      UPDATE KuponTambahanBBM 
      SET status_approval_gact = ${status}, approver_gact = ${approver_name}, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    // --- Notifikasi Lanjutan ---
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkApproval = `${frontendUrl}/coal/data-kupon-bbm`;
    
    if (status === 'APPROVED') {
      const waFuelman = process.env.FUELMAN_PHONE || '081234567890';
      const emailFuelman = process.env.FUELMAN_EMAIL || 'fuelman@perusahaan.com';
      sendWhatsAppMessage(waFuelman, `[NOTIFIKASI] GA telah menyetujui kupon BBM. Giliran Fuelman untuk memproses approval.\n\nSilakan klik link berikut:\n${linkApproval}`);
      sendEmailNotification(emailFuelman, 'Menunggu Approval Fuelman', `<p>GA telah menyetujui pengajuan Kupon BBM. Silakan login untuk persetujuan akhir:</p><a href="${linkApproval}">Buka Aplikasi</a>`);
    } else if (status === 'REJECTED') {
      const waDriver = process.env.DRIVER_PHONE || '081234567890';
      const emailDriver = process.env.DRIVER_EMAIL || 'driver@perusahaan.com';
      sendWhatsAppMessage(waDriver, `[DITOLAK] Pengajuan Kupon BBM Anda DITOLAK oleh GA. Silakan cek aplikasi untuk mengedit jumlah liter atau alasan.\n\nCek di sini:\n${linkApproval}`);
      sendEmailNotification(emailDriver, 'Kupon BBM Ditolak GA', `<p>Pengajuan Kupon BBM Anda ditolak oleh GA. Anda dapat masuk ke aplikasi dan mengklik tombol <b>Edit Fuel</b> untuk mengajukan ulang:</p><a href="${linkApproval}">Buka Aplikasi</a>`);
    }
    // ------------------------

    res.status(200).json({ message: 'Approval GACT berhasil diperbarui' });
  } catch (error) {
    console.error('Error in updateApprovalGact:', error);
    res.status(500).json({ message: 'Gagal memperbarui approval GACT' });
  }
};

export const updateApprovalFuelman = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, approver_name } = req.body;

    await prisma.$executeRaw`
      UPDATE KuponTambahanBBM 
      SET status_approval_fuelman = ${status}, approver_fuelman = ${approver_name}, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    // --- Notifikasi Akhir ---
    const waDriver = process.env.DRIVER_PHONE || '081234567890';
    const emailDriver = process.env.DRIVER_EMAIL || 'driver@perusahaan.com';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkApproval = `${frontendUrl}/coal/data-kupon-bbm`;

    if (status === 'APPROVED') {
      sendWhatsAppMessage(waDriver, `[SUKSES] Pengajuan Kupon BBM Anda telah DISETUJUI oleh Fuelman. Silakan datang ke Fuel Station.\n\nCek status: ${linkApproval}`);
      sendEmailNotification(emailDriver, 'Kupon BBM Disetujui!', `<p>Pengajuan Kupon BBM Anda telah disetujui sepenuhnya. Silakan datang ke Fuel Station untuk pengisian.</p><a href="${linkApproval}">Buka Aplikasi</a>`);
    } else if (status === 'REJECTED') {
      sendWhatsAppMessage(waDriver, `[DITOLAK] Pengajuan Kupon BBM Anda DITOLAK oleh Fuelman.\n\nCek alasan penolakan di aplikasi:\n${linkApproval}`);
      sendEmailNotification(emailDriver, 'Kupon BBM Ditolak Fuelman', `<p>Pengajuan Kupon BBM Anda ditolak pada tahap Fuelman. Silakan cek aplikasi untuk detail lebih lanjut.</p><a href="${linkApproval}">Buka Aplikasi</a>`);
    }
    // ------------------------

    res.status(200).json({ message: 'Approval Fuelman berhasil diperbarui' });
  } catch (error) {
    console.error('Error in updateApprovalFuelman:', error);
    res.status(500).json({ message: 'Gagal memperbarui approval Fuelman' });
  }
};

export const editKuponFuelAmount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { jumlah_fuel, userRole, userName } = req.body;
    
    if (userRole === 'DRIVER') {
      await prisma.$executeRaw`
        UPDATE KuponTambahanBBM 
        SET jumlah_fuel = ${jumlah_fuel}, status_approval_gact = 'PENDING', status_approval_fuelman = 'PENDING', updatedAt = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;

      // Notifikasi bahwa ada revisi dari Driver
      const waGA = process.env.GACT_PHONE || '081234567890';
      const emailGA = process.env.GACT_EMAIL || 'ga@perusahaan.com';
      sendWhatsAppMessage(waGA, `[REVISI] Driver ${userName} telah merevisi pengajuan Kupon BBM menjadi ${jumlah_fuel} L. Mohon diproses ulang.`);
      sendEmailNotification(emailGA, 'Revisi Kupon BBM', `<p>Driver <b>${userName}</b> telah mengedit jumlah pengajuannya menjadi <b>${jumlah_fuel} L</b>. Silakan periksa di aplikasi untuk memproses ulang.</p>`);

    } else if (userRole === 'ADMIN_TRANSPORT' || userRole === 'GA') {
      await prisma.$executeRaw`
        UPDATE KuponTambahanBBM 
        SET jumlah_fuel = ${jumlah_fuel}, status_approval_gact = 'APPROVED', approver_gact = ${userName}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
    } else if (userRole === 'FUELMAN') {
      await prisma.$executeRaw`
        UPDATE KuponTambahanBBM 
        SET jumlah_fuel = ${jumlah_fuel}, status_approval_fuelman = 'APPROVED', approver_fuelman = ${userName}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
    } else if (userRole === 'ADMINISTRATOR' || userRole === 'ADMIN') {
      await prisma.$executeRaw`
        UPDATE KuponTambahanBBM 
        SET jumlah_fuel = ${jumlah_fuel}, status_approval_gact = 'APPROVED', status_approval_fuelman = 'APPROVED', approver_gact = ${userName}, approver_fuelman = ${userName}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE KuponTambahanBBM 
        SET jumlah_fuel = ${jumlah_fuel}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
    }

    res.status(200).json({ message: 'Jumlah fuel berhasil diupdate' });
  } catch (error) {
    console.error('Error in editKuponFuelAmount:', error);
    res.status(500).json({ message: 'Gagal mengupdate jumlah fuel' });
  }
};
