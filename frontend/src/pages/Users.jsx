
import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth`;

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "cashier",
  status: "active",
  shiftStart: "",
  shiftEnd: "",
  attendance: "absent",
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ...emptyForm });

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = currentUser?.role === "admin";
  const token = localStorage.getItem("token");

  const authConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchUsers = async () => {
    try {
      setError("");
      const response = await axios.get(`${API}/users`, authConfig);
      setUsers(response.data);
    } catch (err) {
      console.error("FETCH USERS ERROR:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load workers. Please check your login."
      );
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, []);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const addWorker = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      alert("Only administrators can add workers.");
      return;
    }

    if (form.shiftStart && form.shiftEnd &&
        form.shiftStart === form.shiftEnd) {
      alert("Shift start and end times cannot be the same.");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API}/workers`, form, authConfig);

      alert("Worker added successfully.");
      setForm({ ...emptyForm });
      setShowModal(false);
      await fetchUsers();
    } catch (err) {
      console.error("ADD WORKER ERROR:", err);
      alert(err.response?.data?.message || "Unable to add worker.");
    } finally {
      setLoading(false);
    }
  };

  const deleteWorker = async (user) => {
    if (!isAdmin) return;

    if (user._id === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API}/user/${user._id}`, authConfig);
      setUsers((previous) =>
        previous.filter((worker) => worker._id !== user._id)
      );
      alert("Worker deleted successfully.");
    } catch (err) {
      console.error("DELETE WORKER ERROR:", err);
      alert(err.response?.data?.message || "Unable to delete worker.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <div className="p-6">
            <h1 className="text-2xl font-bold">Workers & Cashiers</h1>
            <p className="mt-4 text-red-600">
              Only administrators can access worker management.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <Navbar />

        <main className="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">Workers & Cashiers</h1>
              <p className="mt-1 text-gray-600">
                Manage staff, roles, shift times and attendance.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              + Add Worker
            </button>
          </div>

          {error && (
            <p className="mb-4 rounded bg-red-100 p-3 text-red-700">
              {error}
            </p>
          )}

          <div className="overflow-x-auto rounded-xl bg-white shadow">
            <table className="w-full border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  {[
                    "Name",
                    "Phone",
                    "Email",
                    "Role",
                    "Status",
                    "Shift Start",
                    "Shift End",
                    "Attendance",
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} className="p-3 text-left">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b">
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.phone || "--"}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3 capitalize">{user.role}</td>

                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-1 text-sm text-white ${
                          user.status === "active"
                            ? "bg-green-600"
                            : "bg-red-600"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="p-3">{user.shiftStart || "--"}</td>
                    <td className="p-3">{user.shiftEnd || "--"}</td>

                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-1 text-sm text-white ${
                          user.attendance === "present"
                            ? "bg-green-600"
                            : user.attendance === "late"
                            ? "bg-yellow-600"
                            : user.attendance === "off"
                            ? "bg-gray-600"
                            : "bg-red-600"
                        }`}
                      >
                        {user.attendance || "absent"}
                      </span>
                    </td>

                    <td className="p-3">
                      {user._id !== currentUser?.id && (
                        <button
                          onClick={() => deleteWorker(user)}
                          className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {users.length === 0 && !error && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-gray-500">
                      No workers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-4 w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold">Add Worker</h2>

            <form onSubmit={addWorker} className="space-y-3">
              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded border p-2"
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded border p-2"
                required
              />

              <input
                name="phone"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded border p-2"
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password (at least 8 characters)"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                className="w-full rounded border p-2"
                required
              />

              <label className="block text-sm font-medium">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded border p-2"
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="security">Security</option>
                <option value="cleaner">Cleaner</option>
                <option value="loader">Loader</option>
                <option value="assistant">Assistant</option>
              </select>

              <label className="block text-sm font-medium">Account Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded border p-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Shift Start</label>
                  <input
                    type="time"
                    name="shiftStart"
                    value={form.shiftStart}
                    onChange={handleChange}
                    className="w-full rounded border p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Shift End</label>
                  <input
                    type="time"
                    name="shiftEnd"
                    value={form.shiftEnd}
                    onChange={handleChange}
                    className="w-full rounded border p-2"
                  />
                </div>
              </div>

              <label className="block text-sm font-medium">
                Initial Attendance
              </label>
              <select
                name="attendance"
                value={form.attendance}
                onChange={handleChange}
                className="w-full rounded border p-2"
              >
                <option value="absent">Absent</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="off">Off</option>
              </select>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded bg-green-600 p-2 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Worker"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setForm({ ...emptyForm });
                  }}
                  className="w-full rounded bg-gray-500 p-2 text-white hover:bg-gray-600"
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
