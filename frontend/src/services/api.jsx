const BASE_URL = import.meta.env.VITE_API_URL;

const api = {
  searchTrend: async (keyword) => {
    try {
      const response = await fetch(`${BASE_URL}/trend/${encodeURIComponent(keyword)}`);
      if (!response.ok) throw new Error('Failed to fetch trend data');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

export default api;
