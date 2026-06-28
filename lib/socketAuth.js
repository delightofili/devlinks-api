import { verifyAccessToken } from "./jwt";

export function socketAuth(socket, next) {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return next(new Error("Invalid token"));
  }

  socket.userId = decoded.userId;

  next();
}
