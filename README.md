# TrendLens 🔍 — Event Intelligence & Incident Analysis Platform

**Comprehensive incident analysis powered by AI, aggregating insights from Google Trends, Reddit, News APIs, and Wikipedia to explain what happened, how it happened, and the current situation.**

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Node](https://img.shields.io/badge/node-%3E%3D14-green)
![React](https://img.shields.io/badge/react-%3E%3D18-blue)

---

## 🚀 Overview

TrendLens is an intelligent incident analysis and explanation platform that helps you **understand complex events in depth**. Instead of scattered information, TrendLens synthesizes data from multiple sources and uses AI to build a complete narrative: what happened, why it happened, how different groups reacted, and where things currently stand.

**Core Value:** When major events break, information is fragmented across sources with different perspectives and timings. TrendLens unifies these signals into a coherent timeline and narrative, showing you the complete story—not just headlines.

**How It Works:** Search for any event or topic → Get a 5-layer Story DNA (WHY, WHAT, HOW, WHERE, TIMELINE) → See how sentiment evolved across Reddit, news, and search data → Understand the incident comprehensively.

---

## ✨ Key Features

### 🔄 Multi-Source Incident Intelligence
- **Google Trends** — Search volume patterns showing public interest over time
- **Reddit** — Community discussions, reactions, and sentiment from affected groups
- **News APIs** — Media coverage timeline and different news outlets' framing
- **Wikipedia** — Historical context and established facts about the event
- *Unified timeline view showing how the incident unfolded across all sources*

### 🎯 AI-Powered Event Explanation
- **Story DNA** — 5-layer narrative framework:
  - **WHY** — Root causes and context
  - **WHAT** — Core facts and what actually happened
  - **HOW** — Mechanisms and how it unfolded
  - **WHERE** — Geographic scope and locations affected
  - **TIMELINE** — Chronological sequence of key events
- **Sentiment Evolution** — How public mood changed across community, news, and search data
- **Source Comparison** — See conflicting narratives across Reddit, news, Google data
- **Pattern Recognition** — Groq AI synthesizes information to reduce contradictions and filter noise

### 🔔 Event Monitoring & Alerts
- **Topic Subscriptions** — Watch specific incidents and get notified of major developments
- **Activity Alerts** — Triggered on significant coverage spikes or sentiment shifts
- **Anti-Noise Filters** — Heuristics reduce false alerts from minor fluctuations
- **Email Notifications** — Stay informed of new updates to topics you're monitoring
- **Alert History** — Full audit trail of all notifications sent

### 📊 Comprehensive Analytics
- **Interactive Timeline** - Chronological view of incident development
- **Multi-Source Charts** — Google Trends, Reddit activity, news volume side-by-side
- **Sentiment Analysis** - Community mood vs. media tone comparison
- **Source Breakdown** - See which outlets covered what angle
- **Export Reports** - Download full incident analysis as PDF

### 📋 Search History & Account Features
- **Per-User History** — All incident searches saved and organized server-side
- **Deduplication** — No duplicate queries cluttering your history
- **Cross-Device Access** — JWT authentication allows seamless login across devices
- **Quick Re-analysis** — One-click to re-analyze an incident with fresh data

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Framer Motion** - Smooth animations & interactions
- **Tailwind CSS** - Utility-first responsive design
- **Vite** - Lightning-fast build tool
- **Recharts** - Interactive data visualizations
- **Lucide Icons** - Beautiful icon library

### Backend
- **Node.js + Express** - Robust API server
- **MongoDB** - Scalable document database
- **Groq AI API** - Fast LLM for trend analysis
- **Node-Cron** - Scheduled background jobs
- **Nodemailer** - Email alert delivery

### External APIs
- **Google News API** - News article aggregation
- **Reddit API** - Community data extraction
- **Google Trends** - Search volume tracking
- **Groq** - Advanced AI inference

---

## ⚙️ Environment Variables

### Backend (.env)
```env
# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/trendlens

# Authentication (JWT + OAuth)
JWT_SECRET=your_super_secret_key_min_32_chars_use_crypto_randomBytes
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars_use_crypto_randomBytes
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# AI Model (Groq)
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

# External APIs
GOOGLE_NEWS_API_KEY=your_news_api_key

# Email Configuration (Gmail)
ALERT_EMAIL_FROM=your-email@gmail.com
ALERT_EMAIL_PASSWORD=your_app_specific_password

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_from_backend
```

---

## 🔄 How It Works

- Collects data from Google Trends, Reddit, News, and Wikipedia  
- Combines and processes data into a unified format  
- Uses AI to generate **Story DNA** (WHY, WHAT, HOW, WHERE, TIMELINE)  
- Builds timeline, sentiment insights, and visual charts  
- Monitors topics and sends alerts on major updates  