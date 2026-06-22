import prisma from "../lib/prisma.js";

export async function requireLinkOwnership(req, res, next) {
  const linkId = Number(req.params.id);

  const link = await prisma.links.findUnique({
    where: { id: linkId },
  });
  if (!link) {
    return res.status(404).json({ error: "Link not found" });
  }

  const isOwner = link.user_id === req.userId;
  const isAdmin = link.userRole === "ADMIN";

  //admins can bypass ownership checks

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "you do not own this resource" });
  }

  req.link = link;

  next();
}
