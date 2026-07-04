import React from "react";

const AdminTools = ({ onOpenTelegram, onOpenBanner, onOpenKYC, onOpenWithdraw, onOpenTestimonials }) => {
  const tools = [
    {
      label: "Telegram Bot Alerts",
      desc: "Manage registration, profile, and campaign start alert toggles",
      emoji: "🔔",
      color: "violet",
      onClick: onOpenTelegram,
    },
    {
      label: "Home Banners",
      desc: "Upload and manage home page banners shown on the Android app",
      emoji: "🖼️",
      color: "orange",
      onClick: onOpenBanner,
    },
    {
      label: "KYC Management",
      desc: "Review and approve/reject user KYC verification documents",
      emoji: "🛡️",
      color: "blue",
      onClick: onOpenKYC,
    },
    {
      label: "Withdrawal Requests",
      desc: "Process pending withdrawal requests and mark payments",
      emoji: "💸",
      color: "green",
      onClick: onOpenWithdraw,
    },
    {
      label: "Testimonials",
      desc: "Approve or reject user reviews before they appear publicly",
      emoji: "⭐",
      color: "yellow",
      onClick: onOpenTestimonials,
    },
  ];

  const colorMap = {
    violet: { border: "border-violet-200", bg: "bg-violet-100/60", text: "text-violet-700", icon: "bg-violet-50 text-violet-600" },
    orange: { border: "border-orange-200", bg: "bg-orange-100/60", text: "text-orange-700", icon: "bg-orange-50 text-orange-600" },
    blue:   { border: "border-blue-200",   bg: "bg-blue-100/60",   text: "text-blue-700",   icon: "bg-blue-50 text-blue-600" },
    green:  { border: "border-green-200",  bg: "bg-green-100/60",  text: "text-green-700",  icon: "bg-green-50 text-green-600" },
    yellow: { border: "border-yellow-200", bg: "bg-yellow-100/60", text: "text-yellow-700", icon: "bg-yellow-50 text-yellow-600" },
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Admin Tools</h3>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tools.map(tool => {
          const c = colorMap[tool.color];
          return (
            <button
              key={tool.label}
              type="button"
              onClick={tool.onClick}
              className={`group relative overflow-hidden rounded-2xl border ${c.border} bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md text-left`}
            >
              <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${c.bg} blur-2xl`} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tool</p>
                  <p className={`mt-1 text-lg font-bold tracking-tight ${c.text}`}>{tool.label}</p>
                </div>
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.icon} text-xl`}>
                  {tool.emoji}
                </span>
              </div>
              <p className="mt-3 text-xs text-gray-500">{tool.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTools;
