'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, CheckCircle, AlertCircle, ArrowRight, Gavel, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AvailableComponent from './components/AvailableComponent';
import PartiallyLockedComponent from './components/PartiallyLockedComponent';
import FullyLockedComponent from './components/FullyLockedComponent';

export default function Home() {
  const router = useRouter();
  const [states, setStates] = useState([]);
  const [counties, setCounties] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [countySearch, setCountySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [countyStatus, setCountyStatus] = useState(null);
  const [error, setError] = useState('');
  const [auctionUrl, setAuctionUrl] = useState('');

  // Dropdown visibility state
  const [showCountyDropdown, setShowCountyDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchStates();

    // Click outside listener to close dropdown
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountyDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchStates = async () => {
    try {
      const res = await fetch('/api/states');
      const data = await res.json();
      if (data.success) {
        setStates(data.data);
      } else {
        setError('Failed to load states');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  const handleStateChange = async (e) => {
    const stateId = e.target.value;
    setSelectedState(stateId);
    setSelectedCounty('');
    setCountyStatus(null);
    setCounties([]);
    setCountySearch('');

    if (stateId) {
      setLoading(true);
      try {
        const res = await fetch(`/api/counties/${stateId}`);
        const data = await res.json();
        if (data.success) {
          setCounties(data.data);
        }
      } catch (err) {
        setError('Failed to load counties');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCountySelect = async (county) => {
    setSelectedCounty(county);
    setCountySearch(county.name);
    setShowCountyDropdown(false);
    setStatusLoading(true);
    setCountyStatus(null);

    try {
      const res = await fetch(`/api/county-status/${county.county_id}`);
      const data = await res.json();
      if (data.success) {
        setCountyStatus(data.data);
      }
    } catch (err) {
      setError('Failed to check county status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAuctionCheck = (e) => {
    e.preventDefault();
    if (auctionUrl) {
      router.push(`/claim?url=${encodeURIComponent(auctionUrl)}`);
    }
  };

  const closeModal = () => {
    setCountyStatus(null);
    // Optional: Clear selection if desired, but keeping it allows re-opening or context
  };

  const filteredCounties = counties.filter(county =>
    county.name.toLowerCase().includes(countySearch.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Compact Header */}
      <header className="bg-white shadow-sm py-3 px-6 flex justify-center shrink-0">
        <div className="relative w-40 h-10">
          <Image
            src="/images/bidsquire-logo.png"
            alt="BidSquire Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-6 md:gap-8 items-start">

          {/* Left Column: Auction URL (PLG) */}
          <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-8 md:p-10 h-full flex flex-col justify-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-blue-600/20 rounded-full mb-4">
                <Gavel className="h-8 w-8 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Check Auction Availability</h1>
              <p className="text-slate-300">
                Found a HiBid lot? Paste the URL to instantly check if it's available for exclusive claiming.
              </p>
            </div>

            <form onSubmit={handleAuctionCheck} className="space-y-4">
              <div className="relative">
                <ExternalLink className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://hibid.com/lot/..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={auctionUrl}
                  onChange={(e) => setAuctionUrl(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                Check Availability
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 text-sm text-slate-400">
              <p>Lock your territory before someone else does.</p>
            </div>
          </div>

          {/* Right Column: County Search (Existing) */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-10 h-full">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-slate-100 rounded-full mb-4">
                <MapPin className="h-8 w-8 text-slate-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Search by Location</h2>
              <p className="text-slate-600">
                Browse available territories by state and county to find your next opportunity.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* State Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">1. Select State</label>
                <div className="relative">
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500 outline-none transition-shadow cursor-pointer"
                    value={selectedState}
                    onChange={handleStateChange}
                  >
                    <option value="">Choose a state...</option>
                    {states.map(state => (
                      <option key={state.state_id} value={state.state_id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* County Selection */}
              <div className="space-y-2" ref={dropdownRef}>
                <label className="block text-sm font-medium text-slate-700">2. Select County</label>
                <div className="relative">
                  <div className="absolute left-4 top-4 text-slate-400">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-12 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={selectedState ? "Search or select county..." : "Select a state first"}
                    disabled={!selectedState}
                    value={countySearch}
                    onChange={(e) => {
                      setCountySearch(e.target.value);
                      setSelectedCounty('');
                      setCountyStatus(null);
                      setShowCountyDropdown(true);
                    }}
                    onFocus={() => {
                      if (selectedState) setShowCountyDropdown(true);
                    }}
                  />

                  {/* Clear Button */}
                  {countySearch && (
                    <button
                      onClick={() => {
                        setCountySearch('');
                        setSelectedCounty('');
                        setCountyStatus(null);
                      }}
                      className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
                      type="button"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}

                  {/* Dropdown Results */}
                  {showCountyDropdown && !selectedCounty && counties.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {filteredCounties.length > 0 ? (
                        filteredCounties.map(county => (
                          <button
                            key={county.county_id}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between group border-b border-slate-50 last:border-0"
                            onClick={() => handleCountySelect(county)}
                          >
                            <span className="text-slate-700 group-hover:text-slate-900 font-medium">{county.name}</span>
                            {county.status === 'available' && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Available</span>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-slate-500 text-center">No counties found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Loading State */}
            {statusLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-slate-500">Checking availability...</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Result Modal */}
      {countyStatus && !statusLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">

            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
            >
              <X className="h-6 w-6 text-slate-600" />
            </button>

            <div className="p-6 md:p-8">
              {countyStatus.status === 'available' && (
                <AvailableComponent county={countyStatus} />
              )}
              {countyStatus.status === 'partially_locked' && (
                <PartiallyLockedComponent county={countyStatus} />
              )}
              {countyStatus.status === 'fully_locked' && (
                <FullyLockedComponent county={countyStatus} onReset={closeModal} />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
