import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
import { createLedgerEntries } from "./ledgerService.js";

export const processSale = async (items, paymentMethod, cashier = "system", customerName = "", customerPhone = "") => {
  let total = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);

    if (!product) throw new Error("Product not found");

    if (product.stock < item.quantity) {
      throw new Error(`Not enough stock for ${product.name}`);
    }

    total += product.price * item.quantity;

    product.stock -= item.quantity;
    await product.save();
  }

  const transaction = await Transaction.create({
    receiptNo: `RCPT-${Date.now()}`,
    items,
    totalAmount: total,

    paymentMethod, // ✅ REQUIRED FIX

    status: "paid", // ✅ correct enum value

    cashier, // ✅ FIXED
    customerName,
    customerPhone,
  });

  await createLedgerEntries(transaction);

  return transaction;
};