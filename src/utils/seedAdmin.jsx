/**
 * Admin Seeding Component
 * Run this component to seed admin data into Firebase
 * Usage: Add this component temporarily to your app and trigger it
 */

import React, { useState, useEffect } from 'react';
import { testConnection, seedAdminUser } from '../services/seedService';

const SeedAdmin = () => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [seedStatus, setSeedStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adminData, setAdminData] = useState({
    name: 'Admin User',
    phone: '1234567890',
    password: 'admin123',
    nid: 'ADMIN001',
  });

  useEffect(() => {
    // Auto-test connection on mount
    handleTestConnection();
  }, []);

  const handleTestConnection = async () => {
    setLoading(true);
    const result = await testConnection();
    setConnectionStatus(result);
    setLoading(false);
  };

  const handleSeedAdmin = async () => {
    setLoading(true);
    const result = await seedAdminUser(adminData);
    setSeedStatus(result);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Firebase Admin Seeding</h1>

        {/* Connection Test */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Connection Test</h2>
          <button
            onClick={handleTestConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 mb-4"
          >
            Test Firebase Connection
          </button>

          {connectionStatus && (
            <div
              className={`p-4 rounded ${
                connectionStatus.success
                  ? 'bg-green-900 text-green-300'
                  : 'bg-red-900 text-red-300'
              }`}
            >
              <p className="font-semibold">{connectionStatus.message}</p>
              {connectionStatus.userCount !== undefined && (
                <p className="text-sm mt-2">Users in database: {connectionStatus.userCount}</p>
              )}
              {connectionStatus.error && (
                <p className="text-sm mt-2">Error: {connectionStatus.error.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Seed Admin */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Seed Admin User</h2>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={adminData.name}
                onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="text"
                value={adminData.phone}
                onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={adminData.password}
                onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">NID</label>
              <input
                type="text"
                value={adminData.nid}
                onChange={(e) => setAdminData({ ...adminData, nid: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>

          <button
            onClick={handleSeedAdmin}
            disabled={loading || !connectionStatus?.success}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Seeding...' : 'Seed Admin User'}
          </button>

          {seedStatus && (
            <div
              className={`mt-4 p-4 rounded ${
                seedStatus.success
                  ? 'bg-green-900 text-green-300'
                  : 'bg-red-900 text-red-300'
              }`}
            >
              <p className="font-semibold">{seedStatus.message}</p>
              {seedStatus.credentials && (
                <div className="mt-2 text-sm">
                  <p>Login credentials:</p>
                  <p>Phone: {seedStatus.credentials.phone}</p>
                  <p>Password: {seedStatus.credentials.password}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-900 rounded text-blue-200 text-sm">
          <p className="font-semibold mb-2">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>First, test the Firebase connection</li>
            <li>If connection is successful, fill in admin details</li>
            <li>Click "Seed Admin User" to create the admin account</li>
            <li>Use the credentials to login as admin</li>
            <li>Remove this component from your app after seeding</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SeedAdmin;
