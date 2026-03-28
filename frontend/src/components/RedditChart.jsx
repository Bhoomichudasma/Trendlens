import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const RedditChart = ({ posts }) => {
  const [activeChart, setActiveChart] = useState('subreddits');

  if (!posts || posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-8">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-gray-500">No Reddit data available</p>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  // Group posts by subreddit
  const subredditData = posts.reduce((acc, post) => {
    const subreddit = post.subreddit || 'Unknown';
    if (!acc[subreddit]) {
      acc[subreddit] = { 
        name: subreddit, 
        count: 0,
        totalScore: 0,
        totalComments: 0
      };
    }
    acc[subreddit].count += 1;
    acc[subreddit].totalScore += post.score || 0;
    acc[subreddit].totalComments += post.num_comments || 0;
    return acc;
  }, {});

  const subredditChartData = Object.values(subredditData)
    .map(item => ({
      name: item.name,
      count: item.count,
      avgScore: item.totalScore / item.count,
      avgComments: item.totalComments / item.count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Group posts by score ranges
  const scoreRanges = [
    { name: '0-100', min: 0, max: 100, count: 0 },
    { name: '101-500', min: 101, max: 500, count: 0 },
    { name: '501-1000', min: 501, max: 1000, count: 0 },
    { name: '1001-5000', min: 1001, max: 5000, count: 0 },
    { name: '5001+', min: 5001, max: Infinity, count: 0 }
  ];

  posts.forEach(post => {
    const score = post.score || 0;
    const range = scoreRanges.find(r => score >= r.min && score <= r.max);
    if (range) range.count++;
  });

  const scoreChartData = scoreRanges.filter(range => range.count > 0);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-xl rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm flex items-center" style={{ color: entry.color }}>
              <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
              {entry.dataKey}: <span className="font-medium ml-1">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Chart components
  const renderSubredditChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={subredditChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="count" 
          name="Post Count"
          fill="#3B82F6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderScoreChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={scoreChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="count" 
          name="Number of Posts"
          fill="#10B981"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderEngagementChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={subredditChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="avgScore" 
          name="Avg Upvotes"
          fill="#EF4444"
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="avgComments" 
          name="Avg Comments"
          fill="#F59E0B"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Chart type selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeChart === 'subreddits' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveChart('subreddits')}
        >
          By Subreddit
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeChart === 'scores' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveChart('scores')}
        >
          By Upvotes
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeChart === 'engagement' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveChart('engagement')}
        >
          Engagement
        </button>
      </div>

      {/* Chart display */}
      <div className="flex-1">
        {activeChart === 'subreddits' && renderSubredditChart()}
        {activeChart === 'scores' && renderScoreChart()}
        {activeChart === 'engagement' && renderEngagementChart()}
      </div>
    </div>
  );
};

export default RedditChart;