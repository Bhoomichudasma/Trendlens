/*import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Activity, FileText, Download, BarChart3, Globe, MessageCircle, Newspaper, Sparkles, Calendar, Users, Eye, ArrowUp, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import ExportButton from '../components/ExportButton';
import TrendChart from '../components/TrendChart';
import NewsList from '../components/NewsList';
import RedditBuzz from '../components/RedditBuzz';
import api from '../services/api';

const Dashboard = () => {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');

    try {
      const data = await api.searchTrend(keyword);
      
      const rawTimeline = data.googleTrends?.timeline_data || [];

const formattedTimeline = rawTimeline.map(item => ({
  date: item.date,
  interest: parseInt(item.values[0]?.extracted_value) || 0,

      }));

      const history = JSON.parse(localStorage.getItem('trendHistory')) || [];
      const newEntry = {
        keyword,
        date: new Date().toISOString()
      };
      const updatedHistory = [newEntry, ...history.slice(0, 19)];
      localStorage.setItem('trendHistory', JSON.stringify(updatedHistory));

      setSearchResults({
        googleTrends: formattedTimeline,
        reddit: data.reddit || [],
        news: data.news || []
      });
    } catch (err) {
      setError('Failed to fetch trend data. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
            Discover Trending Topics
          </h2>
          <p className="text-xl text-gray-500">
            Analyze trends, news, and social media buzz in real-time
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center bg-white rounded-lg shadow-lg overflow-hidden p-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter a topic or keyword to analyze..."
              className="flex-1 px-6 py-4 text-lg border-0 focus:ring-0 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg transition-all ${loading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Analyze
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-4 text-center text-red-600">{error}</div>
          )}
        </form>

        {searchResults && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
                  Trend Analysis
                </h3>
                <ExportButton data={searchResults} keyword={keyword} />
              </div>
              <div className="h-96">
                <TrendChart data={searchResults.googleTrends} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold flex items-center mb-6">
                  <Newspaper className="w-6 h-6 text-blue-600 mr-2" />
                  News Coverage
                </h3>
                <NewsList articles={searchResults.news} />
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold flex items-center mb-6">
                  <MessageCircle className="w-6 h-6 text-blue-600 mr-2" />
                  Social Media Buzz
                </h3>
                <RedditBuzz posts={searchResults.reddit} keyword={keyword} />
              </div>
            </div>
          </div>
        )}

        {!searchResults && !loading && (
          <div className="text-center text-gray-500 mt-12">
            <Globe className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Enter a keyword above to start analyzing trends</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;*/






import React, { useState } from 'react';
import {
  Search,
  TrendingUp,
  Globe,
  MessageCircle,
  Newspaper,
} from 'lucide-react';
import {
  BarChart3
} from 'lucide-react';
import ExportButton from '../components/ExportButton';
import TrendChart from '../components/TrendChart';
import NewsList from '../components/NewsList';
import RedditBuzz from '../components/RedditBuzz';
import api from '../services/api';

const Dashboard = () => {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');

    try {
      const data = await api.searchTrend(keyword);

      // ✅ Corrected access to timeline_data
      const rawTimeline = data.googleTrends?.timeline_data || [];

      const formattedTimeline = rawTimeline.map(item => ({
        date: item.date,
        interest: parseInt(item.values[0]?.extracted_value) || 0,
      }));

      const history = JSON.parse(localStorage.getItem('trendHistory')) || [];
      const newEntry = { keyword, date: new Date().toISOString() };
      const updatedHistory = [newEntry, ...history.slice(0, 19)];
      localStorage.setItem('trendHistory', JSON.stringify(updatedHistory));

      setSearchResults({
        googleTrends: formattedTimeline,
        reddit: data.reddit || [],
        news: data.news || []
      });
    } catch (err) {
      setError('Failed to fetch trend data. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
            Discover Trending Topics
          </h2>
          <p className="text-xl text-gray-500">
            Analyze trends, news, and social media buzz in real-time
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center bg-white rounded-lg shadow-lg overflow-hidden p-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter a topic or keyword to analyze..."
              className="flex-1 px-6 py-4 text-lg border-0 focus:ring-0 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg transition-all ${loading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Analyze
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-4 text-center text-red-600">{error}</div>
          )}
        </form>

        {searchResults && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
                  Trend Analysis
                </h3>
                <ExportButton data={searchResults} keyword={keyword} />
              </div>
              <div className="h-96">
                <TrendChart data={searchResults.googleTrends} keyword={keyword} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold flex items-center mb-6">
                  <Newspaper className="w-6 h-6 text-blue-600 mr-2" />
                  News Coverage
                </h3>
                <NewsList articles={searchResults.news} />
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold flex items-center mb-6">
                  <MessageCircle className="w-6 h-6 text-blue-600 mr-2" />
                  Social Media Buzz
                </h3>
                <RedditBuzz posts={searchResults.reddit} keyword={keyword} />
              </div>
            </div>
          </div>
        )}

        {!searchResults && !loading && (
          <div className="text-center text-gray-500 mt-12">
            <Globe className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Enter a keyword above to start analyzing trends</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
