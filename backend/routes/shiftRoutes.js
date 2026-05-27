import express from "express";
import Shift from "../models/Shift.js";
import User from "../models/User.js";

const router = express.Router();
router.post("/clockin", async (req, res) => {
  try {
    const { userId } = req.body;

    // deactivate all other users (only 1 active cashier rule)
    await User.updateMany({}, { status: "inactive" });

    // activate this user
    await User.findByIdAndUpdate(userId, { status: "active" });

    const shift = await Shift.create({
      userId,
      loginTime: new Date(),
      active: true,
    });

    res.json({ message: "Clocked in", shift });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/clockout", async (req, res) => {
  try {
    const { userId } = req.body;

    const shift = await Shift.findOne({
      userId,
      active: true,
    });

    if (!shift) {
      return res.status(400).json({ message: "No active shift" });
    }

    shift.logoutTime = new Date();

    shift.duration =
      (shift.logoutTime - shift.loginTime) / (1000 * 60);

    shift.active = false;

    await shift.save();

    // deactivate user
    await User.findByIdAndUpdate(userId, { status: "inactive" });

    res.json({ message: "Clocked out", shift });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/", async (req, res) => {
  try {
    const shifts = await Shift.find()
      .populate("userId", "name role")
      .sort({ loginTime: -1 });

    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});