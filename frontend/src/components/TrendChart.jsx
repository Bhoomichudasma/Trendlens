import React, { useState } from 'react';
import { TrendingUp, BarChart3, Map, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Area, AreaChart } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const TrendChart = ({ data, regionData, regionFilterApplied, regionHasData }) => {
  const [activeChart, setActiveChart] = useState('trend');

  // Check if we have data
  const hasTrendData = data && data.length > 0;
  const hasRegionData = regionData && regionData.length > 0;

  // Show region filter message if needed
  if (regionFilterApplied && !regionHasData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data for Selected Region</h3>
          <p className="text-gray-600 mb-4">
            No trend data available for the selected region. Try changing the region filter or removing it to see global trends.
          </p>
        </div>
      </div>
    );
  }

  // Show no data message if no data at all
  if (!hasTrendData && !regionFilterApplied) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-8">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No trend data available</p>
        </div>
      </div>
    );
  }

  // Prepare data for different charts
  const trendChartData = data.map((item, index) => ({
    date: item.date || `Week ${index + 1}`,
    value: item.value || 0,
    interest: item.interest || item.value || 0
  }));

  // Process region data to show meaningful names
  const regionChartData = hasRegionData 
    ? regionData.slice(0, 10).map(item => ({
        name: item.location || item.region || 'Unknown',
        value: parseInt(item.value) || 0
      }))
    : [];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-xl rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm flex items-center" style={{ color: entry.color }}>
              <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
              {entry.dataKey}: <span className="font-medium ml-1">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Chart components
  const renderTrendChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={trendChartData}>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis 
          dataKey="date" 
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
        <Area
          type="monotone"
          dataKey="interest"
          stroke="#3B82F6"
          strokeWidth={3}
          fill="url(#colorGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderRegionChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={regionChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
          dataKey="value"
          radius={[4, 4, 0, 0]}
        >
          {regionChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Chart type selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
            activeChart === 'trend' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveChart('trend')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Interest Over Time
        </button>
        {hasRegionData && (
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
              activeChart === 'region-bar' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveChart('region-bar')}
          >
            <Map className="w-4 h-4 mr-2" />
            By Region
          </button>
        )}
      </div>

      {/* Chart display */}
      <div className="flex-1">
        {activeChart === 'trend' && renderTrendChart()}
        {activeChart === 'region-bar' && hasRegionData ? renderRegionChart() : 
         activeChart === 'region-bar' && !hasRegionData ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center py-8">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Map className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No regional data available</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TrendChart;