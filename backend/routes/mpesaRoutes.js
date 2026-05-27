import express from "express";
import {
  stkPush,
  mpesaCallback,
  checkMpesaStatus,
} from "../services/mpesaService.js";

const router = express.Router();

/* =========================
   STK PUSH
========================= */
router.post("/stkpush", stkPush);

/* =========================
   CALLBACK
========================= */
router.post("/callback", mpesaCallback);

/* =========================
   CHECK STATUS (MISSING BEFORE)
========================= */
router.get("/status/:checkoutId", checkMpesaStatus);

export default router;