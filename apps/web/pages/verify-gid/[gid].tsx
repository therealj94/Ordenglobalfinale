import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { apiClient } from '@/lib/apiClient';
import GenesisIDCard from '@/components/GenesisIDCard';
import { FiLoader, FiXCircle } from 'react-icons/fi';

interface PublicGidData {
  gid: string;
  fullName: string;
  nationality: string | null;
  idCardPhoto: string | null;
  status: string;
}

export default function VerifyGidPage() {
  const router = useRouter();
  const { gid } = router.query;
  const [data, setData] = useState<PublicGidData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!gid || typeof gid !== 'string') return;

    apiClient
      .get<PublicGidData>(`/public/gid/${encodeURIComponent(gid)}`)
      .then((res) => setData(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [gid]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8 text-white">
            <h1 className="text-2xl font-bold">GENESIS ID Verification</h1>
            <p className="text-blue-200 text-sm mt-1">Orden Global Ecosystem</p>
          </div>

          {loading && (
            <div className="flex justify-center">
              <FiLoader className="animate-spin text-white" size={32} />
            </div>
          )}

          {!loading && notFound && (
            <div className="bg-white rounded-xl shadow-2xl p-10 text-center">
              <FiXCircle className="mx-auto text-red-500 mb-4" size={40} />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Not a Verified GENESIS ID</h2>
              <p className="text-gray-600">
                This GENESIS ID doesn't exist or isn't currently verified.
              </p>
            </div>
          )}

          {!loading && data && (
            <GenesisIDCard
              fullName={data.fullName}
              gid={data.gid}
              nationality={data.nationality}
              idCardPhoto={data.idCardPhoto}
              showFullDetails={false}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
