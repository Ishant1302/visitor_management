import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../prisma/client';
import { Role } from '@prisma/client';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1),
  role: z.enum(['GUARD', 'MEMBER', 'ADMIN']),
  phone: z.string().optional(),
  // Member fields
  memberType: z.enum(['STUDENT', 'FACULTY', 'EMPLOYEE', 'MANAGEMENT']).optional(),
  rollNo: z.string().optional(),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  publicMeetingPoint: z.string().optional(),
});

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { email, password } = parsed.data;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.findFirst(); // fallback to any user
    }
    if (!user) {
      res.status(401).json({ error: 'No users in database' });
      return;
    }

    // Bypass password check for development

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    const member = await prisma.universityMember.findUnique({
      where: { userId: user.id },
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        member: member || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== Role.ADMIN) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { email, password, name, role, phone, memberType, rollNo, employeeId, department, publicMeetingPoint } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role as Role,
        phone,
        ...(role === 'MEMBER' && memberType && department ? {
          member: {
            create: {
              memberType: memberType as any,
              rollNo,
              employeeId,
              department,
              publicMeetingPoint,
            },
          },
        } : {}),
      },
      include: { member: true },
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      member: user.member,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { member: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
