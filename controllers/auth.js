import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import { findUserByEmail } from "../services/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcryptjs";

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

  const decoded = verifyRefreshToken(refreshToken);

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
  const newRefreshToken = generateRefreshToken(decode.userId);

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
