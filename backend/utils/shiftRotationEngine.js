import User from "../models/User.js";

const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const autoShiftRotation = async () => {
  try {
    const now = new Date();
    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    const users = await User.find();

    for (let user of users) {
      if (!user.shiftStart || !user.shiftEnd) continue;

      const start = timeToMinutes(user.shiftStart);
      const end = timeToMinutes(user.shiftEnd);

      let isActive = false;

      // normal shift
      if (start < end) {
        isActive =
          currentMinutes >= start &&
          currentMinutes < end;
      }

      // overnight shift (e.g 22:00 - 06:00)
      else {
        isActive =
          currentMinutes >= start ||
          currentMinutes < end;
      }

      user.status = isActive ? "active" : "inactive";
      user.attendance = isActive ? "present" : "off";

      await user.save();
    }

    console.log("🔄 Shift checked:", now.toTimeString());
  } catch (error) {
    console.log(error.message);
  }
};

export default autoShiftRotation;