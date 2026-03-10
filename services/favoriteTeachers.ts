import { BASE_URL } from '../config';
import { makeAuthenticatedCall } from '../utils/authHelper';

export const addFavoriteTeacher = async (teacherEmail: string) => {
    try {
        const response = await makeAuthenticatedCall('/api/favorites/add', {
            method: 'POST',
            body: JSON.stringify({ teacherEmail })
        });

        const data = await response.json();
        if (!response.ok) {
            // Handle specific case of already favorited teacher
            if (response.status === 400 && data.message?.includes('already in favorites')) {
                return { success: true, message: 'Teacher already in favorites', alreadyFavorited: true };
            }
            throw new Error(data.message || 'Failed to add favorite');
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const removeFavoriteTeacher = async (teacherEmail: string) => {
    try {
        const response = await makeAuthenticatedCall('/api/favorites/remove', {
            method: 'DELETE',
            body: JSON.stringify({ teacherEmail })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to remove favorite');
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const getFavoriteTeachers = async () => {
    try {
        const response = await makeAuthenticatedCall('/api/favorites/list');

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch favorites');
        }

        // The API returns teacher data directly, not inside teacher_data
        // So just return the favorites array as-is
        return data.favorites || [];
    } catch (error) {
        throw error;
    }
};

export const checkFavoriteStatus = async (teacherEmail: string) => {
    try {
        const response = await makeAuthenticatedCall(`/api/favorites/check/${teacherEmail}`);

        const data = await response.json();
        if (!response.ok) {
            return false;
        }

        return data.isFavorited || false;
    } catch (error) {
        return false;
    }
};