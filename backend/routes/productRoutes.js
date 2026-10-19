
import express from "express";
import multer from "multer";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

/* =========================
   MULTER MEMORY STORAGE
   Images are uploaded to Cloudinary,
   not saved to the local filesystem.
========================= */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG, and WebP images are allowed.")
      );
    }

    cb(null, true);
  },
});

/* =========================
   CLOUDINARY UPLOAD HELPER
========================= */
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "supermarket-pos/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

/* =========================
   GET PRODUCTS
========================= */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (error) {
    console.error("Fetch products error:", error.message);

    res.status(500).json({
      message: "Failed to fetch products.",
    });
  }
});

/* =========================
   ADD PRODUCT
========================= */
router.post("/", (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    next();
  });
}, async (req, res) => {
  let uploadedImage = null;

  try {
    const {
      name,
      barcode,
      price,
      stock,
      category,
      description,
      manufactureDate,
      expiryDate,
    } = req.body;

    if (!name || !barcode || price === undefined || price === "") {
      return res.status(400).json({
        message: "Name, barcode, and price are required.",
      });
    }

    const productData = {
      name,
      barcode,
      price: Number(price),
      stock: stock === "" || stock === undefined ? 0 : Number(stock),
      category: category || "General",
      description: description || "",
      manufactureDate: manufactureDate || "",
      expiryDate: expiryDate || "",
      image: "",
    };

    if (
      !Number.isFinite(productData.price) ||
      productData.price < 0 ||
      !Number.isFinite(productData.stock) ||
      productData.stock < 0
    ) {
      return res.status(400).json({
        message: "Price and stock must be valid non-negative numbers.",
      });
    }

    if (req.file) {
      uploadedImage = await uploadToCloudinary(req.file.buffer);
      productData.image = uploadedImage.secure_url;
    }

    const product = await Product.create(productData);

    res.status(201).json(product);
  } catch (error) {
    // Remove the Cloudinary image if saving the product fails.
    if (uploadedImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      } catch (cleanupError) {
        console.error(
          "Cloudinary cleanup error:",
          cleanupError.message
        );
      }
    }

    console.error("Add product error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A product with this barcode already exists.",
      });
    }

    res.status(500).json({
      message: "Failed to add product.",
    });
  }
});

/* =========================
   RESTOCK PRODUCT
========================= */
router.put("/restock/:id", async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: "Invalid quantity",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    product.stock = Number(product.stock) + quantity;

    await product.save();

    res.json({
      success: true,
      message: "Product restocked successfully",
      product,
    });
  } catch (error) {
    console.error("Restock error:", error.message);

    res.status(500).json({
      message: "Failed to restock product.",
    });
  }
});

/* =========================
   DELETE PRODUCT
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error.message);

    res.status(500).json({
      message: "Failed to delete product.",
    });
  }
});

export default router;

