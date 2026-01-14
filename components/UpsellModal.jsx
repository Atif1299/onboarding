'use client';

import { Lock, Zap, Check } from 'lucide-react';

export default function UpsellModal({ isOpen, onClose, county, currentAuction }) {
  if (!isOpen) return null;

  const features = [
    'Analyze unlimited auctions in this county',
    'Access all counties nationwide',
    'Advanced analytics & reports',
    'Priority support',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <Lock className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Upgrade to Unlock More
          </h3>
          <p className="mt-2 text-gray-600">
            You're currently locked to your claimed auction.
            {currentAuction && (
              <span className="block mt-1 text-sm">
                Currently analyzing: <strong>{currentAuction.title || 'Your claimed auction'}</strong>
              </span>
            )}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-gray-900">County License</span>
          </div>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900">$95</span>
              <span className="text-sm text-gray-500">/month</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <a
            href={`/checkout?offerId=2&countyId=${county?.id || ''}`}
            className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Upgrade to {county?.name || 'County'} License
          </a>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Stay with Free Plan
          </button>
        </div>

        <p className="mt-4 text-xs text-center text-gray-500">
          Cancel anytime. No long-term commitment.
        </p>
      </div>
    </div>
  );
}
