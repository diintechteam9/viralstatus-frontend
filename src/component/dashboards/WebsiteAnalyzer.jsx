import React, { useState } from 'react';
import { 
  FaGlobe, 
  FaSearch, 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaEnvelope,
  FaPhone,
  FaWhatsapp,
  FaTelegram,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaGithub,
  FaServer,
  FaShieldAlt,
  FaRobot,
  FaImage,
  FaLink,
  FaCode
} from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const WebsiteAnalyzer = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const features = [
    { icon: <FaGlobe />, text: 'Auto Browser Control' },
    { icon: <FaImage />, text: 'Screenshot Capture' },
    { icon: <FaEnvelope />, text: 'Contact Extraction' },
    { icon: <FaLink />, text: 'Social Media Discovery' },
    { icon: <FaCode />, text: 'Technology Detection' },
    { icon: <FaServer />, text: 'Domain Intelligence' },
    { icon: <FaShieldAlt />, text: 'Security Analysis' },
    { icon: <FaRobot />, text: 'AI Insights' }
  ];

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 2000);
    return interval;
  };

  const handleAnalyze = async () => {
    // Validate URL
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      new URL(normalizedUrl);
    } catch (e) {
      setError('Invalid URL format. Please enter a valid website URL (e.g., example.com or https://example.com)');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    
    const progressInterval = simulateProgress();

    try {
      console.log('Starting analysis for:', normalizedUrl);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/website-analyzer/analyze`, 
        { url: normalizedUrl },
        { 
          timeout: 5 * 60 * 1000, // 5 minute timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      clearInterval(progressInterval);
      setProgress(100);
      
      if (response.data && response.data.success) {
        setResult(response.data.data);
        console.log('Analysis completed successfully');
        console.log('Full result data:', JSON.stringify(response.data.data, null, 2));
      } else {
        throw new Error(response.data?.error || 'Analysis failed');
      }
      
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      
      let errorMessage = 'Failed to analyze website';
      
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Analysis timeout. The website took too long to respond. Please try again.';
      } else if (err.response) {
        errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
      } else if (err.request) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <FaGlobe className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Website Analysis</h1>
              <p className="text-gray-600 mt-1">Complete OSINT & Intelligence Tool • Auto browser, screenshots, WHOIS, DNS, AI insights</p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                <span className="text-orange-600 text-xl">{feature.icon}</span>
                <span className="text-sm font-medium text-gray-700">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Input Section */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <FaGlobe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL (e.g., https://example.com)"
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none text-lg"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FaSearch />
                  Analyze
                </>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Analysis in progress...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Browser is automatically opening, scrolling, and capturing screenshots...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3">
              <FaExclamationTriangle className="text-red-500 text-xl" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="max-w-7xl mx-auto space-y-6">
          {(() => {
            // Choose the most reliable screenshot source.
            // - New backend returns absolute URLs inside `screenshotDetails[].path`
            // - Older backend returns relative paths inside `screenshots[]`
            return null;
          })()}
          {/*
            Prefer absolute asset URLs returned by backend to avoid blank screenshots
            when VITE_BACKEND_URL is missing/mismatched in local setup.
          */}
          {(() => {
            // no-op IIFE to keep JSX changes minimal; actual variable is below usage.
            return null;
          })()}
          {/* Success Message */}
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex items-center gap-3">
            <FaCheckCircle className="text-green-500 text-2xl" />
            <div>
              <p className="font-semibold text-green-800">Analysis Completed Successfully!</p>
              <p className="text-sm text-green-600">
                Captured {result.screenshots?.length || 0} screenshots • Analyzed at {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          {/* Domain Intelligence (WHOIS) */}
          {result.domainInfo && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaGlobe className="text-orange-600" />
                Domain Intelligence (WHOIS)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Domain</p>
                  <p className="font-semibold text-gray-900">{result.domainInfo.domain}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Registrar</p>
                  <p className="font-semibold text-gray-900">{result.domainInfo.registrar}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-semibold text-gray-900">{result.domainInfo.created}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Expiry</p>
                  <p className="font-semibold text-gray-900">{result.domainInfo.expires}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Updated</p>
                  <p className="font-semibold text-gray-900">{result.domainInfo.updated}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Country</p>
                  <p className="font-semibold text-gray-900">{result.domainInfo.country}</p>
                </div>
              </div>
              {result.domainInfo.nameServers && result.domainInfo.nameServers.length > 0 && result.domainInfo.nameServers[0] !== 'N/A' && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Name Servers</p>
                  <ul className="list-disc list-inside text-gray-800 text-sm space-y-1">
                    {result.domainInfo.nameServers.slice(0, 8).map((ns, i) => (
                      <li key={i}>{ns}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* DNS Records */}
          {result.dnsRecords && !result.dnsRecords.error && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaServer className="text-orange-600" />
                DNS Records
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.dnsRecords.A && result.dnsRecords.A.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">A (IPv4)</p>
                    <ul className="text-sm text-gray-800 space-y-0.5">
                      {result.dnsRecords.A.slice(0, 6).map((ip, i) => (
                        <li key={i}>{ip}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.dnsRecords.AAAA && result.dnsRecords.AAAA.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">AAAA (IPv6)</p>
                    <ul className="text-sm text-gray-800 space-y-0.5 break-all">
                      {result.dnsRecords.AAAA.slice(0, 4).map((ip, i) => (
                        <li key={i}>{ip}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.dnsRecords.MX && result.dnsRecords.MX.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">MX (Mail)</p>
                    <ul className="text-sm text-gray-800 space-y-0.5">
                      {result.dnsRecords.MX.slice(0, 5).map((mx, i) => (
                        <li key={i}>{mx.exchange || mx}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.dnsRecords.NS && result.dnsRecords.NS.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">NS (Name Servers)</p>
                    <ul className="text-sm text-gray-800 space-y-0.5">
                      {result.dnsRecords.NS.slice(0, 6).map((ns, i) => (
                        <li key={i}>{ns}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.dnsRecords.TXT && result.dnsRecords.TXT.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                    <p className="text-sm font-medium text-gray-600 mb-1">TXT</p>
                    <ul className="text-sm text-gray-800 space-y-0.5 break-all">
                      {result.dnsRecords.TXT.flat().slice(0, 4).map((txt, i) => (
                        <li key={i}>{txt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Server Information */}
          {result.serverInfo && !result.serverInfo.error && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaServer className="text-orange-600" />
                Server Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Server</p>
                  <p className="font-semibold text-gray-900">{result.serverInfo.server}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Powered By</p>
                  <p className="font-semibold text-gray-900">{result.serverInfo.poweredBy}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Content-Type</p>
                  <p className="font-semibold text-gray-900 truncate">{result.serverInfo.contentType}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Cache-Control</p>
                  <p className="font-semibold text-gray-900 truncate">{result.serverInfo.cacheControl || 'N/A'}</p>
                </div>
              </div>
              {result.serverInfo.securityHeaders && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Security Headers</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {Object.entries(result.serverInfo.securityHeaders).map(([k, v]) => (
                      <li key={k}><span className="font-medium">{k}:</span> {v === 'Not set' ? '—' : v}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Page Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaGlobe className="text-orange-600" />
              Page Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Title</p>
                <p className="font-semibold text-gray-900">{result.basicInfo?.title || 'N/A'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">URL</p>
                <p className="font-semibold text-gray-900 truncate">{result.basicInfo?.url || 'N/A'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Links</p>
                <p className="font-semibold text-gray-900">{result.basicInfo?.links || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Images</p>
                <p className="font-semibold text-gray-900">{result.basicInfo?.images || 0}</p>
              </div>
            </div>
            {result.basicInfo?.description && result.basicInfo.description !== 'No description' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-800">{result.basicInfo.description}</p>
              </div>
            )}
          </div>

          {/* Screenshots */}
          {result.screenshots && result.screenshots.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaImage className="text-orange-600" />
                Main Page Screenshots ({result.screenshots.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {result.screenshots.map((screenshot, index) => (
                  <button
                    key={index}
                    type="button"
                    className="relative group text-left"
                    onClick={() =>
                      window.open(
                        String(screenshot.path || screenshot).startsWith('http')
                          ? (screenshot.path || screenshot)
                          : `${API_BASE_URL}${screenshot.path || screenshot}`,
                        '_blank'
                      )
                    }
                  >
                    <img
                      src={String(screenshot.path || screenshot).startsWith('http') ? (screenshot.path || screenshot) : `${API_BASE_URL}${screenshot.path || screenshot}`}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 group-hover:border-orange-500 transition-all cursor-pointer"
                      onError={(e) => {
                        e.currentTarget.src =
                          'data:image/svg+xml;charset=utf-8,' +
                          encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="16">Screenshot failed to load</text></svg>');
                      }}
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-xs text-white px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      View Full
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Internal Pages */}
          {result.internalPages && result.internalPages.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaLink className="text-orange-600" />
                Internal Pages Analyzed ({result.internalPages.length})
              </h2>
              <div className="space-y-6">
                {result.internalPages.map((page, pageIndex) => (
                  <div key={pageIndex} className="border-2 border-gray-200 rounded-xl p-4">
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-gray-900">{page.title}</h3>
                      <a 
                        href={page.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {page.url}
                      </a>
                      {page.linksCount !== undefined && (
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span>Links: {page.linksCount}</span>
                          <span>Images: {page.imagesCount}</span>
                          <span>Screenshots: {page.screenshots?.length || 0}</span>
                        </div>
                      )}
                    </div>
                    {page.screenshots && page.screenshots.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {page.screenshots.map((screenshot, screenshotIndex) => (
                          <button
                            key={screenshotIndex}
                            type="button"
                            className="relative group text-left"
                            onClick={() =>
                              window.open(
                                String(screenshot.path || screenshot).startsWith('http')
                                  ? (screenshot.path || screenshot)
                                  : `${API_BASE_URL}${screenshot.path || screenshot}`,
                                '_blank'
                              )
                            }
                          >
                            <img
                              src={String(screenshot.path || screenshot).startsWith('http') ? (screenshot.path || screenshot) : `${API_BASE_URL}${screenshot.path || screenshot}`}
                              alt={`${page.title} - Screenshot ${screenshotIndex + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:border-orange-500 transition-all cursor-pointer"
                              onError={(e) => {
                                e.currentTarget.src =
                                  'data:image/svg+xml;charset=utf-8,' +
                                  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="14">Image load failed</text></svg>');
                              }}
                            />
                            <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/70 text-[10px] text-white px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              View
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {result.contactInfo && (result.contactInfo.emails?.length > 0 || result.contactInfo.phones?.length > 0 || result.contactInfo.whatsapp?.length > 0 || result.contactInfo.telegram?.length > 0) && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaEnvelope className="text-orange-600" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.contactInfo.emails?.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaEnvelope className="text-blue-600" />
                      <p className="font-semibold text-gray-900">Emails ({result.contactInfo.emails.length})</p>
                    </div>
                    {result.contactInfo.emails.map((email, i) => (
                      <a key={i} href={`mailto:${email}`} className="block text-sm text-blue-600 hover:underline">{email}</a>
                    ))}
                  </div>
                )}
                {result.contactInfo.phones?.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaPhone className="text-green-600" />
                      <p className="font-semibold text-gray-900">Phones ({result.contactInfo.phones.length})</p>
                    </div>
                    {result.contactInfo.phones.map((phone, i) => (
                      <a key={i} href={`tel:${phone}`} className="block text-sm text-green-700">{phone}</a>
                    ))}
                  </div>
                )}
                {result.contactInfo.whatsapp?.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaWhatsapp className="text-green-600" />
                      <p className="font-semibold text-gray-900">WhatsApp ({result.contactInfo.whatsapp.length})</p>
                    </div>
                    {result.contactInfo.whatsapp.map((wa, i) => (
                      <p key={i} className="text-sm text-gray-700">{wa}</p>
                    ))}
                  </div>
                )}
                {result.contactInfo.telegram?.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaTelegram className="text-blue-600" />
                      <p className="font-semibold text-gray-900">Telegram ({result.contactInfo.telegram.length})</p>
                    </div>
                    {result.contactInfo.telegram.map((tg, i) => (
                      <p key={i} className="text-sm text-gray-700">{tg}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Media */}
          {result.socialMedia && (Array.isArray(result.socialMedia) ? result.socialMedia.length > 0 : Object.keys(result.socialMedia).length > 0) && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaLink className="text-orange-600" />
                Social Media Links
              </h2>
              {Array.isArray(result.socialMedia) ? (
                <div className="space-y-2">
                  {result.socialMedia.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm text-blue-600 hover:underline break-all"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(result.socialMedia).map(([platform, links]) => {
                    if (!links || (Array.isArray(links) && links.length === 0)) return null;
                    const icons = {
                      facebook: <FaFacebook className="text-blue-600" />,
                      twitter: <FaTwitter className="text-blue-400" />,
                      instagram: <FaInstagram className="text-pink-600" />,
                      linkedin: <FaLinkedin className="text-blue-700" />,
                      youtube: <FaYoutube className="text-red-600" />,
                      github: <FaGithub className="text-gray-800" />
                    };
                    return (
                      <div key={platform} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {icons[platform.toLowerCase()] || <FaLink className="text-gray-600" />}
                          <p className="font-semibold text-gray-900 capitalize">{platform}</p>
                        </div>
                        <p className="text-sm text-gray-600">{Array.isArray(links) ? links.length : 1} link(s)</p>
                        {Array.isArray(links) && links.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {links.slice(0, 3).map((link, idx) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-blue-600 hover:underline truncate"
                              >
                                {link}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Technologies */}
          {result.technologies && result.technologies.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaCode className="text-orange-600" />
                Technologies Detected
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.technologies.map((tech, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 rounded-full font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {result.aiAnalysis && result.aiAnalysis.executiveSummary && result.aiAnalysis.executiveSummary !== 'N/A' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaRobot className="text-orange-600" />
                AI Analysis
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-2">Executive Summary</p>
                  <p className="text-gray-700">{result.aiAnalysis.executiveSummary}</p>
                </div>

                {result.aiAnalysis.websiteDetails && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">Website Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Purpose: </span>
                        <span className="text-gray-800">{result.aiAnalysis.websiteDetails.purpose}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Business Type: </span>
                        <span className="text-gray-800">{result.aiAnalysis.websiteDetails.businessType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Industry: </span>
                        <span className="text-gray-800">{result.aiAnalysis.websiteDetails.industry}</span>
                      </div>
                    </div>
                  </div>
                )}

                {Array.isArray(result.aiAnalysis.keyFeatures) && result.aiAnalysis.keyFeatures.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">Key Features</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {result.aiAnalysis.keyFeatures.map((f, i) => (
                        <li key={i}>{typeof f === 'string' ? f : JSON.stringify(f)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.aiAnalysis.contentAnalysis && (
                  <div className="p-4 bg-cyan-50 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">Content Analysis</p>
                    <div className="text-sm text-gray-700 space-y-1">
                      {result.aiAnalysis.contentAnalysis.quality && (
                        <p>
                          <span className="text-gray-600">Quality: </span>
                          {result.aiAnalysis.contentAnalysis.quality}
                        </p>
                      )}
                      {result.aiAnalysis.contentAnalysis.professionalism && (
                        <p>
                          <span className="text-gray-600">Professionalism: </span>
                          {result.aiAnalysis.contentAnalysis.professionalism}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {result.aiAnalysis.trustScore && result.aiAnalysis.trustScore !== 'N/A' && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">Trust Score</p>
                    <p className="text-2xl font-bold text-green-600">{result.aiAnalysis.trustScore}</p>
                  </div>
                )}

                {result.aiAnalysis.domainAnalysis && (
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">Domain Analysis</p>
                    <p className="text-sm text-gray-700">{result.aiAnalysis.domainAnalysis}</p>
                  </div>
                )}

                {result.aiAnalysis.businessIntelligence && (
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">Business Intelligence</p>
                    <p className="text-sm text-gray-700">{result.aiAnalysis.businessIntelligence}</p>
                  </div>
                )}

                {result.aiAnalysis.osintValue && (
                  <div className="p-4 bg-slate-100 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">OSINT Value</p>
                    <p className="text-sm text-gray-700">{result.aiAnalysis.osintValue}</p>
                  </div>
                )}

                {Array.isArray(result.aiAnalysis.redFlags) && result.aiAnalysis.redFlags.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="font-semibold text-red-800 mb-2">Red Flags</p>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {result.aiAnalysis.redFlags.map((f, i) => (
                        <li key={i}>{typeof f === 'string' ? f : JSON.stringify(f)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(result.aiAnalysis.recommendations) && result.aiAnalysis.recommendations.length > 0 && (
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">Recommendations</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {result.aiAnalysis.recommendations.map((r, i) => (
                        <li key={i}>{typeof r === 'string' ? r : JSON.stringify(r)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.aiAnalysis.overallAssessment && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">Overall Assessment</p>
                    <p className="text-gray-700">{result.aiAnalysis.overallAssessment}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WebsiteAnalyzer;
