import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client';
import { VisitStatus, VisitType, VehicleType, Role } from '@prisma/client';
import { createNotification } from '../services/notificationService';

const visitSchema = z.object({
  visitorName: z.string().min(1, 'Visitor name is required'),
  visitorPhone: z.string().min(10, 'Valid phone number required'),
  purpose: z.string().min(1, 'Purpose is required'),
  campusLocation: z.string().min(1, 'Campus location is required'),
  expectedDate: z.string().min(1, 'Expected date is required'),
  expectedTime: z.string().optional(),
  expectedDuration: z.string().optional(),
  vehicleType: z.enum(['CAR', 'BIKE', 'TRUCK', 'AUTO', 'OTHER', 'NONE']).default('NONE'),
  vehicleNumber: z.string().optional(),
  notes: z.string().optional(),
  relation: z.string().optional(),
});

export const createVisit = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = visitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { visitorName, visitorPhone, purpose, campusLocation, expectedDate,
      expectedTime, expectedDuration, vehicleType, vehicleNumber, notes } = parsed.data;

    // Find or create visitor
    let visitor = await prisma.visitor.findFirst({ where: { phone: visitorPhone } });
    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: { name: visitorName, phone: visitorPhone },
      });
    }

    const visit = await prisma.visit.create({
      data: {
        visitorId: visitor.id,
        hostMemberId: req.user!.userId,
        visitType: VisitType.PRE_REGISTERED,
        purpose,
        campusLocation,
        expectedDate: new Date(expectedDate),
        expectedTime,
        expectedDuration,
        status: VisitStatus.EXPECTED,
        vehicleType: vehicleType as VehicleType,
        vehicleNumber,
        notes,
      },
      include: {
        visitor: true,
        hostMember: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(visit);
  } catch (err) {
    console.error('Create visit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyVisits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { hostMemberId: req.user!.userId };
    if (status) where.status = status;

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: {
          visitor: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.visit.count({ where }),
    ]);

    res.json({ visits, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) {
    console.error('Get my visits error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getVisitById = async (req: Request, res: Response): Promise<void> => {
  try {
    const visit = await prisma.visit.findUnique({
      where: { id: req.params.id },
      include: {
        visitor: true,
        hostMember: {
          select: { id: true, name: true, email: true, phone: true, member: true },
          include: { member: true } as any,
        },
      },
    });

    if (!visit) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }

    // Members can only see their own visits
    if (req.user!.role === Role.MEMBER && visit.hostMemberId !== req.user!.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(visit);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const cancelVisit = async (req: Request, res: Response): Promise<void> => {
  try {
    const visit = await prisma.visit.findUnique({ where: { id: req.params.id } });

    if (!visit) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }

    // Ownership check
    if (visit.hostMemberId !== req.user!.userId) {
      res.status(403).json({ error: 'You can only cancel your own visits' });
      return;
    }

    if (visit.status === VisitStatus.CHECKED_IN || visit.status === VisitStatus.CHECKED_OUT) {
      res.status(400).json({ error: 'Cannot cancel a visit that is already checked in or out' });
      return;
    }

    const updated = await prisma.visit.update({
      where: { id: req.params.id },
      data: { status: VisitStatus.CANCELLED },
      include: { visitor: true },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateVisit = async (req: Request, res: Response): Promise<void> => {
  try {
    const visit = await prisma.visit.findUnique({ where: { id: req.params.id } });
    if (!visit) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }

    if (req.user!.role === Role.MEMBER && visit.hostMemberId !== req.user!.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updated = await prisma.visit.update({
      where: { id: req.params.id },
      data: req.body,
      include: { visitor: true, hostMember: true },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
