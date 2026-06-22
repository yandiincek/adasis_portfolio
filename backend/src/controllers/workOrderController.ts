import { Request, Response } from 'express';
import prisma from '../config/database';

export const getStats = async (req: Request, res: Response) => {
  try {
    const filter = req.query.filter as string;
    const role = req.query.role as string;
    const userId = req.query.user_id as string;

    let dateWhere: any = {};
    if (filter === 'weekly') {
      const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 7);
      dateWhere = { createdAt: { gte: lastWeek } };
    } else if (filter === 'monthly') {
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      dateWhere = { createdAt: { gte: startOfMonth } };
    } else if (filter === 'yearly') {
      const startOfYear = new Date(); startOfYear.setMonth(0, 1); startOfYear.setHours(0, 0, 0, 0);
      dateWhere = { createdAt: { gte: startOfYear } };
    }

    // Jika role USER, hanya tampilkan data miliknya sendiri
    const ownerWhere = (role === 'USER' && userId) ? { requester_id: userId } : {};

    const [pending, approved, rejected, onProgress, closed, total] = await Promise.all([
      prisma.workOrder.count({ where: { status: 'PENDING', ...dateWhere, ...ownerWhere } }),
      prisma.workOrder.count({ where: { status: 'APPROVED', ...dateWhere, ...ownerWhere } }),
      prisma.workOrder.count({ where: { status: 'REJECTED', ...dateWhere, ...ownerWhere } }),
      prisma.workOrder.count({ where: { status: 'ON_PROGRESS', ...dateWhere, ...ownerWhere } }),
      prisma.workOrder.count({ where: { status: 'CLOSED', ...dateWhere, ...ownerWhere } }),
      prisma.workOrder.count({ where: { ...dateWhere, ...ownerWhere } }),
    ]);

    const menungguUH = await prisma.workOrder.count({
      where: { status: 'PENDING', approvals: { none: { approval_type: 'DIKETAHUI' } }, ...dateWhere, ...ownerWhere }
    });

    const menungguSH = await prisma.workOrder.count({
      where: {
        status: 'PENDING',
        approvals: { some: { approval_type: 'DIKETAHUI', status: 'APPROVED' }, none: { approval_type: 'DISETUJUI' } },
        ...dateWhere, ...ownerWhere
      }
    });

    res.json({ menungguUH, menungguSH, rejected, approved, total, onProgress, closed });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil statistik' });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const { status: statusFilter, no_wo, role, user_id } = req.query;
    let where: any = {};
    if (statusFilter === 'menunggu-uh') where = { status: 'PENDING', approvals: { none: { approval_type: 'DIKETAHUI' } } };
    else if (statusFilter === 'menunggu-sh') where = { status: 'PENDING', approvals: { some: { approval_type: 'DIKETAHUI', status: 'APPROVED' }, none: { approval_type: 'DISETUJUI' } } };
    else if (statusFilter === 'rejected') where = { status: 'REJECTED' };
    else if (statusFilter === 'approved') where = { status: 'APPROVED' };
    else if (statusFilter === 'on-progress') where = { status: 'ON_PROGRESS' };
    else if (statusFilter === 'selesai') where = { status: 'CLOSED' };

    if (no_wo === 'null') { where.no_wo = null; where.status = 'APPROVED'; }

    // Jika role USER, hanya tampilkan data miliknya sendiri
    if (role === 'USER' && user_id) {
      where.requester_id = user_id as string;
    }

    const data = await prisma.workOrder.findMany({
      where,
      include: {
        requester: { select: { full_name: true, nrp: true, department: true, contact: true } },
        area: { select: { name: true } },
        bangunans: { select: { name: true } },
        approvals: { include: { approver: { select: { full_name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
        progress: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const parsedData = data.map((item: any) => {
      let lampiran = [];
      if (typeof item.lampiran_urls === 'string') {
        if (item.lampiran_urls.startsWith('{') && item.lampiran_urls.endsWith('}')) {
          const inner = item.lampiran_urls.slice(1, -1);
          lampiran = inner ? inner.split(',') : [];
        } else {
          try {
            lampiran = JSON.parse(item.lampiran_urls || '[]');
          } catch (e) { lampiran = []; }
        }
      } else {
        lampiran = item.lampiran_urls || [];
      }
      return { ...item, lampiran_urls: lampiran };
    });

    res.json(parsedData);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data work order' });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, requester_name, requester_nrp, requester_dept, requester_contact, area_id, bangunan_ids, requester_id } = req.body;
    if (!title || !description || !area_id || !bangunan_ids) { res.status(400).json({ error: 'Field wajib diisi' }); return; }

    let parsedBangunanIds = [];
    try { parsedBangunanIds = JSON.parse(bangunan_ids); } 
    catch (e) { parsedBangunanIds = typeof bangunan_ids === 'string' && bangunan_ids.includes(',') ? bangunan_ids.split(',') : [bangunan_ids]; }

    let finalRequesterId = requester_id;
    if (!finalRequesterId) {
      let requester = await prisma.user.findFirst({ where: { full_name: requester_name } });
      if (!requester) {
        requester = await prisma.user.create({
          data: {
            username: requester_name.toLowerCase().replace(/\s+/g, '.') + '.' + Date.now(),
            password_hash: 'dummy',
            full_name: requester_name || 'User Tanpa Nama',
            nrp: requester_nrp || null,
            department: requester_dept || null,
            contact: requester_contact || null
          }
        });
      }
      finalRequesterId = requester.id;
    }

    let lampiran_urls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      lampiran_urls = req.files.map((file: any) => `/uploads/${file.filename}`);
    }

    const wo = await prisma.workOrder.create({
      data: {
        title, description, requester_id: finalRequesterId, area_id: parseInt(area_id),
        bangunans: { connect: parsedBangunanIds.map((id: any) => ({ id: parseInt(id) })) },
        lampiran_urls: JSON.stringify(lampiran_urls)
      }
    });
    res.status(201).json(wo);
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat Work Order' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const wo = await prisma.workOrder.findUnique({
      where: { id: req.params.id },
      include: {
        requester: { select: { full_name: true, nrp: true, department: true, contact: true } },
        area: { select: { name: true } },
        bangunans: { select: { name: true } },
        approvals: { include: { approver: { select: { full_name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
        progress: true
      }
    });
    if (!wo) { res.status(404).json({ error: 'Work Order tidak ditemukan' }); return; }

    let lampiran = [];
    if (typeof wo.lampiran_urls === 'string') {
      if (wo.lampiran_urls.startsWith('{') && wo.lampiran_urls.endsWith('}')) {
        const inner = wo.lampiran_urls.slice(1, -1);
        lampiran = inner ? inner.split(',') : [];
      } else {
        try {
          lampiran = JSON.parse(wo.lampiran_urls || '[]');
        } catch (e) { lampiran = []; }
      }
    } else {
      lampiran = wo.lampiran_urls || [];
    }

    res.json({ ...wo, lampiran_urls: lampiran });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil detail WO' });
  }
};

export const updateNoWo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { no_wo } = req.body;
    if (!no_wo) { res.status(400).json({ error: 'No. WO tidak boleh kosong' }); return; }
    const updated = await prisma.workOrder.update({ where: { id: req.params.id }, data: { no_wo, status: 'ON_PROGRESS' } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengupdate No. WO' });
  }
};

export const submitApproval = async (req: Request, res: Response): Promise<void> => {
  try {
    const { approval_type, status: approvalStatus, reject_reason, signature_url } = req.body;
    if (!approval_type || !approvalStatus) { res.status(400).json({ error: 'approval_type dan status wajib diisi' }); return; }

    const approverRole = approval_type === 'DIKETAHUI' ? 'UH_CGA' : 'SH_CGA';
    const approver = await prisma.user.findFirst({ where: { role: approverRole } });
    if (!approver) { res.status(400).json({ error: 'Approver role tidak ditemukan.' }); return; }

    const approval = await prisma.approval.create({
      data: { wo_id: req.params.id, approver_id: approver.id, approval_type, status: approvalStatus, reject_reason: reject_reason || null, signature_url: signature_url || null }
    });

    if (approvalStatus === 'REJECTED') {
      await prisma.workOrder.update({ where: { id: req.params.id }, data: { status: 'REJECTED' } });
    }
    
    if (approval_type === 'DISETUJUI' && approvalStatus === 'APPROVED') {
      const wo = await prisma.workOrder.findUnique({ where: { id: req.params.id } });
      let finalNoWo = wo?.no_wo;
      
      if (!finalNoWo) {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        const count = await prisma.workOrder.count({
          where: {
            no_wo: { not: null },
            createdAt: {
              gte: new Date(year, 0, 1),
              lt: new Date(year + 1, 0, 1)
            }
          }
        });
        
        const sequence = (count + 1).toString().padStart(3, '0');
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        const romanMonth = romanMonths[month - 1];
        
        finalNoWo = `${sequence}/CGA/WO/${romanMonth}/${year}`;
      }
      
      await prisma.workOrder.update({ 
        where: { id: req.params.id }, 
        data: { status: 'ON_PROGRESS', no_wo: finalNoWo } 
      });
    }
    res.status(201).json(approval);
  } catch (error) {
    res.status(500).json({ error: 'Gagal menyimpan approval' });
  }
};

export const startProgress = async (req: Request, res: Response) => {
  try {
    const tglPelaksanaan = req.body.tgl_pelaksanaan ? new Date(req.body.tgl_pelaksanaan) : new Date();
    const progress = await prisma.woProgress.upsert({
      where: { wo_id: req.params.id },
      update: { startedAt: tglPelaksanaan },
      create: { wo_id: req.params.id, status: 'SELESAI', startedAt: tglPelaksanaan }
    });
    res.status(201).json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Gagal menyimpan tanggal pelaksanaan' });
  }
};

export const finishProgress = async (req: Request, res: Response) => {
  try {
    let lampiran_hasil_url = null;
    if (req.file) lampiran_hasil_url = `/uploads/${req.file.filename}`;
    const progressStatus = req.body.status || 'SELESAI';
    const tglPelaksanaan = req.body.tgl_pelaksanaan ? new Date(req.body.tgl_pelaksanaan) : new Date();
    const tglSelesai = req.body.tgl_selesai ? new Date(req.body.tgl_selesai) : new Date();

    const progress = await prisma.woProgress.upsert({
      where: { wo_id: req.params.id },
      update: { status: progressStatus as any, lampiran_hasil_url, startedAt: tglPelaksanaan, completedAt: tglSelesai },
      create: { wo_id: req.params.id, status: progressStatus as any, lampiran_hasil_url, startedAt: tglPelaksanaan, completedAt: tglSelesai }
    });
    await prisma.workOrder.update({ where: { id: req.params.id }, data: { status: 'CLOSED' } });
    res.status(201).json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengupdate progress' });
  }
};

export const acknowledgeProgress = async (req: Request, res: Response) => {
  try {
    const progress = await prisma.woProgress.update({ where: { wo_id: req.params.id }, data: { is_acknowledged: true } });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Gagal konfirmasi pekerjaan selesai' });
  }
};

export const uploadSignature = (req: Request, res: Response): void => {
  try {
    if (!req.file) { res.status(400).json({ error: 'Tidak ada file signature yang diupload' }); return; }
    const signatureUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({ url: signatureUrl });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengupload signature' });
  }
};
