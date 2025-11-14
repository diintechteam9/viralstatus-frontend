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
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Social Media Control Center
            </h3>
            {client?.name && (
              <p className="text-sm text-gray-600">
                Configuring channels for {client.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
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
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6">
            {tabs.map((tab) =>
              tab.key === activeTab ? (
                <div key={tab.key} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl text-violet-800">{tab.icon}</span>
                    <h4 className="text-xl font-semibold text-gray-900">
                      {tab.label} Overview
                    </h4>
                  </div>
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
