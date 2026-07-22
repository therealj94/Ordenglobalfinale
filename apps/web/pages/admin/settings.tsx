import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiCopy,
  FiTrash2,
  FiLoader,
  FiKey,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle
} from 'react-icons/fi';

interface ConnectedApp {
  id: string;
  appName: string;
  apiKey: string;
  isActive: boolean;
  linkedUsers: number;
  lastUsedAt?: string;
  createdAt: string;
}

export default function AdminSettingsPage() {
  const { checking } = useRequireAdmin();
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newRedirectUrl, setNewRedirectUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/apps');
      setApps(response.data.apps);
    } catch (error) {
      toast.error('Failed to load connected apps');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!checking) fetchApps();
  }, [checking, fetchApps]);

  const handleCreate = async () => {
    if (!newAppName.trim()) {
      toast.error('App name is required');
      return;
    }

    try {
      setCreating(true);
      const response = await apiClient.post('/admin/apps', {
        appName: newAppName.trim(),
        redirectUrls: newRedirectUrl ? [newRedirectUrl.trim()] : []
      });
      setNewlyCreatedKey(response.data.app.apiKey);
      setNewAppName('');
      setNewRedirectUrl('');
      fetchApps();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create app');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (appId: string, appName: string) => {
    if (!confirm(`Revoke API key for "${appName}"? This app will lose access immediately.`)) return;

    try {
      await apiClient.delete(`/admin/apps/${appId}`);
      toast.success('API key revoked');
      fetchApps();
    } catch (error) {
      toast.error('Failed to revoke app');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const maskKey = (key: string) => `${key.slice(0, 12)}${'•'.repeat(20)}${key.slice(-4)}`;

  if (checking) return null;

  return (
    <Layout withSidebar>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Connected Apps</h1>
            <p className="text-gray-600">
              Manage API keys for apps in the Orden Global ecosystem (Veta Wallet, My Token Pay, etc.)
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center"
          >
            <FiPlus className="mr-2" /> Connect New App
          </button>
        </div>

        {/* Newly created key banner */}
        {newlyCreatedKey && (
          <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 mb-8">
            <div className="flex items-center mb-3">
              <FiAlertTriangle className="text-green-700 mr-2" size={20} />
              <h3 className="font-bold text-green-900">Save this API key now — it won't be shown again in full!</h3>
            </div>
            <div className="flex items-center bg-white border border-green-300 rounded-lg p-3">
              <code className="flex-1 text-sm text-gray-800 break-all">{newlyCreatedKey}</code>
              <button
                onClick={() => copyToClipboard(newlyCreatedKey)}
                className="ml-3 text-green-700 hover:text-green-900"
              >
                <FiCopy size={20} />
              </button>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="mt-3 text-sm text-green-700 hover:underline"
            >
              I've saved it, dismiss
            </button>
          </div>
        )}

        {/* Create App Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Connect a New App</h3>

              <label className="block text-sm font-medium text-gray-700 mb-2">App Name</label>
              <input
                type="text"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                placeholder="e.g. veta-wallet"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500"
              />

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Redirect URL (optional)
              </label>
              <input
                type="text"
                value={newRedirectUrl}
                onChange={(e) => setNewRedirectUrl(e.target.value)}
                placeholder="https://vetawallet.com/auth/callback"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6 focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {creating ? <FiLoader className="animate-spin" /> : 'Create'}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Apps List */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FiLoader className="animate-spin text-blue-600" size={32} />
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-16">
              <FiKey size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No apps connected yet. Connect Veta Wallet or My Token Pay to get started.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">App</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">API Key</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Linked Users</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{app.appName}</td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-gray-500">{maskKey(app.apiKey)}</code>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{app.linkedUsers}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          app.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {app.isActive ? <FiCheckCircle className="mr-1" size={12} /> : <FiXCircle className="mr-1" size={12} />}
                        {app.isActive ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {app.isActive && (
                        <button
                          onClick={() => handleRevoke(app.id, app.appName)}
                          className="text-red-600 hover:text-red-800"
                          title="Revoke API key"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Integration Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How apps use this API key</h3>
          <p className="text-sm text-blue-800 mb-3">
            Apps send this key as a header on every server-to-server call to GENESIS ID:
          </p>
          <pre className="bg-white border border-blue-200 rounded p-3 text-xs overflow-x-auto">
{`X-API-Key: gid_live_xxxxxxxxxxxxxxxxxxxx

POST /api/apps/user-status
POST /api/apps/register-app
POST /api/apps/token-validate`}
          </pre>
          <p className="text-sm text-blue-800 mt-3">
            See the <code>packages/kyc-sdk</code> folder for the drop-in widget and full integration guide.
          </p>
        </div>
      </div>
    </Layout>
  );
}
