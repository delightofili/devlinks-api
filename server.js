import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { logger } from "./middleware/logger.js";
import linksRouter from "./routes/link.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import adminRouter from "./routes/admin.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { doubleCsrf } from "csrf-csrf";

import path from "path";
import { fileURLToPath } from "url";

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"],
    credentials: true,
  },
});

//GLOBAL MIDDLEWARE
//these runs on every single request in this order
//we run cors first, bcos browser check what happens before anything else

app.use(express.json());
// another middleware — to parse JSON request bodies
//must run before routes. without this req.body is undefined...

app.use(logger);
//logs every request without timing

//for req.cookies

app.use(cookieParser());

//security headers made easy

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "https://res.cloudinary.com"],
      },
    },
  }),
);

//applies to every routes - broad protection

app.use(generalLimiter);

//CSRF PROTECTION

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  getSessionIdentifier: (req) => req.cookies.refreshToken || "anonymous",
  cookieName: "csrf-token",
  cookieOptions: {
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  },
});

app.get("/api/auth/setup-csrf", (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});

//app.use(doubleCsrfProtection);

//file uploads

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//---ROUTES----

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});
//health checks - simple route to confirm server is running
//process.uptime is seconds i=since server started

app.use("/api/auth", authRouter);

app.use("/api/links", linksRouter);

app.use("/api/users", usersRouter);
app.use("/api", adminRouter);

//  ---------------- SOCKET.IO -------------------
io.use(socketAuth);
const onlineUsers = new Map();

io.on("connection", (socket) => {
  const userId = socket.userId;
  console.log(`User Connected: ${socket.id}, userId: ${socket.userId}`);

  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  onlineUsers.get(userId).add(socket.id);

  //to showing is typing

  socket.on("typing", ({ linkId, isTyping }) => {
    socket.to(`link-${linkId}`).emit("userTyping", {
      userId: socket.userId,
      isTyping,
    });
  });

  socket.on("joinLink", (linkId) => {
    const room = `link-${linkId}`;

    socket.join(room);

    console.log(`User ${socket.userId} joined room ${room}`);

    const viewerCount = io.sockets.adapter.rooms.get(room)?.size || 0;

    io.to(room).emit("viewerCount", { linkId, count: viewerCount });
  });

  socket.on("leaveLink", (linkId) => {
    const room = `link-${linkId}`;

    socket.leave(room);

    console.log(`User ${socket.userId} left room link-${linkId}`);
  });

  socket.on("disconnect", () => {
    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
      }
    }
    console.log(`User ${socket.userId} disconnected`);
  });
});
// utility function to check if a user is online — use this anywhere
export function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

//--- 404 HANDLER ---
//ONLY WHERE there's no routes

app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.url} not found`,
  });
});

//---- GLOBAL ERROR HANDLER----
//it takes four parameters, express will identify it's an error handler.
//called when any routes calls next(error);

app.use((err, req, res, next) => {
  console.error(err.stack);
  //logs full error with stack trace on server

  res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
    //in dev it shows stack trace, in production it hides it
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

///Start Server

const PORT = process.env.PORT || 5000;
//user PORT from env fileor set it to 5000.

/* app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  //runs once server succesfully starts sha...
}); */

httpServer.listen(PORT, () => {
  console.log(`Server running on Port: ${PORT}`);
});

export { io };
