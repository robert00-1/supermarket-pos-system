import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Receipt() {
  const { id } = useParams();

  const [sale, setSale] = useState(null);

  const printRef = useRef();

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/sales/${id}`
        );

        setSale(res.data);

      } catch (error) {
        console.log(error);
      }
    };

    fetchSale();

  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (!sale) {
    return (
      <p className="p-6 text-center">
        Loading receipt...
      </p>
    );
  }
  const downloadPDF = async () => {
  const element = printRef.current;

  const canvas = await html2canvas(element);

  const data = canvas.toDataURL("image/png");

  const pdf = new jsPDF();

  const imgProperties = pdf.getImageProperties(data);

  const pdfWidth = pdf.internal.pageSize.getWidth();

  const pdfHeight =
    (imgProperties.height * pdfWidth) /
    imgProperties.width;

  pdf.addImage(
    data,
    "PNG",
    0,
    0,
    pdfWidth,
    pdfHeight
  );

  pdf.save("receipt.pdf");
};

  return (
    <div className="p-6 flex justify-center bg-gray-100 min-h-screen">

      <div
        ref={printRef}
        className="bg-white p-6 w-[350px] shadow-md print:shadow-none"
      >

        <h1 className="text-xl font-bold text-center">
          SUPER MARKET RECEIPT
        </h1>

        <p className="text-center text-sm mb-4">
          Cashier: {sale.cashier}
        </p>

        <hr />

        <div className="mt-3 space-y-2">

          {sale.items.map((item, index) => (

            <div
              key={index}
              className="flex justify-between text-sm"
            >

              <span>
                {item.name} x{item.quantity}
              </span>

              <span>
                KES {item.price * item.quantity}
              </span>

            </div>

          ))}

        </div>

        <hr className="my-3" />

        <div className="flex justify-between font-bold">

          <span>Total</span>

          <span>
            KES {sale.total}
          </span>

        </div>

        <p className="text-xs text-gray-500 mt-3">
          {new Date(sale.createdAt).toLocaleString()}
        </p>

        <button
          onClick={handlePrint}
          className="bg-black text-white w-full mt-4 p-2 print:hidden"
        >
          Print Receipt
        </button>
        <button
  onClick={downloadPDF}
  className="bg-green-600 text-white w-full mt-3 p-2 rounded"
>
  Download PDF
</button>

      </div>

    </div>
  );
}