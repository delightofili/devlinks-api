import { deleteCloudinaryImage } from "../controllers/users.js";
import prisma from "../lib/prisma.js";
import { io } from "../server.js";
import { createNotification } from "./notifications.js";

export async function fetchAllLinks({ category, page = 1, limit = 10 } = {}) {
  const where = {};
  // start with empty where clause - matches everything

  if (category) {
    where.category = category;
    //add category filter if provided
  }

  const [links, total] = await Promise.all([
    //promise.all runs both queries simultaneously and it's faster...

    prisma.link.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
          //only get this user fields - never password
        },
        _count: {
          select: { upvotes: true, comments: true },
        },
      },
      orderBy: { created_at: "desc" },
      //newest first

      skip: (page - 1) * limit,
      take: limit,
    }),

    prisma.link.count({ where }),
  ]);

  return {
    links,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function fetchLinkById(id) {
  const link = await prisma.link.findFirst((link) => link.id === Number(id));
  // .find returns first matching item or undefined
  // Number(id) converts string '5' to number 5 for comparison

  return link || null;
  // return the link if found, null if not
}

export async function insertLink({
  title,
  url,
  userId,
  category,
  description,
}) {
  return prisma.link.create({
    data: {
      title,
      url,
      description,
      category,
      user_id: userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });
}

export async function modifyLink(id, data) {
  const index = await prisma.link.findIndex((link) => link.id === Number(id));
  // findIndex returns position in array, or -1 if not found

  if (index === -1) return null;
  // not found — return null, controller handles 404

  links[index] = { ...links[index], ...data };
  // spread existing link, spread new data on top
  // new data overwrites matching fields, keeps others

  return links[index];
  // return updated link
}

/* export async function removeLink(id) {
  const index = links.findIndex((link) => link.id === Number(id));

  if (index === -1) return null;

  const deleted = links[index];
  // save reference before removing

  links.splice(index, 1);
  // splice(startIndex, deleteCount) — removes 1 item at index

  return deleted;
  // return deleted item so controller can confirm
} */

//cloudinary

export async function removeLink(id, userId) {
  const link = await prisma.link.findUnique({ where: { id: Number(id) } });

  if (!link) return null;

  if (link.user_id !== userId) {
    const error = new Error("You can only delete your own links");
    error.statusCode === 403;
    throw error;
  }

  if (link.image) {
    await deleteCloudinaryImage(link.image);
  }
  return prisma.link.delete({ where: { id: Number(id) } });
}

export async function toggleUpvote(userId, linkId) {
  try {
    await prisma.upvote.create({
      data: { user_id: userId, link_id: Number(linkId) },
    });

    const link = await prisma.link.findUnique({
      where: { id: Number(linkId) },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (link && link.user_id !== userId) {
      await createNotification({
        userId: link.user_id,
        actorId: userId,
        type: "upvote",
        linkId: Number(linkId),
      });
    }
    return { upvoted: true };
  } catch (error) {
    if (error.code === "P2002") {
      await prisma.upvote.delete({
        where: {
          user_id_link_id: { user_id: userId, link_id: Number(linkId) },
        },
      });
      return { upvoted: false };
    }
    throw error;
  }
}

export async function toggleUpvote(userId, linkId) {
  try {
    await prisma.upvote.create({
      data: { user_id: userId, link_id: Number(linkId) },
    });
    const link = await prisma.link.findUnique({
      where: { id: Number(linkId) },
      include: { user: { select: { id: true, name: true } } },
    });
    if (link && link.user_id !== userId) {
      const notification = await prisma.notification.create({
        data: {
          user_id: link.user_id,
          actor_id: userId,
          type: "upvote",
          link_id: Number(linkId),
        },
        include: {
          actor: { select: { name: true, username: true } },
        },
      });
      io.to(`user-${link.user_id}`).emit("notification", notification);
    }
    return { upvoted: true };
  } catch (error) {
    if (error.code === "p2002") {
      await prisma.upvote.delete({
        where: {
          user_id_link_id: { user_id: userId, link_id: Number(linkId) },
        },
      });
      return { upvoted: false };
    }
    throw error;
  }
}
