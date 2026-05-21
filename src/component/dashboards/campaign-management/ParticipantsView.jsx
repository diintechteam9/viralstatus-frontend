import React, { useMemo } from 'react';

const ParticipantsView = ({
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
  onOpenUserDetails,
  onExport,
}) => {
  const processed = useMemo(() => {
    const toName = (userId) => (userDetails[userId]?.name || userId || '').toString();
    let list = [...participants];
    if (participantsSearch.trim()) {
      const q = participantsSearch.trim().toLowerCase();
      list = list.filter((id) => toName(id).toLowerCase().includes(q));
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
  ]);

  const completedCount = useMemo(
    () => participants.filter((id) => hasUserResponded(id)).length,
    [participants, hasUserResponded]
  );

  return (
    <div className="w-full max-w-6xl mb-8 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Active Participants
            <span className="ml-2 text-base font-semibold text-green-600">
              ({participants.length})
            </span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            View-only list — assign tasks from the Tasks tab. {completedCount} completed response(s).
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

      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        {participantsLoading ? (
          <div className="text-gray-500">Loading participants...</div>
        ) : participantsError ? (
          <div className="text-red-500">{participantsError}</div>
        ) : participants.length === 0 ? (
          <div className="text-gray-400">No active participants.</div>
        ) : (
          <div className="overflow-x-auto">
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
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">City</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Task status</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                      Select for Tasks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {processed.visible.map((userId, idx) => (
                    <tr
                      key={userId}
                      className="group cursor-pointer hover:bg-yellow-50/80 transition-colors"
                      onClick={(e) => {
                        if (e.target.closest('button') || e.target.closest('input')) return;
                        onOpenUserDetails(userId);
                      }}
                    >
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
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={(e) => {
                            e.stopPropagation();
                            onSelectUser(userId);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          aria-label={`Select ${userDetails[userId]?.name || userId} for task assignment`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
};

export default ParticipantsView;
