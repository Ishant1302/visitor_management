import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma/client';
import { Role, VisitStatus } from '@prisma/client';

export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayVisitors,
      currentlyInside,
      todayCheckIns,
      todayCheckOuts,
      expectedVisitors,
      walkIns,
      totalMembers,
      totalGuards,
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
        where: { status: { in: [VisitStatus.CHECKED_IN, VisitStatus.CHECKED_OUT] }, actualEntryTime: { gte: today } },
      }),
      prisma.visit.count({
        where: { status: VisitStatus.CHECKED_OUT, actualExitTime: { gte: today } },
      }),
      prisma.visit.count({ where: { status: VisitStatus.EXPECTED } }),
      prisma.visit.count({
        where: { visitType: { in: ['WALK_IN', 'DELIVERY'] }, createdAt: { gte: today } },
      }),
      prisma.user.count({ where: { role: Role.MEMBER } }),
      prisma.user.count({ where: { role: Role.GUARD } }),
    ]);

    res.json({
      todayVisitors, currentlyInside, todayCheckIns, todayCheckOuts,
      expectedVisitors, walkIns, totalMembers, totalGuards,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Last 7 days daily visitors
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyVisits = await prisma.visit.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, visitType: true, status: true },
    });

    // Group by day
    const dailyMap: Record<string, number> = {};
    dailyVisits.forEach(v => {
      const day = v.createdAt.toISOString().split('T')[0];
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      last7Days.push({
        date: key,
        label: d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        count: dailyMap[key] || 0,
      });
    }

    // Visitor type breakdown
    const [preRegistered, walkIn, delivery] = await Promise.all([
      prisma.visit.count({ where: { visitType: 'PRE_REGISTERED' } }),
      prisma.visit.count({ where: { visitType: 'WALK_IN' } }),
      prisma.visit.count({ where: { visitType: 'DELIVERY' } }),
    ]);

    const typeBreakdown = [
      { name: 'Pre-Registered', value: preRegistered, fill: '#1E40AF' },
      { name: 'Walk-in', value: walkIn, fill: '#D97706' },
      { name: 'Delivery', value: delivery, fill: '#16A34A' },
    ];

    // Peak hours (from check-in times)
    const checkinVisits = await prisma.visit.findMany({
      where: { actualEntryTime: { not: null } },
      select: { actualEntryTime: true },
      take: 1000,
    });

    const hourMap: Record<number, number> = {};
    checkinVisits.forEach(v => {
      if (v.actualEntryTime) {
        const hour = v.actualEntryTime.getHours();
        hourMap[hour] = (hourMap[hour] || 0) + 1;
      }
    });

    const peakHours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      count: hourMap[i] || 0,
    })).filter(h => h.hour >= 6 && h.hour <= 22);

    // Monthly stats (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyVisits = await prisma.visit.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true },
    });

    const monthMap: Record<string, { checkIns: number; checkOuts: number }> = {};
    monthlyVisits.forEach(v => {
      const key = v.createdAt.toISOString().substring(0, 7);
      if (!monthMap[key]) monthMap[key] = { checkIns: 0, checkOuts: 0 };
      monthMap[key].checkIns++;
      if (v.status === VisitStatus.CHECKED_OUT) monthMap[key].checkOuts++;
    });

    const monthlyStats = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        month: key,
        label: new Date(key + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        ...val,
      }));

    res.json({ dailyVisitors: last7Days, typeBreakdown, peakHours, monthlyStats });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, role: true, phone: true, createdAt: true,
          member: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role, phone, memberType, rollNo, employeeId, department, publicMeetingPoint } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password || 'changeme123', 12);
    const user = await prisma.user.create({
      data: {
        email, passwordHash, name, role, phone,
        ...(role === 'MEMBER' ? {
          member: { create: { memberType, rollNo, employeeId, department, publicMeetingPoint } },
        } : {}),
      },
      include: { member: true },
    });

    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email, phone, role },
      select: { id: true, email: true, name: true, role: true, phone: true, member: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMembers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const members = await prisma.universityMember.findMany({
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.universityMember.update({
      where: { id: req.params.id },
      data: req.body,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
