import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-gray-900 text-white p-5">

      <h1 className="text-2xl font-bold mb-8">
        Supermarket POS
      </h1>

      <div className="flex flex-col gap-4">

        <Link
          to="/dashboard"
          className="bg-green-600 hover:bg-green-700 p-3 rounded"
        >
          Dashboard
        </Link>

        <Link
          to="/products"
          className="bg-green-600 hover:bg-green-700 p-3 rounded"
        >
          Products
        </Link>

        <Link
          to="/pos"
          className="bg-green-600 hover:bg-green-700 p-3 rounded"
        >
          POS
        </Link>

        <Link
          to="/sales"
          className="bg-green-600 hover:bg-green-700 p-3 rounded"
        >
          Sales History
        </Link>

        <Link
        to="/users"
        className="bg-green-600 hover:bg-green-700 p-3 rounded">
          Workers
        </Link>

        <Link
        to="/ledger"
        className="bg-green-600 hover:bg-green-700 p-3 rounded"
        >
          Ledger
        </Link>
      </div>
    </div>
  );
}