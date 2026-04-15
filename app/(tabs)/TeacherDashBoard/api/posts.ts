// API service for posts/thoughts functionality
// This file handles all API calls to the backend

import { BASE_URL } from '../../../../config';
import { getAuthData } from '../../../../utils/authStorage';

const API_BASE_URL = `${BASE_URL}/api`;

console.log('🔗 API_BASE_URL:', API_BASE_URL);

// Get auth token - replace with your actual auth implementation
const getAuthToken = async (): Promise<string> => {
  const auth = await getAuthData();
  return auth?.token || '';
};

// Generic API request helper with fetch for direct connection
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('🌐 Making API request to:', url);
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    const response = await fetch(url, { 
      ...defaultOptions, 
      ...options,
      // Force direct connection, bypassing any potential proxy
      cache: 'no-cache',
      mode: 'cors'
    });
    
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
