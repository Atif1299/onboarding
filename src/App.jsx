import React, { useState, useMemo } from 'react';
import { ChevronDown, CheckCircle, XCircle, Info, Search } from 'lucide-react';
import statesCountiesData from './data/us-states-counties.json';

// --- State Names Mapping ---
const STATE_NAMES = {
  "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
  "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia",
  "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois",
  "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana",
  "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
  "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
  "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
  "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon",
  "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota",
  "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia",
  "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"
};

// --- Mock Database for County Status ---
// This simulates checking which plans are active in a county.
// Status: 0 = All available (Free trial), 1 = Paid plan active (No free trial), 2 = Pro plan active (Occupied)
// Generate random statuses for demo purposes
const generateCountyStatuses = () => {
  const statuses = {};
  Object.keys(statesCountiesData).forEach(stateCode => {
    statuses[stateCode] = {};
    statesCountiesData[stateCode].forEach(county => {
      // Randomly assign status: 70% available (0), 20% paid plan active (1), 10% occupied (2)
      const rand = Math.random();
      if (rand < 0.7) statuses[stateCode][county] = 0;
      else if (rand < 0.9) statuses[stateCode][county] = 1;
      else statuses[stateCode][county] = 2;
    });
  });
  return statuses;
};

const countyStatuses = generateCountyStatuses();

// --- Components ---

// A single pricing plan card
const PricingCard = ({ planName, price, features, isFeatured = false, ctaText = "Get Started" }) => (
  <div className={`rounded-xl p-6 md:p-8 border shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col ${isFeatured ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white border-gray-200'}`}>
    <h3 className={`text-2xl font-bold ${isFeatured ? 'text-white' : 'text-gray-900'}`}>{planName}</h3>
    <p className={`mt-4 text-4xl font-extrabold tracking-tight ${isFeatured ? 'text-white' : 'text-gray-900'}`}>{price}</p>
    <p className={`mt-1 text-sm ${isFeatured ? 'text-indigo-200' : 'text-gray-500'}`}>per month</p>
    <ul className="mt-6 space-y-4 text-sm flex-grow">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <CheckCircle className={`w-5 h-5 mr-3 flex-shrink-0 ${isFeatured ? 'text-indigo-300' : 'text-indigo-500'}`} />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <button className={`mt-8 w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-300 ${isFeatured ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
      {ctaText}
    </button>
  </div>
);

// The "Free Trial" banner
const FreeTrialCard = () => (
    <div className="bg-gradient-to-r from-green-50 to-cyan-50 border-2 border-green-400 p-6 md:p-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">EXCLUSIVE OFFER</div>
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Start with our Free Trial</h3>
        <p className="mt-2 text-green-800 text-4xl md:text-5xl font-extrabold tracking-tight">FREE</p>
        <p className="mt-1 text-gray-600">Pay only a percentage of your profits. No monthly fees.</p>
        <p className="mt-4 text-sm text-gray-600">This is a non-exclusive plan perfect for getting started in a new county. This offer is only available until a paid plan is activated in this county.</p>
        <button className="mt-6 w-full md:w-auto bg-green-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300 hover:bg-green-600">
            Start Your Free Trial
        </button>
    </div>
);


// The message shown when a county is occupied
const CountyOccupiedCard = ({ county, onClear }) => (
  <div className="bg-orange-50 border-l-4 border-orange-400 p-6 rounded-r-lg shadow-md text-center max-w-2xl mx-auto">
    <div className="flex justify-center items-center">
      <XCircle className="w-12 h-12 text-orange-500 mr-4" />
      <div>
        <h3 className="text-2xl font-bold text-gray-900">County Occupied</h3>
        <p className="mt-2 text-gray-700">
          The Pro plan for <span className="font-semibold">{county}</span> has been claimed, granting exclusive access.
        </p>
        <p className="mt-2 text-gray-600">
          We recommend exploring a neighboring county to find new opportunities.
        </p>
      </div>
    </div>
    <button
      onClick={onClear}
      className="mt-6 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 hover:bg-indigo-700">
      Search Another County
    </button>
  </div>
);

// The main application component
export default function App() {
  const [selectedState, setSelectedState] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("");
  const [countySearch, setCountySearch] = useState("");
  const [isCountyDropdownOpen, setIsCountyDropdownOpen] = useState(false);

  const handleStateChange = (state) => {
    setSelectedState(state);
    setSelectedCounty("");
    setCountySearch("");
    setIsCountyDropdownOpen(true);
  };

  const handleCountySelect = (county) => {
    setSelectedCounty(county);
    setCountySearch(county);
    setIsCountyDropdownOpen(false);
  };

  const clearSelection = () => {
    setSelectedState("");
    setSelectedCounty("");
    setCountySearch("");
    setIsCountyDropdownOpen(false);
  };

  const countyStatus = useMemo(() => {
    if (!selectedState || !selectedCounty) return null;
    return countyStatuses[selectedState]?.[selectedCounty] ?? null;
  }, [selectedState, selectedCounty]);

  const filteredCounties = useMemo(() => {
    if (!selectedState) return [];
    return statesCountiesData[selectedState].filter(county =>
      county.toLowerCase().includes(countySearch.toLowerCase())
    );
  }, [selectedState, countySearch]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 antialiased">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

        {/* --- Header --- */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Find Your Exclusive County
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
            Select your state and county to see available subscription plans and unlock your potential.
          </p>
        </header>

        {/* --- Selection UI --- */}
        <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* State Selection */}
            <div className="relative">
              <label htmlFor="state-select" className="block text-sm font-medium text-gray-700 mb-2">
                1. Select a State
              </label>
              <select
                id="state-select"
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full pl-4 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg shadow-sm appearance-none"
              >
                <option value="" disabled>Choose a state...</option>
                {Object.entries(STATE_NAMES).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 mt-1 pointer-events-none" />
            </div>

            {/* County Selection */}
            <div className="relative">
               <label htmlFor="county-search" className="block text-sm font-medium text-gray-700 mb-2">
                2. Select a County
              </label>
              <div className="relative">
                 <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="county-search"
                  type="text"
                  placeholder={selectedState ? "Search for a county..." : "Please select a state first"}
                  value={countySearch}
                  onChange={(e) => setCountySearch(e.target.value)}
                  onFocus={() => selectedState && setIsCountyDropdownOpen(true)}
                  disabled={!selectedState}
                  className="w-full pl-10 pr-4 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg shadow-sm disabled:bg-gray-100"
                />
              </div>

              {isCountyDropdownOpen && selectedState && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {filteredCounties.length > 0 ? (
                    filteredCounties.map(county => (
                      <div
                        key={county}
                        onClick={() => handleCountySelect(county)}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-50"
                      >
                        {county}
                      </div>
                    ))
                  ) : (
                    <div className="py-2 px-3 text-gray-500">No counties found.</div>
                  )}
                </div>
              )}
            </div>
          </div>
          {selectedCounty && (
            <div className="text-center mt-4">
              <p className="text-lg font-medium">Selected: <span className="text-indigo-600">{selectedCounty}, {STATE_NAMES[selectedState]}</span></p>
            </div>
          )}
        </div>

        {/* --- Pricing Display Section --- */}
        <div className="mt-16">
          {/* Scenario 0: County is completely available */}
          {countyStatus === 0 && (
            <div className="space-y-8">
              <FreeTrialCard />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
                <PricingCard planName="Basic" price="$49" features={["Access to core software", "Standard support", "1 user license", "Non-exclusive access"]} />
                <PricingCard planName="Plus" price="$99" features={["All Basic features", "Advanced analytics", "Priority support", "5 user licenses", "Non-exclusive access"]} />
                <PricingCard planName="Pro" price="$249" features={["All Plus features", "Exclusive county access", "Dedicated account manager", "Unlimited user licenses", "API access"]} isFeatured={true} ctaText="Claim County"/>
              </div>
            </div>
          )}

          {/* Scenario 1: Paid plan active, no free trial */}
          {countyStatus === 1 && (
            <div>
                 <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                A plan is already active in <span className="font-semibold">{selectedCounty}</span>. The free trial is no longer available.
                            </p>
                        </div>
                    </div>
                </div>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <PricingCard planName="Basic" price="$49" features={["Access to core software", "Standard support", "1 user license", "Non-exclusive access"]} />
                    <PricingCard planName="Plus" price="$99" features={["All Basic features", "Advanced analytics", "Priority support", "5 user licenses", "Non-exclusive access"]} />
                    <PricingCard planName="Pro" price="$249" features={["All Plus features", "Exclusive county access", "Dedicated account manager", "Unlimited user licenses", "API access"]} isFeatured={true} ctaText="Claim County"/>
                </div>
            </div>
          )}

          {/* Scenario 2: Pro plan active, county is occupied */}
          {countyStatus === 2 && (
             <CountyOccupiedCard county={selectedCounty} onClear={clearSelection} />
          )}

          {/* Initial state before county selection */}
          {selectedState && !selectedCounty && (
            <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Please select a county to view pricing options.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
