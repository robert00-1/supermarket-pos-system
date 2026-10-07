import { useEffect, useState } from "react";
import axios from "axios";

export default function Shifts() {
  const [shifts, setShifts] = useState([]);

  const fetchShifts = async () => {
    const res = await axios.get("http://localhost:5000/api/shifts");
    setShifts(res.data);
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Shift History</h1>

      <table className="w-full bg-white shadow">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Login</th>
            <th>Logout</th>
            <th>Duration (min)</th>
          </tr>
        </thead>

        <tbody>
          {shifts.map((s) => (
            <tr key={s._id} className="border-t">
              <td>{s.userId?.name}</td>
              <td>{s.userId?.role}</td>
              <td>{new Date(s.loginTime).toLocaleString()}</td>
              <td>
                {s.logoutTime
                  ? new Date(s.logoutTime).toLocaleString()
                  : "Active"}
              </td>
              <td>{Math.round(s.duration || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}