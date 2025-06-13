import React, { useState, useEffect } from 'react';
import { Clock, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

function History() {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const savedHistory = JSON.parse(localStorage.getItem('trendHistory')) || [];
    setHistory(savedHistory);
  };

  const clearHistory = () => {
    localStorage.setItem('trendHistory', JSON.stringify([]));
    setHistory([]);
  };

  const filteredHistory = history.filter(item =>
    item.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Clock className="w-6 h-6 text-blue-600 mr-2" />
              Search History
            </h1>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
              </button>
            )}
          </div>

          {history.length > 0 && (
            <div className="relative mb-6">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search in history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {history.length === 0 ? 'No Search History' : 'No Matching Searches'}
              </h3>
              <p className="text-gray-500">
                {history.length === 0
                  ? 'Start analyzing trends to build your search history'
                  : 'Try a different search term'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((item, index) => (
                <Link
                  to={`/dashboard?q=${encodeURIComponent(item.keyword)}`}
                  key={index}
                  className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {item.keyword}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Searched on {new Date(item.date).toLocaleDateString()} at{' '}
                        {new Date(item.date).toLocaleTimeString()}
                      </p>
                    </div>
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default History;
