import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import POS from "./pages/POS";
import Receipt from "./pages/Receipt";
import Sales from "./pages/Sales";
import Users from "./pages/Users";
import Ledger from "./pages/Ledger";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/pos" element={<POS />} />
      <Route path="/receipt/:id" element={<Receipt />} />
      <Route path="/sales" element={<Sales />} />
      <Route path="/users" element={<Users />} />
      <Route path="/ledger" element={<Ledger />} />
    </Routes>
  );
}