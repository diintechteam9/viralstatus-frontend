import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Wallet, ArrowUpRight, Clock, CheckCircle, XCircle,
  AlertCircle, Shield, Banknote, Smartphone, ChevronRight,
  RefreshCw, IndianRupee, TrendingUp, History,
} from "lucide-react";
import { API_BASE_URL } from "../../config";

// Create axios instance with Bearer token
const getAxiosInstance = () => {
  const token = localStorage.getItem("mobileUserToken");
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

const STATUS_CFG = {
  pending:    { label: "Pending",    cls: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  processing: { label: "Processing", cls: "bg-blue-100 text-blue-700 border-blue-200",       icon: RefreshCw },
  completed:  { label: "Paid",       cls: "bg-green-100 text-green-700 border-green-200",    icon: CheckCircle },
  rejected:   { label: "Rejected",   cls: "bg-red-100 text-red-700 border-red-200",          icon: XCircle },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color = "orange" }) => {
  const colorMap = {
    orange: "from-orange-600 to-orange-500",
    yellow: "from-yellow-600 to-yellow-500",
    green: "from-green-600 to-green-500",
    blue: "from-blue-600 to-blue-500",
  };
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-lg">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-r ${colorMap[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-xs text-gray-600 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
};

// ── Withdraw Request Modal ────────────────────────────────────────────────────
const WithdrawModal = ({ wallet, kyc, onClose, onSuccess }) => {
  const [method, setMethod]   = useState("upi");
  const [amount, setAmount]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const maxAmount = wallet?.totalBalance || 0;

  const handleSubmit = async () => {
    setError("");
    const amt = Number(amount);
    if (!amt || amt < 100)       return setError("Minimum withdrawal is ₹100");
    if (amt > maxAmount)         return setError(`Insufficient balance. Max: ₹${maxAmount}`);
    const validMethods = ["bank", "upi"];
    if (!validMethods.includes(method)) return setError("Select payment method");

    if (!kyc || kyc.status !== "approved") {
      return setError("KYC verification required before withdrawal");
    }

    setLoading(true);
    try {
      const axiosInstance = getAxiosInstance();
      const res = await axiosInstance.post(`/api/withdraw`, { amount: amt, method });
      if (res.data.success) {
        onSuccess(res.data.request);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const payInfo = method === "upi"
    ? kyc?.upiId ? `UPI: ${kyc.upiId}` : "No UPI ID in KYC"
    : kyc?.bankName ? `${kyc.bankName} — ${kyc.accountNumber?.slice(-4).padStart(kyc.accountNumber?.length, "X")}` : "No bank details in KYC";

  return (
    <div className="space-y-4">
      <div className="p-5 border-b border-white/20 bg-white/5 rounded-t-2xl">
        <h3 className="font-bold text-gray-900 text-base">Request Withdrawal</h3>
        <p className="text-xs text-gray-600 mt-0.5">Available: <span className="font-bold text-green-600">₹{maxAmount.toLocaleString()}</span></p>
      </div>

      <div className="px-5 space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (₹) <span className="text-red-400">*</span></label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number" min={100} max={maxAmount}
              className="w-full pl-9 pr-4 py-2.5 border border-white/30 bg-white/20 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none text-gray-900 placeholder-gray-600"
              placeholder="Min ₹100"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          {/* Quick amounts */}
          <div className="flex gap-2 mt-2">
            {[100, 250, 500, 1000].filter(a => a <= maxAmount).map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                className="px-3 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg border border-orange-300 font-medium transition-all">
                ₹{a}
              </button>
            ))}
            {maxAmount > 0 && (
              <button onClick={() => setAmount(String(maxAmount))}
                className="px-3 py-1 text-xs bg-white/30 hover:bg-white/40 text-gray-700 rounded-lg border border-white/40 font-medium transition-all">
                Max
              </button>
            )}
          </div>
        </div>

        {/* Method */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "upi",  label: "UPI",         icon: Smartphone, color: "green" },
              { key: "bank", label: "Bank Transfer", icon: Banknote,   color: "blue" },
            ].map(m => (
              <button key={m.key} onClick={() => setMethod(m.key)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all
                  ${method === m.key ? `border-${m.color}-500 bg-${m.color}-50 text-${m.color}-700` : "border-white/30 text-gray-700 hover:border-white/50 bg-white/10"}`}>
                <m.icon className="w-4 h-4" /> {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment info from KYC */}
        <div className="bg-white/20 border border-white/30 rounded-xl p-3">
          <p className="text-xs text-gray-700 font-medium mb-1">Payment will be sent to:</p>
          <p className="text-sm font-semibold text-gray-900">{payInfo}</p>
          <p className="text-xs text-gray-600 mt-1">From your KYC details</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-100 border border-red-300 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>

      <div className="px-5 pb-5 flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 border border-white/30 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white/20 transition-all">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</> : "Request Withdrawal"}
        </button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const WithdrawFlow = ({ onGoToKYC }) => {
  const [wallet, setWallet]         = useState(null);
  const [kyc, setKyc]               = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [toast, setToast]           = useState(null);

  const userId = (() => {
    try { const d = JSON.parse(localStorage.getItem("mobileUserData") || "{}"); return d.googleId || d.userId || d._id || ""; } catch { return ""; }
  })();

  const showToast = (type, text) => { setToast({ type, text }); setTimeout(() => setToast(null), 3500); };

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const axiosInstance = getAxiosInstance();
      const [wRes, kRes] = await Promise.all([
        axiosInstance.get(`/api/withdraw/history?page=${page}&limit=10`),
        axiosInstance.get(`/api/kyc/me`),
      ]);
      if (wRes.data.success) {
        setWithdrawals(wRes.data.withdrawals || []);
        setTotal(wRes.data.total || 0);
        setWallet(wRes.data.wallet);
      }
      if (kRes.data.kyc) setKyc(kRes.data.kyc);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [userId, page]);

  const kycApproved = kyc?.status === "approved";
  const kycStatus   = kyc?.status || "pending";

  const handleSuccess = (req) => {
    setShowModal(false);
    showToast("success", `Withdrawal of ₹${req.amount} requested successfully!`);
    fetchData();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Withdraw Earnings</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Request and track your withdrawal payments
            </p>
          </div>
          <button onClick={fetchData} className="p-3 hover:bg-gray-100 rounded-xl transition-all border border-gray-200">
            <RefreshCw className={`w-5 h-5 text-gray-700 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* KYC Alert */}
        {!kycApproved && (
          <div className={`border rounded-2xl p-4 flex items-start gap-3
            ${kycStatus === "submitted" || kycStatus === "under_review"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-red-50 border-red-200"}`}>
            <Shield className={`w-5 h-5 shrink-0 mt-0.5 ${kycStatus === "submitted" || kycStatus === "under_review" ? "text-yellow-600" : "text-red-600"}`} />
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">
                {kycStatus === "submitted" || kycStatus === "under_review" ? "KYC Under Review" : "KYC Required"}
              </p>
              <p className="text-xs text-gray-700 mt-0.5">
                {kycStatus === "submitted" || kycStatus === "under_review"
                  ? "Your KYC is being reviewed. Withdrawal will be enabled once approved."
                  : "Complete KYC verification to enable withdrawals."}
              </p>
            </div>
            {kycStatus === "pending" || kycStatus === "rejected" ? (
              <button onClick={onGoToKYC}
                className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1">
                Complete KYC <ChevronRight className="w-3 h-3" />
              </button>
            ) : null}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Wallet}      label="Available"       value={`₹${(wallet?.totalBalance || 0).toLocaleString()}`}    sub="Ready to withdraw" color="orange" />
          <StatCard icon={Clock}       label="Pending"         value={`₹${(wallet?.pendingWithdraw || 0).toLocaleString()}`}  sub="In processing"     color="yellow" />
          <StatCard icon={TrendingUp}  label="Total Earned"    value={`₹${(wallet?.acceptedCredits || 0).toLocaleString()}`}  sub="All time"          color="green" />
          <StatCard icon={CheckCircle} label="Total Withdrawn" value={`₹${(wallet?.totalWithdrawn || 0).toLocaleString()}`}   sub="Paid out"          color="blue" />
        </div>

        {/* Withdraw Button */}
        <button
          onClick={() => setShowModal(true)}
          disabled={!kycApproved || (wallet?.totalBalance || 0) < 100}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-2xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ArrowUpRight className="w-5 h-5" />
          {!kycApproved ? "KYC Required to Withdraw" : (wallet?.totalBalance || 0) < 100 ? "Minimum ₹100 Required" : "Request Withdrawal"}
        </button>

        {/* Withdraw Modal */}
        {showModal && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg">
            <WithdrawModal
              wallet={wallet}
              kyc={kyc}
              onClose={() => setShowModal(false)}
              onSuccess={handleSuccess}
            />
          </div>
        )}

        {/* History */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-white/20 flex items-center gap-2 bg-white/5">
            <History className="w-4 h-4 text-gray-600" />
            <h3 className="font-bold text-gray-900 text-sm">Withdrawal History</h3>
            <span className="ml-auto text-xs text-gray-600">{total} requests</span>
          </div>

          {withdrawals.length === 0 ? (
            <div className="p-8 text-center">
              <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600">No withdrawal requests yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/20">
              {withdrawals.map(w => (
                <div key={w._id} className="p-4 flex items-center gap-3 hover:bg-white/10 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                    ${w.status === "completed" ? "bg-green-100" : w.status === "rejected" ? "bg-red-100" : "bg-yellow-100"}`}>
                    {w.method === "upi"
                      ? <Smartphone className={`w-5 h-5 ${w.status === "completed" ? "text-green-600" : w.status === "rejected" ? "text-red-600" : "text-yellow-600"}`} />
                      : <Banknote   className={`w-5 h-5 ${w.status === "completed" ? "text-green-600" : w.status === "rejected" ? "text-red-600" : "text-yellow-600"}`} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">₹{w.amount.toLocaleString()}</p>
                      <StatusBadge status={w.status} />
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {w.method === "upi" ? `UPI: ${w.upiId}` : `Bank: ${w.bankName}`}
                      {" · "}
                      {new Date(w.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {w.transactionId && <p className="text-xs text-green-600 mt-0.5">TXN: {w.transactionId}</p>}
                    {w.rejectionReason && <p className="text-xs text-red-600 mt-0.5">Reason: {w.rejectionReason}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 10 && (
            <div className="p-4 border-t border-white/20 flex items-center justify-between bg-white/5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 text-xs font-semibold border border-white/30 rounded-xl disabled:opacity-40 hover:bg-white/20 transition-all text-gray-700">
                Previous
              </button>
              <span className="text-xs text-gray-600">Page {page} of {Math.ceil(total / 10)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 10)}
                className="px-4 py-2 text-xs font-semibold border border-white/30 rounded-xl disabled:opacity-40 hover:bg-white/20 transition-all text-gray-700">
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawFlow;
