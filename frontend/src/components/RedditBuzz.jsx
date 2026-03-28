import React, { useState } from 'react';
import { Filter, ThumbsUp, MessageCircle, Clock, ExternalLink, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from './ui';
import { Separator } from './ui/separator';

const RedditBuzz = ({ posts }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score');

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="bg-slate-800/40 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
          <TrendingUp className="w-10 h-10 text-slate-500" />
        </div>
        <p className="text-slate-400 text-lg font-medium">No Reddit posts found</p>
        <p className="text-slate-500 text-sm mt-2">Try searching for a different topic</p>
      </div>
    );
  }

  // Sort posts
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'score') {
      return b.score - a.score;
    } else if (sortBy === 'comments') {
      return (b.num_comments || 0) - (a.num_comments || 0);
    } else if (sortBy === 'date') {
      return new Date(b.created_utc * 1000) - new Date(a.created_utc * 1000);
    }
    return 0;
  });

  // Filter posts by subreddit
  const filteredPosts = filter === 'all' 
    ? sortedPosts 
    : sortedPosts.filter(post => post.subreddit === filter);

  // Get unique subreddits for filter dropdown
  const subreddits = [...new Set(posts.map(post => post.subreddit).filter(Boolean))];

  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Filter and sort controls */}
      <Card className="border-slate-700/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-medium text-slate-300">Filter & Sort</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              >
                <option value="all">All Subreddits ({posts.length})</option>
                {subreddits.map(subreddit => (
                  <option key={subreddit} value={subreddit}>
                    r/{subreddit}
                  </option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              >
                <option value="score">Top Upvoted</option>
                <option value="comments">Most Discussed</option>
                <option value="date">Newest First</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Posts list */}
      <div className="space-y-4">
        {filteredPosts.map((post, index) => (
          <Card 
            key={index} 
            className="border-slate-700/50 hover:border-cyan-500/30 group cursor-pointer transition-all duration-300"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2">
                    <a 
                      href={post.permalink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-cyan-400 transition-colors"
                    >
                      {post.title}
                    </a>
                  </CardTitle>
                </div>
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-cyan-400 flex-shrink-0 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {post.subreddit && (
                  <Badge variant="secondary" className="bg-slate-700/50">
                    r/{post.subreddit}
                  </Badge>
                )}
                
                {post.score && post.score > 1000 && (
                  <Badge variant="success" className="gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </Badge>
                )}
              </div>

              {/* Post preview text */}
              {post.selftext && (
                <>
                  <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
                    {post.selftext}
                  </p>
                  {post.selftext.length > 300 && (
                    <p className="text-cyan-400/60 text-xs font-medium">Read more →</p>
                  )}
                </>
              )}

              <Separator />

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-300 transition-colors">
                  <ThumbsUp className="w-4 h-4 text-cyan-500" />
                  <span className="font-semibold">{post.score?.toLocaleString() || 0}</span>
                  <span>upvotes</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-300 transition-colors">
                  <MessageCircle className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold">{post.num_comments?.toLocaleString() || 0}</span>
                  <span>comments</span>
                </div>
                
                {post.created_utc && (
                  <div className="flex items-center gap-1.5 text-slate-500 ml-auto">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(post.created_utc)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results count */}
      {filteredPosts.length > 0 && (
        <div className="text-center text-slate-400 text-sm pt-4">
          Showing <span className="text-cyan-400 font-semibold">{filteredPosts.length}</span> of <span className="text-cyan-400 font-semibold">{posts.length}</span> posts
        </div>
      )}
    </div>
  );
};

export default RedditBuzz;