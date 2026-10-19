
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

  // ADD PRODUCT TO CART
  const addToCart = (product) => {
    setCart((previousCart) => {
      const existing = previousCart.find(
        (item) => item._id === product._id
      );

      if (existing) {
        return previousCart.map((item) =>
          item._id === product._id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [...previousCart, { ...product, qty: 1 }];
    });
  };

  // UPDATE QUANTITY
  const updateQuantity = (productId, change) => {
    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item._id === productId
            ? { ...item, qty: item.qty + change }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  // REMOVE PRODUCT
  const removeFromCart = (productId) => {
    setCart((previousCart) =>
      previousCart.filter((item) => item._id !== productId)
    );
  };

  // TOTAL
  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * item.qty,
    0
  );

  // FORMAT ITEMS FOR BACKEND
  const formattedItems = () =>
    cart.map((item) => ({
      productId: item._id,
      name: item.name,
      quantity: item.qty,
      price: Number(item.price),
    }));

  // CREATE RECEIPT
  const createReceipt = (paymentMethod) => ({
    items: cart.map((item) => ({ ...item })),
    total,
    paymentMethod,
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
      alert("Cart is empty.");
      return;
    }

    if (paymentLoading) return;

    setPaymentLoading(true);
    setPaymentMessage("Processing cash checkout...");

    try {
      await axios.post(`${API}/api/sales/checkout`, {
        items: formattedItems(),
        paymentMethod: "cash",
        cashier: user?.name || "Unknown Cashier",
        customerName,
        customerPhone,
      });

      setReceipt(createReceipt("Cash"));
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMessage("");
    } catch (error) {
      console.error("Cash checkout failed:", error);
      setPaymentMessage(
        error.response?.data?.message ||
          "Checkout failed. Please check the backend."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // MPESA PAYMENT
  const handleMpesaPayment = async () => {
    if (cart.length === 0) {
      alert("Cart is empty.");
      return;
    }

    if (!customerPhone.trim()) {
      alert("Enter the customer's M-Pesa phone number.");
      return;
    }

    if (paymentLoading) return;

    setPaymentLoading(true);
    setPaymentMessage("Sending STK Push...");

    let interval;

    try {
      const response = await axios.post(
        `${API}/api/mpesa/stkpush`,
        {
          phone: customerPhone.trim(),
          amount: total,
          items: formattedItems(),
        }
      );

      const checkoutId = response.data.checkoutRequestId;

      if (!checkoutId) {
        throw new Error(
          response.data.message ||
            "No checkout request ID was returned."
        );
      }

      setPaymentMessage(
        "STK Push sent. Enter your M-Pesa PIN."
      );

      let attempts = 0;
      const maxAttempts = 15;

      interval = setInterval(async () => {
        attempts += 1;

        try {
          const res = await axios.get(
            `${API}/api/mpesa/status/${encodeURIComponent(checkoutId)}`
          );

          if (res.data.status === "paid") {
            clearInterval(interval);
            interval = null;

            setReceipt(createReceipt("M-Pesa"));
            setCart([]);
            setCustomerName("");
            setCustomerPhone("");
            setPaymentMessage("Payment successful!");
            setPaymentLoading(false);
            return;
          }

          if (res.data.status === "failed") {
            clearInterval(interval);
            interval = null;

            setPaymentMessage(
              "Payment failed. Please try again."
            );
            setPaymentLoading(false);
            return;
          }

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            interval = null;

            setPaymentMessage(
              "Payment is still pending. Confirm the transaction before retrying."
            );
            setPaymentLoading(false);
          }
        } catch (error) {
          console.error("M-Pesa status check failed:", error);

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            interval = null;

            setPaymentMessage(
              "Could not confirm payment status. Check the transaction before retrying."
            );
            setPaymentLoading(false);
          }
        }
      }, 3000);
    } catch (error) {
      if (interval) clearInterval(interval);

      console.error("M-Pesa request failed:", error);
      setPaymentMessage(
        error.response?.data?.message ||
          error.message ||
          "M-Pesa request failed."
      );
      setPaymentLoading(false);
    }
  };

  // DOWNLOAD RECEIPT PDF
  const downloadPDF = async () => {
    const element = document.getElementById("receipt-box");

    if (!element || !receipt) {
      alert("Complete a sale and open its receipt first.");
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const data = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pageWidth - 20;
      const imageHeight =
        (canvas.height * imageWidth) / canvas.width;

      const finalHeight = Math.min(
        imageHeight,
        pageHeight - 20
      );

      pdf.addImage(
        data,
        "PNG",
        10,
        10,
        imageWidth,
        finalHeight
      );

      pdf.save("roberto-supermarket-receipt.pdf");
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("Could not create the receipt PDF.");
    }
  };

  return (
    <div className="flex h-screen w-full flex-row overflow-hidden bg-gray-100">

      {/* LEFT: PRODUCT PREVIEW */}
      <aside className="h-full w-1/4 shrink-0 overflow-y-auto border-r bg-white p-4">
        <h2 className="mb-4 text-lg font-bold">
          Product Preview
        </h2>

        {selectedProduct ? (
          <div>
            <img
              src={getImageUrl(selectedProduct.image)}
              alt={selectedProduct.name}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/placeholder.png";
              }}
              className="h-48 w-full rounded-lg object-cover"
            />

            <h3 className="mt-3 text-lg font-semibold">
              {selectedProduct.name}
            </h3>

            <p className="mt-1 text-green-700 font-bold">
              KES {Number(selectedProduct.price).toLocaleString()}
            </p>

            {selectedProduct.description && (
              <p className="mt-2 text-sm text-gray-600">
                {selectedProduct.description}
              </p>
            )}

            <button
              onClick={() => addToCart(selectedProduct)}
              disabled={paymentLoading}
              className="mt-4 w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Add Another
            </button>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-100 p-6 text-center text-gray-500">
            Select a product to preview it here.
          </div>
        )}
      </aside>

      {/* CENTER: PRODUCTS */}
      <main className="h-full min-w-0 flex-1 overflow-y-auto p-4">
        <h2 className="mb-4 text-xl font-bold">
          Products
        </h2>

        {/* CUSTOMER DETAILS */}
        <div className="mb-5 flex flex-col gap-2 xl:flex-row">
          <input
            type="text"
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={(event) =>
              setCustomerName(event.target.value)
            }
            className="min-w-0 flex-1 rounded-lg border p-2"
          />

          <input
            type="tel"
            placeholder="2547XXXXXXXX"
            value={customerPhone}
            onChange={(event) =>
              setCustomerPhone(event.target.value)
            }
            className="min-w-0 flex-1 rounded-lg border p-2"
          />
        </div>

        {productsLoading && (
          <p className="rounded bg-white p-4">
            Loading products...
          </p>
        )}

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

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <button
              type="button"
              key={product._id}
              disabled={paymentLoading}
              onClick={() => {
                setSelectedProduct(product);
                addToCart(product);
              }}
              className={`rounded-lg border bg-white p-2 text-left shadow-sm transition hover:border-blue-500 hover:shadow-md disabled:opacity-50 ${
                selectedProduct?._id === product._id
                  ? "border-blue-600 ring-2 ring-blue-200"
                  : "border-gray-200"
              }`}
            >
              <img
                src={getImageUrl(product.image)}
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/placeholder.png";
                }}
                className="h-24 w-full rounded-md object-cover"
              />

              <p className="mt-2 font-semibold">
                {product.name}
              </p>

              <p className="mt-1 text-sm font-bold text-green-700">
                KES {Number(product.price).toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-blue-600">
                Click to add
              </p>
            </button>
          ))}
        </div>
      </main>

      {/* RIGHT: CHECKOUT */}
      <aside className="h-full w-1/3 shrink-0 overflow-y-auto border-l bg-white p-4">
        <h2 className="mb-4 text-xl font-bold">
          Checkout
        </h2>

        {cart.length === 0 ? (
          <p className="rounded bg-gray-100 p-4 text-gray-500">
            Your cart is empty.
          </p>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item._id}
                className="border-b pb-3"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium">
                    {item.name}
                  </span>

                  <button
                    type="button"
                    disabled={paymentLoading}
                    onClick={() => removeFromCart(item._id)}
                    className="text-sm text-red-600 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={paymentLoading}
                      onClick={() => updateQuantity(item._id, -1)}
                      className="h-8 w-8 rounded border disabled:opacity-50"
                    >
                      −
                    </button>

                    <span className="min-w-5 text-center">
                      {item.qty}
                    </span>

                    <button
                      type="button"
                      disabled={paymentLoading}
                      onClick={() => updateQuantity(item._id, 1)}
                      className="h-8 w-8 rounded border disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <span className="font-semibold">
                    KES{" "}
                    {(
                      Number(item.price) * item.qty
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="my-5 border-t pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>KES {total.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || paymentLoading}
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cash Checkout
        </button>

        <button
          onClick={handleMpesaPayment}
          disabled={paymentLoading || cart.length === 0}
          className="mt-3 w-full rounded-lg bg-green-600 p-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {paymentLoading ? "Processing..." : "Pay with M-Pesa"}
        </button>

        {paymentMessage && (
          <p className="mt-3 break-words rounded-lg bg-gray-100 p-3 text-sm">
            {paymentMessage}
          </p>
        )}

        <button
          onClick={downloadPDF}
          disabled={!receipt}
          className="mt-3 w-full rounded-lg bg-purple-600 p-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Download Receipt PDF
        </button>
      </aside>

      {/* RECEIPT MODAL */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div
            id="receipt-box"
            className="my-auto w-[380px] max-w-full rounded-lg bg-white p-5 shadow-xl"
          >
            <div className="mb-3 text-center">
              <h2 className="text-xl font-bold">
                {receipt.store.name}
              </h2>
              <p>{receipt.store.address}</p>
              <p>{receipt.store.phone}</p>
            </div>

            <hr className="my-3" />

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

            <p>
              <strong>Payment:</strong> {receipt.paymentMethod}
            </p>

            <hr className="my-3" />

            {receipt.items.map((item, index) => (
              <div
                key={`${item._id}-${index}`}
                className="flex justify-between gap-3 py-1 text-sm"
              >
                <span>
                  {item.name} × {item.qty}
                </span>

                <span className="shrink-0">
                  KES{" "}
                  {(
                    Number(item.price) * item.qty
                  ).toLocaleString()}
                </span>
              </div>
            ))}

            <hr className="my-3" />

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>
                KES {receipt.total.toLocaleString()}
              </span>
            </div>

            <div className="mt-5 space-y-2">
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
