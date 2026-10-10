import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/* =========================

/* =========================
   REGISTER USER
========================= */
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, adminKey } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Only someone with the admin key can register as admin.
    if (
      !process.env.ADMIN_REGISTRATION_KEY ||
      adminKey !== process.env.ADMIN_REGISTRATION_KEY
    ) {
      return res.status(403).json({
        message: "Invalid admin registration key",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone,
      password: hashedPassword,
      role: "admin",
      status: "active",
    });

    return res.status(201).json({
      message: "Admin account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email });

    console.log("FOUND USER:", user);

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    console.log("JWT SECRET:", process.env.JWT_SECRET);

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    });

  } catch (error) {
    console.log("LOGIN ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

/* =========================
   GET ALL USERS
========================= */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================
   UPDATE USER STATUS
========================= */
router.put("/user/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================
   ON DUTY WORKERS
========================= */
router.get("/on-duty", async (req, res) => {
  try {
    const users = await User.find({ status: "active" });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================
   ATTENDANCE LOGS
========================= */
router.get("/attendance/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.attendanceLogs || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;