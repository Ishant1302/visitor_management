import prisma from '../prisma/client';

export const createNotification = async (userId: string, message: string): Promise<void> => {
  try {
    await prisma.notification.create({
      data: { userId, message },
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};
