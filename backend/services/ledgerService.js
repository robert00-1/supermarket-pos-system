import LedgerEntry from "../models/LedgerEntry.js";

export const createLedgerEntries = async (transaction) => {
  const {
    _id,
    totalAmount,
    paymentMethod,
    mpesaReceipt,
    receiptNo,
  } = transaction;

  // ✅ choose reference properly
  const reference =
    paymentMethod === "mpesa"
      ? mpesaReceipt
      : receiptNo;

  const account =
    paymentMethod === "cash" ? "CASH" : "MPESA";

  // =========================
  // DEBIT (Money received)
  // =========================
  await LedgerEntry.create({
    transactionId: _id,
    reference,
    account,
    type: "DEBIT",
    amount: totalAmount,
    description: "Money received from customer",
  });

  // =========================
  // CREDIT (Revenue)
  // =========================
  await LedgerEntry.create({
    transactionId: _id,
    reference,
    account: "SALES",
    type: "CREDIT",
    amount: totalAmount,
    description: "Revenue from sale",
  });
};