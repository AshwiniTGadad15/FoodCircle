import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Mail, MessageSquare, Send } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { useApp } from '../context/AppContext.tsx';

const FAQS = [
  {
    q: 'How does FoodCircle verify that shared food is safe to eat?',
    a: 'Every donor must provide preparation timestamps, storage instructions, allergen details, and sign a mandatory food safety declaration. Any listing past its Best Before deadline is automatically hidden from Explore Food, and users can immediately flag questionable listings.',
  },
  {
    q: 'Can restaurants, bakeries, and caterers schedule regular surplus sharing?',
    a: 'Yes. Businesses can register under the Restaurant / Business role, add their kitchen profile, and post daily or event surplus with bulk serving counts so verified NGOs and neighborhood volunteers can coordinate timely pickups.',
  },
  {
    q: 'How are multiple requests handled so food is not double-booked?',
    a: 'FoodCircle uses atomic quantity locking on the server. When a donor accepts a request, the requested quantity is immediately deducted from available stock. Once remaining quantity reaches zero, the listing automatically switches to Reserved.',
  },
  {
    q: 'How do NGOs get verified on FoodCircle?',
    a: 'Register with the NGO / Organization role, complete your organization profile with your registration number and daily capacity inside the Dashboard, and our Admin team will review and verify your organization.',
  },
  {
    q: 'How do volunteer deliveries work?',
    a: 'When a food seeker or NGO selects Volunteer Delivery and the donor accepts the request, an open delivery task appears in the Volunteer Hub showing pickup and dropoff addresses. A volunteer claims the task and updates progress step-by-step until delivered.',
  },
];

export function SupportPage() {
  const { user, showToast } = useApp();

  const [formType, setFormType] = useState<'contact' | 'issue' | 'feedback'>('contact');
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedNote, setSubmittedNote] = useState<string | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmittedNote(null);
    try {
      const res = await apiRequest<{ message: string }>('/support', {
        method: 'POST',
        body: { type: formType, name, email, subject, message },
      });
      setSubmittedNote(res.message);
      setSubject('');
      setMessage('');
      showToast('Support submission saved.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to submit message.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-medium text-[#16834A]">Contact & Support</p>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#202820] tracking-tight">
          Help Center & Community Support
        </h1>
        <p className="text-base text-[#526054]">
          Have a question about safe food sharing, NGO onboarding, or need to report an issue? Reach
          out to our team or browse the FAQ below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Multi-purpose Contact / Issue / Feedback Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8E0] p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8E0] pb-4">
            <h2 className="font-display text-xl font-bold text-[#202820] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#16834A]" />
              Send a Message
            </h2>
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F1F5F0]">
              {(
                [
                  { id: 'contact', label: 'Contact Us' },
                  { id: 'issue', label: 'Report an Issue' },
                  { id: 'feedback', label: 'Feedback' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormType(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    formType === tab.id ? 'bg-white text-[#16834A] shadow-xs' : 'text-[#526054]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {submittedNote && (
            <div className="p-4 rounded-xl bg-[#EFFAF3] border border-[#C6E8D2] text-sm text-[#16834A] font-medium">
              {submittedNote}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={
                  formType === 'issue'
                    ? 'Briefly describe the issue or listing concern'
                    : formType === 'feedback'
                      ? 'Feature suggestion or experience feedback'
                      : 'How can we help?'
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share helpful details including city, listing name, or order ID if applicable."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-sm font-semibold disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Message'}
            </button>
          </form>
        </div>

        {/* Right: Support Channels & FAQ */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFFAF3] text-[#16834A] flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#202820]">Direct Support Email</h3>
            <p className="text-sm text-[#526054]">
              For urgent food safety escalations, NGO partnership verification, or corporate dining
              integrations:
            </p>
            <a
              href="mailto:support@foodcircle.in"
              className="inline-block font-mono text-sm font-semibold text-[#16834A] hover:underline"
            >
              support@foodcircle.in
            </a>
            <p className="text-xs text-[#526054]">
              Response window: Within 4 hours for food safety reports; 1 business day for general
              inquiries.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-[#202820] flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#16834A]" />
              Frequently Asked Questions
            </h3>
            <div className="divide-y divide-[#E2E8E0]">
              {FAQS.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={item.q} className="py-3 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-3 text-left text-sm font-semibold text-[#202820]"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#526054] shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-2 text-xs text-[#526054] leading-relaxed">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
