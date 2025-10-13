import React from "react";

const AdminTools = ({ onOpenTelegram }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Admin Tools</h3>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          type="button"
          onClick={onOpenTelegram}
          className="group relative overflow-hidden rounded-2xl border border-violet-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md text-left"
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-100/60 blur-2xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tool</p>
              <p className="mt-1 text-xl font-bold tracking-tight text-violet-700">Telegram Bot Alerts</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              🔔
            </span>
          </div>
          <p className="mt-3 text-xs text-gray-500">Manage registration and profile alert toggles</p>
        </button>

        {/* Placeholder slots to keep layout consistent for future tools */}
        <div className="hidden lg:block" />
        <div className="hidden lg:block" />
        <div className="hidden lg:block" />
      </div>
    </div>
  );
};

export default AdminTools;


