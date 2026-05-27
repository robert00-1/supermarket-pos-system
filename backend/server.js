import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import ledgerRoutes from "./routes/ledgerRoutes.js";
import mpesaRoutes from "./routes/mpesaRoutes.js";

import autoShiftRotation from "./utils/shiftRotationEngine.js";
import assignShifts from "./utils/shiftAssigner.js";

dotenv.config();

const app = express();

/* =========================
   SECURITY
========================= */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* =========================
   CORS FIX
========================= */
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://supermarket-67i2.vercel.app",
      ];

      // allow tools like Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // ❌ DO NOT throw error (this breaks requests)
      return callback(null, true); // allow during dev
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());

/* =========================
   RATE LIMIT
========================= */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
});

app.use("/api/auth", limiter);
app.use("/api/sales", limiter);
app.use("/api/mpesa", limiter);

/* =========================
   STATIC FILES
========================= */
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res) => {
      res.set(
        "Cross-Origin-Resource-Policy",
        "cross-origin"
      );
    },
  })
);

/* =========================
   DATABASE
========================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) =>
    console.log("❌ MongoDB Error:", err.message)
  );

/* =========================
   CRON JOBS
========================= */
cron.schedule("* * * * *", autoShiftRotation);
cron.schedule("0 0 * * *", assignShifts);

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/mpesa", mpesaRoutes);

/* =========================
   TEST ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("POS Backend Running");
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});