import React, { useMemo } from 'react';
import GeoJSONMap from './GeoJSONMap';

const ParticipantsView = (({
  participants,
  participantsLoading,
  participantsError,
  userDetails,
  userDetailsLoading,
  userDetailsError,
  participantsSearch,
  onParticipantsSearchChange,
  participantsSort,
  onParticipantsSortChange,
  participantsVisibleCount,
  onLoadMore,
  hasUserResponded,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onClearSelection,
  onOpenUserDetails,
  onExport,
  isPublicCampaign = false,
  locationStats = {},
  locationFilters = {},
  onLocationFilterChange = () => {},
  campaignId = null,
}) => {
  const processed = useMemo(() => {
    const toName = (userId) => (userDetails[userId]?.name || userId || '').toString();
    let list = [...participants];
    
    if (participantsSearch.trim()) {
      const q = participantsSearch.trim().toLowerCase();
      list = list.filter((id) => toName(id).toLowerCase().includes(q));
    }
    
    if (locationFilters.city) {
      list = list.filter((id) => {
        const userCity = userDetails[id]?.city || '';
        return userCity.toLowerCase().includes(locationFilters.city.toLowerCase());
      });
    }
    
    if (locationFilters.pincode) {
      list = list.filter((id) => {
        const userPincode = userDetails[id]?.pincode || '';
        return userPincode === locationFilters.pincode;
      });
    }
    
    if (participantsSort === 'asc' || participantsSort === 'desc') {
      list.sort((a, b) => {
        const cmp = toName(a).localeCompare(toName(b));
        return participantsSort === 'asc' ? cmp : -cmp;
      });
    }
    return { list, visible: list.slice(0, participantsVisibleCount) };
  }, [
    participants,
    userDetails,
    participantsSearch,
    participantsSort,
    participantsVisibleCount,
    locationFilters,
  ]);

  const completedCount = useMemo(
    () => participants.filter((id) => hasUserResponded(id)).length,
    [participants, hasUserResponded]
  );

  const selectedInList = processed.list.filter((id) => selectedUsers.includes(id)).length;
  const allListSelected =
    processed.list.length > 0 && processed.list.every((id) => selectedUsers.includes(id));
  const someListSelected = selectedInList > 0 && !allListSelected;

  const handleHeaderCheckbox = () => {
    if (allListSelected) {
      onClearSelection?.(processed.list);
    } else {
      onSelectAll?.(processed.list);
    }
  };

  return (
    <div className="w-full max-w-6xl mb-8 space-y-6">
      {/* GeoJSON Map Section */}
      {campaignId && (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>🗺️ Participant Location Map</span>
              <span className="text-sm font-normal text-gray-500">({participants.length} participants)</span>
            </h2>
          </div>
          <GeoJSONMap campaignId={campaignId} height={400} />
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Active Participants
            <span className="ml-2 text-base font-semibold text-green-600">
              ({participants.length})
            </span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isPublicCampaign
              ? "Public campaign — reels assign to all registered users from Tasks tab. No participant selection needed."
              : "Click a row for full profile & activity. Select users for task assignment in Tasks tab."}{' '}
            {completedCount} completed response(s).
          </p>
        </div>
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Export CSV
          </button>
        )}
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-orange-200 bg-orange-50">
          <p className="text-sm font-medium text-orange-900">
            <strong>{selectedUsers.length}</strong> participant(s) selected for Tasks tab
          </p>
          <button
            type="button"
            onClick={() => onClearSelection?.()}
            className="text-sm font-medium text-orange-800 hover:text-orange-950 underline"
          >
            Clear all selection
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        {participantsLoading ? (
          <div className="text-gray-500">Loading participants...</div>
        ) : participantsError ? (
          <div className="text-red-500">{participantsError}</div>
        ) : participants.length === 0 ? (
          <div className="text-gray-400">No active participants.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-3">Location Filters</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={locationFilters.city || ''}
                    onChange={(e) => onLocationFilterChange({ ...locationFilters, city: e.target.value })}
                    placeholder="Filter by city"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={locationFilters.pincode || ''}
                    onChange={(e) => onLocationFilterChange({ ...locationFilters, pincode: e.target.value })}
                    placeholder="Filter by pincode"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stats</label>
                  <div className="text-xs text-gray-600 bg-white border border-gray-200 rounded px-2 py-1.5">
                    <p>Cities: {Object.keys(locationStats.byCity || {}).length}</p>
                    <p>Pincodes: {Object.keys(locationStats.byPincode || {}).length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <input
                type="text"
                value={participantsSearch}
                onChange={(e) => onParticipantsSearchChange(e.target.value)}
                placeholder="Search by user name"
                className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search participants"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`px-3 py-2 rounded border text-sm ${
                    participantsSort === 'asc'
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                  onClick={() => onParticipantsSortChange('asc')}
                >
                  A–Z
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 rounded border text-sm ${
                    participantsSort === 'desc'
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                  onClick={() => onParticipantsSortChange('desc')}
                >
                  Z–A
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border border-gray-100 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-center w-10">
                      <input
                        type="checkbox"
                        checked={allListSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someListSelected;
                        }}
                        onChange={handleHeaderCheckbox}
                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        aria-label="Select all visible participants"
                        title={allListSelected ? 'Deselect all' : 'Select all (filtered list)'}
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">City</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Pincode</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Task status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {processed.visible.map((userId, idx) => {
                    const isSelected = selectedUsers.includes(userId);
                    return (
                      <tr
                        key={userId}
                        className={`group cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-orange-50/90 hover:bg-orange-100/80'
                            : 'hover:bg-yellow-50/80'
                        }`}
                        onClick={(e) => {
                          if (e.target.closest('input')) return;
                          onOpenUserDetails(userId);
                        }}
                      >
                        <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelectUser(userId)}
                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            aria-label={`Select ${userDetails[userId]?.name || userId}`}
                          />
                        </td>
                        <td className="px-4 py-2 text-gray-900">{idx + 1}</td>
                        <td className="px-4 py-2 text-gray-900 font-medium">
                          {userDetailsLoading[userId] ? (
                            <span className="text-gray-400">Loading...</span>
                          ) : userDetailsError[userId] ? (
                            <span className="text-red-500">{userDetailsError[userId]}</span>
                          ) : (
                            userDetails[userId]?.name || userId
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {userDetails[userId]?.email || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {userDetails[userId]?.city || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {userDetails[userId]?.pincode || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-2">
                          {hasUserResponded(userId) ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Showing {processed.visible.length} of {processed.list.length} (filtered).{' '}
              {selectedInList > 0 && `${selectedInList} selected in this list.`}
            </p>
            {processed.list.length > processed.visible.length && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded border text-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  onClick={onLoadMore}
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default ParticipantsView;
