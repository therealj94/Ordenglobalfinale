import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import KYCFlow from '@/components/KYCFlow';
import { FiAlertCircle } from 'react-icons/fi';

export default function VerifyPage() {
  const router = useRouter();
  const { userId } = router.query;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (userId) {
      setIsReady(true);
    }
  }, [userId]);

  if (!isReady) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!userId) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
            <FiAlertCircle className="text-red-600 mx-auto mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Request</h2>
            <p className="text-gray-600 mb-6">User ID is required to proceed with verification.</p>
            <button
              onClick={() => router.push('/auth/register')}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              Go to Registration
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <KYCFlow
          userId={userId as string}
          onSuccess={(verification) => {
            router.push('/dashboard');
          }}
        />
      </div>
    </Layout>
  );
}
