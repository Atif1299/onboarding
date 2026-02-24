'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import Header from '../components/Header';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const offerId = searchParams.get('offerId');
  const countyId = searchParams.get('countyId');

  // New Params for Unified Flow
  const mode = searchParams.get('mode'); // 'trial' | 'single_auction'
  const auctionUrl = searchParams.get('auctionUrl');
  const customPrice = searchParams.get('price');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    phone: '',
    address: '',
  });

  const [offer, setOffer] = useState(null);
  const [county, setCounty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuthOptions, setShowAuthOptions] = useState(true);

  // Fetch offer and county details
  useEffect(() => {
    const fetchDetails = async () => {
      // If Trial or Single Auction, manually construct offer
      if (mode === 'trial') {
          setOffer({
              name: 'Free Trial',
              price: 0,
              description: 'Free trial with 500 credits. No credit card required.'
          });
      } else if (mode === 'single_auction') {
          setOffer({
              name: 'Single Auction Lock',
              price: customPrice ? parseFloat(customPrice) : 0,
              description: 'Exclusive lock for this specific auction.'
          });
      } else if (offerId) {
          // Standard Subscription Flow
          try {
            const offerRes = await fetch(`/api/offers/${offerId}`);
            if (offerRes.ok) {
                const offerData = await offerRes.json();
                setOffer(offerData);
            }
          } catch(err) { console.error(err); }
      }

      if (countyId) {
        try {
          const countyRes = await fetch(`/api/county/${countyId}`);
          if (countyRes.ok) {
            const countyData = await countyRes.json();
            setCounty(countyData);
          }
        } catch (err) {
          console.error('Error fetching county:', err);
        }
      }
    };

    fetchDetails();
  }, [offerId, countyId, mode, customPrice]);

  // Pre-populate form if user is logged in
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        firstName: session.user.firstName || '',
        lastName: session.user.lastName || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
        address: session.user.address || '',
      }));
      setShowAuthOptions(false);
    }
  }, [session]);



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required');
      return false;
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Valid email is required');
      return false;
    }

    if (!formData.phone || !/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Valid phone number is required (at least 10 digits)');
      return false;
    }





    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // For standard subscription, we need offer and county.
    // For trial/single_auction, we just need mode and params.
    if (!mode && (!offerId || !countyId)) {
      setError('Missing offer or county information');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let userId = session?.user?.id;

      // If user is not logged in, create an account first
      if (!session) {
        const registerRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            address: formData.address,
          }),
        });

        const registerData = await registerRes.json();

        if (!registerRes.ok) {
          setError(registerData.error || 'Failed to create account');
          setLoading(false);
          return;
        }

        // We can't sign in automatically anymore since we generated the password
        // But we have the user ID from registration response
        userId = registerData.data.id;

        // Wait a small moment to ensure DB sync if needed
        await new Promise(resolve => setTimeout(resolve, 500));

      } else {
          // Update user profile if information is different
          const updateRes = await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              address: formData.address,
            }),
          });

          if (!updateRes.ok) {
            console.error('Failed to update profile');
          }
        }

        // --- UNIFORM CHECKOUT LOGIC ---

        // A. FREE TRIAL FLOW
        if (mode === 'trial') {
            const claimRes = await fetch('/api/auctions/claim-free', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: auctionUrl,
                    email: formData.email,
                    phone: formData.phone,
                    firstName: formData.firstName,
                    lastName: formData.lastName
                }),
            });
            const claimData = await claimRes.json();
            if (claimData.success && claimData.url) {
                window.location.href = claimData.url;
                return;
            } else {
                throw new Error(claimData.message || 'Trial claim failed');
            }
        }

        // B. SINGLE AUCTION PURCHASE FLOW
        if (mode === 'single_auction') {
             const purchaseRes = await fetch('/api/stripe/checkout-auction', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      url: auctionUrl,
                      email: formData.email,
                      phone: formData.phone,
                      firstName: formData.firstName,
                      lastName: formData.lastName
                  }),
             });
             const purchaseData = await purchaseRes.json();
             if (purchaseData.success && purchaseData.url) {
                 window.location.href = purchaseData.url;
                 return;
             } else {
                 throw new Error(purchaseData.message || 'Purchase failed');
             }
        }

        // C. STANDARD SUBSCRIPTION FLOW (Original)
        const checkoutRes = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offerId: parseInt(offerId),
            countyId: parseInt(countyId),
            userId: userId, // Pass the userId (either from session or new registration)
          }),
        });

        const checkoutData = await checkoutRes.json();

        console.log('Checkout response:', checkoutData);

        if (!checkoutRes.ok) {
          const errorMsg = checkoutData.error || checkoutData.details || 'Failed to create checkout session';
          setError(errorMsg);
          setLoading(false);
          return;
        }

        // Redirect to Stripe checkout
        const redirectUrl = checkoutData.data?.url || checkoutData.url;
        if (!redirectUrl) {
          console.error('No redirect URL in response:', checkoutData);
          setError('Failed to get checkout URL. Please try again.');
          setLoading(false);
          return;
        }

        console.log('Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      } catch (err) {
        console.error('Checkout error:', err);
        setError(err.message || 'An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    if (!mode && (!offerId || !countyId)) {
      return (
        <>
          <Header />
          <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Checkout</h1>
              <p className="text-gray-600 mb-6">Missing offer or county information.</p>
              <Link
                href="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return Home
              </Link>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Complete Your {mode ? 'Order' : 'Subscription'}</h1>
            </div>

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  {/* Auth Options - Only show if not logged in */}
                  {showAuthOptions && status !== 'loading' && !session && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h2 className="text-base font-semibold text-gray-900 mb-2">
                        Already have an account?
                      </h2>
                      <div className="flex gap-3">
                        <Link
                          href={`/auth/signin?callbackUrl=${encodeURIComponent('/checkout?' + searchParams.toString())}`}
                          className="w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                        >
                          Sign In
                        </Link>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        Or continue below to create an account and subscribe
                      </p>
                    </div>
                  )}

                  {/* Welcome message for logged in users */}
                  {session && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-green-800 text-sm">
                        Welcome back, {session.user.firstName || session.user.email}!
                        Please verify your information below.
                      </p>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!!session}
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(123) 456-7890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Address */}
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>



              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : (mode==='trial' ? 'Start Free Trial' : 'Proceed to Payment')}
              </button>

                    <p className="text-xs text-gray-500 text-center">
                      {mode==='trial' ? 'No credit card required for trial.' : 'You will be redirected to Stripe for secure payment processing'}
                    </p>
                  </form>
                </div>

                {/* Cancel Link */}
                <div className="text-center mt-4">
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-gray-900 text-sm"
                  >
                    Cancel and return home
                  </Link>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                  {offer && (county || mode) ? (
                    <div className="space-y-4">
                      {/* Plan Details */}
                      <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{offer.tierLevel === 1 ? 'Rural' : offer.tierLevel === 2 ? 'Suburban' : offer.tierLevel === 3 ? 'Urban' : offer.name} {mode ? '' : 'Plan'}</h3>
                        {(county && mode !== 'trial') && (
                            <p className="text-sm text-gray-600 mt-1">
                            {county.name}, {county.state?.abbreviation}
                            </p>
                        )}
                        {mode === 'single_auction' && (
                            <p className="text-sm text-gray-600 mt-1">Single Auction Lock</p>
                        )}
                      </div>

                      {/* Price Breakdown */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{mode ? 'Payment' : 'Subscription'}</span>
                          <span className="font-medium text-gray-900">
                              ${parseFloat(offer.price).toFixed(2)}
                              {mode ? '' : '/month'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Billing Cycle</span>
                          <span className="font-medium text-gray-900">{mode ? 'One Time' : 'Monthly'}</span>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between">
                          <span className="text-lg font-semibold text-gray-900">Total</span>
                          <span className="text-2xl font-bold text-blue-600">${parseFloat(offer.price).toFixed(2)}</span>
                        </div>
                        {!mode && <p className="text-xs text-gray-500 mt-1">per month, billed monthly</p>}
                      </div>

                      {/* Plan Features */}
                      {offer.description && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">What's Included</h4>
                          <p className="text-sm text-gray-600">{offer.description}</p>
                        </div>
                      )}

                      {/* Security Badge */}
                      <div className="border-t pt-4">
                        <div className="flex items-center text-xs text-gray-500">
                          <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Secure payment powered by Stripe</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading order details...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
