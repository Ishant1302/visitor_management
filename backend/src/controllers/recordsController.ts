import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { Role, VisitStatus } from '@prisma/client';

export const getAllRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      dateFrom, dateTo, visitorName, hostName,
      type, status, vehicleNumber,
      page = '1', limit = '50',
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = {};

    // Role-based scoping
    if (req.user!.role === Role.MEMBER) {
      where.hostMemberId = req.user!.userId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) {
        const end = new Date(dateTo as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (visitorName) {
      where.visitor = { name: { contains: visitorName as string, mode: 'insensitive' } };
    }

    if (hostName) {
      where.hostMember = { name: { contains: hostName as string, mode: 'insensitive' } };
    }

    if (type) where.visitType = type;
    if (status) where.status = status;
    if (vehicleNumber) {
      where.vehicleNumber = { contains: vehicleNumber as string, mode: 'insensitive' };
    }

    const [records, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: {
          visitor: true,
          hostMember: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.visit.count({ where }),
    ]);

    res.json({ records, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) {
    console.error('Records error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
