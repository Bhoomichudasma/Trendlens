import React, { useMemo, useState } from 'react';
import { Clock, Info, X } from 'lucide-react';

function TimelineModal({ event, onClose }) {
  if (!event) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {event.date ? new Date(event.date).toLocaleString() : 'Date not specified'}
            </div>
            <div className="text-lg font-semibold mt-1">{event.title}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-800/20 hover:bg-slate-800/35 text-slate-200 p-2"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-3">
            <div className="text-sm font-semibold text-slate-200 mb-1">What happened</div>
            <div className="text-slate-300 whitespace-pre-wrap">{event.whatHappened}</div>
          </div>

          <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-3">
            <div className="text-sm font-semibold text-slate-200 mb-1">Why it matters</div>
            <div className="text-slate-300 whitespace-pre-wrap">{event.whyItMatters}</div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
            <div className="text-sm font-semibold text-cyan-200 mb-1 flex items-center gap-2">
              <Info className="w-4 h-4" />
              AI explanation
            </div>
            <div className="text-cyan-100 whitespace-pre-wrap">{event.aiExplanation}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Timeline = ({ timelineEvents }) => {
  const events = useMemo(() => {
    const arr = timelineEvents || [];
    return [...arr].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });
  }, [timelineEvents]);

  const [selected, setSelected] = useState(null);

  if (!events || events.length === 0) {
    return (
      <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-6 text-slate-300">
        No timeline events found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4">
        <div className="text-slate-200 font-semibold">Chronological Intelligence Timeline</div>
        <div className="text-slate-400 text-sm mt-1">
          Click a node to see “what happened”, “why it matters”, and the AI cause-effect explanation.
        </div>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-800" />

        <div className="space-y-3">
          {events.map((ev) => (
            <button
              key={ev.eventId}
              onClick={() => setSelected(ev)}
              className="w-full text-left block relative pl-10 pr-4 py-4 rounded-xl border border-slate-800 bg-slate-800/15 hover:bg-slate-800/25 transition-colors"
            >
              <div className="absolute left-2 top-6 w-3 h-3 rounded-full bg-cyan-400" />
              <div className="text-xs text-slate-400">
                {ev.date ? new Date(ev.date).toLocaleDateString() : ev.rawDate || 'Date unknown'}
              </div>
              <div className="text-base font-semibold text-slate-200 mt-1">{ev.title}</div>
              <div className="text-slate-300 text-sm mt-2 line-clamp-2">
                {ev.whatHappened}
              </div>
            </button>
          ))}
        </div>
      </div>

      <TimelineModal event={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Timeline;

