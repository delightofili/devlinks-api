import resend from "../lib/email.js";
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

export async function createVerificationToken(userId) {
  const token = crypto.randomBytes(32).toString("hex");

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      verification_token: token,
      verification_expires: expires,
    },
  });

  return token;
}

export async function sendVerificationEmail(user, token) {
  const verificationUrl = `http://localhost:5000/api/auth/verify-email?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    subject: "Verify your DevLinks email address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Confirm your email address</h2>
        
        <p>Hi ${user.name}, please click the button below to verify 
        your DevLinks account.</p>
        
        <a href="${verificationUrl}" 
           style="background: #4F7CFF; color: white; padding: 12px 24px; 
                  border-radius: 6px; text-decoration: none; display: inline-block;
                  margin: 20px 0;">
          Verify Email Address
        </a>
        
        <p style="color: #666;">This link expires in 24 hours.</p>
        
        <p style="color: #666; font-size: 12px;">
          Or copy this link: ${verificationUrl}
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Verification email failed:", error);
  }

  return data;
}
