import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const TelegramTool = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({
    telegramAlertsEnabledOnRegistration: true,
    telegramAlertsEnabledOnProfileCreated: true,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE_URL}/api/telegram/settings`);
      if (res.data?.success && res.data?.settings) {
        setSettings(res.data.settings);
      } else {
        throw new Error(res.data?.error || "Failed to fetch settings");
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (partial) => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.put(`${API_BASE_URL}/api/telegram/settings`, partial);
      if (res.data?.success && res.data?.settings) {
        setSettings(res.data.settings);
      } else {
        throw new Error(res.data?.error || "Failed to update settings");
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">New registration alerts</div>
          <div className="text-sm text-gray-600">User/Client registered via Google</div>
        </div>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={settings.telegramAlertsEnabledOnRegistration}
            onChange={(e) =>
              updateSettings({ telegramAlertsEnabledOnRegistration: e.target.checked })
            }
            disabled={loading}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Profile created alerts</div>
          <div className="text-sm text-gray-600">When Google user completes profile</div>
        </div>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={settings.telegramAlertsEnabledOnProfileCreated}
            onChange={(e) =>
              updateSettings({ telegramAlertsEnabledOnProfileCreated: e.target.checked })
            }
            disabled={loading}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative"></div>
        </label>
      </div>
    </div>
  );
};

export default TelegramTool;


