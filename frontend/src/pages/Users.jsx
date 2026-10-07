import { useEffect, useState } from "react";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "cashier",
    status: "active",

    shiftStart: "",
    shiftEnd: "",
    attendance: "present",
  });

  /* =========================
     FETCH USERS
  ========================= */
  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/auth/users"
      );

      setUsers(res.data);

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* =========================
     HANDLE FORM
  ========================= */
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  /* =========================
     ADD WORKER
  ========================= */
  const addWorker = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/auth/register",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Worker added successfully");

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "cashier",
        status: "active",

        shiftStart: "",
        shiftEnd: "",
        attendance: "present",
      });

      setShowModal(false);

      fetchUsers();

    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
        "Error adding worker"
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <div className="flex-1">

        {/* NAVBAR */}
        <Navbar />

        <div className="p-6">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">

            <h1 className="text-3xl font-bold">
              Workers & Cashiers
            </h1>

            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              + Add Worker
            </button>

          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl shadow overflow-x-auto">

            <table className="w-full border-collapse">

              {/* TABLE HEAD */}
              <thead className="bg-gray-200">
                <tr>

                  <th className="p-3 text-left">
                    Name
                  </th>

                  <th className="p-3 text-left">
                    Phone
                  </th>

                  <th className="p-3 text-left">
                    Email
                  </th>

                  <th className="p-3 text-left">
                    Role
                  </th>

                  <th className="p-3 text-left">
                    Status
                  </th>

                  <th className="p-3 text-left">
                    Shift Start
                  </th>

                  <th className="p-3 text-left">
                    Shift End
                  </th>

                  <th className="p-3 text-left">
                    Attendance
                  </th>

                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody>

                {users.map((user) => (

                  <tr
                    key={user._id}
                    className="border-b"
                  >

                    {/* NAME */}
                    <td className="p-3">
                      {user.name}
                    </td>

                    {/* PHONE */}
                    <td className="p-3">
                      {user.phone}
                    </td>

                    {/* EMAIL */}
                    <td className="p-3">
                      {user.email}
                    </td>

                    {/* ROLE */}
                    <td className="p-3">

                      <span
                        className={`px-3 py-1 rounded text-white text-sm capitalize
                        ${
                          user.role === "admin"
                            ? "bg-red-600"
                            : user.role === "manager"
                            ? "bg-blue-600"
                            : user.role === "security"
                            ? "bg-gray-700"
                            : user.role === "cleaner"
                            ? "bg-yellow-600"
                            : user.role === "loader"
                            ? "bg-purple-600"
                            : "bg-green-600"
                        }`}
                      >
                        {user.role}
                      </span>

                    </td>

                    {/* STATUS */}
                    <td className="p-3">

                      <span
                        className={`px-3 py-1 rounded text-white text-sm
                        ${
                          user.status === "active"
                            ? "bg-green-600"
                            : "bg-red-600"
                        }`}
                      >
                        {user.status}
                      </span>

                    </td>

                    {/* SHIFT START */}
                    <td className="p-3">
                      {user.shiftStart || "--"}
                    </td>

                    {/* SHIFT END */}
                    <td className="p-3">
                      {user.shiftEnd || "--"}
                    </td>

                    {/* ATTENDANCE */}
                    <td className="p-3">

                      <span
                        className={`px-3 py-1 rounded text-white text-sm
                        ${
                          user.attendance === "present"
                            ? "bg-green-600"
                            : user.attendance === "late"
                            ? "bg-yellow-600"
                            : user.attendance === "off"
                            ? "bg-gray-600"
                            : "bg-red-600"
                        }`}
                      >
                        {user.attendance}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* =========================
          ADD WORKER MODAL
      ========================= */}
      {showModal && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-xl w-[400px] shadow-lg">

            <h2 className="text-2xl font-bold mb-4">
              Add Worker
            </h2>

            <form
              onSubmit={addWorker}
              className="space-y-3"
            >

              {/* NAME */}
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="border p-2 w-full rounded"
                required
              />

              {/* EMAIL */}
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="border p-2 w-full rounded"
                required
              />

              {/* PHONE */}
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              />

              {/* PASSWORD */}
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="border p-2 w-full rounded"
                required
              />

              {/* ROLE */}
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              >
                <option value="cashier">
                  Cashier
                </option>

                <option value="manager">
                  Manager
                </option>

                <option value="security">
                  Security
                </option>

                <option value="cleaner">
                  Cleaner
                </option>

                <option value="loader">
                  Loader
                </option>

                <option value="assistant">
                  Assistant
                </option>
              </select>

              {/* STATUS */}
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>

              {/* SHIFT START */}
              <input
                type="time"
                name="shiftStart"
                value={form.shiftStart}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              />

              {/* SHIFT END */}
              <input
                type="time"
                name="shiftEnd"
                value={form.shiftEnd}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              />

              {/* ATTENDANCE */}
              <select
                name="attendance"
                value={form.attendance}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              >
                <option value="present">
                  Present
                </option>

                <option value="late">
                  Late
                </option>

                <option value="absent">
                  Absent
                </option>

                <option value="off">
                  Off
                </option>
              </select>

              {/* BUTTONS */}
              <div className="flex gap-3 pt-2">

                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white w-full p-2 rounded"
                >
                  Save Worker
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white w-full p-2 rounded"
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}