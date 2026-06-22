import { verifyRefreshToken } from "../lib/jwt.js";
import prisma from "../lib/prisma.js";

export async function findUserByEmail(email) {
  const user = await prisma.user.findUnique({
    where: { email: email },
  });
  return user;
}

export async function findUserByUsername(username) {
  const user = await prisma.user.findUnique({
    where: { username: username },
  });
  return user;
}

export async function createUser(userData) {
  return await prisma.user.create({
    data: userData,
  });
}

export async function blacklistToken(token) {
  const decoded = verifyRefreshToken(token);

  await prisma.blacklistedToken.create({
    data: {
      token,
      expires_at: new Date(decoded.exp * 1000),
    },
  });
}

export async function checkBlacklist(token) {
  const found = await prisma.blacklistedToken.findUnique({
    where: { token },
  });
  return !!found;
}
