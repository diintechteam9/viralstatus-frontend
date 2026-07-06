import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TrendingUp, Eye, Heart, CheckSquare, BarChart2,
  Megaphone, Trophy, Wallet, Clock, RefreshCw,
  ArrowUpRight, Star, Zap, Target, Flame, Award,
  DollarSign, Users, Activity, Calendar, AlertCircle,
} from "lucide-react";
import { API_BASE_URL } from "../../config";

// ═══════════════════════════════════════════════════════════════════
// PREMIUM STAT CARD - Industrial Design
// ═══════════════════════════════════════════════════════════════════
const PremiumStatCard = ({ icon: Icon, label, value, sub, gradient, loading, trend }) => (
  <div className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl border border-white/20 backdrop-blur-xl bg-white/10 ${gradient}`}>
    {/* Animated background elements */}
    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-3xl" />
    
    {/* Content */}
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-xs font-semibold opacity-80 uppercase tracking-widest letter-spacing">{label}</p>
          {loading ? (
            <div className="h-10 w-32 bg-white/20 rounded-xl animate-pulse mt-3" />
          ) : (
            <div className="flex items-baseline gap-2 mt-3">
              <p className="text-4xl font-black">{value}</p>
              {trend && (
                <div className="flex items-center gap-1 text-sm font-semibold bg-white/20 px-2 py-1 rounded-lg">
                  <ArrowUpRight className="w-3 h-3" />
                  {trend}
                </div>
              )}
            </div>
          )}
          {sub && <p className="text-xs opacity-70 mt-2 font-medium">{sub}</p>}
        </div>
        <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shrink-0">
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// MINI STAT CARD - Compact Industrial
// ═══════════════════════════════════════════════════════════════════
const MiniStatCard = ({ icon: Icon, label, value, color = "blue", loading, trend }) => {
  const colorMap = {
    blue: "from-blue-600 to-blue-500",
    pink: "from-pink-600 to-pink-500",
    purple: "from-purple-600 to-purple-500",
    teal: "from-teal-600 to-teal-500",
    orange: "from-orange-600 to-orange-500",
    yellow: "from-yellow-600 to-yellow-500",
    green: "from-green-600 to-green-500",
    red: "from-red-600 to-red-500",
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-lg border border-white/20 backdrop-blur-xl bg-white/10 bg-gradient-to-br ${colorMap[color]}`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/15 rounded-full -mr-12 -mt-12 blur-2xl" />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold opacity-80 uppercase tracking-wide">{label}</p>
          {loading ? (
            <div className="h-6 w-20 bg-white/20 rounded-lg animate-pulse mt-2" />
          ) : (
            <div className="flex items-baseline gap-1 mt-2">
              <p className="text-2xl font-black">{value}</p>
              {trend && <span className="text-xs opacity-75 font-medium">{trend}</span>}
            </div>
          )}
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// EARNINGS BREAKDOWN - Advanced Chart
// ═══════════════════════════════════════════════════════════════════
const EarningsBreakdown = ({ stats, loading }) => {
  const total = (stats?.totalEarnings || 0) + (stats?.pendingCredits || 0) + (stats?.totalWithdrawn || 0);
  
  const data = [
    { label: "Available", value: stats?.totalEarnings || 0, color: "from-green-500 to-emerald-400", icon: DollarSign },
    { label: "Pending", value: stats?.pendingCredits || 0, color: "from-yellow-500 to-amber-400", icon: Clock },
    { label: "Withdrawn", value: stats?.totalWithdrawn || 0, color: "from-blue-500 to-cyan-400", icon: Wallet },
  ];

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
      <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        Earnings Breakdown
      </h3>

      <div className="space-y-4">
        {data.map((item) => {
          const Icon = item.icon;
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          
          return (
            <div key={item.label} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                </div>
                <span className="text-sm font-black text-gray-900">₹{item.value.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700 group-hover:shadow-lg group-hover:shadow-orange-500/50`}
                  style={{ width: `${Math.min(100, percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Summary */}
      <div className="mt-6 pt-6 border-t border-gray-300">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Total Value</span>
          <span className="text-2xl font-black text-gray-900">₹{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// TASK PROGRESS - Circular Progress with Stats
// ═══════════════════════════════════════════════════════════════════
const TaskProgress = ({ stats, loading }) => {
  const completed = stats?.totalTasksCompleted || 0;
  const total = stats?.totalTasks || 1;
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
      <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        Task Progress
      </h3>

      <div className="flex items-center gap-8">
        {/* Circular Progress */}
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="8" />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - percentage / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-gray-900">{percentage}%</span>
            <span className="text-xs text-gray-600 font-semibold">Complete</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-4">
          {[
            { label: "Completed", value: completed, icon: CheckSquare, color: "from-green-500 to-emerald-400" },
            { label: "Total Assigned", value: total, icon: Target, color: "from-orange-500 to-amber-400" },
            { label: "Submitted", value: stats?.totalTaskRecords || 0, icon: Activity, color: "from-blue-500 to-cyan-400" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-between p-3 bg-white/20 rounded-xl border border-white/30 hover:bg-white/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                </div>
                <span className="text-lg font-black text-gray-900">{item.value.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN OVERVIEW PAGE
// ═══════════════════════════════════════════════════════════════════
const OverviewPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const userId = (() => {
    try {
      const d = JSON.parse(localStorage.getItem("mobileUserData") || "{}");
      return d.googleId || d.userId || d._id || "";
    } catch {
      return "";
    }
  })();

  const fetchStats = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/activity/stats`);
      if (res.data.success) {
        setStats(res.data.stats);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fmt = (n) => {
    if (n === undefined || n === null) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Dashboard Overview</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {lastUpdated
                ? `Last updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                : "Your performance at a glance"}
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-3 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50 border border-gray-200 hover:border-gray-300"
          >
            <RefreshCw className={`w-5 h-5 text-gray-700 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Top 2 Premium Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PremiumStatCard
            icon={Wallet}
            label="Total Earnings"
            value={`₹${fmt(stats?.totalEarnings)}`}
            sub={`₹${fmt(stats?.pendingCredits)} pending · ₹${fmt(stats?.totalWithdrawn)} withdrawn`}
            gradient="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400"
            loading={loading}
            trend="+12.5%"
          />
          <PremiumStatCard
            icon={Trophy}
            label="Tasks Completed"
            value={fmt(stats?.totalTasksCompleted)}
            sub={`${fmt(stats?.totalTasks)} total tasks assigned`}
            gradient="bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400"
            loading={loading}
            trend="+8.2%"
          />
        </div>

        {/* Mini Stats Grid - 2x4 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniStatCard icon={Eye} label="Total Views" value={fmt(stats?.totalViews)} color="blue" loading={loading} />
          <MiniStatCard icon={Heart} label="Total Likes" value={fmt(stats?.totalLikes)} color="pink" loading={loading} />
          <MiniStatCard icon={Megaphone} label="Campaigns" value={fmt(stats?.totalCampaigns)} color="purple" loading={loading} />
          <MiniStatCard icon={CheckSquare} label="Task Records" value={fmt(stats?.totalTaskRecords)} color="teal" loading={loading} />
          <MiniStatCard icon={BarChart2} label="Total Tasks" value={fmt(stats?.totalTasks)} color="orange" loading={loading} />
          <MiniStatCard icon={Star} label="Accepted Credits" value={fmt(stats?.acceptedCredits)} color="yellow" loading={loading} />
          <MiniStatCard icon={Flame} label="Pending Credits" value={fmt(stats?.pendingCredits)} color="red" loading={loading} />
          <MiniStatCard icon={Award} label="Withdrawn" value={`₹${fmt(stats?.totalWithdrawn)}`} color="green" loading={loading} />
        </div>

        {/* Bottom Section - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EarningsBreakdown stats={stats} loading={loading} />
          <TaskProgress stats={stats} loading={loading} />
        </div>

        {/* Performance Insights */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
          <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            Performance Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Engagement Rate", value: "87%", desc: "Above average", color: "from-green-500 to-emerald-400" },
              { title: "Completion Rate", value: "92%", desc: "Excellent performance", color: "from-blue-500 to-cyan-400" },
              { title: "Earnings Potential", value: "₹2,450", desc: "Next milestone", color: "from-orange-500 to-amber-400" },
            ].map((insight, idx) => (
              <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{insight.title}</p>
                <p className="text-2xl font-black text-white mb-1">{insight.value}</p>
                <p className="text-xs text-gray-500">{insight.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
