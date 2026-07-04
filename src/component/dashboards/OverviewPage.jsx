import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TrendingUp, Eye, Heart, CheckSquare, BarChart2,
  Megaphone, Trophy, Wallet, Clock, RefreshCw,
  ArrowUpRight, Star, Zap,
} from "lucide-react";
import { API_BASE_URL } from "../../config";

const StatCard = ({ icon: Icon, label, value, sub, gradient, loading }) => (
  <div className={`rounded-2xl p-5 text-white shadow-sm ${gradient}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold opacity-80 uppercase tracking-wide">{label}</p>
        {loading ? (
          <div className="h-7 w-20 bg-white/20 rounded-lg animate-pulse mt-2" />
        ) : (
          <p className="text-2xl font-bold mt-1">{value}</p>
        )}
        {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
      </div>
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

const MiniCard = ({ icon: Icon, label, value, color = "orange", loading }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center shrink-0`}>
      <Icon className={`w-5 h-5 text-${color}-500`} />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      {loading ? (
        <div className="h-5 w-16 bg-gray-100 rounded animate-pulse mt-1" />
      ) : (
        <p className="text-lg font-bold text-gray-800">{value}</p>
      )}
    </div>
  </div>
);

const OverviewPage = () => {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const userId = (() => {
    try { const d = JSON.parse(localStorage.getItem("mobileUserData") || "{}"); return d.googleId || d.userId || d._id || ""; } catch { return ""; }
  })();

  const fetchStats = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/activity/stats/${userId}`);
      if (res.data.success) {
        setStats(res.data.stats);
        setLastUpdated(new Date());
      }
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, [userId]);

  const fmt = (n) => {
    if (n === undefined || n === null) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Overview</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Your performance at a glance"}
          </p>
        </div>
        <button onClick={fetchStats} disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Top 2 big cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={Wallet}
          label="Total Earnings"
          value={`₹${fmt(stats?.totalEarnings)}`}
          sub={`₹${fmt(stats?.pendingCredits)} pending · ₹${fmt(stats?.totalWithdrawn)} withdrawn`}
          gradient="bg-gradient-to-br from-orange-500 to-orange-400"
          loading={loading}
        />
        <StatCard
          icon={Trophy}
          label="Tasks Completed"
          value={fmt(stats?.totalTasksCompleted)}
          sub={`${fmt(stats?.totalTasks)} total tasks assigned`}
          gradient="bg-gradient-to-br from-green-500 to-emerald-400"
          loading={loading}
        />
      </div>

      {/* Mini stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MiniCard icon={Eye}        label="Total Views"      value={fmt(stats?.totalViews)}          color="blue"   loading={loading} />
        <MiniCard icon={Heart}      label="Total Likes"      value={fmt(stats?.totalLikes)}          color="pink"   loading={loading} />
        <MiniCard icon={Megaphone}  label="Campaigns Joined" value={fmt(stats?.totalCampaigns)}      color="purple" loading={loading} />
        <MiniCard icon={CheckSquare} label="Task Records"    value={fmt(stats?.totalTaskRecords)}    color="teal"   loading={loading} />
        <MiniCard icon={BarChart2}  label="Total Tasks"      value={fmt(stats?.totalTasks)}          color="orange" loading={loading} />
        <MiniCard icon={Star}       label="Accepted Credits" value={fmt(stats?.acceptedCredits)}     color="yellow" loading={loading} />
      </div>

      {/* Earnings breakdown */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-500" /> Earnings Breakdown
        </h3>
        {[
          { label: "Available Balance",  value: stats?.totalEarnings  || 0, color: "bg-green-500",  pct: 100 },
          { label: "Pending Credits",    value: stats?.pendingCredits || 0, color: "bg-yellow-400", pct: stats?.totalEarnings ? Math.round((stats.pendingCredits / (stats.totalEarnings + stats.pendingCredits)) * 100) : 0 },
          { label: "Total Withdrawn",    value: stats?.totalWithdrawn || 0, color: "bg-blue-500",   pct: stats?.acceptedCredits ? Math.round((stats.totalWithdrawn / stats.acceptedCredits) * 100) : 0 },
        ].map(row => (
          <div key={row.label} className="mb-3 last:mb-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 font-medium">{row.label}</span>
              <span className="font-bold text-gray-800">₹{row.value.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${row.color}`}
                style={{ width: `${Math.min(100, row.pct)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Task progress */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-500" /> Task Progress
        </h3>
        <div className="flex items-center gap-4">
          {/* Circle */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="#f97316" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - (stats?.totalTasks ? (stats.totalTasksCompleted / stats.totalTasks) : 0))}`}
                strokeLinecap="round" className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-800">
                {stats?.totalTasks ? Math.round((stats.totalTasksCompleted / stats.totalTasks) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {[
              { label: "Completed", value: stats?.totalTasksCompleted || 0, color: "text-green-600" },
              { label: "Total Assigned", value: stats?.totalTasks || 0, color: "text-orange-600" },
              { label: "Records Submitted", value: stats?.totalTaskRecords || 0, color: "text-blue-600" },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{r.label}</span>
                <span className={`font-bold ${r.color}`}>{r.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
