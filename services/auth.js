import { verifyRefreshToken } from "../lib/jwt";
import prisma from "../lib/prisma";

export async function findUserByEmail(email) {
  const user = await prisma.users.findUnique({
    where: { email: email },
  });
  return user;
}

export async function blacklistToken(token) {
  const decoded = verifyRefreshToken(token);

  await prisma.blacklisted_tokens.create({
    data: {
      token,
      expires_at: new Date(decoded.exp * 1000),
    },
  });
}

export async function checkBlacklist(token) {
  const found = await prisma.blacklisted_tokens.findUnique({
    where: { token },
  });
  return !!found;
}
