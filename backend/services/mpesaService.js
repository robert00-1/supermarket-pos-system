import axios from "axios";
import moment from "moment";
import Transaction from "../models/Transaction.js";
import { createLedgerEntries } from "./ledgerService.js";

/* =========================
   GET ACCESS TOKEN
========================= */
const getAccessToken = async () => {
  const url =
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const response = await axios.get(url, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  return response.data.access_token;
};

/* =========================
   STK PUSH
========================= */
export const stkPush = async (req, res) => {
  try {
    const { phone, amount, items } = req.body;

    if (!phone || !amount || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const transaction = await Transaction.create({
      receiptNo: `MPESA-${Date.now()}`,
      items,
      totalAmount: amount,
      paymentMethod: "mpesa",
      status: "pending",
      customerPhone: phone,
    });

    const token = await getAccessToken();

    const timestamp = moment().format("YYYYMMDDHHmmss");

    const password = Buffer.from(
      process.env.MPESA_SHORTCODE +
        process.env.MPESA_PASSKEY +
        timestamp
    ).toString("base64");

    const stkResponse = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: "Supermarket POS",
        TransactionDesc: "Payment",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("🔥 STK RESPONSE:", stkResponse.data);

   const checkoutRequestId = stkResponse.data.CheckoutRequestID;

transaction.checkoutRequestId = checkoutRequestId;

await transaction.save();

console.log("🟢 SAVED CHECKOUT ID:", checkoutRequestId);
    await transaction.save();

    return res.json({
      success: true,
      message: "STK Push Sent",
      transactionId: transaction._id,
      checkoutRequestId:
        stkResponse.data.CheckoutRequestID,
    });

  } catch (err) {
    console.log(
      "❌ MPESA ERROR:",
      err.response?.data || err.message
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   CALLBACK (MPESA RESPONSE)
========================= */
export const mpesaCallback = async (req, res) => {
  try {

    console.log(" CALLBACK REVEIVED");
    const stkCallback = req.body?.Body?.stkCallback;

    if (!stkCallback) {
      return res.status(400).json({
        message: "Invalid callback",
      });
    }

    const checkoutId = stkCallback.CheckoutRequestID;

    const transaction = await Transaction.findOne({
      checkoutRequestId: checkoutId,
    });

    // Block fake callbacks
    if (!transaction) {
      console.log("🚨 FAKE CALLBACK BLOCKED");
      return res
        .status(404)
        .json({ message: "Invalid transaction" });
    }

    // Prevent double processing
    if (transaction.status === "paid") {
      console.log("⚠️ DUPLICATE CALLBACK IGNORED");
      return res
        .status(200)
        .json({ message: "Already processed" });
    }

    // PAYMENT FAILED
    if (stkCallback.ResultCode !== 0) {
      transaction.status = "failed";
      await transaction.save();

      console.log("❌ PAYMENT FAILED");

      return res.json({ success: false });
    }

    // PAYMENT SUCCESS
    const meta =
      stkCallback.CallbackMetadata?.Item;

    const amount = meta?.find(
      (i) => i.Name === "Amount"
    )?.Value;

    const receipt = meta?.find(
      (i) => i.Name === "MpesaReceiptNumber"
    )?.Value;

    const phone = meta?.find(
      (i) => i.Name === "PhoneNumber"
    )?.Value;

    transaction.status = "paid";
    transaction.mpesaReceipt = receipt;
    transaction.paidAmount = amount;
    transaction.customerPhone = phone;

    await transaction.save();

    await createLedgerEntries(transaction);

    console.log("✅ PAYMENT SUCCESS SAVED");

    return res.json({ success: true });

  } catch (err) {
    console.log("🔥 CALLBACK ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   CHECK PAYMENT STATUS
========================= */
export const checkMpesaStatus = async (req, res) => {
  try {
    const { checkoutId } = req.params;

    const transaction = await Transaction.findOne({
      checkoutRequestId: checkoutId,
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    return res.json({
      status: transaction.status,
      receipt: transaction.mpesaReceipt,
      amount: transaction.paidAmount,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};