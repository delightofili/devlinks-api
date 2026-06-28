import prisma from "../lib/prisma";
import { io } from "../server";
import { asyncHandler } from "../utils/asyncHandler";

export const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const linkId = Number(req.params.linkId);

  if (!content?.trim()) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      link_id: linkId,
      user_id: req.userId,
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, avatar: true },
      },
    },
  });

  io.to(`link-${linkId}`).emit("newComment", comment);

  res.status(201).json(comment);
});
