'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  CurrencyDollarIcon,
  MapIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/analytics?days=${timeRange}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError(data.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Analytics Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            View subscription metrics and performance data
          </p>
        </div>
        <div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="block rounded-md border-gray-300 focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Subscriptions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-brand-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Subscriptions</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analytics.subscriptions.total}
                    </div>
                    {analytics.subscriptions.change !== 0 && (
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        analytics.subscriptions.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analytics.subscriptions.change > 0 ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 mr-0.5" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-4 w-4 mr-0.5" />
                        )}
                        {Math.abs(analytics.subscriptions.change)}%
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {analytics.subscriptions.active}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Registrations */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Trial Registrations</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {analytics.trials.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue (Placeholder) */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-brand-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Est. Revenue</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    ${analytics.revenue.estimated.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* County Status Distribution */}
      <div className="mb-6 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">County Status Distribution</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Available</span>
              <span className="text-sm font-semibold text-green-600">
                {analytics.counties.available} ({((analytics.counties.available / analytics.counties.total) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded bg-green-200">
              <div
                style={{ width: `${(analytics.counties.available / analytics.counties.total) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
              ></div>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Partially Locked</span>
              <span className="text-sm font-semibold text-yellow-600">
                {analytics.counties.partiallyLocked} ({((analytics.counties.partiallyLocked / analytics.counties.total) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded bg-yellow-200">
              <div
                style={{ width: `${(analytics.counties.partiallyLocked / analytics.counties.total) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
              ></div>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Fully Locked</span>
              <span className="text-sm font-semibold text-red-600">
                {analytics.counties.fullyLocked} ({((analytics.counties.fullyLocked / analytics.counties.total) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded bg-red-200">
              <div
                style={{ width: `${(analytics.counties.fullyLocked / analytics.counties.total) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription by Tier */}
      <div className="mb-6 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Subscriptions by Offer</h3>
        <div className="space-y-4">
          {analytics.subscriptionsByOffer.map((offer) => (
            <div key={offer.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">{offer.name}</span>
                  <span className="ml-2 text-xs text-gray-500">${offer.price}/mo</span>
                </div>
                <span className="text-sm font-semibold text-brand-600">
                  {offer.count} subscriptions
                </span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-brand-200">
                <div
                  style={{ width: `${(offer.count / analytics.subscriptions.total) * 100}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-500"
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top States */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top States by Subscriptions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top States by Subscriptions</h3>
          <div className="space-y-3">
            {analytics.topStates.slice(0, 10).map((state, index) => (
              <div key={state.abbreviation} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                  <span className="text-sm font-medium text-gray-900">{state.name}</span>
                  <span className="ml-2 text-xs text-gray-500">({state.abbreviation})</span>
                </div>
                <span className="text-sm font-semibold text-brand-600">{state.subscriptions}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity (Placeholder) */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Trial Registrations</h3>
          <div className="space-y-3">
            {analytics.recentTrials.length > 0 ? (
              analytics.recentTrials.map((trial) => (
                <div key={trial.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{trial.countyName}</p>
                    <p className="text-xs text-gray-500">{trial.stateName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{new Date(trial.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent trial registrations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
