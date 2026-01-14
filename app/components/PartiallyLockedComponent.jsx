'use client';

import React, { useState } from 'react';
import { CheckCircle, Info, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PricingCard = ({
  planName,
  price,
  features,
  isFeatured = false,
  ctaText = "Unlock Access",
  offerId,
  countyId,
  onSubscribe,
  population
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = async () => {
    // Redirect to checkout page with offer and county information
    router.push(`/checkout?offerId=${offerId}&countyId=${countyId}`);
  };

  return (
    <div className={`rounded-xl p-6 border shadow-xl transition-all duration-300 hover:shadow-2xl flex flex-col ${isFeatured ? 'bg-slate-900 text-white border-slate-800' : 'bg-white border-gray-200'}`}>
      <div className="mb-3">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${isFeatured ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}>
          {planName} Tier
        </span>
      </div>

      <h3 className={`text-2xl font-bold ${isFeatured ? 'text-white' : 'text-gray-900'}`}>Exclusive County License</h3>
      <p className={`mt-1 text-xs ${isFeatured ? 'text-gray-400' : 'text-gray-500'}`}>
        Based on population: {population?.toLocaleString()}
      </p>

      <div className="mt-4 flex items-baseline">
        <span className={`text-4xl font-extrabold tracking-tight ${isFeatured ? 'text-white' : 'text-gray-900'}`}>${price}</span>
        <span className={`ml-2 text-lg ${isFeatured ? 'text-gray-400' : 'text-gray-500'}`}>/month</span>
      </div>

      <ul className="mt-5 space-y-2 text-sm flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle className={`w-5 h-5 mr-2 flex-shrink-0 ${isFeatured ? 'text-blue-400' : 'text-blue-600'}`} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={`mt-6 w-full font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${isFeatured ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          ctaText
        )}
      </button>
    </div>
  );
};

export default function PartiallyLockedComponent({ county }) {
  const [error, setError] = useState(null);

  // Determine Tier based on population
  const population = county.population || 0;
  let tierName = 'Rural';
  let price = 95;
  let tierLevel = 1;
  let creditAmount = 250;

  if (population > 500000) {
    tierName = 'Urban';
    price = 399;
    tierLevel = 3;
    creditAmount = 100;
  } else if (population > 50000) {
    tierName = 'Suburban';
    price = 199;
    tierLevel = 2;
    creditAmount = 100;
  } else {
    tierName = 'Rural';
    price = 99;
    tierLevel = 1;
    creditAmount = 100;
  }

  const features = [
    'Exclusive County Rights',
    `${creditAmount} Credits / Month`,
    'Real-time Alerts',
    'Dedicated Account Manager'
  ];

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-2">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-4 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-700">
              Free trials for <span className="font-semibold">{county.name}</span> are fully claimed.
              <br/>
              However, the <strong>Exclusive License</strong> is still available. Lock it now to secure your territory.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="max-w-md mx-auto">
        <PricingCard
          planName={tierName}
          price={price}
          features={features}
          isFeatured={true}
          offerId={tierLevel + 1}
          countyId={county.county_id}
          population={population}
        />
      </div>
    </div>
  );
}
