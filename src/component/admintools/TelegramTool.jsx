import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const ALERTS = [
  {
    key: "telegramAlertsEnabledOnCampaignCreate",
    title: "New Campaign Created",
    desc: "Alert when a client creates a new campaign",
    emoji: "🚀",
  },
  {
    key: "telegramAlertsEnabledOnCampaignStart",
    title: "Campaign Started / Active",
    desc: "Alert when a campaign becomes active",
    emoji: "✅",
  },
  {
    key: "telegramAlertsEnabledOnUserJoin",
    title: "User Joined Campaign",
    desc: "Alert when users are assigned to a campaign",
    emoji: "🎉",
  },
  {
    key: "telegramAlertsEnabledOnUserEarn",
    title: "User Earned Credits",
    desc: "Alert when a user submits video and earns credits",
    emoji: "💸",
  },
  {
    key: "telegramAlertsEnabledOnRegistration",
    title: "New Registration",
    desc: "Alert when a new user/client registers",
    emoji: "📝",
  },
  {
    key: "telegramAlertsEnabledOnProfileCreated",
    title: "Profile Created",
    desc: "Alert when a Google user completes their profile",
    emoji: "✨",
  },
  {
    key: "telegramAlertsEnabledOnReelUpload",
    title: "Reels Uploaded to Pool",
    desc: "Alert when reels are uploaded to a content pool",
    emoji: "🎬",
  },
  {
    key: "telegramAlertsEnabledOnPoolCreate",
    title: "New Pool Created",
    desc: "Alert when a new content pool is created",
    emoji: "🗂️",
  },
  {
    key: "telegramAlertsEnabledOnClientLogin",
    title: "Client Login",
    desc: "Alert when admin logs into a client account",
    emoji: "🔐",
  },
];

const Toggle = ({ value, onChange, disabled }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-7 w-14 items-center rounded-full border transition-colors duration-200 ${
      value ? "bg-violet-600 border-violet-500" : "bg-gray-200 border-gray-300"
    }`}
  >
    <span className={`absolute left-2 text-[10px] font-bold ${value ? "text-white" : "text-gray-500"}`}>On</span>
    <span className={`absolute right-1.5 text-[10px] font-bold ${value ? "text-violet-200" : "text-gray-600"}`}>Off</span>
    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-8" : "translate-x-1"}`} />
  </button>
);

const TelegramTool = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState({});

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

  const updateSetting = async (key, value) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const res = await axios.put(`${API_BASE_URL}/api/telegram/settings`, { [key]: value });
      if (res.data?.success && res.data?.settings) {
        setSettings(res.data.settings);
        setSuccess("Saved!");
        setTimeout(() => setSuccess(""), 2000);
      } else {
        throw new Error(res.data?.error || "Failed to update");
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const enabledCount = ALERTS.filter((a) => settings[a.key]).length;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-white via-violet-50 to-blue-50 p-5 shadow-sm">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-100/50 blur-3xl" />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-gray-500">Telegram Bot</div>
            <h4 className="mt-1 text-xl font-extrabold tracking-tight bg-gradient-to-r from-violet-700 to-blue-700 bg-clip-text text-transparent">
              Alert Management
            </h4>
            <p className="text-xs text-gray-500 mt-1">{enabledCount} of {ALERTS.length} alerts enabled</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1 text-xs border shadow ${loading ? "border-amber-200 text-amber-600" : "border-violet-100 text-gray-600"}`}>
              <span className={`inline-block h-2 w-2 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
              {loading ? "Syncing…" : "Connected"}
            </div>
            <button
              type="button"
              onClick={() => {
                const allOn = ALERTS.every((a) => settings[a.key]);
                const patch = {};
                ALERTS.forEach((a) => { patch[a.key] = !allOn; });
                axios.put(`${API_BASE_URL}/api/telegram/settings`, patch)
                  .then((r) => { if (r.data?.success) setSettings(r.data.settings); })
                  .catch(() => {});
              }}
              className="text-xs font-semibold text-violet-600 hover:underline"
            >
              {ALERTS.every((a) => settings[a.key]) ? "Disable All" : "Enable All"}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">✅ {success}</div>}

      {/* Alert Toggles */}
      <div className="space-y-2">
        {ALERTS.map((alert) => (
          <div
            key={alert.key}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-violet-200 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{alert.emoji}</span>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{alert.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{alert.desc}</div>
              </div>
            </div>
            <Toggle
              value={!!settings[alert.key]}
              onChange={() => updateSetting(alert.key, !settings[alert.key])}
              disabled={loading}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TelegramTool;
