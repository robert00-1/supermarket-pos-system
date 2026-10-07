import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    barcode: "",
    price: "",
    stock: "",
    category: "General",
    image: null,
    description: "",
    manufactureDate: "",
    expiryDate: "",
  });

  /* =========================
     IMAGE HELPER
  ========================= */
  const getImageUrl = (img) => {
    if (!img) return "/placeholder.png";
    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads/")) {
      return `${API}${img}`;
    }
    return `${API}/uploads/${img}`;
  };

  /* =========================
     FETCH PRODUCTS
  ========================= */
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/api/products`);
      setProducts(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* =========================
     INPUT HANDLERS
  ========================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = (e) => {
    setForm({ ...form, image: e.target.files[0] });
  };

  /* =========================
     ADD PRODUCT
  ========================= */
  const addProduct = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      data.append("name", form.name);
      data.append("barcode", form.barcode);
      data.append("price", form.price);
      data.append("stock", form.stock);
      data.append("category", form.category);
      data.append("description", form.description);
      data.append("manufactureDate", form.manufactureDate);
      data.append("expiryDate", form.expiryDate);

      if (form.image) {
        data.append("image", form.image);
      }

      await axios.post(`${API}/api/products`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Product Added");

      setShowModal(false);

      setForm({
        name: "",
        barcode: "",
        price: "",
        stock: "",
        category: "General",
        image: null,
        description: "",
        manufactureDate: "",
        expiryDate: "",
      });

      fetchProducts();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Error adding product");
    }
  };

  /* =========================
     RESTOCK
  ========================= */
  const handleRestock = async (id) => {
    try {
      const quantity = prompt("Enter quantity to add");
      if (!quantity) return;

      await axios.put(`${API}/api/products/restock/${id}`, {
        quantity,
      });

      alert("✅ Stock updated");
      fetchProducts();
    } catch (error) {
      console.log(error);
    }
  };

  /* =========================
     DELETE PRODUCT
  ========================= */
  const handleDelete = async (id) => {
    try {
      const ok = confirm("Delete this product?");
      if (!ok) return;

      await axios.delete(`${API}/api/products/${id}`);

      alert("🗑️ Deleted");
      fetchProducts();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Products</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-5 py-2 rounded-lg"
        >
          + Add Product
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="w-full">

          <thead className="bg-gray-200">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Barcode</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Category</th>
              <th className="p-3">Expiry</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-t">

                <td className="p-3">
                  <img
                    src={getImageUrl(p.image)}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>

                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.barcode}</td>
                <td className="p-3">KES {p.price}</td>

                <td className="p-3">
                  {p.stock}
                </td>

                <td className="p-3">{p.category}</td>
                <td className="p-3">{p.expiryDate || "--"}</td>

                <td className="p-3 flex gap-2">

                  <button
                    onClick={() => handleRestock(p._id)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Restock
                  </button>

                  <button
                    onClick={() => handleDelete(p._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>

                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <form
            onSubmit={addProduct}
            className="bg-white p-6 rounded-xl w-[450px]"
          >

            <h2 className="text-xl font-bold mb-3">Add Product</h2>

            <input name="name" placeholder="Name" onChange={handleChange} className="border p-2 w-full mb-2" />
            <input name="barcode" placeholder="Barcode" onChange={handleChange} className="border p-2 w-full mb-2" />
            <input name="price" placeholder="Price" onChange={handleChange} className="border p-2 w-full mb-2" />
            <input name="stock" placeholder="Stock" onChange={handleChange} className="border p-2 w-full mb-2" />
            <input name="category" placeholder="Category" onChange={handleChange} className="border p-2 w-full mb-2" />

            <input type="file" onChange={handleImage} className="border p-2 w-full mb-2" />

            <button className="bg-green-600 text-white w-full p-2">
              Save
            </button>

          </form>
        </div>
      )}

    </div>
  );
}