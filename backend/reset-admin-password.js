
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = readline.createInterface({ input, output });

try {
  const password = await rl.question("Enter your new admin password: ");
  const confirmation = await rl.question("Confirm your new password: ");

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  if (password !== confirmation) {
    throw new Error("Passwords do not match.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const admin = await User.findOne({ email: "admin@gmail.com" });

  if (!admin) {
    throw new Error("Admin account not found.");
  }

  if (admin.role !== "admin") {
    throw new Error("This account does not have the admin role.");
  }

 if (!admin.phone) {
  admin.phone = await rl.question(
    "Enter a phone number for the admin account: "
  );
}

admin.password = await bcrypt.hash(password, 10);
await admin.save();

  console.log("Admin password reset successfully.");
} catch (error) {
  console.error("Password reset failed:", error.message);
} finally {
  rl.close();
  await mongoose.disconnect().catch(() => {});
}
