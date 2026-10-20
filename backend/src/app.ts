
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";

import twilioRoutes from "@/routes/twilio.routes";

import telegramRoutes from "./routes/telegram.routes";

import authRoutes from "@/routes/auth.routes";
import emergencyContactRoutes from "@/routes/emergencyContact.routes";
import evidenceRoutes from "@/routes/evidence.routes";

const app = express();

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://safe-ops-smart-safety-workplace-ass-brown.vercel.app",
  "https://safe-ops-smart-safety-workplace-ass.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/* =========================================================
   SECURITY
========================================================= */

app.use(helmet());

/* =========================================================
   LOGGING
========================================================= */

app.use(morgan("dev"));

/* =========================================================
   BODY PARSING
========================================================= */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

/* =========================================================
   STATIC UPLOADS
========================================================= */

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Major Project Backend Running 🚀",
  });
});

/* =========================================================
   API ROUTES
========================================================= */

// Authentication
app.use("/api/auth", authRoutes);

// Emergency Contacts
app.use("/api/emergency-contacts", emergencyContactRoutes);

// Evidence / Emergency Recordings
app.use("/api/evidence", evidenceRoutes);

// Twilio
app.use("/api/twilio", twilioRoutes);

// Telegram
app.use("/api/telegram", telegramRoutes);

/* =========================================================
   404 HANDLER
========================================================= */

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("❌ Server Error:", err);

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
);

export default app;
