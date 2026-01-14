'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function Subscriptions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/subscriptions');
    } else if (status === 'authenticated') {
      fetchSubscriptions();
    }
  }, [status, router]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      const data = await response.json();

      if (data.success) {
        setSubscriptions(data.data);
      } else {
        setError(data.error || 'Failed to load subscriptions');
      }
    } catch (err) {
      setError('Failed to load subscriptions');
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        alert('Failed to open billing portal');
      }
    } catch (err) {
      console.error('Portal error:', err);
      alert('Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      past_due: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
      inactive: 'bg-red-100 text-red-800 border-red-200',
    };

    const icons = {
      active: <CheckCircle className="w-4 h-4" />,
      past_due: <AlertCircle className="w-4 h-4" />,
      cancelled: <AlertCircle className="w-4 h-4" />,
      inactive: <AlertCircle className="w-4 h-4" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.inactive}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Subscriptions</h1>
          <p className="mt-2 text-gray-600">
            Manage your county subscriptions and billing information
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* No Subscriptions */}
        {!loading && subscriptions.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No active subscriptions
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't subscribed to any counties yet.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Browse Counties
            </Link>
          </div>
        )}

        {/* Subscriptions List */}
        {subscriptions.length > 0 && (
          <div className="space-y-6">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                        {subscription.county.name}, {subscription.county.state.abbreviation}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {subscription.offer.name} Plan
                      </p>
                    </div>
                    {getStatusBadge(subscription.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-gray-600">Price</p>
                        <p className="font-semibold text-gray-900">
                          ${subscription.offer.price}/month
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-gray-600">Start Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(subscription.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-gray-600">
                          {subscription.status === 'active' ? 'Next Billing' : 'End Date'}
                        </p>
                        <p className="font-semibold text-gray-900">
                          {subscription.stripeCurrentPeriodEnd
                            ? new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString()
                            : new Date(subscription.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {subscription.offer.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {subscription.offer.description}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Manage Billing Button */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Billing Management
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Update your payment method, view invoices, or cancel subscriptions
              </p>
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Opening Portal...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Manage Billing
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
