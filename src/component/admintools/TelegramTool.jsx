import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const TelegramTool = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({
    telegramAlertsEnabledOnRegistration: true,
    telegramAlertsEnabledOnProfileCreated: true,
    telegramAlertsEnabledOnCampaignStart: true,
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
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100/70 border border-red-300 text-red-700 rounded-xl shadow-sm">{error}</div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-white via-violet-50 to-blue-50 p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-blue-100/50 blur-3xl" />

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-gray-500">Telegram Bot</div>
            <h4 className="mt-1 text-2xl font-extrabold tracking-tight bg-gradient-to-r from-violet-700 to-blue-700 bg-clip-text text-transparent">
              Alert Toggles
            </h4>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1 text-xs text-gray-600 border border-violet-100 shadow">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>{loading ? 'Syncing…' : 'Connected'}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          {/* Registration */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/80 p-4 backdrop-blur">
            <div>
              <div className="font-semibold text-gray-900">New registration alerts</div>
              <div className="text-sm text-gray-600">User/Client registered via Google</div>
            </div>
            <button
              type="button"
              aria-label="Toggle registration alerts"
              onClick={() => updateSettings({ telegramAlertsEnabledOnRegistration: !settings.telegramAlertsEnabledOnRegistration })}
              disabled={loading}
              className={`relative inline-flex h-7 w-17 items-center rounded-full border transition-colors duration-200 ${settings.telegramAlertsEnabledOnRegistration ? 'bg-violet-600 border-violet-500' : 'bg-gray-200 border-gray-300'}`}
            >
              {/* Labels */}
              <span className={`absolute left-2 text-[10px] font-bold ${settings.telegramAlertsEnabledOnRegistration ? 'text-white' : 'text-gray-600'}`}>On</span>
              <span className={`absolute right-2 text-[10px] font-bold ${settings.telegramAlertsEnabledOnRegistration ? 'text-emerald-100' : 'text-gray-700'}`}>Off</span>
              {/* Knob */}
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${settings.telegramAlertsEnabledOnRegistration ? 'translate-x-11' : 'translate-x-1'}`}></span>
            </button>
          </div>

          {/* Profile Created */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/80 p-4 backdrop-blur">
            <div>
              <div className="font-semibold text-gray-900">Profile created alerts</div>
              <div className="text-sm text-gray-600">When Google user completes profile</div>
            </div>
            <button
              type="button"
              aria-label="Toggle profile created alerts"
              onClick={() => updateSettings({ telegramAlertsEnabledOnProfileCreated: !settings.telegramAlertsEnabledOnProfileCreated })}
              disabled={loading}
              className={`relative inline-flex h-7 w-17 items-center rounded-full border transition-colors duration-200 ${settings.telegramAlertsEnabledOnProfileCreated ? 'bg-violet-600 border-violet-500' : 'bg-gray-200 border-gray-300'}`}
            >
              {/* Labels */}
              <span className={`absolute left-2 text-[10px] font-bold ${settings.telegramAlertsEnabledOnProfileCreated ? 'text-white' : 'text-gray-600'}`}>On</span>
              <span className={`absolute right-2 text-[10px] font-bold ${settings.telegramAlertsEnabledOnProfileCreated ? 'text-emerald-100' : 'text-gray-700'}`}>Off</span>
              {/* Knob */}
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${settings.telegramAlertsEnabledOnProfileCreated ? 'translate-x-11' : 'translate-x-1'}`}></span>
            </button>
          </div>

          {/* Campaign Start */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/80 p-4 backdrop-blur">
            <div>
              <div className="font-semibold text-gray-900">Campaign start alerts</div>
              <div className="text-sm text-gray-600">When a campaign becomes active</div>
            </div>
            <button
              type="button"
              aria-label="Toggle campaign start alerts"
              onClick={() => updateSettings({ telegramAlertsEnabledOnCampaignStart: !settings.telegramAlertsEnabledOnCampaignStart })}
              disabled={loading}
              className={`relative inline-flex h-7 w-17 items-center rounded-full border transition-colors duration-200 ${settings.telegramAlertsEnabledOnCampaignStart ? 'bg-violet-600 border-violet-500' : 'bg-gray-200 border-gray-300'}`}
            >
              {/* Labels */}
              <span className={`absolute left-2 text-[10px] font-bold ${settings.telegramAlertsEnabledOnCampaignStart ? 'text-white' : 'text-gray-600'}`}>On</span>
              <span className={`absolute right-2 text-[10px] font-bold ${settings.telegramAlertsEnabledOnCampaignStart ? 'text-emerald-100' : 'text-gray-700'}`}>Off</span>
              {/* Knob */}
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${settings.telegramAlertsEnabledOnCampaignStart ? 'translate-x-11' : 'translate-x-1'}`}></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramTool;


