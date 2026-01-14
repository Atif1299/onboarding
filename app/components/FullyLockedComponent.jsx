'use client';

import React from 'react';
import { Lock, ArrowLeft } from 'lucide-react';

export default function FullyLockedComponent({ county, onReset }) {
  return (
    <div className="text-center py-4">
      <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-full mb-4">
        <Lock className="h-8 w-8 text-orange-600" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        {county.name} is Locked
      </h2>

      <p className="text-base text-slate-600 max-w-lg mx-auto mb-6">
        Another investor has already secured exclusive rights to this territory.
      </p>

      <div className="bg-slate-50 p-4 rounded-xl max-w-lg mx-auto border border-slate-200 mb-6">
        <h3 className="font-semibold text-slate-900 mb-2">What now?</h3>
        <ul className="text-left text-slate-600 space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Search for neighboring counties that might still be available.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Join the waiting list to be notified if this territory opens up.
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3 px-8 rounded-xl transition-colors hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Search Another County
        </button>

        <div>
          <button className="text-slate-500 text-sm hover:text-slate-700 hover:underline">
            Join Waiting List
          </button>
        </div>
      </div>
    </div>
  );
}
