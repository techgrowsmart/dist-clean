import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, RefreshControl, TouchableOpacity, Dimensions, Modal, Animated, Platform, StatusBar } from 'react-native';
import { getAuthData } from '../../../utils/authStorage';
import axios from 'axios';
import { BASE_URL } from '../../../config';
import { useFocusEffect } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { router } from 'expo-router';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const {height,width}=Dimensions.get('window')

type Notification = {
    id: string;
    sender_name?: string;
    avatar_url?: string;
    message: string;
    created_at: string | Date;
    is_read?: boolean;
};

const StudentNotification = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.95));

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
            console.log('🔄 Fetching student notifications from API...');
            
            const response = await axios.get<Notification[]>(`${BASE_URL}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000 // Reduced from 15s to 5s to match Teacher
            });
            
            console.log(`✅ Student notifications fetched successfully: ${response.data.length} items`);
            setNotifications(response.data);
        } catch (err) {
            console.error('❌ Error fetching student notifications:', err);
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
            // Removed excessive polling - only fetch on focus
            return () => {
                // Cleanup if needed
            };
        }, [fetchNotifications])
    );

    const formatTime = (dateString: string | Date) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
    };

    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleNotificationPress = async (notification: Notification) => {
        setSelectedNotification(notification);
        setPreviewVisible(true);
        
        // Animate the modal appearance
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
        
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
                        }
                    }
                );
                console.log('✅ Student notification marked as read successfully');
            } catch (error) {
                console.error('❌ Error marking student notification as read:', error);
            }
        }
    };

    const closePreview = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start(() => {
            setPreviewVisible(false);
            setSelectedNotification(null);
        });
    };

    const isLongMessage = (message: string) => {
        return message.length > 80;
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" />
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.loadingGradient}
                >
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity 
                        style={styles.backButtonContainer}
                        onPress={() => router.back()}
                    >
                        <BlurView intensity={80} style={styles.backButtonBlur}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </BlurView>
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.title}>Notifications</Text>
                        <Text style={styles.subtitle}>{notifications.filter(n => !n.is_read).length} unread</Text>
                    </View>
                    <View style={styles.headerIconContainer}>
                        <BlurView intensity={80} style={styles.iconBlur}>
                            <Ionicons name="notifications" size={22} color="#fff" />
                        </BlurView>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.contentContainer}>
                
                {error ? (
                    <View style={styles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#667eea']}
                                tintColor="#667eea"
                                progressBackgroundColor="#fff"
                            />
                        }
                    >
                        {notifications.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <LinearGradient
                                    colors={['#f8fafc', '#e2e8f0']}
                                    style={styles.emptyGradient}
                                >
                                    <View style={styles.emptyIconContainer}>
                                        <Ionicons name="notifications-off-outline" size={64} color="#94a3b8" />
                                    </View>
                                    <Text style={styles.emptyText}>All Caught Up!</Text>
                                    <Text style={styles.emptySubtext}>No new notifications at the moment</Text>
                                </LinearGradient>
                            </View>
                        ) : (
                            <View style={styles.notificationsList}>
                                {notifications.map((notification, index) => (
                                    <Animated.View 
                                        key={notification.id}
                                        style={{
                                            opacity: slideAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, 1]
                                            }),
                                            transform: [{
                                                translateY: slideAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [20 * (index + 1), 0]
                                                })
                                            }]
                                        }}
                                    >
                                        <TouchableOpacity 
                                            style={[
                                                styles.notificationCard,
                                                !notification.is_read && styles.unreadCard,
                                            ]}
                                            onPress={() => handleNotificationPress(notification)}
                                            activeOpacity={0.85}
                                        >
                                            {!notification.is_read && (
                                                <View style={styles.unreadIndicator} />
                                            )}
                                            <View style={styles.notificationInner}>
                                                {notification.avatar_url ? (
                                                    <Image source={{ uri: notification.avatar_url }} style={styles.avatar} />
                                                ) : (
                                                    <LinearGradient
                                                        colors={!notification.is_read ? ['#667eea', '#764ba2'] : ['#e2e8f0', '#cbd5e1']}
                                                        style={styles.avatar}
                                                    >
                                                        <Text style={styles.avatarText}>
                                                            {notification.sender_name?.charAt(0).toUpperCase() || 'A'}
                                                        </Text>
                                                    </LinearGradient>
                                                )}
                                                <View style={styles.notificationContent}>
                                                    <View style={styles.notificationHeader}>
                                                        <Text style={[
                                                            styles.senderName,
                                                            !notification.is_read && styles.unreadSenderName
                                                        ]}>
                                                            {notification.sender_name || 'Admin'}
                                                        </Text>
                                                        <View style={styles.timeBadge}>
                                                            <Text style={styles.timeText}>
                                                                {formatTime(notification.created_at)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Text 
                                                        style={[
                                                            styles.notificationText,
                                                            !notification.is_read && styles.unreadText
                                                        ]} 
                                                        numberOfLines={2}
                                                        ellipsizeMode="tail"
                                                    >
                                                        {notification.message}
                                                    </Text>
                                                    {isLongMessage(notification.message) && (
                                                        <View style={styles.readMoreBadge}>
                                                            <Text style={styles.readMoreText}>Tap to read</Text>
                                                            <Ionicons name="chevron-forward" size={12} color="#667eea" />
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>

            {/* Notification Preview Modal */}
            <Modal
                visible={previewVisible}
                transparent={true}
                animationType="none"
                onRequestClose={closePreview}
            >
                <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
                    <TouchableOpacity 
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={closePreview}
                    >
                        <Animated.View 
                            style={[
                                styles.modalContainer,
                                { transform: [{ scale: scaleAnim }] }
                            ]}
                        >
                            <LinearGradient
                                colors={['#fff', '#f8fafc']}
                                style={styles.modalGradient}
                            >
                                <View style={styles.modalHeader}>
                                    <View style={styles.modalHeaderLeft}>
                                        <View style={styles.modalIconContainer}>
                                            <LinearGradient
                                                colors={['#667eea', '#764ba2']}
                                                style={styles.modalIconGradient}
                                            >
                                                <Ionicons name="notifications" size={20} color="#fff" />
                                            </LinearGradient>
                                        </View>
                                        <Text style={styles.modalTitle}>Notification</Text>
                                    </View>
                                    <TouchableOpacity onPress={closePreview} style={styles.closeButton}>
                                        <BlurView intensity={60} style={styles.closeButtonBlur}>
                                            <Ionicons name="close" size={20} color="#64748b" />
                                        </BlurView>
                                    </TouchableOpacity>
                                </View>
                                
                                {selectedNotification && (
                                    <View style={styles.previewContent}>
                                        <View style={styles.previewHeader}>
                                            {selectedNotification.avatar_url ? (
                                                <Image 
                                                    source={{ uri: selectedNotification.avatar_url }} 
                                                    style={styles.previewAvatar} 
                                                />
                                            ) : (
                                                <LinearGradient
                                                    colors={['#667eea', '#764ba2']}
                                                    style={styles.previewAvatar}
                                                >
                                                    <Text style={styles.previewAvatarText}>
                                                        {selectedNotification.sender_name?.charAt(0).toUpperCase() || 'A'}
                                                    </Text>
                                                </LinearGradient>
                                            )}
                                            <View style={styles.previewSenderInfo}>
                                                <Text style={styles.previewSenderName}>
                                                    {selectedNotification.sender_name || 'Admin'}
                                                </Text>
                                                <View style={styles.previewTimeContainer}>
                                                    <Ionicons name="time-outline" size={12} color="#94a3b8" />
                                                    <Text style={styles.previewTime}>
                                                        {formatDate(selectedNotification.created_at)} at {formatTime(selectedNotification.created_at)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        
                                        <ScrollView 
                                            style={styles.messageContainer} 
                                            showsVerticalScrollIndicator={false}
                                        >
                                            <View style={styles.messageBubble}>
                                                <Text style={styles.previewMessage}>
                                                    {selectedNotification.message}
                                                </Text>
                                            </View>
                                        </ScrollView>
                                        
                                        <View style={styles.modalActions}>
                                            <TouchableOpacity 
                                                style={styles.actionButton} 
                                                onPress={closePreview}
                                            >
                                                <LinearGradient
                                                    colors={['#667eea', '#764ba2']}
                                                    style={styles.actionButtonGradient}
                                                >
                                                    <Text style={styles.actionButtonText}>Got it</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </LinearGradient>
                        </Animated.View>
                    </TouchableOpacity>
                </Animated.View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#f8fafc" 
    },
    
    // Header Styles
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? hp('5%') : StatusBar.currentHeight ? StatusBar.currentHeight + hp('1%') : hp('3%'),
        paddingBottom: hp('3%'),
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp('4%'),
    },
    backButtonContainer: {
        marginRight: wp('3%'),
    },
    backButtonBlur: {
        width: 40,
        height: 40,
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
    },
    title: { 
        fontSize: wp("6%"), 
        fontWeight: "700", 
        color: "#fff",
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: wp("3.5%"),
        color: "rgba(255,255,255,0.8)",
        marginTop: 2,
    },
    headerIconContainer: {
        marginLeft: wp('2%'),
    },
    iconBlur: {
        width: 44,
        height: 44,
        borderRadius: 14,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Content Container
    contentContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
        paddingTop: 20,
    },
    scrollContent: {
        paddingBottom: hp('10%'),
        paddingHorizontal: wp('4%'),
        paddingTop: hp('2%'),
    },
    
    // Loading State
    loadingContainer: { 
        flex: 1,
    },
    loadingGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: { 
        marginTop: 16, 
        color: '#fff',
        fontSize: wp('4%'),
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    
    // Error State
    errorContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: wp('8%'),
        backgroundColor: '#f8fafc' 
    },
    errorText: { 
        color: '#EF4444', 
        textAlign: 'center', 
        marginTop: 16,
        marginBottom: 24,
        fontSize: wp('4%'),
        fontWeight: '500',
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: '#fff',
        paddingVertical: hp('1.5%'),
        paddingHorizontal: wp('6%'),
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    retryButtonText: { 
        color: '#667eea', 
        fontWeight: '600',
        fontSize: wp('4%'),
    },
    
    // Empty State
    emptyContainer: { 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center",
        paddingTop: hp('10%'),
    },
    emptyGradient: {
        padding: wp('10%'),
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        width: wp('80%'),
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: { 
        fontSize: wp("5.5%"), 
        color: "#1e293b", 
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: wp("3.8%"),
        color: "#64748b",
        textAlign: "center",
        lineHeight: 20,
    },
    
    // Notifications List
    notificationsList: {
        gap: 12,
    },
    
    // Notification Card
    notificationCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    unreadCard: {
        backgroundColor: '#fff',
        shadowColor: '#667eea',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    unreadIndicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: '#667eea',
    },
    notificationInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp('4%'),
    },
    avatar: { 
        width: wp("13%"), 
        height: wp("13%"), 
        borderRadius: wp("6.5%"), 
        marginRight: wp("3.5%"), 
        alignItems: "center", 
        justifyContent: "center",
        overflow: 'hidden',
    },
    avatarText: { 
        color: '#fff', 
        fontWeight: '700', 
        fontSize: wp('5%'),
    },
    notificationContent: { 
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    senderName: { 
        fontSize: wp("4.2%"), 
        fontWeight: "600", 
        color: "#475569",
        flex: 1,
        marginRight: 8,
    },
    unreadSenderName: {
        color: "#1e293b",
        fontWeight: "700",
    },
    timeBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    timeText: { 
        fontSize: wp("3%"), 
        color: "#64748b",
        fontWeight: '500',
    },
    notificationText: { 
        fontSize: wp("3.7%"), 
        color: "#64748b", 
        lineHeight: 20,
    },
    unreadText: {
        color: "#334155",
        fontWeight: "500",
    },
    readMoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    readMoreText: { 
        fontSize: wp("3.2%"), 
        color: "#667eea",
        fontWeight: '600',
    },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp('5%'),
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 40,
        elevation: 20,
    },
    modalGradient: {
        padding: wp('6%'),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp('3%'),
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalIconContainer: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    modalIconGradient: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: wp('5%'),
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: 0.5,
    },
    closeButton: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    closeButtonBlur: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewContent: {
        gap: hp('2%'),
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    previewAvatar: {
        width: wp('16%'),
        height: wp('16%'),
        borderRadius: wp('8%'),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    previewAvatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: wp('6%'),
    },
    previewSenderInfo: {
        flex: 1,
    },
    previewSenderName: {
        fontSize: wp('4.5%'),
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    previewTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    previewTime: {
        fontSize: wp('3.2%'),
        color: '#94a3b8',
        fontWeight: '500',
    },
    messageContainer: {
        maxHeight: hp('35%'),
    },
    messageBubble: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: wp('5%'),
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    previewMessage: {
        fontSize: wp('4%'),
        color: '#334155',
        lineHeight: 26,
        fontWeight: '400',
    },
    modalActions: {
        marginTop: hp('2%'),
    },
    actionButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    actionButtonGradient: {
        paddingVertical: hp('1.8%'),
        paddingHorizontal: wp('6%'),
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: wp('4%'),
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default StudentNotification;