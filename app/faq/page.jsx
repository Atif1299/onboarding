'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ArrowLeft, HelpCircle } from 'lucide-react';

const faqs = [
  {
    id: 'billing',
    category: 'Billing & Payments',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover) through Stripe. All payments are secure and encrypted.',
      },
      {
        q: 'When will I be charged?',
        a: 'Your card will be charged immediately when you subscribe. Subsequent charges occur monthly on the same day of each month.',
      },
      {
        q: 'Can I get a refund?',
        a: 'We offer a 14-day money-back guarantee for all new subscriptions. Contact support@example.com to request a refund.',
      },
      {
        q: 'How do I update my payment method?',
        a: 'Go to your Account Subscriptions page and click "Manage Billing". You\'ll be redirected to the Stripe Customer Portal where you can update your payment method.',
      },
    ],
  },
  {
    id: 'subscriptions',
    category: 'Managing Subscriptions',
    questions: [
      {
        q: 'How do I cancel my subscription?',
        a: 'Visit your Account Subscriptions page, click "Manage Billing", and select "Cancel Subscription" from the Stripe Customer Portal.',
      },
      {
        q: 'Can I upgrade or downgrade my plan?',
        a: 'Yes! You can change your plan at any time. The price difference will be prorated on your next bill.',
      },
      {
        q: 'What happens when I cancel?',
        a: 'You will retain access until the end of your current billing period. After that, your subscription will not renew.',
      },
      {
        q: 'Can I pause my subscription?',
        a: 'We do not currently offer subscription pausing, but you can cancel and resubscribe at any time.',
      },
    ],
  },
  {
    id: 'counties',
    category: 'County Availability',
    questions: [
      {
        q: 'What does "Available" mean?',
        a: 'An available county has no active subscriptions. You can claim the free trial or subscribe to any paid plan.',
      },
      {
        q: 'What does "Partially Locked" mean?',
        a: 'A partially locked county has an active Basic or Plus subscription. The free trial is taken, but you can still subscribe to any paid plan.',
      },
      {
        q: 'What does "Fully Locked" mean?',
        a: 'A fully locked county has an active Pro (exclusive) subscription. No other subscriptions are available for this county.',
      },
      {
        q: 'Can multiple people subscribe to the same county?',
        a: 'Yes, unless someone has a Pro plan (which grants exclusive access). Basic and Plus plans are non-exclusive.',
      },
    ],
  },
  {
    id: 'plans',
    category: 'Plans & Features',
    questions: [
      {
        q: 'What is the difference between Basic, Plus, and Pro?',
        a: 'Basic includes core software for 1 user. Plus adds advanced analytics and 5 users. Pro includes everything plus exclusive county access, unlimited users, and a dedicated account manager.',
      },
      {
        q: 'What is the free trial?',
        a: 'The free trial gives you 60 free credits to get started. It is non-exclusive and only available once per county.',
      },
      {
        q: 'Can I have multiple subscriptions?',
        a: 'Yes! You can subscribe to multiple counties. Each county requires a separate subscription.',
      },
      {
        q: 'Do plans renew automatically?',
        a: 'Yes, all paid plans renew monthly until cancelled.',
      },
    ],
  },
  {
    id: 'technical',
    category: 'Technical Support',
    questions: [
      {
        q: 'I forgot my password. What do I do?',
        a: 'Click "Forgot Password" on the sign-in page. You will receive an email with instructions to reset your password.',
      },
      {
        q: 'I am not receiving emails',
        a: 'Check your spam folder. Add support@example.com to your contacts. Contact support if the issue persists.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Contact support@example.com to request account deletion. All data will be permanently removed.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes! We use Stripe for payment processing. We never store your credit card information on our servers.',
      },
    ],
  },
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (categoryId, questionIndex) => {
    const key = `${categoryId}-${questionIndex}`;
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions about our service
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category) => (
            <div key={category.id} id={category.id} className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {category.category}
              </h2>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {category.questions.map((item, index) => {
                  const key = `${category.id}-${index}`;
                  const isOpen = openItems[key];

                  return (
                    <div
                      key={index}
                      className={`border-b border-gray-200 last:border-b-0`}
                    >
                      <button
                        onClick={() => toggleItem(category.id, index)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                      >
                        <span className="font-medium text-gray-900 pr-8">
                          {item.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-gray-600">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still need help? */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Still need help?
          </h3>
          <p className="text-gray-600 mb-6">
            Cannot find the answer you are looking for? Our support team is here to help.
          </p>
          <Link
            href="/support"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Contact Support
          </Link>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
