import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Clock, Loader2, RefreshCw, Bell, BellOff } from 'lucide-react';
import api from '../services/api';
import StoryDNATabs from '../components/StoryDNATabs';
import ExportButton from '../components/ExportButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
const BASE_URL = import.meta.env.VITE_API_URL;

function normalizeKeywordFromSlug(slug) {
  // We create slugs by replacing non-alphanumerics with "-".
  // Best-effort reverse for a shareable URL: treat "-" as spaces.
  return String(slug || '').replace(/-/g, ' ').trim();
}

const TopicIntelligence = () => {
  const { slug } = useParams();
  const location = useLocation();

  const keyword = useMemo(() => normalizeKeywordFromSlug(slug), [slug]);
  const categoryFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('category') || undefined;
  }, [location.search]);

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertSubscribed, setAlertSubscribed] = useState(false);
  const [alertBusy, setAlertBusy] = useState(false);
  const [showAlertInput, setShowAlertInput] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError('');
      try {
        // Log once when the topic page loads
        const data = await api.searchIntelligence(keyword, { category: categoryFromQuery }, { log: true });
        if (!cancelled) setPayload(data);
      } catch {
        if (!cancelled) setError('Failed to generate Story DNA. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (keyword) run();
    return () => {
      cancelled = true;
    };
  }, [keyword, categoryFromQuery]);

  // ─── FETCH ALERT STATUS ON PAGE LOAD ───────────────────────────
  useEffect(() => {
    if (!payload?.topic?.id) return;

    async function checkAlertStatus() {
      try {
        const res = await fetch(`${BASE_URL}/alerts/status/${payload.topic.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.alertsEnabled && data.subscriberCount > 0) {
            setAlertSubscribed(true);
          }
        }
      } catch {
        // Silent - just don't show status if it fails
      }
    }

    checkAlertStatus();
  }, [payload?.topic?.id]);

  const handleRefresh = async () => {
    try {
      setRefreshBusy(true);
      setError('');
      const data = await api.refreshIntelligence(keyword, { category: categoryFromQuery }, { log: false });
      setPayload(data);
    } catch {
      setError('Failed to refresh Story DNA. Please try again.');
    } finally {
      setRefreshBusy(false);
    }
  };

  const handleSubscribeAlert = async () => {
    if (!alertEmail || !payload?.topic?.id) return;
    setAlertBusy(true);
    try {
      const res = await fetch(`${BASE_URL}/alerts/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: payload.topic.id, email: alertEmail }),
      });
      if (res.ok) {
        setAlertSubscribed(true);
        setAlertEmail('');
        setShowAlertInput(false);
      }
    } catch { /* silent */ } finally {
      setAlertBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">TrendLens AI</div>
              <div className="text-xs text-slate-400">Universal Event Intelligence</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 bg-slate-800/20 hover:border-cyan-500/40 text-sm font-medium text-slate-200"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              to="/history"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 bg-slate-800/20 hover:border-cyan-500/40 text-sm font-medium text-slate-200"
            >
              <Clock className="w-4 h-4" />
              History
            </Link>
            {!loading && payload && (
              <>
                <button
                  onClick={handleRefresh}
                  disabled={refreshBusy}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 bg-slate-800/20 hover:border-cyan-500/40 text-sm font-medium text-slate-200 disabled:opacity-60"
                >
                  {refreshBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Rebuild
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowAlertInput(!showAlertInput)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${
                      alertSubscribed
                        ? 'border-green-500/40 bg-green-500/10 text-green-400'
                        : 'border-slate-800 hover:border-cyan-500/40 bg-slate-800/20 text-slate-200'
                    }`}
                  >
                    {alertSubscribed ? <Bell className="w-4 h-4 fill-current" /> : <Bell className="w-4 h-4" />}
                    {alertSubscribed ? 'Alerts On' : 'Get Alerts'}
                  </button>
                  {showAlertInput && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 z-50">
                      <p className="text-sm text-slate-300 mb-3">Get alerts for <span className="font-semibold text-cyan-400">{keyword}</span></p>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={alertEmail}
                        onChange={(e) => setAlertEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-500 text-sm mb-3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSubscribeAlert}
                          disabled={alertBusy || !alertEmail}
                          className="flex-1 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-medium text-sm rounded transition-colors"
                        >
                          {alertBusy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Subscribe'}
                        </button>
                        <button
                          onClick={() => setShowAlertInput(false)}
                          className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium text-sm rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            Story Intelligence for <span className="text-cyan-400">{keyword}</span>
          </h1>
          <p className="text-slate-400 mt-2">
            Story DNA first: Background → Trigger → Escalation → Current → Timeline.
          </p>
        </div>

        {loading && (
          <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 text-slate-300">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span>Building Story DNA…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/15 border-l-4 border-red-500 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-300 mb-2">Error Loading Story</h3>
                <p className="text-red-200/90 mb-4">{error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshBusy}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {refreshBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Retry
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors"
                  >
                    Go Back
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-red-500/20">
                  <p className="text-sm text-red-200/70">
                    <strong>Troubleshooting tips:</strong>
                  </p>
                  <ul className="text-sm text-red-200/70 mt-2 space-y-1 ml-4 list-disc">
                    <li>Check your internet connection</li>
                    <li>Try searching for a different topic</li>
                    <li>Backend API might be temporarily unavailable</li>
                    <li>Some data sources may be rate-limited</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && payload && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-slate-400">
                Category: <span className="text-slate-200 font-medium">{payload?.topic?.category}</span>
              </div>
              <ExportButton data={payload} keyword={payload?.topic?.keyword || keyword} />
            </div>

            <StoryDNATabs
              dna={payload.dna}
              topic={payload.topic}
              timelineEvents={payload.timelineEvents}
              sentiment={payload.sentiment}
              sourcesComparison={payload.sourcesComparison}
              relatedTopics={payload.relatedTopics}
              redditPosts={payload.redditPosts}
              googleTrends={payload.googleTrends}
              keyword={keyword}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicIntelligence;

