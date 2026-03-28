import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const NewsChart = ({ articles }) => {
  const [activeChart, setActiveChart] = useState('sources');

  if (!articles || articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-8">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📰</span>
          </div>
          <p className="text-gray-500">No news data available</p>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  // Group articles by source
  const sourceData = articles.reduce((acc, article) => {
    const sourceName = article.source?.name || 'Unknown';
    if (!acc[sourceName]) {
      acc[sourceName] = { name: sourceName, count: 0 };
    }
    acc[sourceName].count += 1;
    return acc;
  }, {});

  const sourceChartData = Object.values(sourceData).map(item => ({
    name: item.name,
    count: item.count
  }));

  // Group articles by publication date (by day)
  const dateData = articles.reduce((acc, article) => {
    if (article.publishedAt) {
      const date = new Date(article.publishedAt);
      const dateStr = `${date.getMonth()+1}/${date.getDate()}`;
      if (!acc[dateStr]) {
        acc[dateStr] = { name: dateStr, count: 0 };
      }
      acc[dateStr].count += 1;
    }
    return acc;
  }, {});

  const dateChartData = Object.values(dateData).sort((a, b) => {
    const [aMonth, aDay] = a.name.split('/').map(Number);
    const [bMonth, bDay] = b.name.split('/').map(Number);
    if (aMonth !== bMonth) return aMonth - bMonth;
    return aDay - bDay;
  });

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-xl rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm flex items-center" style={{ color: entry.color }}>
              <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
              {entry.dataKey}: <span className="font-medium ml-1">{entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Chart components
  const renderSourceChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={sourceChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
          name="Article Count"
          fill="#3B82F6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderDateChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={dateChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke="#10B981" 
          name="Articles Published"
          strokeWidth={3}
          dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
          activeDot={{ r: 7, strokeWidth: 2, fill: '#fff' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Chart type selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeChart === 'sources' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveChart('sources')}
        >
          By Source
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeChart === 'dates' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveChart('dates')}
        >
          Publication Timeline
        </button>
      </div>

      {/* Chart display */}
      <div className="flex-1">
        {activeChart === 'sources' && renderSourceChart()}
        {activeChart === 'dates' && renderDateChart()}
      </div>
    </div>
  );
};

export default NewsChart;