import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import GenesisIDCard from '@/components/GenesisIDCard';
import IdCardPhotoCapture from '@/components/IdCardPhotoCapture';
import {
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiLoader,
  FiShield,
  FiGrid,
  FiCopy,
  FiHash,
  FiCamera
} from 'react-icons/fi';

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  verified: { color: 'text-green-600 bg-green-100', icon: FiCheckCircle, label: 'Verified' },
  pending: { color: 'text-yellow-600 bg-yellow-100', icon: FiClock, label: 'Pending Review' },
  rejected: { color: 'text-red-600 bg-red-100', icon: FiXCircle, label: 'Rejected' },
  expired: { color: 'text-gray-600 bg-gray-100', icon: FiXCircle, label: 'Expired' }
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, fetchProfile, isAuthenticated } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }
      const profile = user || (await fetchProfile());
      if (!profile) {
        router.replace('/auth/login');
        return;
      }
      setChecking(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking || !user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <FiLoader className="animate-spin text-blue-600" size={32} />
        </div>
      </Layout>
    );
  }

  const statusInfo = STATUS_CONFIG[user.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusInfo.icon;

  const handleIdCardPhotoSubmit = async (photo: string) => {
    await apiClient.post('/kyc/id-card-photo', { userId: user.id, photo });
    setUser({ ...user, idCardPhoto: photo });
    toast.success('Your GENESIS ID card is ready!');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.fullName || user.email}</h1>
          <p className="text-gray-600">Your GENESIS ID account overview</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow p-8 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mr-4 ${statusInfo.color}`}>
                <StatusIcon size={32} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Verification Status</p>
                <p className="text-2xl font-bold text-gray-900">{statusInfo.label}</p>
              </div>
            </div>

            {user.status === 'pending' && (
              <Link
                href={`/verify?userId=${user.id}`}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Continue Verification
              </Link>
            )}

            {user.status === 'rejected' && (
              <Link
                href={`/verify?userId=${user.id}`}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Retry Verification
              </Link>
            )}
          </div>
        </div>

        {/* GENESIS ID Card */}
        {user.status === 'verified' && user.gid && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow p-8 mb-4 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center text-indigo-100 mb-1">
                    <FiHash className="mr-1" />
                    <p className="text-sm">Your GENESIS ID</p>
                  </div>
                  <p className="text-3xl font-mono font-bold tracking-wide">{user.gid}</p>
                  <p className="text-indigo-100 text-sm mt-2">
                    Use this ID across every Orden Global app — Veta Wallet, My Token Pay, and more.
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.gid || '');
                    toast.success('GENESIS ID copied to clipboard');
                  }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 transition rounded-lg px-4 py-2 flex items-center font-semibold"
                >
                  <FiCopy className="mr-2" />
                  Copy
                </button>
              </div>
            </div>

            {user.idCardPhoto ? (
              <GenesisIDCard
                fullName={user.fullName || user.email}
                gid={user.gid}
                nationality={user.nationality}
                idCardPhoto={user.idCardPhoto}
                dateOfBirth={user.dateOfBirth}
                issuedAt={user.gidIssuedAt}
                expiresAt={user.gidExpiresAt}
                allowDownload
              />
            ) : (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <FiCamera className="mx-auto text-indigo-500 mb-3" size={32} />
                <h3 className="text-lg font-bold text-gray-900 mb-1">Add a photo to your GENESIS ID</h3>
                <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
                  Add a photo to unlock your visual GENESIS ID card — with a QR code others can scan to verify you.
                </p>
                <IdCardPhotoCapture onSubmit={handleIdCardPhotoSubmit} />
              </div>
            )}
          </div>
        )}

        {/* Ecosystem Access */}
        <div className="bg-white rounded-xl shadow p-8">
          <div className="flex items-center mb-6">
            <FiGrid className="text-blue-600 mr-2" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Ecosystem Access</h2>
          </div>

          {user.status === 'verified' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-center">
                <FiShield className="text-green-600 mr-3" size={24} />
                <div>
                  <p className="font-semibold text-gray-900">Veta Wallet</p>
                  <p className="text-sm text-green-700">Access granted</p>
                </div>
              </div>
              <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-center">
                <FiShield className="text-green-600 mr-3" size={24} />
                <div>
                  <p className="font-semibold text-gray-900">My Token Pay</p>
                  <p className="text-sm text-green-700">Access granted</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">
              Complete your identity verification to unlock all Orden Global ecosystem apps.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
