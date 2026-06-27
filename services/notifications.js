import prisma from "../lib/prisma.js";

export async function createNotification({ userId, actorId, type, linkId }) {
  return prisma.notification.create({
    data: {
      user_id: userId,
      actor_id: actorId,
      type,
      link_id: linkId,
    },
  });
}

export async function getNotification(userId) {
  return prisma.notification.findMany({
    where: { user_id: userId },
    include: {
      actor: {
        select: { id: true, name: true, username: true, avatar: true },
      },
      link: {
        select: { id: true, title: true },
      },
    },
    orderBy: { created_at: "desc" },
    take: 50,
  });
}

export async function markAllRead(userId) {
  return prisma.notification.updateMany({
    where: {
      user_id: userId,
      is_read: false,
    },
    data: { is_read: true },
  });
}

export async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: { user_id: userId, is_read: false },
  });
}
