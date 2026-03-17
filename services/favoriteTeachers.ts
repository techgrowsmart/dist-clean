import { BASE_URL } from '../config';
import { getAuthData } from '../utils/authStorage';

export const addFavoriteTeacher = async (teacherEmail: string) => {
    try {
        const auth = await getAuthData();
        if (!auth?.token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${BASE_URL}/api/favorites/add`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${auth.token}`,
                'Content-Type': 'application/json',
            },
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
        const auth = await getAuthData();
        if (!auth?.token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${BASE_URL}/api/favorites/remove`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${auth.token}`,
                'Content-Type': 'application/json',
            },
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
        const auth = await getAuthData();
        if (!auth?.token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${BASE_URL}/api/favorites/list`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${auth.token}`,
            }
        });

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
        const auth = await getAuthData();
        if (!auth?.token) {
            return false;
        }

        const response = await fetch(`${BASE_URL}/api/favorites/check/${teacherEmail}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${auth.token}`,
            }
        });

        const data = await response.json();
        if (!response.ok) {
            return false;
        }

        return data.isFavorited || false;
    } catch (error) {
        return false;
    }
};