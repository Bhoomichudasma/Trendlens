// // 












// import React, { useMemo } from 'react';
// import { Globe, MapPin, BarChart3 } from 'lucide-react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
// import { Badge } from './ui/badge';

// const extractTrendValue = (input) => {
//   if (input === null || input === undefined) return 0;
//   if (typeof input === 'number' && Number.isFinite(input)) return input;
//   if (Array.isArray(input)) return extractTrendValue(input[0]);
//   if (typeof input === 'object') {
//     if (typeof input.value === 'number' && Number.isFinite(input.value)) return input.value;
//     if (Array.isArray(input.value)) return extractTrendValue(input.value[0]);
//   }
//   const parsed = Number(input);
//   return Number.isFinite(parsed) ? parsed : 0;
// };

// const dateStringToUnixTimestamp = (dateStr) => {
//   if (!dateStr) return null;
//   const normalized = String(dateStr).trim();
//   if (/^\d{8}$/.test(normalized)) {
//     const year = Number(normalized.slice(0, 4));
//     const month = Number(normalized.slice(4, 6)) - 1;
//     const day = Number(normalized.slice(6, 8));
//     const d = new Date(Date.UTC(year, month, day));
//     if (!Number.isNaN(d.getTime())) return Math.floor(d.getTime() / 1000);
//   }
//   const parsed = Date.parse(normalized);
//   if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
//   return null;
// };

// const extractTrendTimestamp = (entry) => {
//   if (!entry) return null;
//   if (typeof entry.time === 'number' && entry.time > 0) return entry.time;
//   if (typeof entry.time === 'string') {
//     const asNumber = Number(entry.time);
//     if (!Number.isNaN(asNumber) && asNumber > 0) return asNumber;
//   }
//   if (entry.formattedAxisTime) {
//     const parsed = Date.parse(entry.formattedAxisTime);
//     if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
//   }
//   if (entry.formattedTime) {
//     const firstPart = String(entry.formattedTime).split('–')[0].trim();
//     const parsed = Date.parse(firstPart);
//     if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
//   }
//   const fromDate = dateStringToUnixTimestamp(entry.date);
//   if (fromDate) return fromDate;
//   return null;
// };

// const GoogleTrendsChart = ({ googleTrends }) => {

//   if (!googleTrends) {
//     return (
//       <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-6 text-center">
//         <p className="text-slate-400">No Google Trends data available</p>
//       </div>
//     );
//   }

//   // Only keep top-level country codes with non-zero values
//   const baseTopRegions = useMemo(
//     () =>
//       (googleTrends?.interest_by_region || [])
//         .slice()
//         .sort((a, b) => (b.value || 0) - (a.value || 0))
//         .slice(0, 10),
//     [googleTrends]
//   );

//   const { timeline_data = [] } = googleTrends;

//   const formatDate = (unixSeconds) => {
//     if (!unixSeconds) return null;
//     const ms = unixSeconds * 1000;
//     const d = new Date(ms);
//     if (Number.isNaN(d.getTime())) return null;
//     const minMs = Date.UTC(2004, 0, 1);
//     const maxMs = Date.now() + 7 * 24 * 60 * 60 * 1000;
//     if (ms < minMs || ms > maxMs) return null;
//     return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
//   };

//   const fallbackLabel = (entry) => {
//     if (entry?.formattedTime) {
//       const parsed = Date.parse(entry.formattedTime);
//       if (!Number.isNaN(parsed)) {
//         const minMs = Date.UTC(2004, 0, 1);
//         const maxMs = Date.now() + 7 * 24 * 60 * 60 * 1000;
//         if (parsed >= minMs && parsed <= maxMs) {
//           return new Date(parsed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
//         }
//       }
//     }
//     return null;
//   };

//   const peakEntry = timeline_data.reduce(
//     (best, curr) => (curr.value > best.value ? curr : best),
//     { value: -Infinity, date: null, formattedTime: null }
//   );

//   const xLabels = (() => {
//     if (timeline_data.length === 0) return [];
//     const count = Math.min(8, timeline_data.length);
//     const step = Math.max(1, Math.floor(timeline_data.length / count));
//     const labels = [];
//     for (let i = 0; i < timeline_data.length; i += step) {
//       const entry = timeline_data[i];
//       const label = entry.label || formatDate(entry.date) || fallbackLabel(entry);
//       labels.push({ idx: i, label: label || 'N/A' });
//     }
//     const lastIdx = timeline_data.length - 1;
//     if (labels[labels.length - 1]?.idx !== lastIdx) {
//       const entry = timeline_data[lastIdx];
//       const label = entry.label || formatDate(entry.date) || fallbackLabel(entry);
//       labels.push({ idx: lastIdx, label: label || 'N/A' });
//     }
//     return labels;
//   })();

//   const allValues = timeline_data.map((d) => d.value || 0);
//   const maxValue = Math.max(...allValues, 100);
//   const minValue = Math.min(...allValues, 0);
//   const range = maxValue - minValue || 1;

//   const recentData = timeline_data.slice(-7);
//   const currentTrend = timeline_data.length > 0 ? timeline_data[timeline_data.length - 1]?.value || 0 : 0;
//   const previousTrend = timeline_data.length > 1 ? timeline_data[timeline_data.length - 2]?.value || 0 : 0;
//   const trendDirection = currentTrend >= previousTrend ? 'up' : 'down';
//   const changePercent = previousTrend > 0 ? (((currentTrend - previousTrend) / previousTrend) * 100).toFixed(1) : 0;

//   return (
//     <div className="space-y-6">
//       {/* Main chart */}
//       <Card className="border-slate-700 bg-slate-800/30">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle className="flex items-center gap-2">
//                 <BarChart3 className="w-5 h-5 text-cyan-400" />
//                 Google Trends Over Time
//               </CardTitle>
//               <CardDescription>Search interest visualization</CardDescription>
//             </div>
//             <Badge variant="success">Live Data</Badge>
//           </div>
//         </CardHeader>
//         <CardContent>
//           {timeline_data.length === 0 ? (
//             <div className="text-center py-12">
//               <p className="text-slate-400">No timeline data available</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               <div className="grid grid-cols-3 gap-4">
//                 <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
//                   <div className="text-sm text-slate-400 mb-1">Current Interest</div>
//                   <div className="text-2xl font-bold text-cyan-400">{currentTrend}</div>
//                   <div className={`text-xs mt-2 flex items-center gap-1 ${trendDirection === 'up' ? 'text-green-400' : 'text-red-400'}`}>
//                     {trendDirection === 'up' ? '↗' : '↘'} {changePercent}%
//                   </div>
//                 </div>
//                 <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
//                   <div className="text-sm text-slate-400 mb-1">Peak Value</div>
//                   <div className="text-2xl font-bold text-blue-400">{maxValue}</div>
//                   <div className="text-xs text-slate-500 mt-2">
//                     {peakEntry.label || formatDate(peakEntry.date) || fallbackLabel(peakEntry)
//                       ? `On ${peakEntry.label || formatDate(peakEntry.date) || fallbackLabel(peakEntry)}`
//                       : 'All-time peak'}
//                   </div>
//                 </div>
//                 <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
//                   <div className="text-sm text-slate-400 mb-1">Data Points</div>
//                   <div className="text-2xl font-bold text-purple-400">{timeline_data.length}</div>
//                   <div className="text-xs text-slate-500 mt-2">Time periods</div>
//                 </div>
//               </div>

//               <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-lg p-4 border border-slate-700 overflow-x-auto">
//                 <svg
//                   viewBox={`0 0 ${Math.max(600, timeline_data.length * 30)} 250`}
//                   className="w-full h-60 min-w-max"
//                 >
//                   {[0, 25, 50, 75, 100].map((percent) => (
//                     <line
//                       key={`gridh-${percent}`}
//                       x1="40"
//                       y1={200 - (percent / 100) * 180}
//                       x2={Math.max(600, timeline_data.length * 30) - 20}
//                       y2={200 - (percent / 100) * 180}
//                       stroke="rgba(100, 116, 139, 0.2)"
//                       strokeWidth="1"
//                       strokeDasharray="5,5"
//                     />
//                   ))}
//                   {[0, 25, 50, 75, 100].map((percent) => (
//                     <text
//                       key={`label-${percent}`}
//                       x="35"
//                       y={205 - (percent / 100) * 180}
//                       fontSize="12"
//                       fill="rgba(148, 163, 184, 0.6)"
//                       textAnchor="end"
//                     >
//                       {percent}
//                     </text>
//                   ))}
//                   <defs>
//                     <linearGradient id="trendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
//                       <stop offset="0%" stopColor="rgba(34, 211, 238, 0.3)" />
//                       <stop offset="100%" stopColor="rgba(34, 211, 238, 0.05)" />
//                     </linearGradient>
//                   </defs>
//                   {timeline_data.length > 0 && (
//                     <>
//                       <polyline
//                         points={timeline_data
//                           .map((d, i) => {
//                             const x = 50 + (i / (timeline_data.length - 1 || 1)) * (Math.max(600, timeline_data.length * 30) - 70);
//                             const y = 200 - ((d.value - minValue) / range) * 180;
//                             return `${x},${y}`;
//                           })
//                           .join(' ')}
//                         fill="url(#trendGrad)"
//                         stroke="rgb(34, 211, 238)"
//                         strokeWidth="2"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                       />
//                       {timeline_data.map((d, i) => (
//                         <circle
//                           key={`dot-${i}`}
//                           cx={50 + (i / (timeline_data.length - 1 || 1)) * (Math.max(600, timeline_data.length * 30) - 70)}
//                           cy={200 - ((d.value - minValue) / range) * 180}
//                           r="3"
//                           fill="rgb(34, 211, 238)"
//                           opacity={i % Math.ceil(timeline_data.length / 10) === 0 ? '1' : '0.3'}
//                         />
//                       ))}
//                     </>
//                   )}
//                   <line x1="40" y1="200" x2={Math.max(600, timeline_data.length * 30)} y2="200" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" />
//                 </svg>
//                 {xLabels.length > 0 && (
//                   <div className="mt-2 grid" style={{ gridTemplateColumns: `repeat(${xLabels.length}, minmax(0,1fr))` }}>
//                     {xLabels.map((l) => (
//                       <div key={l.idx} className="text-[11px] text-slate-400 text-center">
//                         {l.label}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <div className="mt-6">
//                 <h4 className="text-sm font-semibold text-slate-200 mb-3">Recent Data Points</h4>
//                 <div className="space-y-2 max-h-48 overflow-y-auto">
//                   {recentData.slice().reverse().map((d, i) => (
//                     <div key={i} className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
//                       <div className="flex-1">
//                         <div className="text-sm text-slate-300">
//                           {d.label || formatDate(d.date) || fallbackLabel(d) || 'Date unavailable'}
//                         </div>
//                         <div className="text-xs text-slate-500 mt-0.5">{d.hasData ? 'Data available' : 'No data'}</div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-lg font-bold text-cyan-400">{d.value}</div>
//                         <div className="w-16 h-6 mt-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded relative overflow-hidden">
//                           <div
//                             className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded"
//                             style={{ width: `${(d.value / maxValue) * 100}%` }}
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
//         <div className="flex gap-3">
//           <Globe className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
//           <div className="text-sm text-blue-200/80">
//             <div className="font-semibold mb-1">About Google Trends Data</div>
//             <p>Interest values are normalized on a scale of 0–100, where 100 represents peak popularity. Data shows search volume relative to the total search volume across various regions.</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default GoogleTrendsChart;





import React, { useMemo } from 'react';
import { Globe, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
} from 'recharts';

const formatDate = (unixSeconds) => {
  if (!unixSeconds) return null;
  const ms = unixSeconds * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  const minMs = Date.UTC(2004, 0, 1);
  const maxMs = Date.now() + 7 * 24 * 60 * 60 * 1000;
  if (ms < minMs || ms > maxMs) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fallbackLabel = (entry) => {
  if (entry?.formattedTime) {
    const parsed = Date.parse(entry.formattedTime);
    if (!Number.isNaN(parsed)) {
      const minMs = Date.UTC(2004, 0, 1);
      const maxMs = Date.now() + 7 * 24 * 60 * 60 * 1000;
      if (parsed >= minMs && parsed <= maxMs) {
        return new Date(parsed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
  }
  return null;
};

const getLabel = (entry) =>
  entry?.label || formatDate(entry?.date) || fallbackLabel(entry) || null;

const GoogleTrendsChart = ({ googleTrends }) => {
  // Filter out entries with no date and no label — never show N/A points
  const timeline_data = useMemo(
    () =>
      (googleTrends?.timeline_data || []).filter(
        (d) => d.date || d.label || d.formattedTime
      ),
    [googleTrends]
  );

  const allValues = timeline_data.map((d) => d.value || 0);
  const maxValue = Math.max(...allValues, 100);

  const currentTrend = timeline_data.at(-1)?.value || 0;
  const previousTrend = timeline_data.at(-2)?.value || 0;
  const trendDirection = currentTrend >= previousTrend ? 'up' : 'down';
  const changePercent =
    previousTrend > 0
      ? (((currentTrend - previousTrend) / previousTrend) * 100).toFixed(1)
      : 0;

  const peakEntry = timeline_data.reduce(
    (best, curr) => (curr.value > best.value ? curr : best),
    { value: -Infinity, date: null, formattedTime: null }
  );

  const recentData = timeline_data.slice(-7);

  const chartData = useMemo(
    () => timeline_data.map((d) => ({ label: getLabel(d) || '', value: d.value })),
    [timeline_data]
  );

  if (!googleTrends) {
    return (
      <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-6 text-center">
        <p className="text-slate-400">No Google Trends data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-800/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Google Trends Over Time
              </CardTitle>
              <CardDescription>Search interest visualization</CardDescription>
            </div>
            <Badge variant="success">Live Data</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {timeline_data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No timeline data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">Current Interest</div>
                  <div className="text-2xl font-bold text-cyan-400">{currentTrend}</div>
                  <div className={`text-xs mt-2 flex items-center gap-1 ${trendDirection === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {trendDirection === 'up' ? '↗' : '↘'} {changePercent}%
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">Peak Value</div>
                  <div className="text-2xl font-bold text-blue-400">{maxValue}</div>
                  <div className="text-xs text-slate-500 mt-2">
                    {getLabel(peakEntry) ? `On ${getLabel(peakEntry)}` : 'All-time peak'}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">Data Points</div>
                  <div className="text-2xl font-bold text-purple-400">{timeline_data.length}</div>
                  <div className="text-xs text-slate-500 mt-2">Time periods</div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgba(34,211,238,0.35)" />
                          <stop offset="95%" stopColor="rgba(34,211,238,0.05)" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(100,116,139,0.2)" strokeDasharray="5 5" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickLine={{ stroke: 'rgba(148,163,184,0.4)' }}
                        interval="preserveStartEnd"
                        minTickGap={12}
                        height={45}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickLine={{ stroke: 'rgba(148,163,184,0.4)' }}
                        axisLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ stroke: 'rgba(148,163,184,0.4)' }}
                        contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                        labelStyle={{ color: '#cbd5e1' }}
                        formatter={(value) => [`Interest: ${value}`, '']}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="none"
                        fill="url(#trendArea)"
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="rgb(34,211,238)"
                        strokeWidth={2}
                        dot={{ r: 2, strokeWidth: 1, fill: 'rgb(34,211,238)' }}
                        activeDot={{ r: 5, strokeWidth: 1, fill: 'rgb(34,211,238)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent data points */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-200 mb-3">Recent Data Points</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentData.slice().reverse().map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                      <div className="flex-1">
                        <div className="text-sm text-slate-300">
                          {getLabel(d) || 'Date unavailable'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {d.hasData ? 'Data available' : 'No data'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-cyan-400">{d.value}</div>
                        <div className="w-16 h-6 mt-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded relative overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded"
                            style={{ width: `${(d.value / maxValue) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geographic breakdown */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
        <div className="flex gap-3">
          <Globe className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200/80">
            <div className="font-semibold mb-1">About Google Trends Data</div>
            <p>Interest values are normalized on a scale of 0–100, where 100 represents peak popularity. Data shows search volume relative to the total search volume across various regions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleTrendsChart;