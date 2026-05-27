import express from "express";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import { processSale } from "../services/saleService.js";

const router = express.Router();

/* =========================
   RECEIPT NUMBER
========================= */
const generateReceipt = () =>
  `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/* =========================
   DASHBOARD SUMMARY
========================= */
router.get("/stats/summary", async (req, res) => {
  try {
    const sales = await Sale.find();

    const totalRevenue = sales.reduce(
      (sum, s) => sum + s.total,
      0
    );

    res.json({
      totalRevenue,
      totalSales: sales.length,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   LOW STOCK ALERT
========================= */
router.get("/low-stock", async (req, res) => {
  try {
    const products = await Product.find({ stock: { $lt: 5 } });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   CHECKOUT (CLEAN - SERVICE LAYER)
========================= */
router.post("/checkout", async (req, res) => {
  try {
    const { items, paymentMethod = "cash" } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const transaction = await processSale(items, paymentMethod);

    res.status(201).json({
      success: true,
      transaction,
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================
   ALL SALES (HISTORY)
========================= */
router.get("/", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   SINGLE RECEIPT (REPRINT)
========================= */
router.get("/:id", async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;