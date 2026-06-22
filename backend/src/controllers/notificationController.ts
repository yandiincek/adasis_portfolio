import { Request, Response } from 'express';
import prisma from '../config/database';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { role, user_id } = req.query;
    let notifications: any[] = [];

    const wos = await prisma.workOrder.findMany({
      include: { requester: true, approvals: true, progress: true },
      orderBy: { updatedAt: 'desc' }
    });

    wos.forEach(wo => {
      const diffMs = new Date().getTime() - new Date(wo.updatedAt).getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMins / 60);
      const diffDays = Math.round(diffHours / 24);
      let timeStr = 'Just now';
      if (diffDays > 0) timeStr = `${diffDays}d ago`;
      else if (diffHours > 0) timeStr = `${diffHours}h ago`;
      else if (diffMins > 0) timeStr = `${diffMins}m ago`;

      if (role === 'ADMIN' || role === 'ADMINISTRATOR' || role === 'ADMIN_INFRA') {
        if (wo.status === 'PENDING') notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'Menunggu Persetujuan' });
        else if (wo.status === 'APPROVED' && !wo.no_wo) notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'Isi No WO' });
        else if (wo.status === 'APPROVED' || wo.status === 'REJECTED') notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: `WO ${wo.status}` });
        else if (wo.status === 'CLOSED' && !wo.progress?.is_acknowledged) notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'Pekerjaan Selesai' });
        else if (wo.status === 'ON_PROGRESS' && !wo.progress?.startedAt) notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'WO Disetujui (Silahkan Lakukan Pekerjaan)' });
        else if (wo.status === 'ON_PROGRESS' && wo.progress?.startedAt) notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'Pekerjaan Dimulai' });
      } else if (role === 'UH_CGA') {
        const hasDiketahui = wo.approvals.some((a: any) => a.approval_type === 'DIKETAHUI');
        if (wo.status === 'PENDING' && !hasDiketahui) notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'Butuh Approval Anda (UH)' });
        else if (wo.status === 'CLOSED' && !wo.progress?.is_acknowledged) notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'Pekerjaan Selesai' });
        else if (wo.status === 'ON_PROGRESS' && wo.progress?.startedAt) notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'Pekerjaan Dimulai' });
      } else if (role === 'SH_CGA') {
        const hasDiketahui = wo.approvals.some((a: any) => a.approval_type === 'DIKETAHUI' && a.status === 'APPROVED');
        const hasDisetujui = wo.approvals.some((a: any) => a.approval_type === 'DISETUJUI');
        if (wo.status === 'PENDING' && hasDiketahui && !hasDisetujui) notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'Butuh Approval Anda (SH)' });
        else if (wo.status === 'CLOSED' && !wo.progress?.is_acknowledged) notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'Pekerjaan Selesai' });
        else if (wo.status === 'ON_PROGRESS' && wo.progress?.startedAt) notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'Pekerjaan Dimulai' });
      } else if (role === 'USER') {
        if (String(wo.requester_id) === String(user_id)) {
          const hasDiketahui = wo.approvals.some((a: any) => a.approval_type === 'DIKETAHUI' && a.status === 'APPROVED');
          const hasDisetujui = wo.approvals.some((a: any) => a.approval_type === 'DISETUJUI');
          if (wo.status === 'PENDING' && hasDiketahui && !hasDisetujui) notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'Disetujui UH (Proses SH)' });
          else if (wo.status === 'APPROVED') notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'WO Anda Disetujui' });
          else if (wo.status === 'REJECTED') notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'WO Anda Ditolak' });
          else if (wo.status === 'CLOSED' && !wo.progress?.is_acknowledged) notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'Pekerjaan Selesai (Menunggu Konfirmasi)' });
          else if (wo.status === 'ON_PROGRESS') notifications.push({ id: wo.id, user: wo.requester.full_name, task: wo.title, time: timeStr, message: 'WO Sedang Dikerjakan Tim Infra' });
        }
      }
    });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil notifikasi' });
  }
};
