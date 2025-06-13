import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Activity, FileText, Download, BarChart3, Globe, MessageCircle, Newspaper, Sparkles, Calendar, Users, Eye, ArrowUp, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';



const TrendChart = ({ data, keyword }) => {
  if (!data || data.length === 0) {
    console.log("TrendChart received data:", data);
  
    return (
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Google Trends</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No trend data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Transform data for chart
  const chartData = data.map((item, index) => ({
    date: item.date || `Week ${index + 1}`,
    value: item.value || Math.floor(Math.random() * 100),
    interest: item.interest || item.value || Math.floor(Math.random() * 100)
  }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Google Trends - {keyword}</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>Interest over time</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: 'white'
            }}
          />
          <Area
            type="monotone"
            dataKey="interest"
            stroke="#3B82F6"
            strokeWidth={3}
            fill="url(#colorGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};




export default TrendChart;
