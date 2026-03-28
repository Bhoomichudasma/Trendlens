import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Globe, MapPin, Newspaper, MessageCircle, Search, Zap, Download, ArrowRight, TrendingUp, Activity, PieChart, LineChart, Brain } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import GlobeVisualization from '../components/GlobeVisualization'; // Added Globe import
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import UserChip from '../components/UserChip';

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activePanel, setActivePanel] = useState('trend');
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('other');
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Some ESLint configs don't count JSX member-usage (e.g. <motion.div>) as "using" the identifier.
  // This no-op reference keeps lint clean while preserving the existing JSX usage.
  void motion;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTrending() {
      try {
        setTrendingLoading(true);
        const res = await api.getTrending();
        if (!cancelled) setTrending(res?.trendingTopics || []);
      } catch {
        if (!cancelled) setTrending([]);
      } finally {
        if (!cancelled) setTrendingLoading(false);
      }
    }

    loadTrending();
    return () => {
      cancelled = true;
    };
  }, []);

  const slugify = (input) => {
    return String(input || '')
      .trim()
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleUniversalSearch = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!query.trim()) return;
    const slug = slugify(query);
    navigate(`/topic/${encodeURIComponent(slug)}?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      {/* Top-right auth shortcuts */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
        {isAuthenticated ? (
          <UserChip />
        ) : (
          <>
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg border border-slate-700/70 text-slate-200 hover:border-cyan-500/60 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
      {/* Subtle animated background */}
      <div className="fixed inset-0 z-0">
        {/* Added Globe visualization with increased opacity */}
        <GlobeVisualization type="globe" />
        
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.05)_0%,rgba(0,0,0,0)_70%)]"></div>
        <div className="absolute inset-0 subtle-grid"></div>
        
        {/* Diagonal flowing lines */}
        <div className="diagonal-line diagonal-line-1"></div>
        <div className="diagonal-line diagonal-line-2"></div>
        <div className="diagonal-line diagonal-line-3"></div>
        <div className="diagonal-line diagonal-line-4"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <motion.div 
            className="inline-flex items-center justify-center mb-6 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <TrendingUp className="w-4 h-4 text-cyan-400 mr-2" />
            <span className="text-sm text-slate-300">Real-time Trend Analysis Platform</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 mx-auto inline-block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 px-4">Intelligence Beyond Headlines</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Advanced trend intelligence powered by AI. Analyze Google Trends, Reddit discussions, news archives, and Wikipedia data in real-time to understand what's really happening.
          </p>

          {/* Universal Search Bar */}
          <form onSubmit={handleUniversalSearch} className="max-w-3xl mx-auto w-full">
            <div className="flex items-center bg-slate-900/40 border border-slate-700/70 rounded-xl overflow-hidden shadow-2xl">
              <div className="px-4 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any trend, event, or topic (e.g., AI regulation, USD markets)"
                className="flex-1 bg-transparent text-white px-1 py-4 focus:outline-none"
              />
              <button
                type="submit"
                className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition-all duration-300 hover:from-cyan-400 hover:to-blue-500 flex items-center gap-2"
              >
                Analyze
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Category quick filters */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {[
                { id: 'politics', label: 'Politics' },
                { id: 'business', label: 'Business' },
                { id: 'tech', label: 'Tech' },
                { id: 'sports', label: 'Sports' },
                { id: 'science', label: 'Science' },
                { id: 'entertainment', label: 'Entertainment' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={[
                    'px-3 py-2 rounded-full text-sm border transition-colors',
                    category === c.id ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200' : 'bg-slate-800/20 border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-600',
                  ].join(' ')}
                >
                  {c.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCategory('other')}
                className={[
                  'px-3 py-2 rounded-full text-sm border transition-colors',
                  category === 'other' ? 'bg-slate-800/30 border-slate-600 text-slate-200' : 'bg-slate-800/20 border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-600',
                ].join(' ')}
              >
                All
              </button>
            </div>
          </form>

          {/* Trending Topics */}
          <div className="mt-8 max-w-3xl mx-auto w-full">
            <div className="flex items-center justify-between mb-3">
              <div className="text-slate-200 font-semibold">Trending Topics</div>
              <div className="text-xs text-slate-400">{trendingLoading ? 'Loading…' : 'What others are searching'}</div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(trending || []).slice(0, 12).map((t) => (
                <button
                  key={t._id || t.slug || t.keyword}
                  onClick={() => navigate(`/topic/${encodeURIComponent(t.slug)}?category=${encodeURIComponent(t.category || 'other')}`)}
                  className="shrink-0 px-4 py-2 rounded-lg border border-slate-700/70 bg-slate-900/30 hover:bg-slate-900/50 hover:border-cyan-500/30 text-slate-100 text-sm"
                >
                  <div className="font-medium">{t.keyword}</div>
                  <div className="text-xs text-slate-400 mt-1">{typeof t.searches === 'number' ? `${t.searches} searches` : ''}</div>
                </button>
              ))}
              {(!trending || trending.length === 0) && !trendingLoading && (
                <div className="text-slate-400 text-sm px-2">No trending topics yet.</div>
              )}
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="flex justify-center space-x-8 mt-12">
            <motion.a 
              href="#features" 
              className="text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium flex items-center"
              whileHover={{ y: -2 }}
            >
              <Activity className="w-4 h-4 mr-1" />
              Features
            </motion.a>
            <motion.a 
              href="#preview" 
              className="text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium flex items-center"
              whileHover={{ y: -2 }}
            >
              <PieChart className="w-4 h-4 mr-1" />
              Preview
            </motion.a>
            <motion.a 
              href="#how-it-works" 
              className="text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium flex items-center"
              whileHover={{ y: -2 }}
            >
              <LineChart className="w-4 h-4 mr-1" />
              How It Works
            </motion.a>
          </div>
        </motion.div>
        
        {/* Animated bottom indicator */}
        <div className="absolute bottom-10 w-full flex justify-center">
          <motion.div 
            className="h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent w-32 rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, delay: 1 }}
          ></motion.div>
        </div>
      </section>

      {/* Feature Highlight Section */}
      <section id="features" className="relative z-20 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Why Choose <span className="text-cyan-400">TrendLens</span>
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-md rounded-xl p-6 border border-slate-700/60 hover:border-cyan-500/40 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <motion.div 
                  className="w-12 h-12 rounded-lg bg-cyan-500/15 flex items-center justify-center mb-4 border border-cyan-500/20"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Preview Section - AMAZING */}
      <section id="preview" className="relative z-20 py-32 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/5 via-transparent to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div className="text-center mb-20">
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Experience the Power of <span className="text-cyan-300 drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)]">Real-time Intelligence</span>
            </motion.h2>
            <motion.p 
              className="text-slate-400 text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              See beautiful dashboards, insightful analytics, and AI-powered trend detection all in one place
            </motion.p>
          </motion.div>

          {/* Main showcase card */}
          <motion.div 
            className="relative mb-12"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600/30 via-blue-600/30 to-purple-600/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/25 p-8 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)]"> 
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              {/* Browser frame */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="ml-auto text-sm text-slate-500">trendlens.ai</div>
                </div>
                <div className="border-t border-slate-700/50"></div>
              </div>

              {/* Dashboard preview grid with swap interaction */}
              <PreviewGrid activePanel={activePanel} setActivePanel={setActivePanel} />

              {/* Bottom stats */}
              <div className="mt-8 pt-6 border-t border-slate-700/50 grid grid-cols-3 gap-4">
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-2xl font-bold text-cyan-400">3,847</div>
                  <p className="text-xs text-slate-500 mt-1">Trends Tracked</p>
                </motion.div>
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-2xl font-bold text-green-400">124ms</div>
                  <p className="text-xs text-slate-500 mt-1">Response Time</p>
                </motion.div>
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-2xl font-bold text-purple-400">99.9%</div>
                  <p className="text-xs text-slate-500 mt-1">Accuracy Rate</p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Feature highlights below preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <motion.div 
              className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-xl p-6 border border-slate-700/60 hover:border-cyan-500/40 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-cyan-500/15 rounded-lg flex items-center justify-center mb-4 border border-cyan-500/30">
                <Zap className="w-6 h-6 text-cyan-300" />
              </div>
              <h3 className="text-white font-bold mb-2">Lightning Fast</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Real-time data processing with sub-second latency</p>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-xl p-6 border border-slate-700/60 hover:border-purple-500/40 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-purple-500/15 rounded-lg flex items-center justify-center mb-4 border border-purple-500/30">
                <Brain className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="text-white font-bold mb-2">AI-Powered</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Groq AI analyzes patterns humans can't see</p>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-xl p-6 border border-slate-700/60 hover:border-green-500/40 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-green-500/15 rounded-lg flex items-center justify-center mb-4 border border-green-500/30">
                <Globe className="w-6 h-6 text-green-300" />
              </div>
              <h3 className="text-white font-bold mb-2">Global Coverage</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Multi-source data from Google, Reddit, News & Wikipedia</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-20 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            How It <span className="text-cyan-400">Works</span>
          </motion.h2>
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <motion.div 
                  className="flex flex-col items-center text-center mb-10 md:mb-0"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div 
                    className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 border border-cyan-500/20"
                    animate={{ 
                      boxShadow: [
                        "0 0 0 0 rgba(6, 182, 212, 0.3)",
                        "0 0 0 10px rgba(6, 182, 212, 0)",
                        "0 0 0 0 rgba(6, 182, 212, 0)"
                      ]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop"
                    }}
                  >
                    {step.icon}
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-slate-400 max-w-48 text-sm">{step.description}</p>
                </motion.div>
                
                {index < steps.length - 1 && (
                  <motion.div 
                    className="hidden md:block w-24 h-0.5 bg-gradient-to-r from-cyan-500/30 to-transparent mx-4"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  ></motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <footer className="relative z-20 py-16 px-4 border-t border-slate-700/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Stay <span className="text-cyan-400">Ahead</span> of the Curve
          </motion.h2>
          <motion.p 
            className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Make smarter decisions with real-time trend intelligence. Understand context, sentiment, and escalation patterns before they dominate headlines.
          </motion.p>
          <motion.button 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              navigate('/');
            }}
            className="px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 flex items-center mx-auto group"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>
      </footer>
    </div>
  );
};

// Feature data
const features = [
  {
    icon: <BarChart3 className="w-6 h-6 text-cyan-400" />,
    title: "Multi-Source Analysis",
    description: "Correlate trends from Google, Reddit, News, and Wikipedia simultaneously."
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-blue-400" />,
    title: "Trend Escalation Tracking",
    description: "Detect when trends shift from niche to mainstream conversations."
  },
  {
    icon: <Zap className="w-6 h-6 text-green-400" />,
    title: "AI-Powered Insights",
    description: "Groq AI analyzes sentiment, context, and escalation automatically."
  },
  {
    icon: <MessageCircle className="w-6 h-6 text-purple-400" />,
    title: "Intelligent Alerts",
    description: "Get notified when meaningful trends emerge, never spam alerts again."
  }
];

// Steps data
const steps = [
  {
    icon: <Search className="w-6 h-6 text-cyan-400" />,
    title: "Search a Topic",
    description: "Enter any keyword to begin analysis"
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-blue-400" />,
    title: "View Intelligence",
    description: "See AI-generated insights and trend metrics"
  },
  {
    icon: <Zap className="w-6 h-6 text-green-400" />,
    title: "Get Alerted",
    description: "Subscribe to smart notifications"
  }
];

function PreviewGrid({ activePanel, setActivePanel }) {
  const cards = [
    {
      id: 'trend',
      title: 'Trend Analysis',
      icon: <BarChart3 className="w-5 h-5 text-cyan-400" />,
      stat: 'LIVE',
      statColor: 'text-cyan-400',
      gradient: 'from-cyan-500/10 to-cyan-600/5',
      border: 'border-cyan-500/20',
      bgAccent: 'from-cyan-400/5 to-blue-400/5',
      body: (
        <>
          <div className="h-40 bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-lg relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 400 150">
              <defs>
                <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(34, 211, 238, 0.3)" />
                  <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
                </linearGradient>
              </defs>
              <polyline points="0,100 50,70 100,80 150,45 200,55 250,30 300,50 350,25 400,35" 
                fill="url(#chartGrad)" stroke="rgb(34, 211, 238)" strokeWidth="2" />
            </svg>
            <motion.div 
              className="absolute top-2 right-2 text-xs text-cyan-300 font-semibold"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ↗ +42.5%
            </motion.div>
          </div>
          <div className="mt-4 flex justify-between text-xs text-slate-400">
            <span>Google Trends</span>
            <span>Last 7 days</span>
          </div>
        </>
      ),
    },
    {
      id: 'news',
      title: 'News Articles',
      icon: <Newspaper className="w-5 h-5 text-green-300" />,
      stat: '+24',
      statColor: 'text-green-300',
      gradient: 'from-green-500/10 to-emerald-600/5',
      border: 'border-green-500/20',
      bgAccent: 'from-green-400/5 to-emerald-400/5',
      body: (
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-center justify-between"><span>Coverage breadth</span><span className="text-green-300 font-semibold">+18%</span></div>
          <div className="flex items-center justify-between text-slate-400"><span>Top sources</span><span>NYTimes, Reuters, AP</span></div>
          <div className="flex items-center justify-between text-slate-400"><span>Freshness</span><span>Past 48h</span></div>
        </div>
      ),
    },
    {
      id: 'reddit',
      title: 'Reddit Posts',
      icon: <MessageCircle className="w-5 h-5 text-purple-300" />,
      stat: '+156',
      statColor: 'text-purple-300',
      gradient: 'from-purple-500/10 to-pink-600/5',
      border: 'border-purple-500/20',
      bgAccent: 'from-purple-400/5 to-pink-400/5',
      body: (
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-center justify-between"><span>Conversation tempo</span><span className="text-purple-200 font-semibold">High</span></div>
          <div className="flex items-center justify-between text-slate-400"><span>Top subs</span><span>r/worldnews, r/technology</span></div>
          <div className="flex items-center justify-between text-slate-400"><span>Avg. upvotes</span><span>1.2k</span></div>
        </div>
      ),
    },
    {
      id: 'sentiment',
      title: 'Sentiment Score',
      icon: <TrendingUp className="w-5 h-5 text-blue-300" />,
      stat: '95% ↑ 8%',
      statColor: 'text-blue-200',
      gradient: 'from-blue-500/10 to-cyan-600/5',
      border: 'border-blue-500/20',
      bgAccent: 'from-blue-400/5 to-cyan-400/5',
      body: (
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
          <div className="space-y-1">
            <div className="text-xs text-slate-400">Overall</div>
            <div className="text-lg font-semibold text-cyan-200">0.62</div>
            <div className="text-xs text-green-300">Positive drift</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400">Reddit</div>
            <div className="text-lg font-semibold text-purple-200">0.55</div>
            <div className="text-xs text-slate-400">Community mood</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400">News</div>
            <div className="text-lg font-semibold text-emerald-200">0.68</div>
            <div className="text-xs text-slate-400">Headline tone</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400">Shift</div>
            <div className="text-lg font-semibold text-cyan-200">+0.12</div>
            <div className="text-xs text-green-300">Week over week</div>
          </div>
        </div>
      ),
    },
  ];

  const active = cards.find((c) => c.id === activePanel) || cards[0];
  const smallCards = cards.filter((c) => c.id !== activePanel);

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <motion.div 
        className={`lg:col-span-2 bg-gradient-to-br ${active.gradient} rounded-xl p-6 border ${active.border} group/card overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.4)]`}
        transition={{ duration: 0.3 }}
        whileHover={{ borderColor: 'rgba(34, 211, 238, 0.4)' }}
      >
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" style={{
          background: `radial-gradient(circle at top right, ${active.id === 'trend' ? 'rgba(34, 211, 238, 0.2)' : active.id === 'news' ? 'rgba(74, 222, 128, 0.2)' : active.id === 'reddit' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)'}, transparent 80%)`
        }}></div>
        <div className={`absolute inset-0 bg-gradient-to-tr ${active.bgAccent} opacity-0 group-hover/card:opacity-100 transition-all`}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${active.id === 'trend' ? 'bg-cyan-500/20' : active.id === 'news' ? 'bg-green-500/20' : active.id === 'reddit' ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                {active.icon}
              </div>
              <h3 className="text-lg font-bold text-white">
                {active.title}
              </h3>
            </div>
            <span className={`text-sm font-bold ${active.statColor} px-3 py-1 rounded-full ${active.id === 'trend' ? 'bg-cyan-500/15' : active.id === 'news' ? 'bg-green-500/15' : active.id === 'reddit' ? 'bg-purple-500/15' : 'bg-blue-500/15'}`}>{active.stat}</span>
          </div>
          {active.body}
        </div>
      </motion.div>

      <div className="space-y-3">
        {smallCards.map((card) => (
          <motion.button
            key={card.id}
            type="button"
            onClick={() => setActivePanel(card.id)}
            className={`relative w-full text-left bg-gradient-to-br ${card.gradient} rounded-lg p-4 border ${card.border} group/card overflow-hidden transition-all shadow-[0_15px_40px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]`}
            whileHover={{ scale: 1.03, y: -2 }}
          >
            {/* Glowing border effect on hover */}
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" style={{
              background: `radial-gradient(circle at top right, ${card.id === 'trend' ? 'rgba(34, 211, 238, 0.25)' : card.id === 'news' ? 'rgba(74, 222, 128, 0.25)' : card.id === 'reddit' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(59, 130, 246, 0.25)'}, transparent 75%)`
            }}></div>
            <div className={`absolute inset-0 bg-gradient-to-tr ${card.bgAccent} opacity-0 group-hover/card:opacity-100 transition-all`}></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${card.id === 'trend' ? 'bg-cyan-500/20' : card.id === 'news' ? 'bg-green-500/20' : card.id === 'reddit' ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                    {card.icon}
                  </div>
                  <span className="text-sm font-bold text-white">{card.title}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-400 group-hover/card:text-slate-200 transition-colors">Click to expand</p>
                <span className={`text-xs font-bold ${card.statColor}`}>{card.stat}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default LandingPage;