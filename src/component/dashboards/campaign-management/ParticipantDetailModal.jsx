import React, { useState } from 'react';

const StatCard = ({ label, value, sub, color = 'text-gray-900' }) => (
  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/80">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
  </div>
);

const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—');

const activityIcon = (type) => {
  const map = {
    campaign_joined: 'bg-blue-100 text-blue-700',
    task_assigned: 'bg-purple-100 text-purple-700',
    task_accepted: 'bg-green-100 text-green-700',
    task_cancelled: 'bg-orange-100 text-orange-700',
    response_submitted: 'bg-yellow-100 text-yellow-800',
    response_completed: 'bg-emerald-100 text-emerald-800',
  };
  return map[type] || 'bg-gray-100 text-gray-700';
};

const ParticipantDetailModal = ({
  googleId,
  onClose,
  loading,
  error,
  insights,
  isSelected,
  onToggleSelect,
  campaignName,
}) => {
  const [tab, setTab] = useState('overview');
  const p = insights?.profile || {};
  const stats = insights?.stats || {};
  const current = insights?.currentCampaign;

  if (!googleId) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'activity', label: 'Activity' },
    { id: 'credits', label: 'Credits' },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="participant-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-orange-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-4 px-6 py-4 shrink-0"
          style={{ background: 'linear-gradient(90deg, #ffb55e 30%, #ffa53b 100%)' }}
        >
          <div className="min-w-0">
            <h2 id="participant-modal-title" className="text-xl md:text-2xl font-bold text-gray-900 truncate">
              {loading ? 'Loading…' : p.name || 'Participant'}
            </h2>
            <p className="text-sm text-gray-800/90 truncate">{p.email || googleId}</p>
            {current && (
              <p className="text-xs mt-1 font-medium text-gray-900">
                This campaign:{' '}
                {current.hasJoined ? (
                  <span className="text-green-800">Joined {formatDate(current.registeredAt)}</span>
                ) : current.isParticipant ? (
                  <span className="text-amber-800">Active participant (assign only)</span>
                ) : (
                  <span className="text-red-800">Not in this campaign</span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onToggleSelect && (
              <button
                type="button"
                onClick={onToggleSelect}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${
                  isSelected
                    ? 'bg-white text-orange-700 border-orange-300'
                    : 'bg-orange-600/20 text-gray-900 border-orange-200'
                }`}
              >
                {isSelected ? 'Selected for tasks' : 'Select for tasks'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-gray-500">Loading full profile…</div>
        ) : error ? (
          <div className="p-6 text-red-700 bg-red-50 m-4 rounded-lg">{error}</div>
        ) : (
          <>
            <div className="px-6 pt-3 border-b border-gray-100 flex gap-1 overflow-x-auto shrink-0">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {tab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Campaigns joined" value={stats.totalCampaignsJoined ?? 0} />
                    <StatCard label="Credits earned" value={stats.earnedCredits ?? 0} color="text-orange-600" />
                    <StatCard label="Tasks done" value={stats.completedTasks ?? 0} color="text-green-700" />
                    <StatCard label="Wallet balance" value={stats.walletBalance ?? 0} sub="Total balance" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Profile</h3>
                      {[
                        ['Mobile', p.mobileNumber],
                        ['City', p.city],
                        ['Gender', p.gender],
                        ['Occupation', p.occupation],
                        ['Qualification', p.highestQualification],
                      ]
                        .filter(([, v]) => v)
                        .map(([label, val]) => (
                          <div key={label}>
                            <span className="text-xs font-semibold text-orange-700 uppercase">{label}</span>
                            <p className="text-gray-900">{val}</p>
                          </div>
                        ))}
                      {p.socialMedia?.instagram?.handle && (
                        <div>
                          <span className="text-xs font-semibold text-orange-700 uppercase">Instagram</span>
                          <p className="text-gray-900">{p.socialMedia.instagram.handle}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">
                        {campaignName ? `In "${campaignName}"` : 'Current campaign'}
                      </h3>
                      {current ? (
                        <ul className="text-sm text-gray-700 space-y-2 list-disc pl-4">
                          <li>Tasks assigned: {current.tasks?.length ?? 0}</li>
                          <li>Responses: {current.responses?.length ?? 0}</li>
                          <li>
                            Completed:{' '}
                            {current.responses?.filter((r) => r.isTaskCompleted).length ?? 0}
                          </li>
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No campaign context.</p>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <p className="font-bold text-gray-900">{stats.totalViews ?? 0}</p>
                          <p className="text-xs text-gray-500">Views</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <p className="font-bold text-gray-900">{stats.totalLikes ?? 0}</p>
                          <p className="text-xs text-gray-500">Likes</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <p className="font-bold text-gray-900">{stats.totalComments ?? 0}</p>
                          <p className="text-xs text-gray-500">Comments</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'campaigns' && (
                <div className="space-y-4">
                  {(insights?.registrations || []).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No campaigns joined yet.</p>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Campaign</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Joined</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-700">Credits</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {insights.registrations.map((r) => (
                            <tr key={r.campaignId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">{r.campaignName}</td>
                              <td className="px-4 py-3 text-gray-600">{formatDate(r.registeredAt)}</td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    r.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {r.isActive ? 'Active' : 'Ended'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-orange-600 font-semibold">
                                {r.credits ?? 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'activity' && (
                <div className="space-y-3">
                  {(insights?.activity || []).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No activity recorded.</p>
                  ) : (
                    <ul className="space-y-2">
                      {insights.activity.map((item, i) => (
                        <li
                          key={`${item.type}-${item.at}-${i}`}
                          className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                        >
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${activityIcon(item.type)}`}
                          >
                            {item.type.replace(/_/g, ' ')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            {item.campaignName && (
                              <p className="text-xs text-gray-500">{item.campaignName}</p>
                            )}
                            {item.meta?.url && (
                              <a
                                href={item.meta.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 break-all hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {item.meta.url}
                              </a>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">{formatDate(item.at)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {tab === 'credits' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Earned (approved)" value={stats.earnedCredits ?? 0} color="text-green-700" />
                    <StatCard label="Pending" value={stats.pendingCredits ?? 0} color="text-amber-700" />
                    <StatCard label="Penalties" value={stats.penaltiesApplied ?? 0} color="text-red-600" />
                    <StatCard label="Wallet" value={insights?.wallet?.totalBalance ?? stats.walletBalance ?? 0} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Earnings by response</h3>
                    {(insights?.responses || []).length === 0 ? (
                      <p className="text-gray-500 text-sm">No submissions yet.</p>
                    ) : (
                      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left">Campaign</th>
                              <th className="px-3 py-2 text-center">Amount</th>
                              <th className="px-3 py-2 text-center">Credit status</th>
                              <th className="px-3 py-2 text-center">Task</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {insights.responses.map((r, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2">{r.campaignName || r.campaignId}</td>
                                <td className="px-3 py-2 text-center font-semibold text-orange-600">
                                  {r.creditAmount}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      r.isCreditAccepted
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {r.isCreditAccepted ? 'Approved' : r.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center text-xs">
                                  {r.isTaskCompleted ? 'Done' : 'Pending'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ParticipantDetailModal;
