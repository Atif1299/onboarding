'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Search, Lock, Unlock, Calendar, ExternalLink } from 'lucide-react';

export default function CountyLandingPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const [county, setCounty] = useState(null);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auction check state
  const [auctionUrl, setAuctionUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  // Claim modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimData, setClaimData] = useState({ email: '', phone: '', firstName: '', lastName: '' });
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);

  // Get UTM params for tracking
  const utmSource = searchParams.get('utm_source');
  const utmCampaign = searchParams.get('utm_campaign');

  useEffect(() => {
    fetchCountyData();
  }, [params.state, params.slug]);

  async function fetchCountyData() {
    try {
      setLoading(true);

      // Fetch county by state abbreviation and slug
      const stateAbbr = params.state?.toUpperCase();
      const countySlug = params.slug?.replace(/-/g, ' ');

      // Get all states and find matching county
      const statesRes = await fetch('/api/states');
      const statesData = await statesRes.json();

      if (!statesData.success) {
        setError('Failed to load states');
        return;
      }

      const state = statesData.data.find(s => s.abbreviation === stateAbbr);
      if (!state) {
        setError('State not found');
        return;
      }

      // Get counties for this state
      const countiesRes = await fetch(`/api/counties/${state.state_id}`);
      const countiesData = await countiesRes.json();

      if (!countiesData.success) {
        setError('Failed to load counties');
        return;
      }

      // Find county by name (case-insensitive)
      const foundCounty = countiesData.data.find(
        c => c.name.toLowerCase() === countySlug?.toLowerCase()
      );

      if (!foundCounty) {
        setError('County not found');
        return;
      }

      setCounty({
        id: foundCounty.county_id,
        name: foundCounty.name,
        status: foundCounty.status,
        state: state.name,
        stateAbbr: state.abbreviation
      });

      // Fetch auctions for this county
      const auctionsRes = await fetch(`/api/auctions/${foundCounty.county_id}`);
      const auctionsData = await auctionsRes.json();

      if (auctionsData.success) {
        setAuctions(auctionsData.auctions || []);
      }

    } catch (err) {
      console.error('Error fetching county data:', err);
      setError('Failed to load county data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckAvailability(e) {
    e.preventDefault();

    if (!auctionUrl.trim()) return;

    setChecking(true);
    setCheckResult(null);

    try {
      const res = await fetch('/api/auctions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionUrl: auctionUrl.trim(),
          countyId: county.id
        })
      });

      const data = await res.json();
      setCheckResult(data);

      if (data.success && data.available) {
        setShowClaimModal(true);
      }

    } catch (err) {
      setCheckResult({ success: false, error: 'Failed to check availability' });
    } finally {
      setChecking(false);
    }
  }

  async function handleClaim(e) {
    e.preventDefault();

    if (!claimData.email) return;

    setClaiming(true);
    setClaimResult(null);

    try {
      const res = await fetch('/api/auctions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...claimData,
          auctionId: checkResult.auctionId,
        })
      });

      const data = await res.json();
      setClaimResult(data);

      if (data.success) {
        // Refresh auctions list
        fetchCountyData();
      }

    } catch (err) {
      setClaimResult({ success: false, error: 'Failed to claim auction' });
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {county?.name} County, {county?.stateAbbr}
          </h1>
          <p className="mt-2 text-gray-600">
            Check auction availability and lock your exclusive access
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Check Auction Availability
          </h2>

          <form onSubmit={handleCheckAvailability} className="space-y-4">
            <div>
              <label htmlFor="auctionUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Paste HiBid Lot URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="auctionUrl"
                  value={auctionUrl}
                  onChange={(e) => setAuctionUrl(e.target.value)}
                  placeholder="https://hibid.com/lot/12345"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <Search className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={checking || !auctionUrl.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {checking ? 'Checking...' : 'Check Availability'}
            </button>
          </form>

          {/* Check Result */}
          {checkResult && !checkResult.available && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-700">
                  {checkResult.message || checkResult.error}
                </span>
              </div>
              <p className="mt-2 text-sm text-red-600">
                Join the waiting list to be notified when this auction becomes available.
              </p>
            </div>
          )}
        </div>

        {/* Upcoming Auctions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Auctions in {county?.name} County
          </h2>

          {auctions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No upcoming auctions found. Check back later or paste a HiBid URL above.
            </p>
          ) : (
            <div className="space-y-4">
              {auctions.map((auction) => (
                <div
                  key={auction.id}
                  className={`p-4 border rounded-lg ${
                    auction.available
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {auction.available ? (
                          <Unlock className="h-4 w-4 text-green-600" />
                        ) : (
                          <Lock className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${
                          auction.available ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {auction.available ? 'Available' : 'Claimed'}
                        </span>
                      </div>

                      <h3 className="mt-2 font-medium text-gray-900">
                        {auction.title || 'Untitled Auction'}
                      </h3>

                      {auction.auctionDate && (
                        <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {new Date(auction.auctionDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <a
                      href={auction.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {auction.available && (
                    <button
                      onClick={() => {
                        setAuctionUrl(auction.url);
                        setCheckResult({ success: true, available: true, auctionId: auction.id });
                        setShowClaimModal(true);
                      }}
                      className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Lock This Auction
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            {claimResult?.success ? (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <Unlock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Auction Locked!
                </h3>
                <p className="text-gray-600 mb-4">
                  You now have exclusive access to analyze this auction.
                  You've received <strong>500 free credits</strong> to get started.
                </p>
                {claimResult.data?.tempPassword && (
                  <div className="bg-gray-100 p-3 rounded-md mb-4">
                    <p className="text-sm text-gray-600">Your temporary password:</p>
                    <p className="font-mono font-medium">{claimResult.data.tempPassword}</p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowClaimModal(false);
                    setClaimResult(null);
                    setAuctionUrl('');
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700"
                >
                  Start Analyzing
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Lock This Auction
                </h3>

                <form onSubmit={handleClaim} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={claimData.email}
                      onChange={(e) => setClaimData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={claimData.phone}
                      onChange={(e) => setClaimData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={claimData.firstName}
                        onChange={(e) => setClaimData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={claimData.lastName}
                        onChange={(e) => setClaimData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {claimResult?.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{claimResult.error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowClaimModal(false);
                        setClaimResult(null);
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={claiming || !claimData.email}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {claiming ? 'Locking...' : 'Lock & Get 500 Credits'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
