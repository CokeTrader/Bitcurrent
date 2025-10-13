'use client';

import { useState } from 'react';
import { User, Bell, Shield, Key, Mail, Smartphone } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Settings
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'api', label: 'API Keys', icon: Key }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'api' && <APIKeySettings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Profile Settings
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Display Name
          </label>
          <input
            type="text"
            defaultValue="John Doe"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            defaultValue="john@example.com"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            defaultValue="+44 7700 900000"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Notification Preferences
      </h2>

      <div className="space-y-4">
        {[
          { label: 'Order filled', description: 'Get notified when orders are executed' },
          { label: 'Price alerts', description: 'Receive price movement alerts' },
          { label: 'Deposit confirmations', description: 'Get notified when deposits complete' },
          { label: 'Withdrawal updates', description: 'Track withdrawal status' },
          { label: 'Security alerts', description: 'Important security notifications' },
          { label: 'Marketing emails', description: 'News and promotional content' }
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
            </div>
            <input
              type="checkbox"
              defaultChecked={index < 5}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Security Settings
      </h2>

      <div className="space-y-6">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-800 dark:text-green-200">
              Two-Factor Authentication
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mb-3">
            2FA is enabled and protecting your account
          </p>
          <button className="text-sm text-green-600 dark:text-green-400 hover:underline">
            Manage 2FA
          </button>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            Change Password
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Current password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="password"
              placeholder="New password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Update Password
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            Active Sessions
          </h3>
          <div className="space-y-2">
            {[
              { device: 'Chrome on Mac', location: 'London, UK', time: 'Active now' },
              { device: 'Safari on iPhone', location: 'London, UK', time: '2 hours ago' }
            ].map((session, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{session.device}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {session.location} • {session.time}
                  </div>
                </div>
                {index > 0 && (
                  <button className="text-sm text-red-600 hover:underline">
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function APIKeySettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          API Keys
        </h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Create New Key
        </button>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          API keys allow third-party applications to access your account. Keep them secure and never share them.
        </p>
      </div>

      <div className="space-y-3">
        {[
          { name: 'Trading Bot', permissions: 'Read, Trade', created: '2025-10-01' },
          { name: 'Portfolio Tracker', permissions: 'Read', created: '2025-10-10' }
        ].map((key, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-900 dark:text-white">{key.name}</div>
              <button className="text-sm text-red-600 hover:underline">
                Delete
              </button>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Permissions: {key.permissions}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Created: {key.created}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
