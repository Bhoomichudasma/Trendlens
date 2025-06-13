import React from 'react';
import { Newspaper, Globe, Calendar, ExternalLink } from 'lucide-react';

const NewsList = ({ articles, keyword }) => {
  if (!articles || articles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Newspaper className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Latest News</h3>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No news articles found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Latest News</h3>
        </div>
        <span className="text-sm text-gray-500">{articles.length} articles</span>
      </div>

      <div className="space-y-4">
        {articles.slice(0, 5).map((article, index) => (
          <div
            key={index}
            className="border-l-4 border-red-500 pl-4 hover:bg-gray-50 transition-colors duration-200 p-3 rounded-r-lg"
          >
            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
              {article.url ? (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {article.title || `Breaking: ${keyword} makes headlines in major development`}
                </a>
              ) : (
                article.title
              )}
            </h4>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {article.description ||
                `Latest updates on ${keyword} showing significant impact across multiple sectors...`}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <Globe className="w-3 h-3" />
                <span>{article.source?.name || 'News Source'}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="w-3 h-3" />
                <span>
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '2 hours ago'}
                </span>
              </div>

              {article.url && (
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 cursor-pointer hover:text-blue-600" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsList;
