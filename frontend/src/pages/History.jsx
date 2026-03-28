import React, { useState, useEffect } from 'react';
import { Clock, Search, Trash2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function History() {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    loadHistory();
  }, [isAuthenticated, token]);

  const loadHistory = async () => {
    // If authenticated, fetch server-side history; else fallback to local storage
    if (isAuthenticated && token) {
      try {
        setLoading(true);
        const { history: serverHistory } = await api.getMyHistory(token);
        setHistory(
          (serverHistory || []).map((h) => ({
            keyword: h.keyword,
            date: h.createdAt,
            category: h.category,
          }))
        );
        setLoading(false);
        return;
      } catch (err) {
        console.error('History fetch failed, falling back to local:', err.message);
        setLoading(false);
      }
    }

    // Guest fallback
    const savedHistory = JSON.parse(localStorage.getItem('trendHistory')) || [];
    setHistory(savedHistory);
  };

  const clearHistory = async () => {
    if (isAuthenticated && token) {
      // Not implemented server-side; for now just clear client view
      setHistory([]);
      return;
    }
    localStorage.setItem('trendHistory', JSON.stringify([]));
    setHistory([]);
  };

  const slugify = (input) => {
    return String(input || '')
      .trim()
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const filteredHistory = history.filter(item =>
    item.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Topbar */}
      <div className="border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                TrendLens
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/" className="text-sm font-medium text-slate-300 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/30 bg-slate-800/50 hover:bg-slate-800 rounded-lg px-3 py-2 transition-colors">
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-slate-700 bg-slate-800/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Search History</CardTitle>
                  <CardDescription>Your recent trend searches</CardDescription>
                </div>
              </div>
              {history.length > 0 && (
                <Button variant="destructive" onClick={clearHistory} className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.length > 0 && (
              <div className="relative mb-6">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search in history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            )}

            {loading ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-slate-500 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Loading history...</h3>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {history.length === 0 ? 'No Search History' : 'No Matching Searches'}
                </h3>
                <p className="text-slate-400">
                  {history.length === 0
                    ? 'Start analyzing trends to build your search history'
                    : 'Try a different search term'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((item, index) => (
                  <Link
                    to={`/topic/${encodeURIComponent(slugify(item.keyword))}`}
                    key={index}
                    className="block border border-slate-700 hover:border-cyan-500/30 bg-slate-800/50 hover:bg-slate-800/70 rounded-lg p-4 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {item.keyword}
                        </h3>
                        <p className="text-sm text-slate-400">
                          Searched on {new Date(item.date).toLocaleDateString()} at{' '}
                          {new Date(item.date).toLocaleTimeString()}
                        </p>
                      </div>
                      <Search className="w-5 h-5 text-cyan-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default History;