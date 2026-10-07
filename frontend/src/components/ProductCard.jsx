export default function ProductCard({ product, addToCart }) {
  return (
    <div
      onClick={() => addToCart(product)}
      className="bg-white p-4 rounded shadow cursor-pointer hover:bg-green-50"
    >

      <h2 className="font-bold text-lg">
        {product.name}
      </h2>

      <p className="text-gray-600">
        Barcode: {product.barcode}
      </p>

      <p className="text-green-700 font-bold mt-2">
        KES {product.price}
      </p>

    </div>
  );
}