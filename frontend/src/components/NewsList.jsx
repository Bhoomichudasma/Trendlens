import React, { useState } from 'react';
import { Filter, Calendar, Globe, ExternalLink, Clock, Newspaper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from './ui';
import { Separator } from './ui/separator';

const NewsList = ({ articles }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('publishedAt');

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="bg-slate-800/40 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
          <Newspaper className="w-10 h-10 text-slate-500" />
        </div>
        <p className="text-slate-400 text-lg font-medium">No news articles found</p>
        <p className="text-slate-500 text-sm mt-2">Check back later for updates</p>
      </div>
    );
  }

  // Sort articles
  const sortedArticles = [...articles].sort((a, b) => {
    if (sortBy === 'publishedAt') {
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    } else if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Filter articles by source
  const filteredArticles = filter === 'all' 
    ? sortedArticles 
    : sortedArticles.filter(article => article.source?.name === filter);

  // Get unique sources for filter dropdown
  const sources = [...new Set(articles.map(article => article.source?.name).filter(Boolean))];

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Filter and sort controls */}
      <Card className="border-slate-700/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">Filter & Sort</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">All Sources ({articles.length})</option>
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="publishedAt">Latest First</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Articles list */}
      <div className="space-y-4">
        {filteredArticles.map((article, index) => (
          <Card 
            key={index} 
            className="border-slate-700/50 hover:border-blue-500/30 group cursor-pointer transition-all duration-300 overflow-hidden"
          >
            {/* Image banner if available */}
            {article.urlToImage && (
              <div className="h-48 sm:h-40 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                <img 
                  src={article.urlToImage} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg text-slate-100 group-hover:text-blue-300 transition-colors line-clamp-2">
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-400 transition-colors"
                    >
                      {article.title}
                    </a>
                  </CardTitle>
                </div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-blue-400 flex-shrink-0 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {article.source?.name && (
                  <Badge variant="secondary" className="bg-slate-700/50 gap-1">
                    <Globe className="w-3 h-3" />
                    {article.source.name}
                  </Badge>
                )}
              </div>

              {/* Description */}
              {article.description && (
                <>
                  <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
                    {article.description}
                  </p>
                  {article.description.length > 300 && (
                    <p className="text-blue-400/60 text-xs font-medium">Read full article →</p>
                  )}
                </>
              )}

              <Separator />

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                {article.publishedAt && (
                  <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-slate-400 transition-colors ml-auto">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results count */}
      {filteredArticles.length > 0 && (
        <div className="text-center text-slate-400 text-sm pt-4">
          Showing <span className="text-blue-400 font-semibold">{filteredArticles.length}</span> of <span className="text-blue-400 font-semibold">{articles.length}</span> articles
        </div>
      )}
    </div>
  );
};

export default NewsList;