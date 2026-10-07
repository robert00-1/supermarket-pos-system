import { useEffect, useState } from "react";
import axios from "axios";

export default function ReceiptHistory() {
  const [sales, setSales] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  /* =========================
     FETCH ALL RECEIPTS
  ========================= */
  const fetchSales = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/sales"
      );
      setSales(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  /* =========================
     OPEN SINGLE RECEIPT
  ========================= */
  const openReceipt = async (id) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/sales/${id}`
      );
      setSelectedReceipt(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-6">
        Receipt History
      </h1>

      {/* TABLE */}
      <div className="bg-white shadow rounded overflow-x-auto">

        <table className="w-full">

          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Receipt No</th>
              <th className="p-3 text-left">Cashier</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {sales.map((s) => (
              <tr key={s._id} className="border-t">

                <td className="p-3 font-mono">
                  {s.receiptNumber}
                </td>

                <td className="p-3">
                  {s.cashier}
                </td>

                <td className="p-3">
                  {s.customerName || "Walk-in"}
                </td>

                <td className="p-3 text-green-600 font-bold">
                  KES {s.total}
                </td>

                <td className="p-3">
                  {new Date(s.createdAt).toLocaleString()}
                </td>

                <td className="p-3">
                  <button
                    onClick={() => openReceipt(s._id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    View / Reprint
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* =========================
          RECEIPT MODAL
      ========================= */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">

          <div className="bg-white w-[350px] p-4 rounded">

            <h2 className="text-center font-bold">
              RECEIPT
            </h2>

            <hr />

            <p>Receipt: {selectedReceipt.receiptNumber}</p>
            <p>Cashier: {selectedReceipt.cashier}</p>
            <p>Customer: {selectedReceipt.customerName}</p>
            <p>Phone: {selectedReceipt.customerPhone}</p>

            <hr />

            {selectedReceipt.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.name}</span>
                <span>
                  {item.quantity * item.price}
                </span>
              </div>
            ))}

            <hr />

            <h3 className="font-bold">
              TOTAL: KES {selectedReceipt.total}
            </h3>

            <button
              onClick={() => window.print()}
              className="bg-green-600 text-white w-full mt-3 p-2"
            >
              Print Receipt
            </button>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="bg-gray-600 text-white w-full mt-2 p-2"
            >
              Close
            </button>

          </div>

        </div>
      )}

    </div>
  );
}