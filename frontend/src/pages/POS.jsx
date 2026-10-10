
import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const getImageUrl = (image) => {
  if (!image) return "/placeholder.png";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  if (image.startsWith("/")) {
    return `${API}${image}`;
  }

  return `${API}/uploads/${image}`;
};

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  // LOAD PRODUCTS
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setProductsLoading(true);
      setProductsError("");

      try {
        const res = await axios.get(`${API}/api/products`);

        if (!cancelled) {
          const data = Array.isArray(res.data)
            ? res.data
            : res.data.products || [];

          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to load products:", error);

        if (!cancelled) {
          setProductsError(
            error.response
              ? `Could not load products (HTTP ${error.response.status}).`
              : "Could not connect to the backend. Check your API URL and internet connection."
          );
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  // CART
  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item._id === product._id);

      if (exists) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [...prev, { ...product, qty: 1 }];
    });
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.qty,
    0
  );

  const formattedItems = () =>
    cart.map((item) => ({
      productId: item._id,
      name: item.name,
      quantity: item.qty,
      price: Number(item.price),
    }));

  const createReceipt = () => ({
    items: cart.map((item) => ({ ...item })),
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

  // CASH CHECKOUT
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    try {
      await axios.post(`${API}/api/sales/checkout`, {
        items: formattedItems(),
        paymentMethod: "cash",
        cashier: user?.name || "Unknown Cashier",
        customerName,
        customerPhone,
      });

      setReceipt(createReceipt());
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
    } catch (error) {
      console.error("Cash checkout failed:", error);
      alert(
        error.response?.data?.message ||
          "Checkout failed. Please check the backend."
      );
    }
  };

  // MPESA PAYMENT
  const handleMpesaPayment = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    if (!customerPhone.trim()) {
      alert("Enter the customer's M-Pesa phone number.");
      return;
    }

    if (paymentLoading) return;

    setPaymentLoading(true);
    setPaymentMessage("Sending STK Push...");

    try {
      const response = await axios.post(`${API}/api/mpesa/stkpush`, {
        phone: customerPhone.trim(),
        amount: total,
        items: formattedItems(),
      });

      const checkoutId = response.data.checkoutRequestId;

      if (!checkoutId) {
        throw new Error(
          response.data.message || "No checkout request ID was returned."
        );
      }

      setPaymentMessage("STK sent. Enter your M-Pesa PIN.");

      let attempts = 0;
      const maxAttempts = 15;

      const interval = setInterval(async () => {
        attempts += 1;

        try {
          const res = await axios.get(
            `${API}/api/mpesa/status/${encodeURIComponent(checkoutId)}`
          );

          if (res.data.status === "paid") {
            clearInterval(interval);
            setPaymentLoading(false);
            setPaymentMessage("Payment successful!");

            setReceipt(createReceipt());
            setCart([]);
            setCustomerName("");
            setCustomerPhone("");
            return;
          }

          if (res.data.status === "failed") {
            clearInterval(interval);
            setPaymentLoading(false);
            setPaymentMessage("Payment failed. Please try again.");
            return;
          }

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            setPaymentLoading(false);
            setPaymentMessage(
              "Payment status is still pending. Confirm payment before retrying."
            );
          }
        } catch (error) {
          console.error("M-Pesa status check failed:", error);

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            setPaymentLoading(false);
            setPaymentMessage(
              "Could not confirm payment status. Check the transaction before retrying."
            );
          }
        }
      }, 3000);
    } catch (error) {
      console.error("M-Pesa request failed:", error);
      setPaymentLoading(false);
      setPaymentMessage(
        error.response?.data?.message ||
          error.message ||
          "M-Pesa request failed."
      );
    }
  };

  // DOWNLOAD RECEIPT PDF
  const downloadPDF = async () => {
    const element = document.getElementById("receipt-box");

    if (!element) {
      alert("Complete a sale and open its receipt before downloading.");
      return;
    }

    try {
      const canvas = await html2canvas(element);
      const data = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pageWidth - 20;
      const imageHeight =
        (canvas.height * imageWidth) / canvas.width;

      const finalHeight = Math.min(imageHeight, pageHeight - 20);

      pdf.addImage(data, "PNG", 10, 10, imageWidth, finalHeight);
      pdf.save("receipt.pdf");
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("Could not create the receipt PDF.");
    }
  };

  // UI
  return (
    <div className="flex h-screen flex-col overflow-auto bg-gray-100 lg:flex-row">
      {/* LEFT: PRODUCT PREVIEW */}
      <div className="w-full border-b bg-white p-4 lg:w-1/4 lg:border-b-0 lg:border-r">
        <h2 className="mb-3 font-bold">Product Preview</h2>

        {selectedProduct ? (
          <div>
            <img
              src={getImageUrl(selectedProduct.image)}
              alt={selectedProduct.name}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/placeholder.png";
              }}
              className="h-40 w-full rounded object-cover"
            />
            <p className="mt-2 font-semibold">
              {selectedProduct.name}
            </p>
            <p>KES {selectedProduct.price}</p>
          </div>
        ) : (
          <p>No product selected</p>
        )}
      </div>

      {/* CENTER: PRODUCTS */}
      <div className="min-w-0 flex-1 p-4">
        <h2 className="mb-4 text-xl font-bold">Products</h2>

        {/* CUSTOMER DETAILS */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            className="w-full rounded border p-2"
          />

          <input
            type="tel"
            placeholder="2547XXXXXXXX"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            className="w-full rounded border p-2"
          />
        </div>

        {productsLoading && <p>Loading products...</p>}

        {productsError && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
            {productsError}
            <button
              onClick={() => window.location.reload()}
              className="ml-2 underline"
            >
              Retry
            </button>
          </div>
        )}

        {!productsLoading &&
          !productsError &&
          products.length === 0 && (
            <p className="rounded bg-yellow-100 p-3">
              No products were returned by the backend.
            </p>
          )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <button
              type="button"
              key={product._id}
              onClick={() => {
                setSelectedProduct(product);
                addToCart(product);
              }}
              className="rounded bg-white p-2 text-left shadow transition hover:shadow-md"
            >
              <img
                src={getImageUrl(product.image)}
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/placeholder.png";
                }}
                className="h-24 w-full rounded object-cover"
              />

              <p className="mt-2 font-semibold">{product.name}</p>
              <p>KES {product.price}</p>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: CHECKOUT */}
      <div className="w-full border-t bg-white p-4 lg:w-1/3 lg:border-l">
        <h2 className="mb-4 text-lg font-bold">Checkout</h2>

        {cart.length === 0 ? (
          <p className="text-gray-500">Your cart is empty.</p>
        ) : (
          cart.map((item) => (
            <div
              key={item._id}
              className="flex justify-between gap-2 py-1"
            >
              <span>
                {item.name} x {item.qty}
              </span>
              <span>
                KES {Number(item.price) * item.qty}
              </span>
            </div>
          ))
        )}

        <h3 className="my-4 text-lg font-bold">
          Total: KES {total.toLocaleString()}
        </h3>

        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || paymentLoading}
          className="mt-2 w-full rounded bg-blue-600 p-2 text-white disabled:opacity-50"
        >
          Cash Checkout
        </button>

        <button
          onClick={handleMpesaPayment}
          disabled={paymentLoading || cart.length === 0}
          className="mt-2 w-full rounded bg-green-600 p-2 text-white disabled:opacity-50"
        >
          {paymentLoading ? "Processing..." : "Pay M-Pesa"}
        </button>

        {paymentMessage && (
          <p className="mt-2 rounded bg-gray-100 p-2 text-sm">
            {paymentMessage}
          </p>
        )}

        <button
          onClick={downloadPDF}
          disabled={!receipt}
          className="mt-2 w-full rounded bg-purple-600 p-2 text-white disabled:opacity-50"
        >
          Download Receipt PDF
        </button>
      </div>

      {/* RECEIPT */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 p-4">
          <div
            id="receipt-box"
            className="w-[380px] max-w-full rounded bg-white p-4 shadow-lg"
          >
            <div className="mb-3 text-center">
              <h2 className="text-xl font-bold">
                {receipt.store.name}
              </h2>
              <p>{receipt.store.address}</p>
              <p>{receipt.store.phone}</p>
            </div>

            <hr className="my-2" />

            <p>
              <strong>Cashier:</strong> {receipt.cashier}
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
              <strong>Date:</strong> {receipt.date}
            </p>

            <hr className="my-2" />

            {receipt.items.map((item, index) => (
              <div
                key={`${item._id}-${index}`}
                className="flex justify-between gap-2 py-1"
              >
                <span>
                  {item.name} x {item.qty}
                </span>
                <span>
                  KES {Number(item.price) * item.qty}
                </span>
              </div>
            ))}

            <hr className="my-2" />

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>KES {receipt.total.toLocaleString()}</span>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => window.print()}
                className="w-full rounded bg-green-600 p-2 text-white hover:bg-green-700"
              >
                Print Receipt
              </button>

              <button
                onClick={downloadPDF}
                className="w-full rounded bg-purple-600 p-2 text-white hover:bg-purple-700"
              >
                Download PDF
              </button>

              <button
                onClick={() => setReceipt(null)}
                className="w-full rounded bg-gray-600 p-2 text-white hover:bg-gray-700"
              >
                Close Receipt
              </button>

              <button
                onClick={() => {
                  setReceipt(null);
                  setSelectedProduct(null);
                  setCart([]);
                  setPaymentMessage("");
                }}
                className="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700"
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
