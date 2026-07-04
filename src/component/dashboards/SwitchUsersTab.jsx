import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import {
  FaUsers, FaSearch, FaExchangeAlt, FaCheckCircle,
  FaTimesCircle, FaTimes, FaShieldAlt, FaSpinner,
  FaSignInAlt, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";

const getAdminToken = () =>
  localStorage.getItem("admintoken") ||
  sessionStorage.getItem("admintoken");

const authH = () => ({ Authorization: `Bearer ${getAdminToken()}` });

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ user, onConfirm, onCancel, loading }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5" style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <FaShieldAlt className="text-white" size={16} />
            </div>
            <div>
              <p className="text-white font-bold text-base">Login as User</p>
              <p className="text-white/70 text-xs">Admin impersonation — session is temporary</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-2">You are about to view the app as:</p>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-4">
            <p className="font-bold text-gray-900 text-sm">{user.name || "—"}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            {user.mobile && <p className="text-xs text-gray-400 mt-0.5">{user.mobile}</p>}
          </div>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
            ⚠️ This session lasts 2 hours. Your admin session is preserved. Exit anytime via the top banner.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-sm transition disabled:opacity-60"
              style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }}
            >
              {loading
                ? <><FaSpinner className="animate-spin" size={13} /> Logging in…</>
                : <><FaSignInAlt size={13} /> Confirm Login</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export default function SwitchUsersTab({ onSwitchSuccess }) {
  const [users,       setUsers]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [confirmUser, setConfirmUser] = useState(null);
  const [switching,   setSwitching]   = useState(false);
  const [error,       setError]       = useState("");
  const LIMIT = 20;

  const fetchUsers = useCallback(async (q, p) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: authH(),
        params: { search: q ?? search, page: p ?? page, limit: LIMIT },
      });
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchUsers(search, page); }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(search, 1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleLogin = async () => {
    if (!confirmUser) return;
    setSwitching(true);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/admin/switch-user/${confirmUser._id}`,
        {},
        { headers: authH() }
      );
      if (data.success) {
        // Backup admin session
        localStorage.setItem("admintoken_backup", localStorage.getItem("admintoken") || "");
        localStorage.setItem("adminData_backup",  localStorage.getItem("adminData")  || "");
        localStorage.setItem("isAdminSwitch", "true");
        // Set user session
        localStorage.setItem("mobileUserToken", data.token);
        localStorage.setItem("mobileUserData",  JSON.stringify(data.userData));
        if (data.userData.googleId) localStorage.setItem("googleId", data.userData.googleId);

        setConfirmUser(null);
        onSwitchSuccess?.();
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
      setSwitching(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="w-full space-y-4">
      {confirmUser && (
        <ConfirmModal
          user={confirmUser}
          loading={switching}
          onConfirm={handleLogin}
          onCancel={() => { setConfirmUser(null); setSwitching(false); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <FaUsers className="text-violet-600" size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Switch Users</h2>
            <p className="text-xs text-gray-500">Login as any user to view their dashboard</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold">
          <FaShieldAlt size={11} /> All switches are audit-logged
        </span>
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or mobile…"
            className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <FaTimes size={11} />
            </button>
          )}
        </div>
        {!loading && (
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm flex items-center gap-2 shrink-0">
            <span className="text-base font-bold text-violet-600">{total}</span>
            <span className="text-xs text-gray-500 font-medium">Total Users</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center justify-between">
          {error}
          <button onClick={() => { setError(""); fetchUsers(search, page); }} className="text-xs underline ml-3">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <FaUsers className="text-gray-300 mb-3" size={32} />
            <p className="font-semibold text-gray-500 text-sm">
              {search ? "No users match your search" : "No users found"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <table className="w-full text-sm" style={{ minWidth: "700px" }}>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-10">#</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-24">Mobile</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-20">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-28">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-24">Joined</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const serial = (page - 1) * LIMIT + idx + 1;
                  const initial = (u.name || u.email || "U")[0].toUpperCase();
                  const verified = u.emailVerified;
                  const complete = (u.registrationStep || 0) >= 3;
                  return (
                    <tr
                      key={u._id}
                      className="border-b border-gray-50 hover:bg-violet-50/40 transition-colors"
                    >
                      {/* # */}
                      <td className="px-4 py-3 text-gray-400 text-xs">{serial}</td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <span className="font-semibold text-gray-900 text-xs truncate max-w-[110px]">
                            {u.name || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px]">
                        <span className="block truncate">{u.email}</span>
                      </td>

                      {/* Mobile */}
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {u.mobile || "—"}
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3">
                        {u.clientCode
                          ? <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{u.clientCode}</span>
                          : <span className="text-gray-300 text-xs">—</span>
                        }
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {verified
                            ? <FaCheckCircle size={10} className="text-green-500 shrink-0" />
                            : <FaTimesCircle size={10} className="text-gray-300 shrink-0" />
                          }
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                            complete
                              ? "bg-green-50 text-green-700 border border-green-100"
                              : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                          }`}>
                            {complete ? "Complete" : `Step ${u.registrationStep || 0}`}
                          </span>
                        </div>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setConfirmUser(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition hover:opacity-90 shadow-sm whitespace-nowrap"
                          style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }}
                        >
                          <FaSignInAlt size={10} /> Login
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} users
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); fetchUsers(search, p); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 transition"
              >
                <FaChevronLeft size={11} />
              </button>
              <span className="text-xs font-semibold text-gray-700 px-1">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => { const p = page + 1; setPage(p); fetchUsers(search, p); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 transition"
              >
                <FaChevronRight size={11} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
