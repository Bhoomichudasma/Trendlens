import React, { useMemo, useState } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TONE_CONFIG = {
  positive:  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-300',  dot: 'bg-green-400',  label: 'Pro / Supportive' },
  negative:  { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-300',    dot: 'bg-red-400',    label: 'Critical / Alarming' },
  neutral:   { bg: 'bg-slate-700/20',  border: 'border-slate-600/30',  text: 'text-slate-300',  dot: 'bg-slate-400',  label: 'Neutral / Factual' },
  critical:  { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', dot: 'bg-orange-400', label: 'Critical' },
  supportive:{ bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30',   text: 'text-cyan-300',   dot: 'bg-cyan-400',   label: 'Supportive' },
};

function getTone(tone) {
  const t = (tone || 'neutral').toLowerCase();
  return TONE_CONFIG[t] || TONE_CONFIG.neutral;
}

function buildSourceStats(seriesBySource) {
  return (seriesBySource || []).map((s) => {
    const avg = s.points.length
      ? s.points.reduce((sum, p) => sum + p.score, 0) / s.points.length : 0;
    const tone = avg >= 0.15 ? 'positive' : avg <= -0.15 ? 'negative' : 'neutral';
    return { source: s.source, avg: parseFloat(avg.toFixed(2)), count: s.points.length, tone };
  }).sort((a, b) => b.count - a.count);
}

const SourcesComparison = ({ sourcesComparison, sentiment }) => {
  const [activeTab, setActiveTab] = useState('framing');
  const comparison = sourcesComparison?.comparison || [];
  const sourceStats = useMemo(() => buildSourceStats(sentiment?.seriesBySource), [sentiment]);

  const positiveCount = sourceStats.filter(s => s.tone === 'positive').length;
  const negativeCount = sourceStats.filter(s => s.tone === 'negative').length;
  const neutralCount  = sourceStats.filter(s => s.tone === 'neutral').length;
  const total = sourceStats.length;

  // Group sources by tone for the "Sides" view
  const positiveSources = sourceStats.filter(s => s.tone === 'positive').slice(0, 8);
  const negativeSources = sourceStats.filter(s => s.tone === 'negative').slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Header summary */}
      <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4">
        <div className="text-slate-200 font-semibold mb-1">Who Is Saying What</div>
        <div className="text-slate-400 text-sm mb-4">
          How {total} different outlets are framing this story — their angle, bias, and key claims.
        </div>
        {total > 0 && (
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-300 font-semibold text-sm">{positiveCount}</span>
              <span className="text-green-400 text-xs">supportive</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/30 border border-slate-600/20">
              <Minus className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300 font-semibold text-sm">{neutralCount}</span>
              <span className="text-slate-400 text-xs">neutral</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-300 font-semibold text-sm">{negativeCount}</span>
              <span className="text-red-400 text-xs">critical</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'framing', label: 'AI Framing Analysis' },
          { id: 'sides',   label: 'Sides at a Glance' },
          { id: 'all',     label: `All Sources (${total})` },
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

      {/* AI Framing tab */}
      {activeTab === 'framing' && (
        comparison.length === 0 ? (
          <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-6 text-slate-400">
            No AI framing analysis available. Try rebuilding the topic.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {comparison.map((c, idx) => {
              const tone = getTone(c.tone);
              return (
                <div key={idx} className={`${tone.bg} border ${tone.border} rounded-xl p-4`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${tone.dot} shrink-0 mt-1`} />
                      <div className="text-slate-100 font-semibold">{c.source}</div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${tone.bg} border ${tone.border} ${tone.text} whitespace-nowrap shrink-0`}>
                      {tone.label}
                    </div>
                  </div>
                  <div className="text-slate-300 text-sm mb-3 leading-relaxed italic">
                    "{c.framing || '—'}"
                  </div>
                  {Array.isArray(c.keyFacts) && c.keyFacts.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-400 mb-2 font-medium">Key claims</div>
                      <div className="space-y-1">
                        {c.keyFacts.slice(0, 4).map((f, fIdx) => (
                          <div key={fIdx} className="text-slate-300 text-sm bg-slate-900/40 rounded-lg px-3 py-2 flex gap-2">
                            <span className="text-slate-500 shrink-0 mt-0.5">›</span>{f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Sides at a glance */}
      {activeTab === 'sides' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <div className="text-green-300 font-semibold">Supportive / Pro Coverage</div>
            </div>
            {positiveSources.length === 0 ? (
              <div className="text-slate-400 text-sm">No clearly supportive sources found.</div>
            ) : (
              <div className="space-y-2">
                {positiveSources.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900/30 rounded-lg px-3 py-2">
                    <span className="text-slate-200 text-sm">{s.source}</span>
                    <span className="text-green-400 text-xs">{s.count} article{s.count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <div className="text-red-300 font-semibold">Critical / Negative Coverage</div>
            </div>
            {negativeSources.length === 0 ? (
              <div className="text-slate-400 text-sm">No clearly critical sources found.</div>
            ) : (
              <div className="space-y-2">
                {negativeSources.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900/30 rounded-lg px-3 py-2">
                    <span className="text-slate-200 text-sm">{s.source}</span>
                    <span className="text-red-400 text-xs">{s.count} article{s.count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* All sources */}
      {activeTab === 'all' && (
        <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-xs mb-4">
            Tone score based on language analysis. Negative = alarming/critical language. Positive = supportive/optimistic language.
          </div>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {sourceStats.map((s) => {
              const tone = getTone(s.tone);
              const barPct = Math.abs(s.avg) * 100;
              return (
                <div key={s.source} className="flex items-center gap-3 py-1">
                  <div className={`w-2 h-2 rounded-full ${tone.dot} shrink-0`} />
                  <div className="text-slate-300 text-sm w-36 truncate shrink-0" title={s.source}>{s.source}</div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-slate-700/40 rounded-full h-1.5 overflow-hidden">
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.max(barPct, 3)}%`, backgroundColor: s.tone === 'positive' ? '#22c55e' : s.tone === 'negative' ? '#ef4444' : '#94a3b8' }} />
                    </div>
                    <div className={`text-xs w-20 shrink-0 ${tone.text}`}>{tone.label.split(' ')[0]}</div>
                  </div>
                  <div className="text-slate-500 text-xs w-14 text-right shrink-0">{s.count} art.</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SourcesComparison;
