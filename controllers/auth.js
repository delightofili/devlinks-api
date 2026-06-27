import resend from "../lib/email.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import prisma from "../lib/prisma.js";
import {
  blacklistToken,
  checkBlacklist,
  createUser,
  findUserByEmail,
  findUserByUsername,
} from "../services/auth.js";
import { sendWelcomeEmail } from "../services/email.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcryptjs";
import pkg from "@prisma/client";

const { Role } = pkg;

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  //this pulls credentials from the request body

  const user = await findUserByEmail(email);

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken,

    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  const decoded = verifyRefreshToken(oldRefreshToken);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }

  //check if the requesttoken has been blacklisted, we rebuild another one

  const isBlackListed = await checkBlacklist(oldRefreshToken);
  if (isBlackListed) {
    return res.status(401).json({ error: "Token has been revoked" });
  }

  await blacklistToken(oldRefreshToken);

  const newAccessToken = generateAccessToken(decoded.userId);
  const newRefreshToken = generateRefreshToken(decoded.userId);

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken: newAccessToken });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken");

  res.json({ message: "Logged out successfully" });
});

export const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;
  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    return res.status(409).json({ error: "Email already in use" });
  }
  const existingUsername = await findUserByUsername(username);
  if (existingUsername) {
    return res.status(409).json({ error: "Username already in use" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await createUser({
    name,
    username,
    email,
    password: hashedPassword,
  });

  sendWelcomeEmail(newUser);

  const accessToken = generateAccessToken(newUser.id);
  const refreshToken = generateRefreshToken(newUser.id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(201).json({
    accessToken,
    user: {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
    },
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Verification token is required" });
  }

  const user = await prisma.user.findFirst({
    where: {
      verification_token: token,
      verification_expires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return res
      .status(400)
      .json({ error: "Invalid or expired verification token" });
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      verified: true,

      verification_token: null,
      verification_expires: null,
    },
  });
  res.json({ message: "Email verified successfully. You can now log in." });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.json({
      message: "If this email exists, a reset link has been sent.",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      reset_token: resetToken,
      reset_token_expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: user.email,
    subject: "Reset your DevLinks password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        
        <p>You requested a password reset for your DevLinks account.</p>
        
        <a href="${resetUrl}" 
           style="background: #4F7CFF; color: white; padding: 12px 24px;
                  border-radius: 6px; text-decoration: none; display: inline-block;">
          Reset Password
        </a>
        
        <p style="color: #666;">This link expires in 1 hour.</p>
        
        <p style="color: #666; font-size: 12px;">
          If you didn't request this, ignore this email. 
          Your password will not change.
        </p>
      </div>`,
  });

  res.json({ message: "If this email exists, a reset link has been sent." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res
      .status(400)
      .json({ error: "Token and new password are required" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  const user = await prisma.user.findFirst({
    where: {
      reset_token: token,
      reset_token_expires: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      reset_token: null,
      reset_token_expires: null,
    },
  });

  res.json({ message: "Password reset successfully. You can now log in." });
});

export const createAdminAccount = asyncHandler(async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(404).json({ error: "All fields are required!" });
    }

    const accountRole = role ? role.toUpperCase() : Role.ADMIN;

    if (!Object.values(Role).includes(accountRole)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${Object.values(Role).join(" , ")}`,
      });
    }

    const hashedPassword = bcrypt.hash(password, 10);

    const newAdmin = await prisma.user.create({
      data: {
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role: accountRole,
        verified: true,
      },
    });
    return res.status(201).json({ user: newAdmin });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});
