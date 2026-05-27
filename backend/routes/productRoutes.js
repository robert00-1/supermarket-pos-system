import express from "express";
import multer from "multer";
import Product from "../models/Product.js";
import fs from "fs";
import path from "path";

const router = express.Router();

/* =========================
   MULTER STORAGE
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  },
});

const upload = multer({ storage });

/* =========================
   GET PRODUCTS
========================= */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();

    res.json(products);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

/* =========================
   ADD PRODUCT
========================= */
router.post(
  "/",
  upload.single("image"),
  async (req, res) => {
    try {
      const product = await Product.create({
        name: req.body.name,
        barcode: req.body.barcode,
        price: req.body.price,
        stock: req.body.stock,
        category: req.body.category,
        description: req.body.description,
        manufactureDate:
          req.body.manufactureDate,
        expiryDate: req.body.expiryDate,

        image: req.file
          ? `/uploads/${req.file.filename}`
          : "",
      });

      res.status(201).json(product);

    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

/* =========================
   RESTOCK PRODUCT
========================= */
router.put("/restock/:id", async (req, res) => {
  try {
    const { quantity } = req.body;

    // VALIDATE QUANTITY
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Invalid quantity",
      });
    }

    // FIND PRODUCT
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // ADD STOCK
    product.stock =
      Number(product.stock) + Number(quantity);

    // SAVE
    await product.save();

    res.json({
      success: true,
      message: "Product restocked successfully",
      product,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

/* =========================
   DELETE PRODUCT
========================= */
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;