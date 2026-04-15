import { BASE_URL } from '../config';

/**
 * Reusable utility function to construct image source from various path formats
 * Handles full URLs, relative paths, and null/undefined values
 * 
 * @param imagePath - The image path (can be full URL, relative path, or null/undefined)
 * @returns Image source object for React Native Image component, or null if invalid
 */
export const getImageSource = (imagePath: string | null | undefined): { uri: string } | null => {
  if (!imagePath) return null;
  
  // Handle null/undefined strings
  if (imagePath === 'null' || imagePath === 'undefined' || imagePath.trim() === '') {
    return null;
  }
  
  // If it's already a full URL (http/https/file://), return as-is
  if (imagePath.startsWith('http') || imagePath.startsWith('file://')) {
    return { uri: imagePath };
  }
  
  // If it already contains BASE_URL, return as-is (avoid double prefixing)
  if (imagePath.includes(BASE_URL)) {
    return { uri: imagePath };
  }
  
  // Handle relative paths - prepend BASE_URL
  // If path already starts with /uploads/, just prepend BASE_URL
  if (imagePath.startsWith('/uploads/')) {
    return { uri: `${BASE_URL}${imagePath}` };
  }
  
  // If path starts with /, prepend BASE_URL
  if (imagePath.startsWith('/')) {
    return { uri: `${BASE_URL}${imagePath}` };
  }
  
  // Otherwise, prepend BASE_URL with /uploads/
  return { uri: `${BASE_URL}/uploads/${imagePath}` };
};

/**
 * Get profile image source with fallback to placeholder
 * 
 * @param profilePic - Profile picture path
 * @param placeholder - Optional placeholder require path
 * @returns Image source object
 */
export const getProfileImageSource = (
  profilePic: string | null | undefined,
  placeholder?: any
): { uri: string } | any => {
  const source = getImageSource(profilePic);
  if (source) return source;
  
  // Return placeholder if provided, otherwise null
  if (placeholder) return placeholder;
  return null;
};
