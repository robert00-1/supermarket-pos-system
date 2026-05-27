import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  loginTime: Date,
  logoutTime: Date,
  duration: Number, // minutes
  active: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.model("Shift", shiftSchema);