import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';
import { FaGlobe, FaEnvelope, FaPhone, FaImage, FaLink, FaServer, FaShieldAlt, FaChartLine, FaRobot } from 'react-icons/fa';

const WebsiteAnalyzer = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/website-analyzer/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze website');
      }

      setResult(data.data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze website');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-violet-800 to-violet-900 rounded-lg p-6 mb-6 text-white">
          <h1 className="text-3xl font-bold mb-2">🌐 Website Intelligence Analyzer</h1>
          <p className="text-violet-100">Advanced OSINT Intelligence Platform - Powered by AI</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter Website URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-800 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-violet-800 text-white rounded-lg hover:bg-violet-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Analyzing...' : 'Start Investigation'}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
          )}
        </div>

        {result && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaGlobe className="mr-2 text-violet-800" />📄 Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-600">Title</p><p className="font-semibold">{result.basicInfo.title}</p></div>
                <div><p className="text-sm text-gray-600">URL</p><p className="font-semibold break-all">{result.basicInfo.url}</p></div>
                <div className="md:col-span-2"><p className="text-sm text-gray-600">Description</p><p className="font-semibold">{result.basicInfo.description}</p></div>
                <div><p className="text-sm text-gray-600">Links</p><p className="font-semibold">{result.basicInfo.links}</p></div>
                <div><p className="text-sm text-gray-600">Images</p><p className="font-semibold">{result.basicInfo.images}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaImage className="mr-2 text-violet-800" />📸 Screenshots ({result.screenshots.length} total)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.screenshots.map((screenshot, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={`${API_BASE_URL}${screenshot.path}`}
                      alt={`Screenshot ${screenshot.percentage}%`}
                      className="w-full h-48 object-cover cursor-pointer hover:opacity-90"
                      onClick={() => window.open(`${API_BASE_URL}${screenshot.path}`, '_blank')}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="p-3 bg-gray-50">
                      <p className="text-sm font-semibold">{screenshot.percentage}% - Position {screenshot.position}</p>
                      {screenshot.visibleContent && screenshot.visibleContent.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600">Visible Content:</p>
                          <ul className="text-xs text-gray-700 mt-1">
                            {screenshot.visibleContent.slice(0, 3).map((content, i) => (
                              <li key={i} className="truncate">• {content}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="mt-2">
                        <a
                          href={`${API_BASE_URL}${screenshot.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet-800 hover:underline"
                        >
                          Open image
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaEnvelope className="mr-2 text-violet-800" />📞 Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">📧 Emails ({result.contactInfo.emails.length}):</p>
                  {result.contactInfo.emails.length > 0 ? (
                    <ul className="space-y-1">{result.contactInfo.emails.map((email, i) => (<li key={i} className="text-sm text-gray-600">{email}</li>))}</ul>
                  ) : (<p className="text-sm text-gray-500">No emails found</p>)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">📱 Phones ({result.contactInfo.phones.length}):</p>
                  {result.contactInfo.phones.length > 0 ? (
                    <ul className="space-y-1">{result.contactInfo.phones.map((phone, i) => (<li key={i} className="text-sm text-gray-600">{phone}</li>))}</ul>
                  ) : (<p className="text-sm text-gray-500">No phones found</p>)}
                </div>
              </div>
            </div>

            {result.socialMedia && result.socialMedia.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <FaLink className="mr-2 text-violet-800" />🔗 Social Media Links
                </h2>
                <div className="flex flex-wrap gap-2">
                  {result.socialMedia.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-sm hover:bg-violet-200 transition-colors">
                      {new URL(link).hostname}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {result.aiAnalysis && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <FaRobot className="mr-2 text-violet-800" />🤖 AI Analysis
                </h2>
                <div className="space-y-4">
                  <div><h3 className="font-semibold text-gray-800 mb-2">📊 Executive Summary</h3><p className="text-gray-700">{result.aiAnalysis.executiveSummary}</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><h3 className="font-semibold text-gray-800 mb-2">Business Type</h3><p className="text-gray-700">{result.aiAnalysis.businessType}</p></div>
                    <div><h3 className="font-semibold text-gray-800 mb-2">Trust Score</h3><p className="text-gray-700">{result.aiAnalysis.trustScore}</p></div>
                  </div>
                  {result.aiAnalysis.raw?.websiteDetails && (
                    <div className="p-4 bg-violet-50 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">🌐 Website Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div><span className="text-gray-600">Purpose:</span> <span className="text-gray-800">{result.aiAnalysis.raw.websiteDetails.purpose}</span></div>
                        <div><span className="text-gray-600">Business Type:</span> <span className="text-gray-800">{result.aiAnalysis.raw.websiteDetails.businessType}</span></div>
                        <div><span className="text-gray-600">Industry:</span> <span className="text-gray-800">{result.aiAnalysis.raw.websiteDetails.industry}</span></div>
                      </div>
                    </div>
                  )}
                  {Array.isArray(result.aiAnalysis.raw?.keyFeatures) && result.aiAnalysis.raw.keyFeatures.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">✨ Key Features</h3>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {result.aiAnalysis.raw.keyFeatures.slice(0, 12).map((f, i) => (
                          <li key={i}>{typeof f === 'string' ? f : JSON.stringify(f)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.aiAnalysis.raw?.contentAnalysis && (
                    <div className="p-4 bg-cyan-50 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">📝 Content Analysis</h3>
                      <div className="text-sm text-gray-700 space-y-1">
                        {result.aiAnalysis.raw.contentAnalysis.quality && (
                          <p><span className="text-gray-600">Quality:</span> {result.aiAnalysis.raw.contentAnalysis.quality}</p>
                        )}
                        {result.aiAnalysis.raw.contentAnalysis.professionalism && (
                          <p><span className="text-gray-600">Professionalism:</span> {result.aiAnalysis.raw.contentAnalysis.professionalism}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {result.aiAnalysis.raw?.domainAnalysis && (
                    <div className="p-4 bg-indigo-50 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">🌍 Domain Analysis</h3>
                      <p className="text-sm text-gray-700">{result.aiAnalysis.raw.domainAnalysis}</p>
                    </div>
                  )}
                  {result.aiAnalysis.raw?.osintValue && (
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">🔎 OSINT Value</h3>
                      <p className="text-sm text-gray-700">{result.aiAnalysis.raw.osintValue}</p>
                    </div>
                  )}
                  {Array.isArray(result.aiAnalysis.raw?.redFlags) && result.aiAnalysis.raw.redFlags.length > 0 && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h3 className="font-semibold text-red-800 mb-2">🚩 Red Flags</h3>
                      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        {result.aiAnalysis.raw.redFlags.slice(0, 12).map((f, i) => (
                          <li key={i}>{typeof f === 'string' ? f : JSON.stringify(f)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.technologies && result.technologies.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <FaServer className="mr-2 text-violet-800" />⚙️ Technologies Detected
                </h2>
                <div className="flex flex-wrap gap-2">
                  {result.technologies.map((tech, i) => (<span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{tech}</span>))}
                </div>
              </div>
            )}

            {result.domainInfo && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <FaShieldAlt className="mr-2 text-violet-800" />🌍 Domain Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-600">Registrar</p><p className="font-semibold">{result.domainInfo.registrar}</p></div>
                  <div><p className="text-sm text-gray-600">Created</p><p className="font-semibold">{result.domainInfo.created}</p></div>
                </div>
                {result.domainInfo.nameServers && result.domainInfo.nameServers.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Name Servers</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {result.domainInfo.nameServers.slice(0, 8).map((ns, i) => (
                        <li key={i} className="break-all">• {ns}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {(result.dnsRecords || result.serverInfo) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <FaServer className="mr-2 text-violet-800" />🖥️ DNS & Server Intelligence
                </h2>
                {result.dnsRecords && !result.dnsRecords.error && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {Array.isArray(result.dnsRecords.A) && result.dnsRecords.A.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">A (IPv4)</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {result.dnsRecords.A.slice(0, 6).map((ip, i) => (<li key={i}>{ip}</li>))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(result.dnsRecords.NS) && result.dnsRecords.NS.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">NS</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {result.dnsRecords.NS.slice(0, 6).map((ns, i) => (<li key={i} className="break-all">{ns}</li>))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(result.dnsRecords.MX) && result.dnsRecords.MX.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">MX</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {result.dnsRecords.MX.slice(0, 6).map((mx, i) => (<li key={i}>{mx.exchange || String(mx)}</li>))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(result.dnsRecords.TXT) && result.dnsRecords.TXT.length > 0 && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-semibold text-gray-700 mb-1">TXT</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {result.dnsRecords.TXT.flat().slice(0, 4).map((txt, i) => (<li key={i} className="break-all">{txt}</li>))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {result.serverInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><p className="text-sm text-gray-600">Server</p><p className="font-semibold">{result.serverInfo.server}</p></div>
                    <div><p className="text-sm text-gray-600">Powered By</p><p className="font-semibold">{result.serverInfo.poweredBy}</p></div>
                    <div><p className="text-sm text-gray-600">Content Type</p><p className="font-semibold break-all">{result.serverInfo.contentType}</p></div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteAnalyzer;
