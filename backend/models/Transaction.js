import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "mpesa"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    cashier: {
      type: String,
      default: "system",
      trim: true,
    },

    customerName: {
      type: String,
      default: "Walk-in Customer",
    },

    customerPhone: {
      type: String,
      default: null,
    },

    // MPESA tracking
    checkoutRequestId: {
      type: String,
      default: null,
    },

    mpesaReceipt: {
      type: String,
      default: null,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Transaction", transactionSchema);