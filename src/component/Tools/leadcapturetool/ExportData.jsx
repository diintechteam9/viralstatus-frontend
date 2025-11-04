import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar,
  Settings
} from 'lucide-react';
import { API_BASE_URL } from '../../../config';
import toast from 'react-hot-toast';

const ExportData = ({ cardId }) => {
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: ''
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      
      // Prepare query parameters
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params[key] = value;
        }
      });
      
      if (cardId) {
        params.cardId = cardId;
      }

      let response;
      let filename;
      let mimeType;

      if (format === 'excel') {
        const res = await fetch(`${API_BASE_URL}/api/phone-numbers/export/excel?${new URLSearchParams(params)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to export Excel file');
        }
        
        response = await res.blob();
        filename = `phone_numbers_${new Date().toISOString().split('T')[0]}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        const res = await fetch(`${API_BASE_URL}/api/phone-numbers/export/csv?${new URLSearchParams(params)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to export CSV file');
        }
        
        response = await res.blob();
        filename = `phone_numbers_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      // Create blob and download
      const blob = new Blob([response], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} file downloaded successfully!`);

    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${format.toUpperCase()} file`);
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Export Data</h2>
        <p className="text-gray-600">Export your extracted phone numbers in various formats</p>
      </div>

      {/* Export Options */}
      <div className="">
        {/* Excel Export */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 rounded-full mr-4">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Excel Export</h3>
              <p className="text-sm text-gray-600">Download as .xlsx file with multiple sheets</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1 mb-4">
            <li>• Multiple worksheets (Data, Summary, Country breakdown)</li>
            <li>• Rich formatting and styling</li>
            <li>• Statistics and analytics included</li>
            <li>• Compatible with Excel, Google Sheets</li>
          </ul>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Excel</span>
              </>
            )}
          </button>
        </div>

        {/* CSV Export */}
        {/* <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">CSV Export</h3>
              <p className="text-sm text-gray-600">Download as .csv file for data analysis</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1 mb-4">
            <li>• Lightweight comma-separated format</li>
            <li>• Easy to import into databases</li>
            <li>• Compatible with all spreadsheet apps</li>
            <li>• Perfect for data analysis tools</li>
          </ul>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download CSV</span>
              </>
            )}
          </button>
        </div> */}
      </div>

      {/* Export Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Export Filters
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date From Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm font-medium text-blue-900 mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {filters.dateFrom && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Calendar className="h-3 w-3 mr-1" />
                  From {filters.dateFrom}
                </span>
              )}
              {filters.dateTo && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Calendar className="h-3 w-3 mr-1" />
                  To {filters.dateTo}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Export Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Excel Export Includes:</h4>
            <ul className="space-y-1">
              <li>• Main data sheet with all phone numbers</li>
              <li>• Summary sheet with statistics</li>
              <li>• Country breakdown analysis</li>
              <li>• Formatted columns and styling</li>
            </ul>
          </div>
          {/* <div>
            <h4 className="font-medium text-gray-900 mb-2">CSV Export Includes:</h4>
            <ul className="space-y-1">
              <li>• All phone number data in CSV format</li>
              <li>• Source URL and page title</li>
              <li>• Confidence scores and validity status</li>
              <li>• Extraction timestamps</li>
            </ul>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ExportData;
