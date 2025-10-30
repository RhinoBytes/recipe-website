"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  const handlePrint = () => {
    // Expand any collapsed sections before printing
    const collapsedElements = document.querySelectorAll('[aria-expanded="false"]');
    const originalStates: { element: Element; state: string | null }[] = [];
    
    collapsedElements.forEach((el) => {
      originalStates.push({ element: el, state: el.getAttribute('aria-expanded') });
      el.setAttribute('aria-expanded', 'true');
    });

    // Trigger print
    window.print();

    // Restore original states after print
    setTimeout(() => {
      originalStates.forEach(({ element, state }) => {
        if (state !== null) {
          element.setAttribute('aria-expanded', state);
        }
      });
    }, 100);
  };

  return (
    <>
      <button
        onClick={handlePrint}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-highlight text-text hover:bg-highlight-hover rounded-lg font-medium transition-colors print:hidden focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Print recipe"
      >
        <Printer size={20} />
        <span className="hidden sm:inline">Print</span>
      </button>

      <style jsx global>{`
        @media print {
          /* Force light theme colors for print */
          :root,
          :root[data-theme="dark-cottagecore"],
          :root[data-theme="terracotta"] {
            --bg: #ffffff !important;
            --bg-secondary: #ffffff !important;
            --text: #000000 !important;
            --text-secondary: #333333 !important;
            --text-muted: #666666 !important;
            --border: #e5e5e5 !important;
          }

          /* Hide non-essential elements */
          nav,
          header,
          footer,
          .print\\:hidden,
          button,
          [role="button"] {
            display: none !important;
          }

          /* Show only recipe content */
          body {
            background: white !important;
            color: black !important;
            font-size: 12pt;
            line-height: 1.5;
          }

          /* Optimize layout for print */
          .container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Remove shadows and backgrounds */
          .shadow-md,
          .shadow-lg,
          .shadow-sm,
          .shadow-xl {
            box-shadow: none !important;
          }

          .rounded-lg,
          .rounded-2xl,
          .rounded-full,
          .rounded-xl {
            border-radius: 4px !important;
          }

          /* Simplify colors */
          * {
            background: white !important;
            color: black !important;
            border-color: #e5e5e5 !important;
          }

          /* Keep some visual structure */
          .bg-bg-secondary,
          .border {
            border: 1px solid #e5e5e5 !important;
          }

          /* Prevent page breaks within important sections */
          .bg-bg-secondary,
          ol li,
          ul li,
          .space-y-4 > div {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Ensure headings stay with their content */
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid !important;
            break-after: avoid !important;
            font-weight: bold !important;
            margin-top: 1em !important;
            margin-bottom: 0.5em !important;
          }

          /* Better list styling for print */
          ol, ul {
            margin: 0.5em 0 !important;
            padding-left: 2em !important;
          }

          /* Remove transitions and animations */
          * {
            transition: none !important;
            animation: none !important;
          }

          /* Make images print-friendly */
          img {
            max-width: 100% !important;
            height: auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Ensure proper spacing */
          .space-y-4 > * + * {
            margin-top: 1rem !important;
          }

          .space-y-6 > * + * {
            margin-top: 1.5rem !important;
          }

          .space-y-8 > * + * {
            margin-top: 2rem !important;
          }
        }
      `}</style>
    </>
  );
}
