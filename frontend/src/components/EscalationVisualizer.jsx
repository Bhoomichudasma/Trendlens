import React, { useMemo } from 'react';

function uniq(arr) {
  return [...new Set(arr)];
}

const EscalationVisualizer = ({ timelineEvents = [], escalationChain }) => {
  const edges = useMemo(() => {
    const aiEdges = escalationChain?.edges || [];

    // If AI gave us enough edges, use them
    if (aiEdges.length >= 3) return aiEdges;

    // Otherwise auto-build a chain from timeline events (sequential cause→effect)
    const sorted = [...(timelineEvents || [])]
      .filter((e) => e?.eventId && e?.title)
      .sort((a, b) => {
        const oa = typeof a.order === 'number' ? a.order : (a.date ? new Date(a.date).getTime() : 0);
        const ob = typeof b.order === 'number' ? b.order : (b.date ? new Date(b.date).getTime() : 0);
        return oa - ob;
      });

    const generated = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      generated.push({
        causeEventId: sorted[i].eventId,
        effectEventId: sorted[i + 1].eventId,
        cause: sorted[i].title,
        effect: sorted[i + 1].title,
      });
    }
    return generated.length > 0 ? generated : aiEdges;
  }, [escalationChain, timelineEvents]);

  const eventsById = useMemo(() => {
    const m = new Map();
    (timelineEvents || []).forEach((e) => {
      if (e?.eventId) m.set(e.eventId, e);
    });
    return m;
  }, [timelineEvents]);

  const nodeIds = useMemo(() => uniq(edges.flatMap((e) => [e.causeEventId, e.effectEventId]).filter(Boolean)), [edges]);

  const orderedNodes = useMemo(() => {
    const nodes = nodeIds
      .map((id) => eventsById.get(id))
      .filter(Boolean);
    nodes.sort((a, b) => {
      const oa = typeof a.order === 'number' ? a.order : (a.date ? new Date(a.date).getTime() : 0);
      const ob = typeof b.order === 'number' ? b.order : (b.date ? new Date(b.date).getTime() : 0);
      return oa - ob;
    });
    return nodes;
  }, [nodeIds, eventsById]);

  if (nodeIds.length === 0 || edges.length === 0) {
    return (
      <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-6 text-slate-300">
        No escalation chain data found.
      </div>
    );
  }

  const layout = orderedNodes.map((ev, idx) => {
    const x = 120 + idx * 260;
    const y = 90 + (idx % 2) * 160;
    return { id: ev.eventId, x, y, title: ev.title };
  });

  const posById = new Map(layout.map((p) => [p.id, p]));

  const width = Math.max(600, 120 + orderedNodes.length * 260);
  const height = 340;

  return (
    <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4 overflow-x-auto">
      <div className="text-slate-200 font-semibold mb-3">Escalation Path Visualizer</div>

      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="absolute inset-0">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="rgba(34,211,238,0.9)" />
            </marker>
          </defs>

          {edges.map((e, idx) => {
            const from = posById.get(e.causeEventId);
            const to = posById.get(e.effectEventId);
            if (!from || !to) return null;
            const x1 = from.x + 90;
            const y1 = from.y + 18;
            const x2 = to.x + 90;
            const y2 = to.y + 18;
            return (
              <path
                key={idx}
                d={`M ${x1} ${y1} C ${x1 + 80} ${y1}, ${x2 - 80} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="rgba(34,211,238,0.55)"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            );
          })}
        </svg>

        {layout.map((n) => (
          <div
            key={n.id}
            style={{ left: n.x - 90, top: n.y }}
            className="absolute max-w-[220px] border border-cyan-500/30 bg-slate-900/30 rounded-xl p-3"
          >
            <div className="text-xs text-cyan-200/90 font-medium">Event node</div>
            <div className="text-sm text-slate-100 font-semibold mt-1">{n.title}</div>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-400 mt-3">
        Each edge is a cause → effect step extracted from the AI timeline.
      </div>
    </div>
  );
};

export default EscalationVisualizer;

