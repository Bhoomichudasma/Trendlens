import React, { useState } from 'react';
import {
  Search,
  TrendingUp,
  Globe,
  MessageCircle,
  Newspaper,
  BarChart3,
  Filter,
  Download,
  ChevronDown,
  X,
  ThumbsUp,
  Calendar,
  MapPin,
  Server,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ExportButton from '../components/ExportButton';
import TrendChart from '../components/TrendChart';
import NewsChart from '../components/NewsChart';
import RedditChart from '../components/RedditChart';
import NewsList from '../components/NewsList';
import RedditBuzz from '../components/RedditBuzz';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSources, setActiveSources] = useState({
    googleTrends: true,
    reddit: true,
    news: true
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    redditLimit: 10,
    newsLimit: 10,
    redditSort: 'relevance',
    newsSort: 'publishedAt',
    redditTime: 'week',
    newsTime: 'week',
    region: ''
  });

  const handleSearch = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Avoid double-logging; Topic page will log once when it loads
      const payload = await api.searchIntelligence(keyword, filters, { log: false });

      const history = JSON.parse(localStorage.getItem('trendHistory')) || [];
      const newEntry = { keyword, date: new Date().toISOString() };
      const updatedHistory = [newEntry, ...history.slice(0, 19)];
      localStorage.setItem('trendHistory', JSON.stringify(updatedHistory));

      setSearchResults(null);
      navigate(`/topic/${encodeURIComponent(payload?.topic?.slug || keyword)}`);
    } catch (err) {
      setError('Failed to fetch trend data. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = (source) => {
    setActiveSources(prev => ({
      ...prev,
      [source]: !prev[source]
    }));
  };

  const clearSearch = () => {
    setSearchResults(null);
    setKeyword('');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Topbar */}
      <div className="border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">TrendLens</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link 
                to="/" 
                className="flex items-center space-x-1 text-sm font-medium text-slate-300 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/30 bg-slate-800/50 hover:bg-slate-800 rounded-lg px-3 py-2 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Home</span>
              </Link>
              
              <Link 
                to="/history" 
                className="flex items-center space-x-1 text-sm font-medium text-slate-300 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/30 bg-slate-800/50 hover:bg-slate-800 rounded-lg px-3 py-2 transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>History</span>
              </Link>
              
              <div className="relative">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 transition-colors"
                >slate-300 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/30 bg-slate-800/50 hover:bg-slate-8
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-700 z-10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">Filters</h3>
                      <button 
                        onClick={() => setShowFilters(false)}
                        className="text-slate-400 hover:text-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Platform Selection */}
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                          <Server className="w-4 h-4 mr-1" />
                          Data Sources
                        </h4>
                        <div className="space-y-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={activeSources.googleTrends}
                              onChange={() => toggleSource('googleTrends')}
                              className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 accent-cyan-500"
                            />
                            <span className="ml-2 text-sm text-slate-300">Google Trends</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={activeSources.reddit}
                              onChange={() => toggleSource('reddit')}
                              className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 accent-cyan-500"
                            />
                            <span className="ml-2 text-sm text-slate-300">Reddit Mentions</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={activeSources.news}
                              onChange={() => toggleSource('news')}
                              className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 accent-cyan-500"
                            />
                            <span className="ml-2 text-sm text-slate-300">News Frequency</span>
                          </label>
                        </div>
                      </div>
                      
                      {/* Time Range */}
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Time Range
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Reddit</label>
                            <select
                              value={filters.redditTime}
                              onChange={(e) => handleFilterChange('redditTime', e.target.value)}
                              className="w-full rounded-lg bg-slate-700 border border-slate-600 text-sm text-white focus:ring-cyan-500 focus:border-cyan-500"
                            >
                              <option value="day">Day</option>
                              <option value="week">Week</option>
                              <option value="month">Month</option>
                              <option value="year">Year</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">News</label>
                            <select
                              value={filters.newsTime}
                              onChange={(e) => handleFilterChange('newsTime', e.target.value)}
                              className="w-full rounded-lg bg-slate-700 border border-slate-600 text-sm text-white focus:ring-cyan-500 focus:border-cyan-500"
                            >
                              <option value="day">Day</option>
                              <option value="week">Week</option>
                              <option value="month">Month</option>
                              <option value="year">Year</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      {/* Limits */}
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">Result Limits</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Reddit Posts</label>
                            <select
                              value={filters.redditLimit}
                              onChange={(e) => handleFilterChange('redditLimit', parseInt(e.target.value))}
                              className="w-full rounded-lg bg-slate-700 border border-slate-600 text-sm text-white focus:ring-cyan-500 focus:border-cyan-500"
                            >
                              <option value="5">5</option>
                              <option value="10">10</option>
                              <option value="20">20</option>
                              <option value="50">50</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">News Articles</label>
                            <select
                              value={filters.newsLimit}
                              onChange={(e) => handleFilterChange('newsLimit', parseInt(e.target.value))}
                              className="w-full rounded-lg bg-slate-700 border border-slate-600 text-sm text-white focus:ring-cyan-500 focus:border-cyan-500"
                            >
                              <option value="5">5</option>
                              <option value="10">10</option>
                              <option value="20">20</option>
                              <option value="50">50</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      {/* Region Filter */}
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Region
                        </h4>
                        <input
                          type="text"
                          placeholder="e.g., US, GB, IN"
                          value={filters.region}
                          onChange={(e) => handleFilterChange('region', e.target.value)}
                          className="w-full rounded-lg bg-slate-700 border border-slate-600 text-sm text-white placeholder-slate-500 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                        <p className="text-xs text-slate-400 mt-1">Leave blank for global data</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {searchResults && (
                <ExportButton data={searchResults} keyword={keyword} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Trend Intelligence Dashboard</h2>
            <p className="text-slate-400">Discover what's trending across Google, Reddit, and News</p>
          </div>

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="flex items-center bg-slate-900/40 border border-slate-700/70 rounded-xl overflow-hidden shadow-2xl">
                <div className="px-4 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search any trend, person, or event..."
                  className="flex-1 bg-transparent text-white px-1 py-4 focus:outline-none placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-4 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition-all duration-300 flex items-center gap-2 ${loading ? 'opacity-75' : 'hover:from-cyan-400 hover:to-blue-500'}`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Analyze
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
              
              {searchResults && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute -top-2 -right-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {error && (
              <div className="mt-3 text-center text-red-400 text-sm">{error}</div>
            )}
          </form>
        </div>

        {/* Results Section */}
        {searchResults ? (
          <div className="space-y-8">
            {/* Main Trend Analysis - Only Google Trends */}
            {activeSources.googleTrends && (
              <Card className="border-slate-700 bg-slate-800/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-cyan-400" />
                      <CardTitle>Trend Analysis</CardTitle>
                    </div>
                    {searchResults.googleTrendsMetadata?.regionFilterApplied && (
                      <Badge variant={searchResults.googleTrendsMetadata?.regionHasData ? 'success' : 'warning'}>
                        {searchResults.googleTrendsMetadata?.regionHasData 
                          ? `Region: ${filters.region}` 
                          : `No data for: ${filters.region}`}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <TrendChart 
                      data={searchResults.googleTrends} 
                      regionData={searchResults.googleTrendsRegion}
                      regionFilterApplied={searchResults.googleTrendsMetadata?.regionFilterApplied}
                      regionHasData={searchResults.googleTrendsMetadata?.regionHasData}
                      keyword={keyword} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Source Sections - With region indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* News Analysis */}
              {activeSources.news && (
                <Card className="border-slate-700 bg-slate-800/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Newspaper className="w-5 h-5 text-green-400" />
                        <CardTitle>News Analysis</CardTitle>
                      </div>
                      {searchResults.newsMetadata?.regionFilterApplied && (
                        <Badge variant="success">
                          Region: {filters.region}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <NewsChart articles={searchResults.news} keyword={keyword} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reddit Analysis */}
              {activeSources.reddit && (
                <Card className="border-slate-700 bg-slate-800/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-purple-400" />
                        <CardTitle>Social Media Analysis</CardTitle>
                      </div>
                      {searchResults.redditMetadata?.regionFilterApplied && (
                        <Badge variant="secondary">
                          Region: {filters.region}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <RedditChart posts={searchResults.reddit} keyword={keyword} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Interactive News Timeline */}
            {activeSources.news && (
              <Card className="border-slate-700 bg-slate-800/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Newspaper className="w-5 h-5 text-green-400" />
                      <CardTitle>News Timeline</CardTitle>
                    </div>
                    {searchResults.newsMetadata?.regionFilterApplied && (
                      <Badge variant="success">
                        Region: {filters.region}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    <NewsList articles={searchResults.news} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reddit Buzz */}
            {activeSources.reddit && (
              <Card className="border-slate-700 bg-slate-800/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-purple-400" />
                      <CardTitle>Reddit Discussions</CardTitle>
                    </div>
                    {searchResults.redditMetadata?.regionFilterApplied && (
                      <Badge variant="secondary">
                        Region: {filters.region}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    <RedditBuzz posts={searchResults.reddit} keyword={keyword} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : !loading && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                <BarChart3 className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Start Analyzing</h3>
              <p className="text-slate-400">Enter a keyword above to discover trending topics across all major data sources</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;