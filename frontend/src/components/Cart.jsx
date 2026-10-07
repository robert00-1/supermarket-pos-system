export default function Cart({ cart }) {

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="bg-white rounded shadow p-4">

      <h2 className="text-2xl font-bold mb-4">
        Cart
      </h2>

      {
        cart.length === 0 ? (
          <p>No items selected</p>
        ) : (
          cart.map((item, index) => (
            <div
              key={index}
              className="border-b py-2 flex justify-between"
            >
              <span>
                {item.name} x{item.quantity}
              </span>

              <span>
                KES {item.price * item.quantity}
              </span>
            </div>
          ))
        )
      }

      <div className="mt-6 text-xl font-bold flex justify-between">

        <span>Total</span>

        <span>
          KES {total}
        </span>

      </div>

      <button className="bg-green-600 text-white w-full py-3 rounded mt-6">
        Checkout
      </button>

    </div>
  );
}