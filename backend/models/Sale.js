import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      unique: true,
    },

    cashier: String,

    customerName: String,
    customerPhone: String,

    items: [
      {
        productId: String,
        name: String,
        quantity: Number,
        price: Number,
      },
    ],

    total: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);