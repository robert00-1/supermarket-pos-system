
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import User from "./models/User.js";

const rl = readline.createInterface({ input, output });

try {
  const uri = process.env.PRODUCTION_MONGO_URI;

  if (!uri) {
    throw new Error("Production MongoDB connection is missing.");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("Connected database:", mongoose.connection.name);

  const email = "admin@gmail.com";
  const existing = await User.findOne({ email });

  if (existing) {
    throw new Error(
      "This email already exists. No changes were made."
    );
  }

  const name = await rl.question("Enter admin full name: ");
  const phone = await rl.question("Enter admin phone number: ");
  const password = await rl.question("Create a new unique password: ");
  const confirmation = await rl.question("Confirm password: ");

  if (!name.trim() || !phone.trim()) {
    throw new Error("Name and phone number are required.");
  }

  if (password.length < 12 || password !== confirmation) {
    throw new Error(
      "Passwords must match and contain at least 12 characters."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name: name.trim(),
    email,
    phone: phone.trim(),
    password: hashedPassword,
    role: "admin",
    status: "active",
  });

  console.log("Production admin account created successfully.");
} catch (error) {
  console.error("Operation failed:", error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await mongoose.disconnect().catch(() => {});
}
