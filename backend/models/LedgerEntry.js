import mongoose from "mongoose";

const ledgerEntrySchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },

    account: String, // CASH, MPESA, SALES, INVENTORY

    type: {
      type: String,
      enum: ["DEBIT", "CREDIT"],
    },

    amount: Number,

    description: String,

    // ✅ FIXED NAME
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // 🔥 IMPORTANT (adds updatedAt too)
  }
);

export default mongoose.model("LedgerEntry", ledgerEntrySchema);