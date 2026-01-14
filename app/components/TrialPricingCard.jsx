'use client';

import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';
import TrialRegistrationForm from './TrialRegistrationForm';

export default function TrialPricingCard({ countyId, countyName, onSuccess }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = (data) => {
    setIsModalOpen(false);
    if (onSuccess) {
      onSuccess(data);
    }
  };

  return (
    <>
      <div className="rounded-xl p-6 md:p-8 border-2 border-green-400 bg-gradient-to-br from-green-50 to-cyan-50 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold text-gray-900">Free Trial</h3>
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            LIMITED
          </span>
        </div>
        <p className="mt-4 text-5xl font-extrabold tracking-tight text-green-600">FREE</p>
        <p className="mt-1 text-sm text-gray-600">No monthly fees</p>
        <ul className="mt-6 space-y-4 text-sm flex-grow">
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-green-500" />
            <span>100 free credits to get started</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-green-500" />
            <span>Pay only a percentage of profits</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-green-500" />
            <span>Non-exclusive access</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-green-500" />
            <span>Access to core features</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-green-500" />
            <span className="text-xs text-gray-500">Available until Pro Plan is claimed</span>
          </li>
        </ul>
        <button
          onClick={handleOpenModal}
          className="mt-8 w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-300 bg-green-600 text-white hover:bg-green-700 flex items-center justify-center"
        >
          Claim Free Trial
        </button>
      </div>

      {/* Trial Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Claim Free Trial - ${countyName}`}
        size="default"
      >
        <TrialRegistrationForm
          countyId={countyId}
          countyName={countyName}
          session={session}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </>
  );
}
