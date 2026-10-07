import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Sales() {
  const [sales, setSales] = useState([]);

  const fetchSales = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/sales");
      setSales(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">
            Sales History
          </h1>

          <div className="bg-white shadow rounded p-4">
            {sales.map((sale) => (
              <div
                key={sale._id}
                className="border-b py-3 flex justify-between"
              >
                <div>
                  <p className="font-semibold">
                    Cashier: {sale.cashier}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(sale.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="font-bold">
                  KES {sale.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}