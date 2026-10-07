import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  // cashier from login
  const user = JSON.parse(localStorage.getItem("user"));

  /* =========================
     LOAD PRODUCTS
  ========================= */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/products");
        setProducts(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchProducts();
  }, []);

  /* =========================
     CART
  ========================= */
  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((p) => p._id === product._id);

      if (exists) {
        return prev.map((p) =>
          p._id === product._id ? { ...p, qty: p.qty + 1 } : p
        );
      }

      return [...prev, { ...product, qty: 1 }];
    });
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  /* =========================
     CASH CHECKOUT
  ========================= */
  const handleCheckout = async () => {
    try {
      if (cart.length === 0) return alert("Cart is empty");

      const formattedItems = cart.map((item) => ({
        productId: item._id,
        name: item.name,
        quantity: item.qty,
        price: item.price,
      }));

      await axios.post("http://localhost:5000/api/sales/checkout", {
        items: formattedItems,
        paymentMethod: "cash",
        cashier: user?.name || "Unknown Cashier",
        customerName,
        customerPhone,
      });

      setReceipt({
        items: cart,
        total,
        cashier: user?.name || "Unknown Cashier",
        customerName,
        customerPhone,
        date: new Date().toLocaleString(),
        store: {
          name: "ROBERTO SUPERMARKET",
          address: "ELDORET CBD",
          phone: "+254 71234567",
        },
      });

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");

    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Checkout failed");
    }
  };

  /* =========================
     MPESA PAYMENT
  ========================= */
  const handleMpesaPayment = async () => {
    try {
      if (cart.length === 0) return alert("Cart is empty");
      if (!customerPhone) return alert("Enter phone");
      if (paymentLoading) return;

      setPaymentLoading(true);
      setPaymentMessage("Sending STK Push...");

      const formattedItems = cart.map((item) => ({
        productId: item._id,
        name: item.name,
        quantity: item.qty,
        price: item.price,
      }));

      const response = await axios.post(
        "http://localhost:5000/api/mpesa/stkpush",
        {
          phone: customerPhone,
          amount: total,
          items: formattedItems,
        }
      );

      const checkoutId = response.data.checkoutRequestId;

      setPaymentMessage("STK sent. Enter PIN...");

      let attempts = 0;

      const interval = setInterval(async () => {
        try {
          attempts++;

          const res = await axios.get(
            `http://localhost:5000/api/mpesa/status/${checkoutId}`
          );

          if (res.data.status === "paid") {
            clearInterval(interval);
            setPaymentLoading(false);
            setPaymentMessage("Payment successful!");

            setReceipt({
              items: cart,
              total,
              cashier: user?.name || "Unknown Cashier",
              customerName,
              customerPhone,
              date: new Date().toLocaleString(),
              store: {
                name: "ROBERTO SUPERMARKET",
                address: "ELDORET CBD",
                phone: "+254 71234567",
              },
            });

            setCart([]);
            setCustomerName("");
            setCustomerPhone("");
          }

          if (res.data.status === "failed") {
            clearInterval(interval);
            setPaymentLoading(false);
            setPaymentMessage("Payment failed");
          }

          if (attempts > 15) {
            clearInterval(interval);
            setPaymentLoading(false);
            setPaymentMessage("Payment timeout");
          }

        } catch (err) {
          console.log(err);
        }
      }, 3000);

    } catch (error) {
      console.log(error);
      setPaymentLoading(false);
      setPaymentMessage("MPESA failed");
    }
  };

  /* =========================
     PDF
  ========================= */
  const downloadPDF = async () => {
    const element = document.getElementById("receipt-box");
    const canvas = await html2canvas(element);
    const data = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(data, "PNG", 10, 10, 180, 0);
    pdf.save("receipt.pdf");
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="flex h-screen bg-gray-100">

      {/* LEFT */}
      <div className="w-1/4 bg-white p-4 border-r">
        <h2 className="font-bold">Product Preview</h2>

        {selectedProduct ? (
          <div>
            <img
              src={
                selectedProduct.image
                  ? `http://localhost:5000${selectedProduct.image}`
                  : "/placeholder.png"
              }
              className="h-40 w-full object-cover"
            />
            <p>{selectedProduct.name}</p>
            <p>KES {selectedProduct.price}</p>
          </div>
        ) : (
          <p>No product selected</p>
        )}
      </div>

      {/* CENTER */}
      <div className="flex-1 p-4">
        {/* CUSTOMER DETAILS */}
<div className="flex gap-2 mb-4">

  <input
    type="text"
    placeholder="Customer Name"
    value={customerName}
    onChange={(e) =>
      setCustomerName(e.target.value)
    }
    className="border p-2 rounded w-full"
  />

  <input
    type="text"
    placeholder="2547XXXXXXXX"
    value={customerPhone}
    onChange={(e) =>
      setCustomerPhone(e.target.value)
    }
    className="border p-2 rounded w-full"
  />

</div>
        <div className="grid grid-cols-3 gap-3">
          {products.map((p) => (
            <div
              key={p._id}
              onClick={() => {
                setSelectedProduct(p);
                addToCart(p);
              }}
              className="bg-white p-2 shadow cursor-pointer"
            >
              <img
                src={
                  p.image
                    ? `http://localhost:5000${p.image}`
                    : "/placeholder.png"
                }
                className="h-24 w-full object-cover"
              />
              <p>{p.name}</p>
              <p>KES {p.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-1/3 bg-white p-4 border-l">
        <h2>Checkout</h2>

        {cart.map((item) => (
          <div key={item._id} className="flex justify-between">
            <span>{item.name} x {item.qty}</span>
            <span>KES {item.price * item.qty}</span>
          </div>
        ))}

        <h3>Total: KES {total}</h3>

        <button onClick={handleCheckout} className="bg-blue-600 text-white w-full p-2 mt-2">
          Cash Checkout
        </button>

        <button
          onClick={handleMpesaPayment}
          disabled={paymentLoading}
          className="bg-green-600 text-white w-full p-2 mt-2"
        >
          {paymentLoading ? "Processing..." : "Pay MPESA"}
        </button>

        {paymentMessage && (
          <p className="text-sm mt-2 bg-gray-100 p-2">{paymentMessage}</p>
        )}

        <button
          onClick={downloadPDF}
          className="bg-purple-600 text-white w-full p-2 mt-2"
        >
          Download Receipt PDF
        </button>
      </div>
            {/* RECEIPT */}
      {receipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div
            id="receipt-box"
            className="bg-white w-[380px] p-4 rounded shadow-lg"
          >

            {/* STORE */}
            <div className="text-center mb-3">

              <h2 className="font-bold text-xl">
                {receipt.store.name}
              </h2>

              <p>{receipt.store.address}</p>

              <p>{receipt.store.phone}</p>

            </div>

            <hr className="my-2" />

            {/* INFO */}
            <p>
              <strong>Cashier:</strong>{" "}
              {receipt.cashier}
            </p>

            <p>
              <strong>Customer:</strong>{" "}
              {receipt.customerName || "Walk-in Customer"}
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              {receipt.customerPhone || "--"}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {receipt.date}
            </p>

            <hr className="my-2" />

            {/* ITEMS */}
            {receipt.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between py-1"
              >
                <span>
                  {item.name} x {item.qty}
                </span>

                <span>
                  KES {item.price * item.qty}
                </span>
              </div>
            ))}

            <hr className="my-2" />

            {/* TOTAL */}
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>

              <span>
                KES {receipt.total}
              </span>
            </div>

            {/* BUTTONS */}
            <div className="space-y-2 mt-4">

              <button
                onClick={() => window.print()}
                className="bg-green-600 hover:bg-green-700 text-white w-full p-2 rounded"
              >
                Print Receipt
              </button>

              <button
                onClick={downloadPDF}
                className="bg-purple-600 hover:bg-purple-700 text-white w-full p-2 rounded"
              >
                Download PDF
              </button>

              <button
                onClick={() => {
                  setReceipt(null);
                  setCart([]);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white w-full p-2 rounded"
              >
                New Sale
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
