import React, { useState } from 'react';
import { Download } from 'lucide-react';

const ExportButton = ({ data, keyword }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/trend/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword, data }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      // Get the blob from the response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create a link to download the PDF
      const a = document.createElement('a');
      a.href = url;
      a.download = `trendlens-${keyword}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export Error:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center space-x-2 ${loading ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'} text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl`}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>{loading ? 'Exporting...' : 'Export Report'}</span>
    </button>
  );
};

export default ExportButton;