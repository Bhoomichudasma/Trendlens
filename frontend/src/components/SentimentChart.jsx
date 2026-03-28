import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, ReferenceLine,
  BarChart, Bar, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Newspaper, MessageCircle } from 'lucide-react';

function toneLabel(score) {
  if (score >= 0.3)  return { label: 'Very Positive', color: '#22c55e', bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-300',  emoji: '😊' };
  if (score >= 0.05) return { label: 'Slightly Positive', color: '#67e8f9', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-300', emoji: '🙂' };
  if (score <= -0.3) return { label: 'Very Negative', color: '#ef4444', bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-300',    emoji: '😠' };
  if (score <= -0.05)return { label: 'Slightly Negative', color: '#fca5a5', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-300', emoji: '😟' };
  return { label: 'Neutral', color: '#94a3b8', bg: 'bg-slate-700/20', border: 'border-slate-600/20', text: 'text-slate-300', emoji: '😐' };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const score = payload[0]?.value ?? 0;
  const tone = toneLabel(score);
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm shadow-xl">
      <div className="text-slate-400 mb-1 text-xs">{label}</div>
      <div style={{ color: tone.color }} className="font-semibold">{tone.emoji} {tone.label}</div>
      <div className="text-slate-500 text-xs mt-1">Score: {score.toFixed(2)}</div>
    </div>
  );
};

const SentimentChart = ({ sentiment }) => {
  const [activeTab, setActiveTab] = useState('timeline');
  const seriesBySource = sentiment?.seriesBySource || [];
  const annotations = sentiment?.annotations || [];

  // Aggregate all into daily average — only last 2 years for chart readability
  const allChartData = useMemo(() => {
    const map = new Map();
    for (const s of seriesBySource) {
      for (const p of s.points || []) {
        const prev = map.get(p.date) || { sum: 0, count: 0 };
        map.set(p.date, { sum: prev.sum + p.score, count: prev.count + 1 });
      }
    }
    const cutoff = new Date('2024-01-01').getTime();
    return [...map.entries()]
      .filter(([date]) => new Date(date).getTime() >= cutoff)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, { sum, count }]) => ({ date, score: parseFloat((sum / count).toFixed(3)) }));
  }, [seriesBySource]);

  // Reddit vs News split
  const redditSeries = seriesBySource.filter(s => s.source?.startsWith('r/'));
  const newsSeries   = seriesBySource.filter(s => !s.source?.startsWith('r/'));

  function avgSeries(series) {
    const map = new Map();
    for (const s of series) {
      for (const p of s.points || []) {
        const prev = map.get(p.date) || { sum: 0, count: 0 };
        map.set(p.date, { sum: prev.sum + p.score, count: prev.count + 1 });
      }
    }
    const cutoff = new Date('2024-01-01').getTime();
    return [...map.entries()]
      .filter(([date]) => new Date(date).getTime() >= cutoff)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, { sum, count }]) => ({ date, score: parseFloat((sum / count).toFixed(3)) }));
  }

  const redditChartData = useMemo(() => avgSeries(redditSeries), [redditSeries]);
  const newsChartData   = useMemo(() => avgSeries(newsSeries), [newsSeries]);

  // Overall stats
  const avgScore = useMemo(() => {
    if (!allChartData.length) return 0;
    return allChartData.reduce((s, d) => s + d.score, 0) / allChartData.length;
  }, [allChartData]);

  const redditAvg = useMemo(() => {
    if (!redditChartData.length) return null;
    return redditChartData.reduce((s, d) => s + d.score, 0) / redditChartData.length;
  }, [redditChartData]);

  const newsAvg = useMemo(() => {
    if (!newsChartData.length) return null;
    return newsChartData.reduce((s, d) => s + d.score, 0) / newsChartData.length;
  }, [newsChartData]);

  // Most negative and most positive days
  const sortedByScore = [...allChartData].sort((a, b) => a.score - b.score);
  const mostNegativeDays = sortedByScore.slice(0, 3);
  const mostPositiveDays = sortedByScore.slice(-3).reverse();

  // Mood shift detection
  const moodShifts = useMemo(() => {
    const shifts = [];
    for (let i = 1; i < allChartData.length; i++) {
      const delta = allChartData[i].score - allChartData[i - 1].score;
      if (Math.abs(delta) >= 0.2) {
        shifts.push({ date: allChartData[i].date, delta, direction: delta > 0 ? 'improved' : 'worsened' });
      }
    }
    return shifts.slice(0, 5);
  }, [allChartData]);

  const overallTone = toneLabel(avgScore);
  const shiftAnnotation = annotations.find(a => a?.date);

  if (!allChartData.length) {
    return (
      <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-6 text-slate-300">
        No sentiment data found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`${overallTone.bg} border ${overallTone.border} rounded-xl p-4 flex items-center gap-3`}>
          <div className="text-3xl">{overallTone.emoji}</div>
          <div>
            <div className="text-slate-400 text-xs">Overall Tone</div>
            <div className={`font-bold ${overallTone.text}`}>{overallTone.label}</div>
            <div className="text-slate-500 text-xs">Score: {avgScore.toFixed(2)}</div>
          </div>
        </div>

        {newsAvg !== null && (
          <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-slate-400 shrink-0" />
            <div>
              <div className="text-slate-400 text-xs">News Media</div>
              <div className={`font-bold ${toneLabel(newsAvg).text}`}>{toneLabel(newsAvg).emoji} {toneLabel(newsAvg).label}</div>
              <div className="text-slate-500 text-xs">{newsSeries.length} outlets</div>
            </div>
          </div>
        )}

        {redditAvg !== null && (
          <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-slate-400 shrink-0" />
            <div>
              <div className="text-slate-400 text-xs">Reddit</div>
              <div className={`font-bold ${toneLabel(redditAvg).text}`}>{toneLabel(redditAvg).emoji} {toneLabel(redditAvg).label}</div>
              <div className="text-slate-500 text-xs">{redditSeries.length} subreddits</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'timeline', label: 'Tone Over Time' },
          { id: 'compare',  label: 'Reddit vs News' },
          { id: 'shifts',   label: `Mood Shifts (${moodShifts.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              activeTab === t.id
                ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-200'
                : 'bg-slate-800/20 border-slate-700 text-slate-300 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Timeline tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-200 font-semibold mb-1">Coverage Tone Day by Day</div>
            <div className="text-slate-400 text-xs mb-4">
              Above the line = positive/hopeful coverage. Below = negative/alarming. The line shows the average across all sources each day.
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={allChartData}>
                  <defs>
                    <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                  <YAxis domain={[-1, 1]} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false}
                    tickFormatter={v => v === 1 ? '+1 😊' : v === -1 ? '-1 😠' : v === 0 ? '0' : v} width={55} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="rgba(148,163,184,0.25)" strokeDasharray="4 4" />
                  {shiftAnnotation?.date && (
                    <ReferenceLine x={shiftAnnotation.date} stroke="rgba(34,211,238,0.6)" strokeWidth={2}
                      label={{ position: 'top', value: '⚡', fill: '#22d3ee', fontSize: 14 }} />
                  )}
                  <Area type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={2}
                    fill="url(#posGrad)" dot={false} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Best/worst days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <div className="text-red-300 font-semibold text-sm">Most Negative Days</div>
              </div>
              {mostNegativeDays.map((d, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-800/50 last:border-0">
                  <span className="text-slate-300 text-sm">{d.date}</span>
                  <span className="text-red-400 text-sm font-medium">{d.score.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <div className="text-green-300 font-semibold text-sm">Most Positive Days</div>
              </div>
              {mostPositiveDays.map((d, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-800/50 last:border-0">
                  <span className="text-slate-300 text-sm">{d.date}</span>
                  <span className="text-green-400 text-sm font-medium">+{d.score.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reddit vs News tab */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-200 font-semibold mb-1">Reddit vs News Media</div>
            <div className="text-slate-400 text-xs mb-4">
              Are people on Reddit reacting differently to how news outlets are covering this?
            </div>

            {/* Side by side score */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-900/30 rounded-xl border border-slate-700">
                <Newspaper className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                <div className="text-slate-400 text-xs mb-1">News Media avg</div>
                <div className={`text-2xl font-bold ${newsAvg !== null ? toneLabel(newsAvg).text : 'text-slate-400'}`}>
                  {newsAvg !== null ? newsAvg.toFixed(2) : 'N/A'}
                </div>
                <div className={`text-xs mt-1 ${newsAvg !== null ? toneLabel(newsAvg).text : 'text-slate-400'}`}>
                  {newsAvg !== null ? toneLabel(newsAvg).emoji + ' ' + toneLabel(newsAvg).label : '—'}
                </div>
              </div>
              <div className="text-center p-4 bg-slate-900/30 rounded-xl border border-slate-700">
                <MessageCircle className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                <div className="text-slate-400 text-xs mb-1">Reddit avg</div>
                <div className={`text-2xl font-bold ${redditAvg !== null ? toneLabel(redditAvg).text : 'text-slate-400'}`}>
                  {redditAvg !== null ? redditAvg.toFixed(2) : 'N/A'}
                </div>
                <div className={`text-xs mt-1 ${redditAvg !== null ? toneLabel(redditAvg).text : 'text-slate-400'}`}>
                  {redditAvg !== null ? toneLabel(redditAvg).emoji + ' ' + toneLabel(redditAvg).label : '—'}
                </div>
              </div>
            </div>

            {/* Divergence insight */}
            {newsAvg !== null && redditAvg !== null && (
              <div className="bg-slate-900/40 border border-slate-700 rounded-lg p-3 text-sm text-slate-300">
                {Math.abs(newsAvg - redditAvg) < 0.1
                  ? '✅ News and Reddit are largely aligned in tone on this topic.'
                  : newsAvg > redditAvg
                    ? `📰 News media is more positive (${newsAvg.toFixed(2)}) than Reddit (${redditAvg.toFixed(2)}) — Reddit users are more critical.`
                    : `💬 Reddit is more positive (${redditAvg.toFixed(2)}) than news media (${newsAvg.toFixed(2)}) — media coverage is more alarming.`
                }
              </div>
            )}
          </div>

          {/* Dual chart */}
          {(newsChartData.length > 0 || redditChartData.length > 0) && (
            <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4">
              <div className="text-slate-300 text-sm font-medium mb-3">News tone over time</div>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={newsChartData}>
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                    <YAxis domain={[-1, 1]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} width={30} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="rgba(148,163,184,0.2)" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="score" stroke="#60a5fa" strokeWidth={2} fill="rgba(96,165,250,0.1)" dot={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-slate-300 text-sm font-medium mt-4 mb-3">Reddit tone over time</div>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={redditChartData}>
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                    <YAxis domain={[-1, 1]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} width={30} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="rgba(148,163,184,0.2)" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="score" stroke="#f97316" strokeWidth={2} fill="rgba(249,115,22,0.1)" dot={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mood shifts tab */}
      {activeTab === 'shifts' && (
        <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-200 font-semibold mb-1">Detected Mood Shifts</div>
          <div className="text-slate-400 text-xs mb-4">
            Days where coverage tone changed significantly — could indicate a major event, announcement, or turning point.
          </div>
          {moodShifts.length === 0 ? (
            <div className="text-slate-400 text-sm">No significant mood shifts detected — tone has been consistent.</div>
          ) : (
            <div className="space-y-3">
              {moodShifts.map((s, i) => (
                <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border ${
                  s.direction === 'improved'
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                }`}>
                  <div className="text-2xl">{s.direction === 'improved' ? '📈' : '📉'}</div>
                  <div className="flex-1">
                    <div className="text-slate-200 font-medium text-sm">{s.date}</div>
                    <div className={`text-xs mt-0.5 ${s.direction === 'improved' ? 'text-green-400' : 'text-red-400'}`}>
                      Tone {s.direction} by {Math.abs(s.delta).toFixed(2)} points
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${s.direction === 'improved' ? 'text-green-400' : 'text-red-400'}`}>
                    {s.direction === 'improved' ? '+' : ''}{s.delta.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SentimentChart;
