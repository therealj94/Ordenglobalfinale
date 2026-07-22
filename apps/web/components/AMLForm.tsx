import React, { useState } from 'react';
import { COUNTRIES } from '@/lib/countries';
import { FiAlertTriangle, FiArrowRight } from 'react-icons/fi';

export interface AMLData {
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  occupation: string;
  sourceOfFunds: string;
  isPEP: boolean;
  pepDetails?: string;
}

interface AMLFormProps {
  onSubmit: (data: AMLData) => void;
}

const SOURCE_OF_FUNDS_OPTIONS = [
  { value: 'salary', label: 'Salary / employment income' },
  { value: 'savings', label: 'Personal savings' },
  { value: 'business_income', label: 'Business income' },
  { value: 'investments', label: 'Investments' },
  { value: 'inheritance', label: 'Inheritance' },
  { value: 'other', label: 'Other' }
];

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 0;
  return (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

export default function AMLForm({ onSubmit }: AMLFormProps) {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('');
  const [occupation, setOccupation] = useState('');
  const [sourceOfFunds, setSourceOfFunds] = useState('');
  const [isPEP, setIsPEP] = useState<'yes' | 'no' | ''>('');
  const [pepDetails, setPepDetails] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!dateOfBirth || !nationality || !countryOfResidence || !occupation.trim() || !sourceOfFunds || !isPEP) {
      setError('Please complete all fields.');
      return;
    }

    if (calculateAge(dateOfBirth) < 18) {
      setError('You must be at least 18 years old to complete this verification.');
      return;
    }

    if (isPEP === 'yes' && !pepDetails.trim()) {
      setError('Please describe your (or your relative\'s) public position.');
      return;
    }

    onSubmit({
      dateOfBirth,
      nationality,
      countryOfResidence,
      occupation: occupation.trim(),
      sourceOfFunds,
      isPEP: isPEP === 'yes',
      pepDetails: isPEP === 'yes' ? pepDetails.trim() : undefined
    });
  };

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="p-8 md:p-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Compliance Information</h2>
        <p className="text-gray-600 mb-8">
          Required by financial regulations (AML/KYC) before we can verify your identity.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Software Engineer"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country of Residence</label>
              <select
                value={countryOfResidence}
                onChange={(e) => setCountryOfResidence(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source of Funds — where does the money you'll use come from?
            </label>
            <select
              value={sourceOfFunds}
              onChange={(e) => setSourceOfFunds(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select an option</option>
              {SOURCE_OF_FUNDS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Are you, or an immediate family member, a Politically Exposed Person (PEP)?
              <span className="block text-xs text-gray-500 font-normal mt-1">
                (e.g. a senior government official, judge, military officer, or a close relative of one)
              </span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isPEP"
                  checked={isPEP === 'no'}
                  onChange={() => setIsPEP('no')}
                />
                No
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isPEP"
                  checked={isPEP === 'yes'}
                  onChange={() => setIsPEP('yes')}
                />
                Yes
              </label>
            </div>

            {isPEP === 'yes' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please describe the position and relationship
                </label>
                <textarea
                  value={pepDetails}
                  onChange={(e) => setPepDetails(e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="e.g. I am a city council member / My father is a federal judge"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-center">
              <FiAlertTriangle className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition transform hover:scale-105 flex items-center justify-center"
          >
            Continue
            <FiArrowRight className="ml-2" />
          </button>
        </form>
      </div>
    </div>
  );
}
