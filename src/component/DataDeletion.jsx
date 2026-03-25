import React from "react";

const DataDeletion = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Deletion Instructions</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: March 25, 2026</p>

        <section className="mb-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            If you want to delete your data associated with the <strong>ViralStatus</strong> app, please follow the steps below.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">How to Delete Your Data</h2>
          <ol className="list-decimal list-inside text-gray-600 text-sm leading-relaxed space-y-2">
            <li>Go to your Facebook Settings</li>
            <li>Click on <strong>Apps and Websites</strong></li>
            <li>Find <strong>ViralStatus</strong> in the list</li>
            <li>Click <strong>Remove</strong> to revoke access and delete your data</li>
          </ol>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Request Manual Deletion</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            You can also request manual deletion of all your data by emailing us at:{" "}
            <a href="mailto:vijay.wiz@gmail.com" className="text-violet-700 hover:underline">
              vijay.wiz@gmail.com
            </a>
            <br /><br />
            Please include your Facebook User ID or registered email address in the request. We will delete all your data within <strong>30 days</strong> and send you a confirmation.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">What Data We Delete</h2>
          <ul className="list-disc list-inside text-gray-600 text-sm leading-relaxed space-y-1">
            <li>Your name and email address</li>
            <li>Connected Instagram and YouTube account tokens</li>
            <li>Any scheduled or published post history</li>
            <li>All session and authentication data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Contact</h2>
          <p className="text-gray-600 text-sm">
            <a href="mailto:vijay.wiz@gmail.com" className="text-violet-700 hover:underline">vijay.wiz@gmail.com</a><br />
            YovoAI / ViralStatus
          </p>
        </section>
      </div>
    </div>
  );
};

export default DataDeletion;
