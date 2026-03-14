import React, { useState } from "react";
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaSms,
  FaEnvelope,
} from "react-icons/fa";
import WhatsAppChat from "./whatsapp/WhatsAppChat";

const SocialMedia = ({ client }) => {

  const tabs = [
    {
      key: "whatsapp",
      label: "Whatsapp",
      icon: <FaWhatsapp />,
      description:
        "Manage WhatsApp campaigns, automation templates, and broadcast lists.",
    },
    {
      key: "telegram",
      label: "Telegram",
      icon: <FaTelegramPlane />,
      description:
        "Monitor Telegram bot engagement and configure automated responses.",
    },
    {
      key: "sms",
      label: "SMS",
      icon: <FaSms />,
      description:
        "Send transactional alerts, reminders, and marketing SMS updates.",
    },
    {
      key: "email",
      label: "Email",
      icon: <FaEnvelope />,
      description:
        "Track newsletters, drip sequences, and deliverability metrics.",
    },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].key);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Social Media Control Center
            </h3>
            {client?.name && (
              <p className="text-xs sm:text-sm text-gray-600">
                Configuring channels for {client.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="text-sm sm:text-base">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "whatsapp" ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
            <WhatsAppChat client={client} />
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-6">
            {tabs.map((tab) =>
              tab.key === activeTab ? (
                <div key={tab.key} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl sm:text-2xl text-violet-800">{tab.icon}</span>
                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {tab.label} Overview
                    </h4>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">{tab.description}</p>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMedia;
