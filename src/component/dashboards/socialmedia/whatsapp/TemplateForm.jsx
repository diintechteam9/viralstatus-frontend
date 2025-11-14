import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config';

const TemplateForm = ({ isOpen, onClose, onSuccess, client }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'UTILITY',
    language: 'en',
    parameter_format: 'POSITIONAL',
    allow_category_change: false,
    components: {
      header: { type: 'TEXT', text: '' },
      body: { text: '', examples: [] },
      footer: { text: '' },
      buttons: []
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = ['UTILITY', 'MARKETING', 'AUTHENTICATION'];
  const languages = ['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
  const headerTypes = ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleComponentChange = (componentType, field, value) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [componentType]: {
          ...prev.components[componentType],
          [field]: value
        }
      }
    }));
  };

  const addButton = () => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        buttons: [...prev.components.buttons, { type: 'QUICK_REPLY', text: '', url: '', phone_number: '' }]
      }
    }));
  };

  const removeButton = (index) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        buttons: prev.components.buttons.filter((_, i) => i !== index)
      }
    }));
  };

  const updateButton = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        buttons: prev.components.buttons.map((btn, i) => 
          i === index ? { ...btn, [field]: value } : btn
        )
      }
    }));
  };

  const addBodyExample = () => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        body: {
          ...prev.components.body,
          examples: [...prev.components.body.examples, '']
        }
      }
    }));
  };

  const updateBodyExample = (index, value) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        body: {
          ...prev.components.body,
          examples: prev.components.body.examples.map((ex, i) => 
            i === index ? value : ex
          )
        }
      }
    }));
  };

  const removeBodyExample = (index) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        body: {
          ...prev.components.body,
          examples: prev.components.body.examples.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const buildMetaComponents = () => {
    const components = [];

    // Header component
    if (formData.components.header.type === 'TEXT' && formData.components.header.text.trim()) {
      components.push({
        type: 'HEADER',
        format: 'TEXT',
        text: formData.components.header.text
      });
    } else if (formData.components.header.type !== 'TEXT' && formData.components.header.text.trim()) {
      components.push({
        type: 'HEADER',
        format: formData.components.header.type,
        example: {
          header_handle: [formData.components.header.text]
        }
      });
    }

    // Body component
    if (formData.components.body.text.trim()) {
      const bodyComponent = {
        type: 'BODY',
        text: formData.components.body.text
      };
      components.push(bodyComponent);
    }

    // Footer component
    if (formData.components.footer.text.trim()) {
      components.push({
        type: 'FOOTER',
        text: formData.components.footer.text
      });
    }

    // Buttons component
    if (formData.components.buttons.length > 0) {
      const buttons = formData.components.buttons.map(btn => {
        const button = { type: btn.type, text: btn.text };
        if (btn.type === 'URL' && btn.url) {
          button.url = btn.url;
        } else if (btn.type === 'PHONE_NUMBER' && btn.phone_number) {
          button.phone_number = btn.phone_number;
        }
        return button;
      }).filter(btn => btn.text.trim());

      if (buttons.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: buttons
        });
      }
    }

    return components;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.name)) {
      newErrors.name = 'Template name can only contain lowercase letters, numbers, and underscores';
    }

    if (!formData.components.body.text.trim()) {
      newErrors.body = 'Body text is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const components = buildMetaComponents();
      
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        language: formData.language,
        parameter_format: formData.parameter_format,
        allow_category_change: formData.allow_category_change,
        components: components,
        clientId: client?._id || client?.id || null,
      };

      const response = await axios.post(`${API_BASE_URL}/api/create-template/templates`, payload);
      
      if (response.data.success) {
        alert('Template submitted successfully! It will be reviewed by Meta.');
        onSuccess && onSuccess(response.data.template);
        onClose();
        // Reset form
        setFormData({
          name: '',
          category: 'UTILITY',
          language: 'en',
          parameter_format: 'POSITIONAL',
          allow_category_change: false,
          components: {
            header: { type: 'TEXT', text: '' },
            body: { text: '', examples: [] },
            footer: { text: '' },
            buttons: []
          }
        });
      } else {
        setErrors({ submit: response.data.message || 'Failed to submit template' });
      }
    } catch (error) {
      console.error('Error submitting template:', error);
      const backendMsg = error.response?.data?.message;
      const metaMsg = error.response?.data?.error?.error?.message;
      const errorMessage = metaMsg || backendMsg || 'Failed to submit template';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create WhatsApp Template</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., order_update_v1"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language *
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parameter Format
                </label>
                <select
                  value={formData.parameter_format}
                  onChange={(e) => handleInputChange('parameter_format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="POSITIONAL">POSITIONAL (&#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125;)</option>
                  <option value="NAMED">NAMED (&#123;&#123;name&#125;&#125;, &#123;&#123;order&#125;&#125;)</option>
                </select>
              </div>
            </div>

            {/* Header Component */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Header</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Header Type
                  </label>
                  <select
                    value={formData.components.header.type}
                    onChange={(e) => handleComponentChange('header', 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {headerTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.components.header.type === 'TEXT' ? 'Header Text' : 'Media URL'}
                  </label>
                  <input
                    type="text"
                    value={formData.components.header.text}
                    onChange={(e) => handleComponentChange('header', 'text', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={formData.components.header.type === 'TEXT' ? 'Enter header text' : 'Enter media URL'}
                  />
                </div>
              </div>
            </div>

            {/* Body Component */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Body *</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body Text
                </label>
                <textarea
                  value={formData.components.body.text}
                  onChange={(e) => handleComponentChange('body', 'text', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 ${
                    errors.body ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your message text. Use {{1}}, {{2}} for variables..."
                />
                {errors.body && <p className="text-red-500 text-sm mt-1">{errors.body}</p>}
              </div>

              {/* Body Examples */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Example Values (for variables)
                  </label>
                  <button
                    type="button"
                    onClick={addBodyExample}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Example
                  </button>
                </div>
                {formData.components.body.examples.map((example, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={example}
                      onChange={(e) => updateBodyExample(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Example ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeBodyExample(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Component */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Footer</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={formData.components.footer.text}
                  onChange={(e) => handleComponentChange('footer', 'text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter footer text (optional)"
                />
              </div>
            </div>

            {/* Buttons Component */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Buttons</h3>
                <button
                  type="button"
                  onClick={addButton}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Button
                </button>
              </div>
              {formData.components.buttons.map((button, index) => (
                <div key={index} className="border rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Button Type
                      </label>
                      <select
                        value={button.type}
                        onChange={(e) => updateButton(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="QUICK_REPLY">Quick Reply</option>
                        <option value="URL">URL</option>
                        <option value="PHONE_NUMBER">Phone Number</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Button Text
                      </label>
                      <input
                        type="text"
                        value={button.text}
                        onChange={(e) => updateButton(index, 'text', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Button text"
                      />
                    </div>
                    {button.type === 'URL' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL
                        </label>
                        <input
                          type="url"
                          value={button.url}
                          onChange={(e) => updateButton(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://example.com"
                        />
                      </div>
                    )}
                    {button.type === 'PHONE_NUMBER' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={button.phone_number}
                          onChange={(e) => updateButton(index, 'phone_number', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="+1234567890"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeButton(index)}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove Button
                  </button>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Template'}
              </button>
            </div>

            {errors.submit && (
              <div className="text-red-500 text-sm text-center mt-2">
                {errors.submit}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default TemplateForm;
