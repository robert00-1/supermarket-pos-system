import express from "express";
import LedgerEntry from "../models/LedgerEntry.js";

const router = express.Router();

/* =========================
   GET ALL LEDGER ENTRIES
========================= */
router.get("/", async (req, res) => {
  try {
    const entries = await LedgerEntry.find()
      .sort({ createdAt: -1 });

    res.json(entries);
  } catch (error) {
    console.log("LEDGER ERROR:", error.message);

    res.status(500).json({
      message: "Failed to fetch ledger entries",
    });
  }
});

/* =========================
   FILTER BY PAYMENT TYPE (OPTIONAL BUT USEFUL)
========================= */
router.get("/type/:type", async (req, res) => {
  try {
    const entries = await LedgerEntry.find({
      account: req.params.type, // CASH or MPESA or SALES
    }).sort({ createdAt: -1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({
      message: "Failed to filter ledger",
    });
  }
});

/* =========================
   TEST ROUTE
========================= */
router.get("/test", (req, res) => {
  res.json({ message: "Ledger route working" });
});

export default router;