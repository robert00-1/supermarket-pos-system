import { useEffect, useState } from "react";
import axios from "axios";

export default function Ledger() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* =========================
     FETCH LEDGER
  ========================= */
  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/ledger"
      );

      setEntries(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     SEARCH FILTER (SAFE)
  ========================= */
  const filteredEntries = entries.filter((entry) => {
    const searchText = search.toLowerCase();

    return (
      entry.reference?.toLowerCase().includes(searchText) ||
      entry.account?.toLowerCase().includes(searchText) ||
      entry.description?.toLowerCase().includes(searchText)
    );
  });

  /* =========================
     TOTALS
  ========================= */
  const totalDebit = filteredEntries
    .filter((e) => e.type === "DEBIT")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalCredit = filteredEntries
    .filter((e) => e.type === "CREDIT")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <div className="p-6 text-xl">
        Loading ledger...
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Ledger Dashboard</h1>
        <p className="text-gray-500">Financial Transactions</p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-gray-500">Total Debit</h2>
          <p className="text-2xl font-bold text-green-600">
            KES {totalDebit}
          </p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-gray-500">Total Credit</h2>
          <p className="text-2xl font-bold text-blue-600">
            KES {totalCredit}
          </p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-gray-500">Transactions</h2>
          <p className="text-2xl font-bold">
            {filteredEntries.length}
          </p>
        </div>

      </div>

      {/* SEARCH */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search reference/account..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-3 rounded w-full"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">

          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Reference</th>
              <th className="p-3 text-left">Account</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Description</th>
            </tr>
          </thead>

          <tbody>
            {filteredEntries.map((entry) => (
              <tr
                key={entry._id}
                className="border-b hover:bg-gray-50"
              >

                {/* DATE (FIXED SAFE) */}
                <td className="p-3">
                  {entry.createdAt
                    ? new Date(entry.createdAt).toLocaleString()
                    : "N/A"}
                </td>

                {/* REFERENCE */}
                <td className="p-3 font-semibold">
                  {entry.reference || "N/A"}
                </td>

                <td className="p-3">{entry.account || "N/A"}</td>

                <td
                  className={`p-3 font-bold ${
                    entry.type === "DEBIT"
                      ? "text-green-600"
                      : "text-blue-600"
                  }`}
                >
                  {entry.type}
                </td>

                <td className="p-3">
                  KES {entry.amount || 0}
                </td>

                <td className="p-3">
                  {entry.description || "-"}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}