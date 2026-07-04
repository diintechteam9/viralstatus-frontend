import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Activity, Users, Megaphone, CheckCircle, Wallet,
  UserPlus, Star, Shield, Video, RefreshCw, Filter,
  TrendingUp, Zap,
} from "lucide-react";
import { API_BASE_URL } from "../../config";

const ACTIVITY_CFG = {
  user_joined:        { icon: UserPlus,    color: "bg-blue-100 text-blue-600",    label: "New User" },
  campaign_joined:    { icon: Megaphone,   color: "bg-purple-100 text-purple-600", label: "Campaign Joined" },
  campaign_completed: { icon: CheckCircle, color: "bg-green-100 text-green-600",  label: "Campaign Done" },
  task_accepted:      { icon: Zap,         color: "bg-yellow-100 text-yellow-600", label: "Task Accepted" },
  task_completed:     { icon: CheckCircle, color: "bg-teal-100 text-teal-600",    label: "Task Done" },
  credits_earned:     { icon: TrendingUp,  color: "bg-green-100 text-green-600",  label: "Credits Earned" },
  withdrawal_request: { icon: Wallet,      color: "bg-orange-100 text-orange-600", label: "Withdrawal" },
  withdrawal_paid:    { icon: Wallet,      color: "bg-green-100 text-green-600",  label: "Paid Out" },
  kyc_submitted:      { icon: Shield,      color: "bg-blue-100 text-blue-600",    label: "KYC Submitted" },
  kyc_approved:       { icon: Shield,      color: "bg-green-100 text-green-600",  label: "KYC Approved" },
  ugc_submitted:      { icon: Video,       color: "bg-pink-100 text-pink-600",    label: "UGC Uploaded" },
  review_posted:      { icon: Star,        color: "bg-yellow-100 text-yellow-600", label: "Review Posted" },
  client_created:     { icon: Users,       color: "bg-indigo-100 text-indigo-600", label: "Client Added" },
  banner_updated:     { icon: Megaphone,   color: "bg-orange-100 text-orange-600", label: "Banner Updated" },
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const ActivityItem = ({ item }) => {
  const cfg = ACTIVITY_CFG[item.type] || { icon: Activity, color: "bg-gray-100 text-gray-600", label: item.type };
  const Icon = cfg.icon;
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-snug">{item.description || item.type}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
          <span className="text-xs text-gray-400">{timeAgo(item.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

const FILTER_TYPES = [
  { key: "all",               label: "All" },
  { key: "user_joined",       label: "Users" },
  { key: "campaign_joined",   label: "Campaigns" },
  { key: "task_completed",    label: "Tasks" },
  { key: "credits_earned",    label: "Credits" },
  { key: "withdrawal_request",label: "Withdrawals" },
  { key: "kyc_submitted",     label: "KYC" },
];

const LiveActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [filter, setFilter]         = useState("all");
  const [loading, setLoading]       = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  const fetchActivities = async (p = page, f = filter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (f !== "all") params.set("type", f);
      const res = await axios.get(`${API_BASE_URL}/api/activity?${params}`);
      if (res.data.success) {
        setActivities(res.data.activities || []);
        setTotal(res.data.total || 0);
      }
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchActivities(1, filter); setPage(1); }, [filter]);

  useEffect(() => { fetchActivities(page, filter); }, [page]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => { if (page === 1) fetchActivities(1, filter); }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, filter, page]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-800">Live Activity</h2>
          <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRefresh(a => !a)}
            className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all
              ${autoRefresh ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
            {autoRefresh ? "Live" : "Paused"}
          </button>
          <button onClick={() => fetchActivities(page, filter)} disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Activities", value: total, icon: Activity, color: "orange" },
          { label: "This Page",        value: activities.length, icon: Zap, color: "blue" },
          { label: "Auto Refresh",     value: autoRefresh ? "30s" : "Off", icon: RefreshCw, color: "green" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            <p className={`text-lg font-bold text-${s.color}-500 mt-0.5`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TYPES.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
              ${filter === f.key ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-9 h-9 bg-gray-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-10 text-center">
            <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No activities found</p>
          </div>
        ) : (
          <div className="p-2 divide-y divide-gray-50">
            {activities.map(a => <ActivityItem key={a._id} item={a} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-all">
              Previous
            </button>
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-all">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveActivityFeed;
