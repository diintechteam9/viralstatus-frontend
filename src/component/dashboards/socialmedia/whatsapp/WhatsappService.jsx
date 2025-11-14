import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const WhatsappService = () => {
    const [formData, setFormData] = useState({
        phoneNumber: '',
        orgName: '',
        courseName: ''
    });
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        let cleanValue = value;

        // Allow only digits for phone number
        if (name === "phoneNumber") {
            if (!/^\d*$/.test(value)) return;
        } else {
            // For orgName and courseName: remove * and trim spaces
            cleanValue = value.replace(/\*/g, '').trimStart();
        }

        setFormData(prev => ({
            ...prev,
            [name]: cleanValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            let cleanPhoneNumber = formData.phoneNumber.trim();

            // Always prefix +91
            cleanPhoneNumber = '+91' + cleanPhoneNumber;

            // Send to backend
            const result = await axios.post(`${API_BASE_URL}/api/whatsapp/send-info`, {
                to: cleanPhoneNumber,
                orgName: formData.orgName.replace(/\*/g, '').trim(),
                courseName: formData.courseName.replace(/\*/g, '').trim()
            });

            setResponse(result.data);

            // reset form
            setFormData({ phoneNumber: '', orgName: '', courseName: '' });
        } catch (err) {
            console.error('Error sending message:', err);
            if (err.response?.data) {
                setError(err.response.data.message || err.response.data.error?.message || 'Failed to send message');
            } else {
                setError(err.message || 'Failed to send message');
            }
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = /^\d{10}$/.test(formData.phoneNumber) 
        && formData.orgName.trim() !== '' 
        && formData.courseName.trim() !== '';

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">WhatsApp Info Service</h1>
                    <p className="text-gray-600 text-lg">Send info messages directly to WhatsApp users</p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Phone Number Input */}
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                    +91
                                </span>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="Enter Your Phone Number"
                                    pattern="[0-9]{10}"
                                    maxLength="10"
                                    className="block w-full px-3 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                                    required
                                />
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                Enter your 10-digit mobile number (without +91)
                            </p>
                        </div>

                        {/* Org Name Input */}
                        <div>
                            <label htmlFor="orgName" className="block text-sm font-semibold text-gray-700 mb-2">
                                Organization Name ({"{{1}}"})
                            </label>
                            <input
    type="text"
    id="orgName"
    name="orgName"
    value={formData.orgName}
    onChange={handleInputChange}
    placeholder="e.g., EG Classes"
    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
    required
/>
                        </div>

                        {/* Course Name Input */}
                        <div>
                            <label htmlFor="courseName" className="block text-sm font-semibold text-gray-700 mb-2">
                                Course Name ({"{{2}}"})
                            </label>
                            <input
                                type="text"
                                id="courseName"
                                name="courseName"
                                value={formData.courseName}
                                onChange={handleInputChange}
                                placeholder="e.g., UPSC Online Classes"
                                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                                required
                            />
                        </div>

                        {/* Send Message Button */}
                        <button
                            type="submit"
                            disabled={!isFormValid || loading}
                            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                                isFormValid && !loading
                                    ? 'bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-200 transform hover:scale-105'
                                    : 'bg-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {loading ? "Sending..." : "Send Info Message"}
                        </button>
                    </form>
                </div>

                {/* Response Display */}
                {response && response.success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-semibold text-green-800 mb-2">Message Sent Successfully!</h3>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Sending Message</h3>
                        <p className="text-red-700">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsappService;
