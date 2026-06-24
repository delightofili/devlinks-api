import path from "path";
import sharp from "sharp";

export async function resizeAvatar(filePath, filename) {
  const outputPath = path.join("uploads", "resized-" + filename);

  await sharp(filePath)
    .resize(200, 200, {
      fit: "cover",
    })
    .jpeg({ quality: 80 })
    .toFile(outputPath);

  return outputPath;
}
