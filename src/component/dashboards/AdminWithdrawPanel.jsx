import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Wallet, CheckCircle, XCircle, Clock, RefreshCw,
  Search, Eye, Banknote, Smartphone, AlertCircle, IndianRupee,
} from "lucide-react";
import { API_BASE_URL } from "../../config";

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

// ── Process Modal ─────────────────────────────────────────────────────────────
const ProcessModal = ({ req, token, onClose, onUpdated }) => {
  const [action, setAction]        = useState("");
  const [txnId, setTxnId]          = useState("");
  const [reason, setReason]        = useState("");
  const [loading, setLoading]      = useState(false);
  const [error, setError]          = useState("");

  const handleProcess = async () => {
    if (!action) return setError("Select an action");
    if (action === "completed" && !txnId.trim()) return setError("Transaction ID required for completion");
    if (action === "rejected" && !reason.trim()) return setError("Rejection reason required");
    setLoading(true);
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/api/withdraw/admin/${req._id}`,
        { status: action, transactionId: txnId, rejectionReason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) { onUpdated(res.data.request); onClose(); }
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-800">Process Withdrawal</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl">
            <XCircle className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Request info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-gray-800">₹{req.amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Method</span>
              <span className="font-semibold text-gray-700 capitalize">{req.method}</span>
            </div>
            {req.method === "upi" && req.upiId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">UPI ID</span>
                <span className="font-semibold text-gray-700">{req.upiId}</span>
              </div>
            )}
            {req.method === "bank" && req.bankName && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bank</span>
                  <span className="font-semibold text-gray-700">{req.bankName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Account</span>
                  <span className="font-semibold text-gray-700">
                    {req.accountNumber ? `XXXX${req.accountNumber.slice(-4)}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IFSC</span>
                  <span className="font-semibold text-gray-700">{req.ifscCode}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">User ID</span>
              <span className="font-mono text-xs text-gray-600 truncate max-w-[160px]">{req.userId}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "processing", label: "Mark Processing", color: "blue" },
              { key: "completed",  label: "Mark Paid",       color: "green" },
              { key: "rejected",   label: "Reject",          color: "red" },
            ].map(a => (
              <button key={a.key} onClick={() => setAction(a.key)}
                className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all
                  ${action === a.key
                    ? `border-${a.color}-500 bg-${a.color}-50 text-${a.color}-700`
                    : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                {a.label}
              </button>
            ))}
          </div>

          {action === "completed" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Transaction ID <span className="text-red-400">*</span></label>
              <input
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                placeholder="UTR / Transaction ID"
                value={txnId} onChange={e => setTxnId(e.target.value)}
              />
            </div>
          )}

          {action === "rejected" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Rejection Reason <span className="text-red-400">*</span></label>
              <textarea
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none resize-none"
                rows={2} placeholder="Reason for rejection..."
                value={reason} onChange={e => setReason(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={handleProcess} disabled={loading || !action}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</> : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AdminWithdrawPanel = () => {
  const [list, setList]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [statusFilter, setStatus] = useState("");
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);

  const token = localStorage.getItem("admintoken") || localStorage.getItem("adminToken") || localStorage.getItem("token");

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set("status", statusFilter);
      const res = await axios.get(`${API_BASE_URL}/api/withdraw/admin/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) { setList(res.data.withdrawals || []); setTotal(res.data.total || 0); }
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, [page, statusFilter]);

  const handleUpdated = (updated) => {
    setList(prev => prev.map(r => r._id === updated._id ? updated : r));
  };

  const filtered = search
    ? list.filter(r => r.userId?.includes(search) || r.upiId?.includes(search) || r.bankName?.toLowerCase().includes(search.toLowerCase()))
    : list;

  const totalPages = Math.ceil(total / 20);

  // Summary stats
  const pending   = list.filter(r => r.status === "pending").length;
  const totalAmt  = list.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-800">Withdrawal Requests</h2>
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">{total}</span>
        </div>
        <button onClick={fetchList} disabled={loading} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-xs text-yellow-700 font-medium">Pending Requests</p>
          <p className="text-2xl font-bold text-yellow-800 mt-1">{pending}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-xs text-orange-700 font-medium">Pending Amount</p>
          <p className="text-2xl font-bold text-orange-800 mt-1">₹{totalAmt.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="Search by user ID, UPI, bank..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
          value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Wallet className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No withdrawal requests found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(r => (
              <div key={r._id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                  ${r.method === "upi" ? "bg-green-100" : "bg-blue-100"}`}>
                  {r.method === "upi"
                    ? <Smartphone className="w-5 h-5 text-green-600" />
                    : <Banknote className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800">₹{r.amount?.toLocaleString()}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {r.method === "upi" ? `UPI: ${r.upiId}` : `Bank: ${r.bankName}`}
                    {" · "}
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-xs text-gray-400 font-mono truncate">{r.userId}</p>
                </div>
                {(r.status === "pending" || r.status === "processing") && (
                  <button onClick={() => setSelected(r)}
                    className="p-2 hover:bg-orange-50 rounded-xl transition-all shrink-0">
                    <Eye className="w-4 h-4 text-orange-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-all">Previous</button>
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-all">Next</button>
          </div>
        )}
      </div>

      {selected && (
        <ProcessModal req={selected} token={token} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      )}
    </div>
  );
};

export default AdminWithdrawPanel;
