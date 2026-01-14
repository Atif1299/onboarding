import Link from 'next/link';
import { Mail, MessageCircle, Book, ArrowLeft } from 'lucide-react';

export default function Support() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How can we help you?
          </h1>
          <p className="text-lg text-gray-600">
            We're here to assist you with any questions or issues
          </p>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Email Support */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Email Support
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Get help via email within 24 hours
            </p>
            <a
              href="mailto:support@example.com"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
            >
              support@example.com
            </a>
          </div>

          {/* Live Chat */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Live Chat
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Chat with our support team
            </p>
            <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Start Chat
            </button>
          </div>

          {/* Documentation */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Book className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Documentation
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Browse our help articles
            </p>
            <Link
              href="/faq"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              View FAQ
            </Link>
          </div>
        </div>

        {/* Common Topics */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Common Topics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/faq#billing"
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
            >
              <h3 className="font-semibold text-gray-900 mb-1">
                Billing & Payments
              </h3>
              <p className="text-sm text-gray-600">
                Questions about subscriptions and invoices
              </p>
            </Link>

            <Link
              href="/faq#subscriptions"
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
            >
              <h3 className="font-semibold text-gray-900 mb-1">
                Managing Subscriptions
              </h3>
              <p className="text-sm text-gray-600">
                Cancel, upgrade, or modify your plan
              </p>
            </Link>

            <Link
              href="/faq#counties"
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
            >
              <h3 className="font-semibold text-gray-900 mb-1">
                County Availability
              </h3>
              <p className="text-sm text-gray-600">
                Understanding county status and tiers
              </p>
            </Link>

            <Link
              href="/faq#technical"
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
            >
              <h3 className="font-semibold text-gray-900 mb-1">
                Technical Support
              </h3>
              <p className="text-sm text-gray-600">
                Login issues and technical problems
              </p>
            </Link>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Send us a message
          </h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="How can we help?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe your issue or question..."
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
