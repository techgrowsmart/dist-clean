import React, { useEffect, useState } from 'react';
import { Platform,
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    StatusBar
} from 'react-native';
import { getAuthData } from '../../../utils/authStorage';
import axios from 'axios';
import { BASE_URL } from '../../../config';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Notification = {
    id: string;
    sender_name?: string;
    avatar_url?: string;
    message: string;
    created_at: string | Date;
    is_read?: boolean;
    type?: 'message' | 'booking' | 'payment' | 'system' | 'achievement';
};

const StudentNotification = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleBackPress = () => {
        router.back();
    };

    const fetchNotifications = async () => {
        const token = await getAuthData();
        const currentToken = token?.token || null;
        
        if (!currentToken) {
            console.error('❌ No authentication token found');
            setError('Authentication required. Please log in again.');
            setLoading(false);
            return;
        }

        try {
            setError(null);
            console.log('🔄 Fetching student notifications from API...');
            
            const response = await axios.get<Notification[]>(`${BASE_URL}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            // Validate response data is an array
            const notificationsData = Array.isArray(response.data) ? response.data : [];
            console.log(`✅ Student notifications fetched successfully: ${notificationsData.length} items`);
            setNotifications(notificationsData);
        } catch (err) {
            console.error('❌ Error fetching student notifications:', err);
            const error = err as any;
            
            if (error.response) {
                console.error('Response error:', error.response.status, error.response.data);
                const errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`;
                setError(errorMessage);
            } else if (error.request) {
                console.error('No response received:', error.request);
                setError('Network error: Unable to connect to server. Please check your connection.');
            } else {
                console.error('Request setup error:', error.message);
                setError('Failed to load notifications. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = () => {
        fetchNotifications();
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchNotifications();
            return () => {};
        }, [])
    );

    const formatTime = (dateString: string | Date) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const handleNotificationPress = async (notification: Notification) => {
        if (!notification.is_read) {
            try {
                const updatedNotifications = notifications.map(item => 
                    item.id === notification.id ? { ...item, is_read: true } : item
                );
                setNotifications(updatedNotifications);

                const token = await getAuthData();
                await axios.post(`${BASE_URL}/api/notifications/mark-read`, 
                    { notification_id: notification.id },
                    {
                        headers: {
                            'Authorization': `Bearer ${token?.token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
    };

    const filteredNotifications = (Array.isArray(notifications) ? notifications : []).filter(notification => {
        return notification;
    });

    const unreadCount = (Array.isArray(notifications) ? notifications : []).filter(n => !n.is_read).length;

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <Text style={styles.unreadCount}>{unreadCount}</Text>
            </View>

            {error ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchNotifications} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView 
                    style={styles.scrollContainer}
                    refreshControl={
                        <>
                            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                                <Ionicons name="refresh" size={20} color="#000" />
                            </TouchableOpacity>
                        </>
                    }
                >
                    {filteredNotifications.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>No notifications</Text>
                        </View>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <TouchableOpacity
                                key={notification.id}
                                style={[
                                    styles.notificationItem,
                                    !notification.is_read && styles.unreadItem
                                ]}
                                onPress={() => handleNotificationPress(notification)}
                            >
                                <View style={styles.notificationContent}>
                                    <Text style={styles.senderName}>
                                        {notification.sender_name || 'GoGrowSmart'}
                                    </Text>
                                    <Text style={styles.message}>{notification.message}</Text>
                                    <Text style={styles.time}>{formatTime(notification.created_at)}</Text>
                                </View>
                                {!notification.is_read && <View style={styles.unreadDot} />}
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginLeft: 8,
    },
    unreadCount: {
        fontSize: 14,
        color: '#666',
    },
    scrollContainer: {
        flex: 1,
    },
    refreshButton: {
        alignSelf: 'center',
        marginVertical: 16,
        padding: 12,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        padding: 12,
        backgroundColor: '#000',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#FFF',
    },
    unreadItem: {
        backgroundColor: '#F3F4F6',
    },
    notificationContent: {
        flex: 1,
    },
    senderName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    time: {
        fontSize: 12,
        color: '#999',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3B82F6',
        marginLeft: 12,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
});

export default StudentNotification;