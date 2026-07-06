import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Gift,
  RefreshCw,
  Filter,
  Search,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Zap,
  Award,
  DollarSign,
  Clock,
} from "lucide-react";
import { API_BASE_URL } from "../../config";

const getAxiosInstance = () => {
  const token = localStorage.getItem("mobileUserToken");
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    fetchTransactions();
    fetchStats();
    fetchSummary();
  }, [page, filterType, dateRange]);

  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "3m":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        return {};
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const axiosInstance = getAxiosInstance();
      const dateParams = getDateRange();
      const params = {
        page,
        limit: 15,
        ...(filterType !== "all" && { type: filterType }),
        ...dateParams,
      };

      let endpoint = "/api/transaction-history";
      if (filterType === "earning" || filterType === "campaign_reward") {
        endpoint = "/api/transaction-history/earnings";
      } else if (filterType === "penalty") {
        endpoint = "/api/transaction-history/penalties";
      }

      const res = await axiosInstance.get(endpoint, { params });
      if (res.data.success) {
        setTransactions(res.data.transactions || res.data.earnings || res.data.penalties || []);
        setTotalPages(Math.ceil((res.data.total || 0) / 15));
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const axiosInstance = getAxiosInstance();
      const dateParams = getDateRange();
      const res = await axiosInstance.get("/api/transaction-history/stats", {
        params: dateParams,
      });
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchSummary = async () => {
    try {
      const axiosInstance = getAxiosInstance();
      const res = await axiosInstance.get("/api/transaction-history/summary");
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "earning":
      case "campaign_reward":
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "penalty":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "bonus":
        return <Gift className="w-5 h-5 text-purple-500" />;
      case "refund":
        return <DollarSign className="w-5 h-5 text-blue-500" />;
      default:
        return <Zap className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "earning":
      case "campaign_reward":
        return "bg-green-50 border-green-200";
      case "penalty":
        return "bg-red-50 border-red-200";
      case "bonus":
        return "bg-purple-50 border-purple-200";
      case "refund":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getAmountColor = (amount) => {
    return amount > 0 ? "text-green-600" : "text-red-600";
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  const filteredTransactions = transactions.filter((tx) =>
    tx.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Transaction History
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Track your earnings, penalties, and bonuses
              </p>
            </div>
            <button
              onClick={() => {
                fetchTransactions();
                fetchStats();
                fetchSummary();
              }}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-gray-700 rounded-lg transition-colors disabled:opacity-60 text-sm border border-white/30"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <StatCard
              icon={TrendingUp}
              label="Last 30 Days Earnings"
              value={`₹${summary.last30Days.earnings.toLocaleString()}`}
              color="bg-green-500"
            />
            <StatCard
              icon={AlertCircle}
              label="Last 30 Days Penalties"
              value={`₹${summary.last30Days.penalties.toLocaleString()}`}
              color="bg-red-500"
            />
            <StatCard
              icon={Gift}
              label="Last 30 Days Bonuses"
              value={`₹${summary.last30Days.bonuses.toLocaleString()}`}
              color="bg-purple-500"
            />
            <StatCard
              icon={Award}
              label="Net (Last 30 Days)"
              value={`₹${summary.last30Days.net.toLocaleString()}`}
              color={summary.last30Days.net > 0 ? "bg-blue-500" : "bg-orange-500"}
            />
          </div>
        )}

        {/* Stats Section */}
        {stats && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Statistics ({dateRange === "all" ? "All Time" : dateRange})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stats.earningCount}
                </p>
                <p className="text-xs text-gray-600">Earnings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {stats.penaltyCount}
                </p>
                <p className="text-xs text-gray-600">Penalties</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {stats.bonusCount}
                </p>
                <p className="text-xs text-gray-600">Bonuses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  ₹{stats.totalEarnings.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">Total Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  ₹{stats.totalPenalties.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">Total Penalties</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${getAmountColor(stats.netAmount)}`}>
                  ₹{stats.netAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">Net Amount</p>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Section */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg">
          <div className="p-4 sm:p-6 border-b border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Transactions
              </h2>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-white/30 bg-white/20 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm text-gray-900 placeholder-gray-600"
                  />
                </div>
              </div>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-white/30 bg-white/20 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm text-gray-900"
              >
                <option value="all">All Types</option>
                <option value="earning">Earnings</option>
                <option value="campaign_reward">Campaign Rewards</option>
                <option value="penalty">Penalties</option>
                <option value="bonus">Bonuses</option>
                <option value="refund">Refunds</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-white/30 bg-white/20 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm text-gray-900"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="3m">Last 3 Months</option>
                <option value="1y">Last Year</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="divide-y divide-white/20">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin">
                  <RefreshCw className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-gray-600 mt-2">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No transactions found</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx._id}
                  className={`p-4 sm:p-6 hover:bg-white/20 transition-colors border-l-4 ${
                    tx.amount > 0 ? "border-green-500" : "border-red-500"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 rounded-lg bg-white/20">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {tx.description}
                          </h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-white/30 text-gray-700 whitespace-nowrap">
                            {tx.type}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-600">
                          <span>
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </span>
                          {tx.meta?.reason && (
                            <span className="hidden sm:inline">
                              • {tx.meta.reason}
                            </span>
                          )}
                          <span className="hidden sm:inline">
                            • Balance: ₹{tx.balanceAfter.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getAmountColor(tx.amount)}`}>
                        {tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {tx.status === "completed" ? "✓ Completed" : tx.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 sm:p-6 border-t border-white/20 flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-gray-700 rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-gray-700 rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
