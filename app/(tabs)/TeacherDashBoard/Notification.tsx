import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, RefreshControl, TouchableOpacity, Dimensions, Modal, Animated } from 'react-native';
import { getAuthData } from '../../../utils/authStorage';
import axios from 'axios';
import { BASE_URL } from '../../../config';
import { useFocusEffect } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { router } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';

const {height,width}=Dimensions.get('window')

type Notification = {
    id: string;
    sender_name?: string;
    avatar_url?: string;
    message: string;
    created_at: string | Date;
    is_read?: boolean;
};

const TeacherNotification = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        const loadToken = async () => {
            const token = await getAuthData();
            setUserToken(token?.token || null);
        };
        loadToken();
    }, []);

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
            console.log('🔄 Fetching notifications from API...');
            
            const response = await axios.get<Notification[]>(`${BASE_URL}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });
            
            console.log(`✅ Notifications fetched successfully: ${response.data.length} items`);
            setNotifications(response.data);
        } catch (err) {
            console.error('❌ Error fetching notifications:', err);
            const error = err as any;
            
            // Detailed error logging
            if (error.response) {
                // Server responded with error status
                console.error('Response error:', error.response.status, error.response.data);
                const errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`;
                setError(errorMessage);
            } else if (error.request) {
                // Request was made but no response received
                console.error('No response received:', error.request);
                setError('Network error: Unable to connect to server. Please check your connection.');
            } else {
                // Something else happened
                console.error('Request setup error:', error.message);
                setError('Failed to load notifications. Please try again later.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    
    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }, [])
    );

    const formatTime = (dateString: string | Date) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', { 
            hour: 'numeric', 
            minute: 'numeric', 
            hour12: true 
        });
    };

    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleNotificationPress = async (notification: Notification) => {
        setSelectedNotification(notification);
        setPreviewVisible(true);
        
        // Only mark as read if it's not already read
        if (!notification.is_read) {
            try {
                // Update local state immediately for better UX
                const updatedNotifications = notifications.map(item => 
                    item.id === notification.id ? { ...item, is_read: true } : item
                );
                setNotifications(updatedNotifications);

                // Send API request to mark as read in backend
                const token = await getAuthData();
                await axios.post(`${BASE_URL}/api/notifications/mark-read`, 
                    { notification_id: notification.id },
                    {
                        headers: {
                            'Authorization': `Bearer ${token?.token}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    }
                );
                console.log('✅ Notification marked as read successfully');
            } catch (error) {
                console.error('❌ Error marking notification as read:', error);
                // Don't revert - keep it as read locally for better UX
                // The sync will happen on next refresh
                console.log('⚠️ Notification marked as read locally only');
            }
        }

        // Animate the modal appearance
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closePreview = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setPreviewVisible(false);
            setSelectedNotification(null);
        });
    };

    const isLongMessage = (message: string) => {
        return message.length > 80; // Adjust this threshold as needed
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2e70e8" />
                <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={{marginTop: hp('4%')}}>
                <View style={styles.topContent}>
                    <Text style={styles.title}>Notifications</Text>
                    <TouchableOpacity 
                        onPress={() => router.push('/(tabs)/TeacherDashBoard/Teacher')}
                    >
                        <FontAwesome6 name="x" size={24} color="black" style={styles.crossIcon} />
                    </TouchableOpacity>
                </View>
                
                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <Text style={styles.retryButton} onPress={fetchNotifications}>
                            Tap to retry
                        </Text>
                    </View>
                ) : (
                    <ScrollView 
                        contentContainerStyle={{ paddingBottom: 200 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#2e70e8']}
                                tintColor="#2e70e8"
                            />
                        }
                    >
                        {notifications.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <View style={styles.dot}></View>
                                <Image source={require("../../../assets/image/notification.png")} style={styles.emptyImage} />
                                <Text style={styles.emptyText}>No Notifications Yet</Text>
                                <Text style={{color:"#7d7d7d"}}>You're all caught up! Check back later for updates.</Text>
                            </View>
                        ) : (
                            notifications.map((notification, index) => (
                                <TouchableOpacity 
                                    key={notification.id} 
                                    style={[
                                        styles.notification,
                                        !notification.is_read && styles.unreadNotification,
                                        index === 0 && !notification.is_read && styles.unreadNotification
                                    ]}
                                    onPress={() => handleNotificationPress(notification)}
                                    activeOpacity={0.7}
                                >
                                    {notification.avatar_url ? (
                                        <Image source={{ uri: notification.avatar_url }} style={styles.avatar} />
                                    ) : (
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>
                                                {notification.sender_name?.charAt(0).toUpperCase() || 'A'}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.contentContainer}>
                                        <Text style={styles.senderName}>{notification.sender_name || 'Admin'}</Text>
                                        <Text 
                                            style={styles.notificationText} 
                                            numberOfLines={2}
                                            ellipsizeMode="tail"
                                        >
                                            {notification.message}
                                        </Text>
                                        {isLongMessage(notification.message) && (
                                            <Text style={styles.readMoreText}>Tap to read more</Text>
                                        )}
                                    </View>
                                    <View style={styles.time}>
                                        <Text style={styles.timeText}>{formatTime(notification.created_at)}</Text>
                                        {!notification.is_read && <View style={styles.unreadDot} />}
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                )}
            </View>

            {/* Notification Preview Modal */}
            <Modal
                visible={previewVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closePreview}
            >
                <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Notification</Text>
                            <TouchableOpacity onPress={closePreview} style={styles.closeButton}>
                                <Image 
                                    source={require("../../../assets/images/cross-working.png")}
                                    style={styles.modalCloseIcon}
                                />
                            </TouchableOpacity>
                        </View>
                        
                        {selectedNotification && (
                            <View style={styles.previewContent}>
                                <View style={styles.previewHeader}>
                                    {selectedNotification.avatar_url ? (
                                        <Image source={{ uri: selectedNotification.avatar_url }} style={styles.previewAvatar} />
                                    ) : (
                                        <View style={styles.previewAvatar}>
                                            <Text style={styles.previewAvatarText}>
                                                {selectedNotification.sender_name?.charAt(0).toUpperCase() || 'A'}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.previewSenderInfo}>
                                        <Text style={styles.previewSenderName}>
                                            {selectedNotification.sender_name || 'Admin'}
                                        </Text>
                                        <Text style={styles.previewTime}>
                                            {formatTime(selectedNotification.created_at)} • {formatDate(selectedNotification.created_at)}
                                        </Text>
                                    </View>
                                </View>
                                
                                <ScrollView style={styles.messageContainer} showsVerticalScrollIndicator={false}>
                                    <Text style={styles.previewMessage}>
                                        {selectedNotification.message}
                                    </Text>
                                </ScrollView>
                                
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.actionButton} onPress={closePreview}>
                                        <Text style={styles.actionButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF" },
    topContent: { 
        flexDirection: "row", 
        justifyContent: "space-between", 
        alignItems: "center", 
        paddingHorizontal: wp("4%"),
        paddingTop: hp("2%"),
        paddingBottom: hp("1%"),
    },
    crossIcon: { 
        width: wp("7%"), 
        height: wp("7%"),
        resizeMode: 'contain',
    },
    title: { 
        fontSize: wp("6%"), 
        fontWeight: "bold", 
        color: "#333",
        marginTop: hp("1%"),
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { marginTop: 10, color: '#666' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    errorText: { color: '#d32f2f', textAlign: 'center', marginBottom: 15 },
    retryButton: { color: '#1976d2', fontWeight: '600', padding: 10 },
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginBottom: hp("10%") },
    emptyImage: { width: wp("40%"), height: hp("20%"), resizeMode: "contain" },
    emptyText: { fontSize: wp("5%"), color: "#1b1b1b", lineHeight: hp("4%"), textAlign: "center", marginTop: hp("1%") },
    dot: { height: hp("1%"), width: wp("2.5%"), borderRadius: wp("1.25%"), backgroundColor: "#2e70e8", marginBottom: hp("2%") },
    
    // Notification Items
    notification: { 
        width: "100%", 
        padding: wp("4%"), 
        flexDirection: "row", 
        alignItems: "center", 
        height: hp("10%"), 
        marginTop: hp('0.2%'),
        backgroundColor: '#fff',
    },
    unreadNotification: {
        backgroundColor: "rgba(95,95,255,0.31)",
    },
    
    avatar: { 
        width: wp("12%"), 
        height: wp("12%"), 
        borderRadius: wp("6%"), 
        marginRight: wp("3%"), 
        backgroundColor: "#e2e8f0", 
        alignItems: "center", 
        justifyContent: "center" 
    },
    avatarText: { color: '#555', fontWeight: 'bold', fontSize: 16 },
    contentContainer: { flex: 1 },
    senderName: { fontSize: wp("4%"), fontWeight: "bold", color: "#333", marginBottom: 4 },
    notificationText: { fontSize: wp("3.8%"), color: "#333", lineHeight: 20 },
    readMoreText: { fontSize: wp("3.2%"), color: "#2e70e8", marginTop: 4, fontWeight: '500' },
    time: { flexDirection: "column", alignItems: "center", marginLeft: wp("2%") },
    timeText: { fontSize: wp("3.2%"), color: "#888", marginLeft: wp("2%") },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2e70e8',
        marginTop: 4,
    },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp('4%'),
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxHeight: hp('70%'),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: wp('4%'),
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: wp('5%'),
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    modalCloseIcon: {
        width: wp('4%'),
        height: wp('4%'),
        resizeMode: 'contain',
    },
    previewContent: {
        padding: wp('4%'),
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('2%'),
    },
    previewAvatar: {
        width: wp('14%'),
        height: wp('14%'),
        borderRadius: wp('7%'),
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: wp('3%'),
    },
    previewAvatarText: {
        color: '#555',
        fontWeight: 'bold',
        fontSize: 18,
    },
    previewSenderInfo: {
        flex: 1,
    },
    previewSenderName: {
        fontSize: wp('4.5%'),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    previewTime: {
        fontSize: wp('3.5%'),
        color: '#888',
    },
    messageContainer: {
        maxHeight: hp('30%'),
        marginBottom: hp('2%'),
    },
    previewMessage: {
        fontSize: wp('4%'),
        color: '#333',
        lineHeight: 24,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingTop: hp('1%'),
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionButton: {
        paddingVertical: hp('1.5%'),
        paddingHorizontal: wp('6%'),
        backgroundColor: '#2e70e8',
        borderRadius: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: wp('4%'),
        fontWeight: '600',
    },
});

export default TeacherNotification;