import React, { useState, useEffect } from "react";
import PoolReels from "./PoolReels";
import { API_BASE_URL } from "../../config";

const FolderIcon = ({ open }) => (
  <svg
    className={`w-8 h-8 mr-2 ${open ? "text-yellow-500" : "text-yellow-400"}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7a2 2 0 012-2h3.172a2 2 0 011.414.586l1.828 1.828A2 2 0 0012.828 8H19a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      fill={open ? "#FBBF24" : "#FDE68A"}
    />
  </svg>
);

const ContentPoolFolderView = ({ onPoolReelSelectionChange, clientId: propClientId, googleId: propGoogleId }) => {
  const [pools, setPools] = useState([]);
  const [expandedPoolId, setExpandedPoolId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedReelsByPool, setSelectedReelsByPool] = useState({}); // { poolId: [reelId, ...] }

  // Resolve identifiers from props, sessionStorage, or localStorage
  let sessionUser = {};
  try {
    sessionUser = JSON.parse(
      (typeof window !== 'undefined' ? localStorage.getItem('clientData') : null) ||
      (typeof window !== 'undefined' ? sessionStorage.getItem('clientData') : null) ||
      (typeof window !== 'undefined' ? sessionStorage.getItem('userData') : null) ||
      '{}'
    );
  } catch {}
  const effectiveClientId = propClientId || sessionUser._id || sessionUser.id || sessionUser.clientId;
  const idQuery = effectiveClientId
    ? `clientId=${encodeURIComponent(effectiveClientId)}`
    : "";

  useEffect(() => {
    const fetchPools = async () => {
      setLoading(true);
      setError("");
      try {
        if (!idQuery) {
          setError('Missing clientId or googleId');
          setPools([]);
          return;
        }
        const res = await fetch(`${API_BASE_URL}/api/pools?${idQuery}`);
        const data = await res.json();
        if (res.ok) {
          setPools(data.pools || []);
        } else {
          setError(data.error || "Failed to fetch pools");
        }
      } catch (err) {
        setError("Failed to fetch pools");
      } finally {
        setLoading(false);
      }
    };
    fetchPools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idQuery]);

  const handleToggle = (poolId) => {
    setExpandedPoolId(expandedPoolId === poolId ? null : poolId);
  };

  const handleReelSelection = (poolId, selectedReels) => {
    setSelectedReelsByPool((prev) => {
      const updated = { ...prev, [poolId]: selectedReels };
      if (onPoolReelSelectionChange) {
        onPoolReelSelectionChange(updated);
      }
      return updated;
    });
  };

  if (loading)
    return (
      <div className="py-8 text-center text-gray-500">Loading pools...</div>
    );
  if (error)
    return <div className="py-8 text-center text-red-500">{error}</div>;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {pools.length === 0 && (
        <div className="text-gray-400 text-center py-8">No pools found.</div>
      )}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {pools.map((pool) => (
          <div key={pool._id} className="flex-shrink-0">
            <div
              className={`flex flex-col items-center justify-center border rounded-xl bg-white shadow-md px-6 py-5 min-w-[180px] max-w-xs cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-yellow-400  ${
                expandedPoolId === pool._id
                  ? "border-yellow-400 ring-2 ring-yellow-200"
                  : "border-gray-200"
              }`}
              onClick={() => handleToggle(pool._id)}
            >
              <FolderIcon open={expandedPoolId === pool._id} />
              <div className="text-base font-semibold text-green-700 text-center truncate w-full">
                {pool.name}
              </div>
              {pool.category ? (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full mt-2 min-h-[22px] block">
                  {pool.category}
                </span>
              ) : (
                <span className="invisible mt-2 min-h-[22px] block">
                  placeholder
                </span>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {pool.reelCount || 0} reels
              </div>
            </div>
            {expandedPoolId === pool._id && (
              <div className="mt-2 bg-gray-50 rounded-xl shadow-inner p-4">
                <PoolReels
                  pool={pool}
                  onSelectedReelsChange={(reels) =>
                    handleReelSelection(pool._id, reels)
                  }
                  hideDelete={false}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentPoolFolderView;
