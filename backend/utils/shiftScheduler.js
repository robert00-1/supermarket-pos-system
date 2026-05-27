import User from "../models/User.js";

const autoShiftRotation = async () => {
  try {
    const now = new Date();

    const currentTime = now.toTimeString().slice(0, 5); // "14:30"

    const users = await User.find();

    for (let user of users) {
      if (!user.shiftStart || !user.shiftEnd) continue;

      const isWorking =
        currentTime >= user.shiftStart &&
        currentTime <= user.shiftEnd;

      if (isWorking) {
        user.status = "active";
        user.attendance = "present";
      } else {
        user.status = "inactive";
        user.attendance = "off";
      }

      await user.save();
    }

    console.log("🔄 Shift rotation updated");
  } catch (error) {
    console.log("Shift error:", error.message);
  }
};

export default autoShiftRotation;