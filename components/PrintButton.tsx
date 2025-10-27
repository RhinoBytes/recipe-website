"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors print:hidden"
      >
        <Printer size={20} />
        Print Recipe
      </button>

      <style jsx global>{`
        @media print {
          /* Hide non-essential elements */
          nav,
          header,
          footer,
          .print\\:hidden {
            display: none !important;
          }

          /* Optimize for print */
          body {
            background: white !important;
          }

          /* Ensure proper page breaks */
          .print\\:break-after {
            page-break-after: always;
          }

          /* Show all content */
          * {
            background: white !important;
            color: black !important;
          }

          /* Simplify shadows and rounded corners */
          .shadow-md,
          .shadow-lg,
          .shadow-sm {
            box-shadow: none !important;
          }

          .rounded-lg,
          .rounded-2xl,
          .rounded-full {
            border-radius: 0 !important;
          }

          /* Better spacing for print */
          .container {
            max-width: 100% !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
