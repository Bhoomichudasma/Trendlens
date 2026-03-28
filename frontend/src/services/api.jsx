// Normalize base URL and ensure "/api" prefix for backend routes
const API_ROOT = (import.meta.env.VITE_API_URL?.replace(/\/$/, '')) || 'http://localhost:5000';
const BASE_URL = `${API_ROOT}/api`;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = {
  searchTrend: async (keyword, filters = {}, options = {}) => {
    const log = options.log ?? true;
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Add filters as query parameters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          queryParams.append(key, filters[key]);
        }
      });
      queryParams.append('log', String(log));
      
      const url = `${BASE_URL}/trend/${encodeURIComponent(keyword)}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          ...authHeaders(),
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch trend data');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Universal intelligence build (StoryDNA + timeline + sentiment + reddit pulse)
  searchIntelligence: async (keyword, filters = {}, options = {}) => {
    const log = options.log ?? true;
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', keyword);
      queryParams.append('log', String(log));

      Object.keys(filters).forEach((key) => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `${BASE_URL}/search?${queryParams.toString()}`;
      const response = await fetch(url, {
        headers: {
          ...authHeaders(),
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch topic intelligence');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Force-rebuild StoryDNA (bypasses 30-min cache)
  refreshIntelligence: async (keyword, filters = {}, options = {}) => {
    const log = options.log ?? true;
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', keyword);
      queryParams.append('refresh', 'true');
      queryParams.append('log', String(log));

      Object.keys(filters).forEach((key) => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `${BASE_URL}/search?${queryParams.toString()}`;
      const response = await fetch(url, {
        headers: {
          ...authHeaders(),
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to refresh topic intelligence');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  getTopicDNA: async (id) => {
    const response = await fetch(`${BASE_URL}/topics/${id}/dna`);
    if (!response.ok) throw new Error('Failed to fetch topic DNA');
    return response.json();
  },

  getTopicTimeline: async (id) => {
    const response = await fetch(`${BASE_URL}/topics/${id}/timeline`);
    if (!response.ok) throw new Error('Failed to fetch topic timeline');
    return response.json();
  },

  getTopicSentiment: async (id) => {
    const response = await fetch(`${BASE_URL}/topics/${id}/sentiment`);
    if (!response.ok) throw new Error('Failed to fetch topic sentiment');
    return response.json();
  },

  getTopicSources: async (id) => {
    const response = await fetch(`${BASE_URL}/topics/${id}/sources`);
    if (!response.ok) throw new Error('Failed to fetch topic sources');
    return response.json();
  },

  getTopicRelated: async (id) => {
    const response = await fetch(`${BASE_URL}/topics/${id}/related`);
    if (!response.ok) throw new Error('Failed to fetch related topics');
    return response.json();
  },

  getTopicRedditPosts: async (id) => {
    const response = await fetch(`${BASE_URL}/topics/${id}/reddit`);
    if (!response.ok) throw new Error('Failed to fetch reddit posts');
    return response.json();
  },

  getTrending: async () => {
    const response = await fetch(`${BASE_URL}/trending`);
    if (!response.ok) throw new Error('Failed to fetch trending topics');
    return response.json();
  },

  getMyHistory: async (token) => {
    const response = await fetch(`${BASE_URL}/search/history`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  },
};

export default api;