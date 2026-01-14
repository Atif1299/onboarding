'use client';

import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CheckoutCancel() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Cancel Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* Cancel Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-orange-600" />
            </div>
          </div>

          {/* Cancel Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Checkout Cancelled
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your payment was cancelled. No charges have been made to your
            account.
          </p>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Why subscribe?
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Exclusive access to your selected county</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Full access to all platform features</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Priority support and dedicated account manager</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Cancel anytime from your account settings</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Need assistance?
          </h3>
          <p className="text-gray-600 mb-4">
            If you're experiencing issues with payment or have questions about
            our subscription plans, we're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/support"
              className="text-blue-600 hover:underline font-medium"
            >
              Contact Support
            </Link>
            <Link
              href="/faq"
              className="text-blue-600 hover:underline font-medium"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
