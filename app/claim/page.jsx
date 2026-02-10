'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Lock, CheckCircle, AlertCircle, Loader2, DollarSign, Package, ArrowRight } from 'lucide-react';

function ClaimPageContent() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { status: 'AVAILABLE' | 'LOCKED', data: ... }
  const [error, setError] = useState('');

  // Auto-check if URL is provided in query params
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam && !result && !loading && !url) {
      const decodedUrl = decodeURIComponent(urlParam);
      setUrl(decodedUrl);
      checkAuction(decodedUrl);
    }
  }, [searchParams]);

  const checkAuction = async (auctionUrl) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/auctions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: auctionUrl }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Failed to check auction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    checkAuction(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative">
          <a href="/" className="absolute left-4 top-4 text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
            ← Back to Home
          </a>
          <h1 className="text-3xl font-bold text-white mb-2">Check Auction Availability</h1>
        </div>

        {/* Main Content */}
        <div className="p-8">

          {/* Search Form */}
          {!result && (
            <form onSubmit={handleCheck} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://hibid.com/catalog/123456/auction-name"
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing Auction...
                  </>
                ) : (
                  'Check Availability'
                )}
              </button>
            </form>
          )}

          {/* Result: AVAILABLE */}
          {result?.status === 'AVAILABLE' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-4">
                {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-2">

                </div> */}
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <span>Auction Available!</span>
                  </h2>

                {/* Auction Details Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left">
                    <h3 className="font-semibold text-slate-900 mb-2 truncate">{result.data.title || 'Auction Details'}</h3>

                    {/* Location Info */}
                    {(result.data.location || result.data.zipCode) && (
                        <div className="text-sm text-slate-500 mb-3 flex items-start gap-2">
                            <div className="mt-0.5"><Search className="h-3 w-3" /></div>
                            <div>
                                {result.data.location && <div>{result.data.location}</div>}
                                {/* {result.data.zipCode && <div className="font-mono text-xs bg-slate-200 inline-block px-1 rounded mt-0.5">Zip: {result.data.zipCode}</div>} */}
                            </div>
                        </div>
                    )}

                    {/* Auctioneer Info (for lot pages) */}
                    {result.data.auctioneer && (
                        <div className="text-sm text-slate-600 mb-2">
                            <span className="font-medium">Auctioneer:</span> {result.data.auctioneer}
                        </div>
                    )}

                    {result.data.auctionName && (
                        <div className="text-sm text-slate-600 mb-3">
                            <span className="font-medium">Auction:</span> {result.data.auctionName}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-200 pt-3">
                        {result.data.itemCount !== null ? (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                    <Package className="h-3 w-3" />
                                    <span>Items</span>
                                </div>
                                <span className="text-xl font-bold text-slate-900">{result.data.itemCount}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                    <Package className="h-3 w-3" />
                                    <span>Items</span>
                                </div>
                                <span className="text-sm text-slate-500">Count unavailable</span>
                            </div>
                        )}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                <DollarSign className="h-3 w-3" />
                                <span>Price</span>
                            </div>
                            <span className="text-xl font-bold text-blue-600">${result.data.price.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Price Breakdown - only show when item count is available */}
                {result.data.breakdown && (
                    <div className="text-sm text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="font-medium text-blue-900 mb-1">Price Breakdown:</p>
                        <div className="flex justify-between">
                            <span>Base (100 items):</span>
                            <span>${result.data.breakdown.basePrice.toFixed(2)}</span>
                        </div>
                        {result.data.breakdown.extraItems > 0 && (
                            <div className="flex justify-between">
                                <span>{result.data.breakdown.extraItems} Extra Items ($0.10/ea):</span>
                                <span>${result.data.breakdown.extraCost.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                )}
              </div>

              {/* Error Message in Result View */}
              {error && (
                <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Redirect Options */}
              <div className="bg-white rounded-xl p-6 space-y-4 shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Select an Option</h3>

                {/* Purchase Option */}
                <button
                  onClick={() => {
                     const targetUrl = `/checkout?offerId=2&countyId=891&auctionUrl=${encodeURIComponent(url)}&mode=single_auction&price=${result.data.price}`;
                     window.location.href = targetUrl;
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-between px-6"
                >
                  <span>Purchase & Lock</span>
                  <span className="bg-blue-800 px-2 py-1 rounded text-sm">${result.data.price.toFixed(2)}</span>
                </button>

                 {/* Free Trial Option */}
                {result.data.isTrialEligible && (
                  <div className="pt-2">
                    <button
                        onClick={() => {
                            const targetUrl = `/checkout?offerId=2&countyId=891&auctionUrl=${encodeURIComponent(url)}&mode=trial`;
                            window.location.href = targetUrl;
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-between px-6"
                    >
                        <span>Start Free Trial</span>
                        <span className="bg-green-800 px-2 py-1 rounded text-sm">Free</span>
                    </button>
                    <p className="text-xs text-slate-500 text-center mt-2">
                        First time users only. Includes 500 credits for your trial auction.
                    </p>
                  </div>
                )}
              </div>

              <div className="text-center">
                <button
                    onClick={() => setResult(null)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-center gap-1 mx-auto"
                >
                    <Search className="h-4 w-4" /> Check another URL
                </button>
              </div>
            </div>
          )}

          {/* Result: LOCKED */}
          {result?.status === 'LOCKED' && (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-2">
                <Lock className="h-8 w-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Auction Locked</h2>
              <p className="text-slate-600">
                This auction has already been claimed by another user.
                <br />
                Exclusivity is guaranteed for the claim holder.
              </p>

              <button
                onClick={() => setResult(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg transition-colors"
              >
                Check another URL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ClaimPageContent />
    </Suspense>
  );
}
