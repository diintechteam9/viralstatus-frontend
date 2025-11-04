import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Phone, 
  CheckCircle, 
  TrendingUp
} from 'lucide-react';
import { API_BASE_URL } from '../../../config';
import toast from 'react-hot-toast';

const Stats = ({ cardId }) => {
  const [stats, setStats] = useState({
    screenshots: {
      total: 0,
      processed: 0,
      unprocessed: 0
    },
    phoneNumbers: {
      total: 0,
      valid: 0,
      invalid: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [cardId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [screenshotStatsRes, phoneStatsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/screenshots/stats${cardId ? `?cardId=${cardId}` : ''}`),
        fetch(`${API_BASE_URL}/api/phone-numbers/stats${cardId ? `?cardId=${cardId}` : ''}`)
      ]);

      if (!screenshotStatsRes.ok || !phoneStatsRes.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const [screenshotStats, phoneStats] = await Promise.all([
        screenshotStatsRes.json(),
        phoneStatsRes.json()
      ]);

      setStats({
        screenshots: {
          total: screenshotStats.data.totalScreenshots,
          processed: screenshotStats.data.processedScreenshots,
          unprocessed: screenshotStats.data.unprocessedScreenshots
        },
        phoneNumbers: {
          total: phoneStats.data.totalPhoneNumbers,
          valid: phoneStats.data.validPhoneNumbers,
          invalid: phoneStats.data.invalidPhoneNumbers
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-full ${color} shrink-0 ml-3`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Statistics Overview</h2>
        <button
          onClick={fetchStats}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          Refresh Stats
        </button>
      </div>

      {/* Stats Cards - 2x2 Grid Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* First Row */}
        <StatCard
          title="Total Screenshots"
          value={stats.screenshots.total}
          icon={Camera}
          color="bg-blue-500"
          subtitle={`${stats.screenshots.processed} processed`}
        />
        <StatCard
          title="Phone Numbers Found"
          value={stats.phoneNumbers.total}
          icon={Phone}
          color="bg-green-500"
          subtitle={`${stats.phoneNumbers.valid} valid`}
        />
        {/* Second Row */}
        <StatCard
          title="Processing Rate"
          value={stats.screenshots.total > 0 ? Math.round((stats.screenshots.processed / stats.screenshots.total) * 100) : 0}
          icon={TrendingUp}
          color="bg-purple-500"
          subtitle="% of screenshots processed"
        />
        <StatCard
          title="Validity Rate"
          value={stats.phoneNumbers.total > 0 ? Math.round((stats.phoneNumbers.valid / stats.phoneNumbers.total) * 100) : 0}
          icon={CheckCircle}
          color="bg-orange-500"
          subtitle="% of valid numbers"
        />
      </div>

      {/* Additional Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Screenshot Processing</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processed:</span>
                <span className="font-medium text-green-600">{stats.screenshots.processed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unprocessed:</span>
                <span className="font-medium text-red-600">{stats.screenshots.unprocessed}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Phone Number Validation</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valid:</span>
                <span className="font-medium text-green-600">{stats.phoneNumbers.valid}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Invalid:</span>
                <span className="font-medium text-red-600">{stats.phoneNumbers.invalid}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;