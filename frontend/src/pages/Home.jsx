import { Link } from "react-router-dom";

export default function Home() {
return ( <div className="min-h-screen bg-gray-950 text-white">
{/* Navigation */} <nav className="flex items-center justify-between px-6 py-5 md:px-16"> <Link to="/" className="text-2xl font-extrabold"> <span className="text-yellow-400">Super</span>Mart </Link>

```
    <Link
      to="/login"
      className="rounded-lg border border-yellow-400 px-5 py-2 font-semibold text-yellow-400 hover:bg-yellow-400 hover:text-gray-950"
    >
      Login
    </Link>
  </nav>

  {/* Hero Banner */}
  <section
    className="relative flex min-h-[75vh] items-center bg-cover bg-center px-6 py-16 md:px-16"
    style={{
      backgroundImage:
        "linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.78)), url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2000&q=85')",
    }}
  >
    <div className="max-w-3xl">
      <p className="mb-4 font-bold uppercase tracking-[0.25em] text-yellow-400">
        Smart Shopping. Simple Management.
      </p>

      <h1 className="mb-6 text-5xl font-extrabold leading-tight md:text-7xl">
        Welcome to <span className="text-yellow-400">SuperMart</span>
      </h1>

      <p className="mb-8 max-w-2xl text-lg leading-8 text-gray-200 md:text-xl">
        Your complete supermarket management solution. Manage products,
        track inventory, process sales, monitor payments, and keep your
        business running smoothly in one place.
      </p>

      <div className="flex flex-wrap gap-4">
        <Link
          to="/register"
          className="rounded-lg bg-yellow-400 px-7 py-4 font-bold text-gray-950 transition hover:bg-yellow-300"
        >
          Register as Admin
        </Link>

        <Link
          to="/login"
          className="rounded-lg border-2 border-white px-7 py-4 font-bold text-white transition hover:bg-white hover:text-gray-950"
        >
          Login as Admin
        </Link>
      </div>
    </div>
  </section>

  {/* Features */}
  <section className="grid gap-8 px-6 py-14 md:grid-cols-3 md:px-16">
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-3 text-xl font-bold text-yellow-400">
        Product Management
      </h2>
      <p className="text-gray-300">
        Manage products, prices, stock levels, and inventory.
      </p>
    </div>

    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-3 text-xl font-bold text-yellow-400">
        Sales & Payments
      </h2>
      <p className="text-gray-300">
        Process customer purchases and track sales transactions.
      </p>
    </div>

    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-3 text-xl font-bold text-yellow-400">
        Business Reports
      </h2>
      <p className="text-gray-300">
        Monitor your ledger and keep track of your business performance.
      </p>
    </div>
  </section>

  <footer className="border-t border-gray-800 px-6 py-6 text-center text-sm text-gray-400">
    © {new Date().getFullYear()} SuperMart POS. All rights reserved.
  </footer>
</div>


);
}
