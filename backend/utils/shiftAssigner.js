import User from "../models/User.js";

const shifts = [
  { start: "08:00", end: "12:00" },
  { start: "12:00", end: "16:00" },
  { start: "16:00", end: "20:00" },
];

const assignShifts = async () => {
  try {
    const users = await User.find();

    let index = 0;

    for (let user of users) {
      if (user.role === "admin") continue;

      const shift = shifts[index % shifts.length];

      user.shiftStart = shift.start;
      user.shiftEnd = shift.end;

      await user.save();
      index++;
    }

    console.log("✅ Shifts assigned successfully");
  } catch (error) {
    console.log("Shift assign error:", error.message);
  }
};

export default assignShifts;