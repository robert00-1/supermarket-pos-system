
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

const router = express.Router();

const allowedRoles = [
  "admin",
  "manager",
  "cashier",
  "cleaner",
  "security",
  "loader",
  "assistant",
];

const allowedAttendance = ["present", "absent", "late", "off"];

// Verify the login token and load the current user.
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.status !== "active") {
      return res.status(401).json({
        message: "Account not found or inactive",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired login token",
    });
  }
};

// Only admins may manage workers.
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Only administrators can manage workers",
    });
  }

  next();
};

// PUBLIC REGISTRATION: users can only register as cashiers.
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Name, email, phone and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "cashier",
      status: "active",
    });

    return res.status(201).json({
      message: "Account created successfully",
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
    console.error("REGISTRATION ERROR:", error.message);

    return res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Your account is inactive. Contact an administrator.",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
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
    console.error("LOGIN ERROR:", error.message);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
});

// LIST WORKERS: admin only
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// CREATE A WORKER: admin only
router.post("/workers", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      status,
      shiftStart,
      shiftEnd,
      attendance,
    } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Name, email, phone and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    if (!allowedRoles.includes(role || "cashier")) {
      return res.status(400).json({ message: "Invalid worker role" });
    }

    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid worker status" });
    }

    const validTime = (value) =>
      value == null ||
      value === "" ||
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

    if (!validTime(shiftStart) || !validTime(shiftEnd)) {
      return res.status(400).json({
        message: "Shift times must use HH:mm format",
      });
    }

    if (shiftStart && shiftEnd && shiftStart === shiftEnd) {
      return res.status(400).json({
        message: "Shift start and end times cannot be the same",
      });
    }

    if (attendance && !allowedAttendance.includes(attendance)) {
      return res.status(400).json({ message: "Invalid attendance status" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: role || "cashier",
      status: status || "active",
      shiftStart: shiftStart || null,
      shiftEnd: shiftEnd || null,
      attendance: attendance || "absent",
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(201).json({
      message: "Worker added successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("ADD WORKER ERROR:", error.message);

    return res.status(500).json({
      message: "Failed to add worker",
    });
  }
});

// DELETE A WORKER: admin only
router.delete(
  "/user/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid worker ID" });
      }

      if (req.params.id === req.user._id.toString()) {
        return res.status(400).json({
          message: "You cannot delete your own account",
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "Worker not found" });
      }

      await user.deleteOne();

      return res.json({ message: "Worker deleted successfully" });
    } catch (error) {
      console.error("DELETE WORKER ERROR:", error.message);

      return res.status(500).json({
        message: "Failed to delete worker",
      });
    }
  }
);

// UPDATE WORKER STATUS: admin only
router.put(
  "/user/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ message: "Worker not found" });
      }

      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// ON-DUTY WORKERS: authenticated users only; never return password hashes.
router.get("/on-duty", authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ status: "active" }).select("-password");
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// ATTENDANCE LOGS: admin or the worker viewing their own logs.
router.get("/attendance/:id", authenticateToken, async (req, res) => {
  try {
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({
        message: "You are not allowed to view these attendance logs",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Worker not found" });
    }

    return res.json(user.attendanceLogs || []);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
