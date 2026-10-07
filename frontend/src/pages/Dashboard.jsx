import { useEffect, useState } from "react";
import axios from "axios";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
  });

  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH STATS
  ========================= */
  const fetchStats = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/sales/stats/summary"
      );

      setStats(res.data);
    } catch (error) {
      console.log("Stats error:", error.message);
    }
  };

  /* =========================
     FETCH LOW STOCK
  ========================= */
  const fetchLowStock = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/sales/low-stock"
      );

      setLowStock(res.data);
    } catch (error) {
      console.log("Low stock error:", error.message);
    }
  };

  /* =========================
     INIT LOAD
  ========================= */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchLowStock()]);
      setLoading(false);
    };

    load();

    const interval = setInterval(() => {
      fetchStats();
      fetchLowStock();
    }, 10000); // refresh every 10 sec

    return () => clearInterval(interval);
  }, []);

  /* =========================
     CHART DATA (demo)
  ========================= */
  const chartData = [
    { day: "Mon", sales: 400 },
    { day: "Tue", sales: 700 },
    { day: "Wed", sales: 500 },
    { day: "Thu", sales: 900 },
    { day: "Fri", sales: 1200 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="flex-1">

        <Navbar />

        <div className="p-6">

          {/* TITLE */}
          <h1 className="text-3xl font-bold mb-6">
            🛒 Supermarket Dashboard
          </h1>

          {/* LOADING */}
          {loading && (
            <p className="text-gray-500 mb-4">
              Loading dashboard data...
            </p>
          )}

          {/* STATS CARDS */}
          <div className="grid grid-cols-2 gap-6">

            <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
              <h2 className="text-gray-500">Total Revenue</h2>
              <h1 className="text-4xl font-bold text-green-600 mt-2">
                KES {stats.totalRevenue}
              </h1>
            </div>

            <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
              <h2 className="text-gray-500">Total Sales</h2>
              <h1 className="text-4xl font-bold text-blue-600 mt-2">
                {stats.totalSales}
              </h1>
            </div>

          </div>

          {/* SALES CHART */}
          <div className="bg-white p-6 rounded-xl shadow mt-6">
            <h2 className="text-xl font-bold mb-4">
              Weekly Sales
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#16a34a"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* LOW STOCK ALERTS */}
          <div className="bg-white mt-6 p-6 rounded-xl shadow">

            <h2 className="text-xl font-bold text-red-600 mb-4">
              ⚠ Low Stock Alerts
            </h2>

            {lowStock.length === 0 ? (
              <p className="text-gray-500">
                All products are sufficiently stocked
              </p>
            ) : (
              <div className="space-y-3">

                {lowStock.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between bg-red-50 p-3 rounded border border-red-200"
                  >

                    <div>
                      <p className="font-semibold">
                        {product.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        Barcode: {product.barcode}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-red-600 font-bold">
                        {product.stock} left
                      </p>

                      <p className="text-xs text-gray-500">
                        Reorder soon
                      </p>
                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}