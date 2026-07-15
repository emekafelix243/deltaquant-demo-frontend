// src/app/purchase/success/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { verifyOrder } from "@/lib/api";

function SuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "error">("checking");
  const [downloadToken, setDownloadToken] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      return;
    }

    let attempts = 0;
    const maxAttempts = 15;

    const poll = async () => {
      try {
        const res = await verifyOrder(reference);
        if (res.data.status === "paid") {
          setStatus("paid");
          setDownloadToken(res.data.download_token);
          return;
        }
      } catch {
        // order not found yet, keep trying
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000);
      } else {
        setStatus("pending");
      }
    };

    poll();
  }, [reference]);

  const downloadUrl = downloadToken
  ? `https://deltaquant-demo-backend.onrender.com/payments/download/${downloadToken}`
  : null;

  const goToDownload = () => {
    if (downloadUrl) {
      window.location.href = downloadUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-lg text-center">
        <div className="flex flex-col items-center gap-3 mb-6">
          <img src="/logo.png" alt="DeltaQuant" className="w-20 h-20 object-contain" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">DeltaQuant POS</h1>
        </div>

        {status === "checking" && (
          <>
            <p className="text-gray-300 text-lg mb-2">Confirming your payment...</p>
            <p className="text-gray-500 text-sm">This usually takes a few seconds.</p>
          </>
        )}

        {status === "paid" && downloadUrl && (
          <>
            <div className="text-green-400 text-4xl mb-3">✓</div>
            <p className="text-white text-lg font-semibold mb-2">Payment confirmed!</p>
            <p className="text-gray-400 text-sm mb-6">
              Your download is ready. This link is valid for 48 hours.
            </p>
            <button
              onClick={goToDownload}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Download DeltaQuant POS
            </button>
          </>
        )}

        {status === "pending" && (
          <>
            <p className="text-yellow-400 text-lg mb-2">Still confirming your payment...</p>
            <p className="text-gray-400 text-sm">
              This is taking longer than expected. If you completed payment, please check your
              email for the download link, or contact support with your reference:{" "}
              <span className="text-gray-300">{reference}</span>
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <p className="text-red-400 text-lg mb-2">Something went wrong</p>
            <p className="text-gray-400 text-sm">
              We couldn&apos;t find your order reference. Please contact support if you completed a payment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      <SuccessContent />
    </Suspense>
  );
}