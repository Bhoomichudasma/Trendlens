import React, { useState } from 'react';
import { List, Brain, Clock3, Network, Heart, Sparkles, MessageCircle, AlertTriangle } from 'lucide-react';
import Timeline from './Timeline';
import EscalationVisualizer from './EscalationVisualizer';
import SentimentChart from './SentimentChart';
import SourcesComparison from './SourcesComparison';
import GoogleTrendsChart from './GoogleTrendsChart';

// Lightweight local tab system (avoid adding more dependencies).
const tabs = [
  { id: 'story', label: 'Story DNA' },
  { id: 'trends', label: 'Google Trends' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'escalation', label: 'Escalation' },
  { id: 'sources', label: 'Sources' },
  { id: 'sentiment', label: 'Sentiment' },
  { id: 'reddit', label: 'Reddit' },
];

function TextCard({ title, text, icon }) {
  return (
    <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <div className="font-semibold text-slate-200">{title}</div>
      </div>
      <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">{text || 'Generating this layer... If this persists, the AI may be rate-limited. Try again in a moment.'}</div>
    </div>
  );
}

const StoryDNATabs = ({ dna, timelineEvents, sentiment, sourcesComparison, relatedTopics, redditPosts, googleTrends, topic, keyword }) => {
  const [active, setActive] = useState('story');
  const [eli5, setEli5] = useState(false);
  const topicKeyword = keyword || topic?.keyword || '';
  
  // Helper to convert escalation (array) to string
  const formatEscalation = (esc) => {
    if (Array.isArray(esc)) return esc.join('\n\n');
    return esc || '';
  };
  
  const dnaLayers = eli5 && dna?.eli5
    ? {
        background: dna.eli5.background,
        trigger: dna.eli5.trigger,
        escalation: formatEscalation(dna.eli5.escalation),
        current: dna.eli5.current,
        timelineSummary: dna.eli5.timelineSummary,
      }
    : {
        background: dna?.background || '',
        trigger: dna?.trigger || '',
        escalation: formatEscalation(dna?.escalation),
        current: dna?.current || '',
        timelineSummary: dna?.timelineSummary || '',
      };

  const redditPulse = dna?.redditPulse || {};

  const redditPostsSafe = redditPosts || [];

  const currentBeliefs = redditPulse.currentRedditBeliefs || [];

  return (
    <div className="space-y-4">
      {/* Tab headers */}
      <div className="bg-slate-800/15 border border-slate-800 rounded-xl p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={[
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active === t.id ? 'bg-cyan-500/15 border border-cyan-500/35 text-cyan-200' : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-800/30 border border-transparent',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setEli5((v) => !v)}
            className="ml-auto px-3 py-2 rounded-lg text-sm font-medium border border-slate-800 bg-slate-800/20 hover:bg-slate-800/30 text-slate-200 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            ELI5 Mode
          </button>
        </div>
      </div>

      {/* Tab content */}
      {active === 'story' && (
        <div className="space-y-4">
          {/* Story DNA cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TextCard
              title="Background"
              text={dnaLayers.background}
              icon={<Brain className="w-5 h-5 text-cyan-400" />}
            />
            <TextCard
              title="Trigger"
              text={dnaLayers.trigger}
              icon={<AlertTriangle className="w-5 h-5 text-cyan-400" />}
            />
            <TextCard
              title="Escalation"
              text={dnaLayers.escalation}
              icon={<Network className="w-5 h-5 text-cyan-400" />}
            />
            <TextCard
              title="Current"
              text={dnaLayers.current}
              icon={<Clock3 className="w-5 h-5 text-cyan-400" />}
            />
          </div>

          <TextCard
            title="Timeline Recap"
            text={dnaLayers.timelineSummary}
            icon={<List className="w-5 h-5 text-cyan-400" />}
          />

        </div>
      )}

      {active === 'trends' && <GoogleTrendsChart googleTrends={googleTrends} keyword={topicKeyword} />}
      {active === 'timeline' && <Timeline timelineEvents={timelineEvents} />}
      {active === 'escalation' && <EscalationVisualizer timelineEvents={timelineEvents} escalationChain={dna?.escalationChain} />}
      {active === 'sources' && <SourcesComparison sourcesComparison={sourcesComparison} sentiment={sentiment} />}
      {active === 'sentiment' && <SentimentChart sentiment={sentiment} />}
      {active === 'reddit' && (
        <div className="space-y-4">
          <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-5 h-5 text-cyan-400" />
              <div className="font-semibold text-slate-200">What Reddit Thinks (Pulse)</div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 ml-auto">Public Opinion</span>
            </div>
            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{redditPulse.summary || ''}</div>

            {currentBeliefs.length > 0 && (
              <div className="mt-3">
                <div className="text-slate-400 text-sm mb-2">Common beliefs</div>
                <div className="flex flex-wrap gap-2">
                  {currentBeliefs.map((b, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-slate-900/40 border border-slate-700 text-slate-200 text-sm">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-cyan-400" />
                <div className="font-semibold text-slate-200">Reddit Posts</div>
              </div>
              <div className="text-xs text-slate-400">Click a post for the permalink</div>
            </div>
            {redditPostsSafe.length === 0 ? (
              <div className="text-slate-400">No Reddit posts found for this topic (yet).</div>
            ) : (
              <div className="space-y-3">
                {redditPostsSafe.map((p, idx) => (
                  <a
                    key={`${p.permalink || idx}`}
                    href={p.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-slate-800 bg-slate-800/20 hover:bg-slate-800/35 transition-colors p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-slate-200 font-medium leading-snug">{p.title}</div>
                      <div className="text-xs text-slate-400 whitespace-nowrap">
                        {typeof p.score === 'number' ? `${p.score.toLocaleString()} pts` : ''}
                      </div>
                    </div>
                    <div className="text-slate-400 text-xs mt-2">
                      r/{p.subreddit} · {p.num_comments ? `${p.num_comments} comments` : 'discussion'} ·{' '}
                      {p.created_utc ? new Date(p.created_utc * 1000).toLocaleDateString() : ''}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryDNATabs;

