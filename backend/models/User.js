import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    /* =========================
       BASIC INFO
    ========================= */
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    /* =========================
       ROLE SYSTEM
    ========================= */
    role: {
      type: String,
      enum: [
        "admin",
        "manager",
        "cashier",
        "cleaner",
        "security",
        "loader",
        "assistant",
      ],
      default: "cashier",
    },

    /* =========================
       WORK STATUS
    ========================= */
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    /* =========================
       SHIFT SYSTEM (FIXED)
       IMPORTANT: NO DEFAULT TIMES
    ========================= */
    shiftStart: {
      type: String,
      default: null,
    },

    shiftEnd: {
      type: String,
      default: null,
    },

    /* =========================
       ROTATION SYSTEM
    ========================= */
    rotationOrder: {
      type: Number,
      default: 0,
    },

    lastShiftDate: {
      type: Date,
      default: null,
    },

    /* =========================
       ATTENDANCE SYSTEM
    ========================= */
    attendance: {
      type: String,
      enum: ["present", "absent", "late", "off"],
      default: "absent",
    },

    attendanceLogs: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        status: String,
        shiftStart: String,
        shiftEnd: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;