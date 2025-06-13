import { MessageCircle, ArrowUp ,Users} from "lucide-react";


const RedditBuzz = ({ posts = [], keyword = "technology" }) => {
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MessageCircle className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Reddit Buzz</h3>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No Reddit discussions found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Reddit Buzz</h3>
        </div>
        <span className="text-sm text-gray-500">{posts.length} posts</span>
      </div>
      
      <div className="space-y-4">
        {posts.slice(0, 5).map((post, index) => (
          <div key={index} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-medium text-gray-900 flex-1 line-clamp-2">
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-blue-600"
                >
                  {post.title || `Discussion: ${keyword} - What are your thoughts?`}
                </a>
              </h4>
              <div className="flex items-center space-x-1 text-orange-600 ml-3">
                <ArrowUp className="w-4 h-4" />
                <span className="text-sm font-medium">{post.score || 0}</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {post.selftext?.trim()
                ? post.selftext
                : `Community discussion about ${keyword} and its recent developments.`}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>r/{post.subreddit || "technology"}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{post.num_comments || 0} comments</span>
                </div>
              </div>
              <span>
                {post.created_utc
                  ? new Date(post.created_utc * 1000).toLocaleString()
                  : "Unknown date"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default RedditBuzz;