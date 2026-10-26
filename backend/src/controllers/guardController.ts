import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client';
import { VisitStatus, VisitType, VehicleType } from '@prisma/client';
import { createNotification } from '../services/notificationService';

const walkInSchema = z.object({
  visitorName: z.string().min(1, 'Visitor name is required'),
  visitorPhone: z.string().min(10, 'Valid phone number required'),
  purpose: z.string().min(1, 'Purpose is required'),
  campusLocation: z.string().min(1, 'Location is required'),
  visitType: z.enum(['WALK_IN', 'DELIVERY']).default('WALK_IN'),
  hostName: z.string().optional(),
  vehicleType: z.enum(['CAR', 'BIKE', 'TRUCK', 'AUTO', 'OTHER', 'NONE']).default('NONE'),
  vehicleNumber: z.string().optional(),
  idVerified: z.boolean().default(false),
  notes: z.string().optional(),
  // Delivery fields
  deliveryCompany: z.string().optional(),
  receivingPerson: z.string().optional(),
  deliveryDest: z.string().optional(),
});

export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayTotal,
      currentlyInside,
      expectedToday,
      pendingVerification,
      walkInsToday,
      checkedOutToday,
    ] = await Promise.all([
      prisma.visit.count({
        where: {
          OR: [
            { actualEntryTime: { gte: today, lt: tomorrow } },
            { expectedDate: { gte: today, lt: tomorrow } },
          ],
        },
      }),
      prisma.visit.count({ where: { status: VisitStatus.CHECKED_IN } }),
      prisma.visit.count({
        where: {
          status: VisitStatus.EXPECTED,
          expectedDate: { gte: today, lt: tomorrow },
        },
      }),
      prisma.visit.count({ where: { status: VisitStatus.PENDING_VERIFICATION } }),
      prisma.visit.count({
        where: {
          visitType: { in: [VisitType.WALK_IN, VisitType.DELIVERY] },
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.visit.count({
        where: {
          status: VisitStatus.CHECKED_OUT,
          actualExitTime: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    res.json({
      todayTotal,
      currentlyInside,
      expectedToday,
      pendingVerification,
      walkInsToday,
      checkedOutToday,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchVisitors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      res.json({ visits: [], members: [] });
      return;
    }

    const query = q.trim();

    // Search visits by visitor name, phone, vehicle number, or ID
    const visits = await prisma.visit.findMany({
      where: {
        OR: [
          { visitor: { name: { contains: query, mode: 'insensitive' } } },
          { visitor: { phone: { contains: query } } },
          { vehicleNumber: { contains: query, mode: 'insensitive' } },
          { id: { contains: query, mode: 'insensitive' } },
          { hostMember: { name: { contains: query, mode: 'insensitive' } } },
        ],
        status: { notIn: [VisitStatus.CANCELLED, VisitStatus.CHECKED_OUT] },
      },
      include: {
        visitor: true,
        hostMember: {
          include: { member: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Also search members directly
    const members = await prisma.user.findMany({
      where: {
        role: 'MEMBER',
        name: { contains: query, mode: 'insensitive' },
      },
      include: {
        member: true,
        hostedVisits: {
          where: { status: { notIn: [VisitStatus.CANCELLED, VisitStatus.CHECKED_OUT] } },
          include: { visitor: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      take: 10,
    });

    res.json({ visits, members });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCurrentlyInside = async (_req: Request, res: Response): Promise<void> => {
  try {
    const visits = await prisma.visit.findMany({
      where: { status: VisitStatus.CHECKED_IN },
      include: {
        visitor: true,
        hostMember: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { actualEntryTime: 'desc' },
    });
    res.json(visits);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const visit = await prisma.visit.findUnique({
      where: { id: req.params.id },
      include: { visitor: true, hostMember: true },
    });

    if (!visit) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }

    if (visit.status === VisitStatus.CHECKED_IN || visit.status === VisitStatus.CHECKED_OUT) {
      res.status(400).json({ error: `Visit is already ${visit.status.toLowerCase().replace('_', ' ')}` });
      return;
    }

    const { vehicleType, vehicleNumber, idVerified, notes } = req.body;

    const updated = await prisma.visit.update({
      where: { id: req.params.id },
      data: {
        status: VisitStatus.CHECKED_IN,
        actualEntryTime: new Date(),
        idVerified: idVerified ?? visit.idVerified,
        vehicleType: vehicleType ?? visit.vehicleType,
        vehicleNumber: vehicleNumber ?? visit.vehicleNumber,
        notes: notes ?? visit.notes,
      },
      include: { visitor: true, hostMember: true },
    });

    // Notify host member
    if (visit.hostMemberId) {
      await createNotification(
        visit.hostMemberId,
        `Your visitor ${visit.visitor.name} has arrived at ${visit.campusLocation}.`
      );
    }

    res.json(updated);
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const visit = await prisma.visit.findUnique({
      where: { id: req.params.id },
      include: { visitor: true },
    });

    if (!visit) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }

    if (visit.status !== VisitStatus.CHECKED_IN) {
      res.status(400).json({ error: 'Visitor is not currently checked in' });
      return;
    }

    const updated = await prisma.visit.update({
      where: { id: req.params.id },
      data: {
        status: VisitStatus.CHECKED_OUT,
        actualExitTime: new Date(),
      },
      include: { visitor: true, hostMember: true },
    });

    // Notify host member
    if (visit.hostMemberId) {
      await createNotification(
        visit.hostMemberId,
        `Your visitor ${visit.visitor.name} has exited the campus.`
      );
    }

    res.json(updated);
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createWalkIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = walkInSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const {
      visitorName, visitorPhone, purpose, campusLocation, visitType,
      vehicleType, vehicleNumber, idVerified, notes,
      deliveryCompany, receivingPerson, deliveryDest,
    } = parsed.data;

    let visitor = await prisma.visitor.findFirst({ where: { phone: visitorPhone } });
    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: { name: visitorName, phone: visitorPhone },
      });
    }

    const visit = await prisma.visit.create({
      data: {
        visitorId: visitor.id,
        hostMemberId: null,
        visitType: visitType as VisitType,
        purpose,
        campusLocation,
        status: VisitStatus.CHECKED_IN,
        actualEntryTime: new Date(),
        idVerified,
        vehicleType: vehicleType as VehicleType,
        vehicleNumber,
        notes,
        deliveryCompany,
        receivingPerson,
        deliveryDest,
      },
      include: { visitor: true },
    });

    res.status(201).json(visit);
  } catch (err) {
    console.error('Walk-in error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyVisitor = async (req: Request, res: Response): Promise<void> => {
  try {
    const visit = await prisma.visit.findUnique({ where: { id: req.params.id } });
    if (!visit) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }

    const { idVerified, vehicleType, vehicleNumber, notes } = req.body;

    const updated = await prisma.visit.update({
      where: { id: req.params.id },
      data: {
        status: VisitStatus.PENDING_VERIFICATION,
        idVerified: idVerified ?? visit.idVerified,
        vehicleType: vehicleType ?? visit.vehicleType,
        vehicleNumber: vehicleNumber ?? visit.vehicleNumber,
        notes: notes ?? visit.notes,
      },
      include: { visitor: true, hostMember: true },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
