// API service for posts/thoughts functionality
// This file handles all API calls to the backend

const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token - replace with your actual auth implementation
const getAuthToken = async (): Promise<string> => {
  // This should get the token from your auth context/storage
  // For now, return a placeholder
  return 'your-auth-token-here';
};

// Generic API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Posts API
export const postsAPI = {
  // Create a new post (teachers only)
  createPost: async (content: string, imageUri?: string, tags?: string[]) => {
    const formData = new FormData();
    formData.append('content', content);
    
    if (tags && tags.length > 0) {
      formData.append('tags', tags.join(','));
    }
    
    if (imageUri) {
      // Note: For React Native, you might need to handle file uploads differently
      formData.append('postImage', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'post-image.jpg',
      } as any);
    }

    return apiRequest('/posts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  },

  // Get all posts
  getAllPosts: async () => {
    return apiRequest('/posts/all');
  },

  // Like a post
  likePost: async (postId: string) => {
    return apiRequest(`/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  // Unlike a post
  unlikePost: async (postId: string) => {
    return apiRequest(`/posts/${postId}/like`, {
      method: 'DELETE',
    });
  },

  // Add comment to a post
  addComment: async (postId: string, content: string) => {
    return apiRequest(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // Get comments for a post
  getComments: async (postId: string) => {
    return apiRequest(`/posts/${postId}/comments`);
  },
};

export default postsAPI;
