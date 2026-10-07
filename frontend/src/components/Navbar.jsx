export default function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
      
      <h1 className="text-2xl font-bold text-gray-800">
        Supermarket POS
      </h1>

      <div className="flex items-center gap-4">

        {/* USER INFO */}
        <div className="text-right">
          <p className="font-semibold text-gray-700">
            {user?.name || "Guest"}
          </p>

          <p className="text-sm text-gray-500 capitalize">
            {user?.role || "Cashier"}
          </p>
        </div>

        {/* USER AVATAR */}
        <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold uppercase">
          {user?.name?.charAt(0) || "U"}
        </div>

        {/* LOGOUT */}
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "/";
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Logout
        </button>

      </div>
    </div>
  );
}