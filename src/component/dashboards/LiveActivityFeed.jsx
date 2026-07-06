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
    <div className="flex items-start gap-3 p-4 hover:bg-white/20 rounded-xl transition-all border border-white/10">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 font-medium leading-snug">{item.description || item.type}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>
          <span className="text-xs text-gray-500">{timeAgo(item.createdAt)}</span>
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

  const getToken = () => 
    localStorage.getItem("mobileUserToken") || 
    localStorage.getItem("clienttoken") || 
    sessionStorage.getItem("clienttoken");

  const fetchActivities = async (p = page, f = filter) => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({ page: p, limit: 20 });
      if (f !== "all") params.set("type", f);
      
      const res = await axios.get(`${API_BASE_URL}/api/activity?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setActivities(res.data.activities || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
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
    <div className="w-full space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live Activity</h1>
            <p className="text-xs text-gray-500 mt-0.5">Real-time system activity feed</p>
          </div>
          <span className={`w-2.5 h-2.5 rounded-full ml-2 ${autoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRefresh(a => !a)}
            className={`text-xs px-3 py-2 rounded-xl font-semibold transition-all border ${
              autoRefresh 
                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" 
                : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
            }`}>
            {autoRefresh ? "● Live" : "⊘ Paused"}
          </button>
          <button onClick={() => fetchActivities(page, filter)} disabled={loading}
            className="p-2 hover:bg-orange-50 rounded-xl transition-all disabled:opacity-50">
            <RefreshCw className={`w-5 h-5 text-orange-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Activities", value: total, icon: Activity, color: "from-orange-400 to-orange-600" },
          { label: "This Page", value: activities.length, icon: Zap, color: "from-blue-400 to-blue-600" },
          { label: "Auto Refresh", value: autoRefresh ? "30s" : "Off", icon: RefreshCw, color: "from-green-400 to-green-600" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-5 shadow-sm transition-all hover:shadow-md hover:border-white/30">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl" style={{backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`}} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{s.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTER_TYPES.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              filter === f.key 
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600 shadow-md" 
                : "bg-white/10 backdrop-blur-xl text-gray-700 border-white/20 hover:border-white/40 hover:bg-white/20"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 bg-white/20 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/20 rounded w-3/4" />
                  <div className="h-3 bg-white/20 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-sm text-gray-600 font-medium">No activities found</p>
            <p className="text-xs text-gray-500 mt-1">Activities will appear here as they happen</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {activities.map(a => <ActivityItem key={a._id} item={a} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 text-xs font-semibold border border-white/20 rounded-xl disabled:opacity-40 hover:bg-white/10 transition-all">
              Previous
            </button>
            <span className="text-xs text-gray-600 font-medium">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 text-xs font-semibold border border-white/20 rounded-xl disabled:opacity-40 hover:bg-white/10 transition-all">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveActivityFeed;
