import React from 'react';

const TrendingKeywords = ({ keywords, onKeywordClick }) => {
  const sampleKeywords = [
    'Artificial Intelligence',
    'Machine Learning',
    'Climate Change',
    'Cryptocurrency',
    'Remote Work',
    'Electric Vehicles',
    'Space Exploration',
    'Mental Health'
  ];

  const trendingKeywords = keywords && keywords.length > 0 ? keywords : sampleKeywords;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Keywords</h3>
      
      <div className="flex flex-wrap gap-2">
        {trendingKeywords.map((keyword, index) => (
          <button
            key={index}
            onClick={() => onKeywordClick && onKeywordClick(keyword)}
            className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            {keyword}
          </button>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        Click on any keyword to analyze trends
      </p>
    </div>
  );
};

export default TrendingKeywords;