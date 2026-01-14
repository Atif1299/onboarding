'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapIcon,
  BuildingOfficeIcon,
  TagIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    states: { total: 0 },
    counties: {
      total: 0,
      available: 0,
      partially_locked: 0,
      fully_locked: 0
    },
    offers: { total: 0 },
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching dashboard stats...');
      const response = await fetch('/api/admin/dashboard-stats');
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setStats(data.data);
        console.log('Stats updated:', data.data);
      } else {
        console.error('Failed to fetch dashboard stats:', data.error);
        setError(data.error || 'Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.message || 'An error occurred while fetching dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button
            onClick={fetchDashboardStats}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to the Admin Dashboard
          </h2>
          <p className="text-sm text-gray-600">
            Monitor and manage your states, counties, and offers from this central dashboard.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* States Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total States
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.states.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/admin/states" className="font-medium text-blue-700 hover:text-blue-900">
                Manage states
              </a>
            </div>
          </div>
        </div>

        {/* Counties Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Counties
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.counties.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/admin/counties" className="font-medium text-green-700 hover:text-green-900">
                Manage counties
              </a>
            </div>
          </div>
        </div>

        {/* Offers Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TagIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Offers
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.offers.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/admin/offers" className="font-medium text-purple-700 hover:text-purple-900">
                Manage offers
              </a>
            </div>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Analytics
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    View Reports
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/admin/analytics" className="font-medium text-orange-700 hover:text-orange-900">
                View analytics
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* County Status Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            County Status Overview
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.counties.available}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ExclamationCircleIcon className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Partially Locked</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.counties.partially_locked}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <XCircleIcon className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Fully Locked</p>
                <p className="text-2xl font-bold text-red-600">{stats.counties.fully_locked}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/admin/counties?status=available"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              View Available Counties
            </a>
            <a
              href="/admin/counties?status=partially_locked"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
            >
              View Partially Locked
            </a>
            <a
              href="/admin/counties?status=fully_locked"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              View Fully Locked
            </a>
            <a
              href="/admin/offers/new"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Create New Offer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}