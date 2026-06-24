import path from "path";
import prisma from "../lib/prisma.js";
import { resizeAvatar } from "../services/imageProcessing.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import cloudinary from "../lib/cloudinary.js";

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    await prisma.users.delete({
      where: { id: id },
    });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "no file uploaded!" });
  }

  console.log(req.file);

  /*  const resizedPath = await resizeAvatar(req.file.path, req.file.filename);


  const avatarUrl = `/uploads/${path.basename(resizedPath)}`; */

  // when using CloudinaryStorage, req.file.path is ALREADY the full Cloudinary URL
  // something like: https://res.cloudinary.com/your-cloud/image/upload/v123/devlinks/abc123.jpg
  // no need to build the URL yourself like we did with local storage

  const avatarUrl = req.file.path;

  /* const updatedUser = await prisma.user.update({
    where: { id: req.userId },
    data: { avatar: avatarUrl },
  }); */

  await prisma.user.update({
    where: { id: req.userId },
    data: { avatar: avatarUrl },
  });
  res.json({ avatar: avatarUrl /*  user: updatedUser */ });
});

export async function deleteCloudinaryImage(imageUrl) {
  if (!imageUrl) return;

  const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];

  await cloudinary.uploader.destroy(publicId);
}
