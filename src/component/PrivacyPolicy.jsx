import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: March 25, 2026</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">1. Information We Collect</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            We collect information you provide directly to us, such as your name, email address, and social media account details when you connect your accounts to our platform. We also collect usage data to improve our services.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">2. How We Use Your Information</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            We use the information we collect to provide, maintain, and improve our services, including publishing content to your connected social media accounts (Instagram, YouTube) on your behalf, only when you explicitly request it.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">3. Social Media Integrations</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            When you connect your Instagram or YouTube account, we access only the permissions required to publish content on your behalf. We do not sell or share your social media data with third parties. You can disconnect your accounts at any time from the Accounts tab.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">4. Data Storage</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your data is stored securely on our servers. Access tokens for social media accounts are encrypted and used solely for the purpose of publishing content as authorized by you.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">5. Data Deletion</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            You can request deletion of your data at any time by contacting us at <a href="mailto:vijay.wiz@gmail.com" className="text-violet-700 hover:underline">vijay.wiz@gmail.com</a>. Upon request, we will delete all your personal data and revoke all social media access tokens within 30 days.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">6. Cookies</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            We use session cookies to keep you logged in. We do not use tracking or advertising cookies.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">7. Contact Us</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at:<br />
            <a href="mailto:vijay.wiz@gmail.com" className="text-violet-700 hover:underline">vijay.wiz@gmail.com</a><br />
            YovoAI / ViralStatus
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
