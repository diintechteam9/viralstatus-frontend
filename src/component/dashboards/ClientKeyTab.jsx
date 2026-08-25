import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import { FaKey, FaTrash, FaCopy, FaEye, FaEyeSlash, FaPlus } from "react-icons/fa";

const ClientKeyTab = () => {
  const [clientKey, setClientKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const fetchKey = async () => {
    try {
      setLoading(true);
      const token =
        sessionStorage.getItem("clienttoken") || localStorage.getItem("clienttoken");
      const res = await fetch(`${API_BASE_URL}/api/client/key`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setClientKey(data.clientKey);
      }
    } catch (error) {
      console.error("Failed to fetch client key:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKey();
  }, []);

  const handleGenerateKey = async () => {
    if (clientKey) {
      const confirm = window.confirm("Generating a new key will immediately invalidate your old key. Are you sure you want to proceed?");
      if (!confirm) return;
    }
    
    try {
      setActionLoading(true);
      const token =
        sessionStorage.getItem("clienttoken") || localStorage.getItem("clienttoken");
      const res = await fetch(`${API_BASE_URL}/api/client/key/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setClientKey(data.clientKey);
        setShowKey(true); // Automatically show the newly generated key
        alert("New Client Key generated successfully!");
      }
    } catch (error) {
      alert("Failed to generate key. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteKey = async () => {
    const confirm = window.confirm("Are you sure you want to revoke this key? Any application using it will stop working immediately.");
    if (!confirm) return;

    try {
      setActionLoading(true);
      const token =
        sessionStorage.getItem("clienttoken") || localStorage.getItem("clienttoken");
      const res = await fetch(`${API_BASE_URL}/api/client/key`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setClientKey(null);
        setShowKey(false);
      }
    } catch (error) {
      alert("Failed to revoke key.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = () => {
    if (clientKey) {
      navigator.clipboard.writeText(clientKey);
      alert("Client Key copied to clipboard!");
    }
  };

  const maskedKey = clientKey
    ? `${clientKey.slice(0, 4)}........................${clientKey.slice(-4)}`
    : "";

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <FaKey className="text-violet-600" /> API Keys
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Your secret API keys are listed below. Please note that we do not display your secret API keys again after you generate them.
          Do not share your API key with others, or expose it in the browser or other client-side code.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">Secret key</h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center gap-3 text-gray-400">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Loading key...</span>
            </div>
          ) : clientKey ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={showKey ? clientKey : maskedKey}
                      readOnly
                      className="w-full pl-4 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700 outline-none"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        onClick={() => setShowKey(!showKey)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                        title={showKey ? "Hide key" : "Show key"}
                      >
                        {showKey ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      <button
                        onClick={handleCopy}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                        title="Copy key"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDeleteKey}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <FaTrash className="text-xs" />
                  Revoke key
                </button>
              </div>
              <p className="mt-3 text-xs text-amber-600 font-medium">
                If you revoke this key, any application using it will stop working immediately.
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <FaKey className="text-gray-400 text-xl" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No API key found</h3>
              <p className="text-sm text-gray-500">You don't have an active API key.</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <button
          onClick={handleGenerateKey}
          disabled={actionLoading || loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {actionLoading && !clientKey ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <FaPlus className="text-xs" />
          )}
          Create new secret key
        </button>
      </div>
    </div>
  );
};

export default ClientKeyTab;
