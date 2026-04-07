import React, { useEffect, useState, useRef } from 'react';
import { Platform,  
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator, 
    Image, 
    RefreshControl, 
    TouchableOpacity, 
    Dimensions, 
    Modal, 
    Animated, 
    FlatList,
    StatusBar,
    TextInput
} from 'react-native';
import { getAuthData } from '../../../utils/authStorage';
import axios from 'axios';
import { BASE_URL } from '../../../config';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import {  
    Ionicons, 
    MaterialIcons, 
    FontAwesome6 
} from '@expo/vector-icons';
import BackButton from '../../../components/BackButton';
import * as Haptics from 'expo-haptics';

const {height,width}=Dimensions.get('window')
const isIOS = Platform.OS === 'ios';

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
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const loadToken = async () => {
            const token = await getAuthData();
            setUserToken(token?.token || null);
        };
        loadToken();
    }, []);

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();
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
                timeout: 5000
            });
            
            console.log(`✅ Student notifications fetched successfully: ${response.data.length} items`);
            setNotifications(response.data);
            
            // Trigger haptic feedback on successful fetch
            if (response.data.length > 0) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
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
            
            // Trigger haptic feedback on error
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        
        // Refresh animation
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();
        
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

    const getNotificationIcon = (type?: string) => {
        switch (type) {
            case 'message': return 'chatbubble-outline';
            case 'booking': return 'calendar-outline';
            case 'payment': return 'card-outline';
            case 'achievement': return 'trophy-outline';
            default: return 'notifications-outline';
        }
    };

    const getNotificationColor = (type?: string) => {
        switch (type) {
            case 'message': return '#3B82F6';
            case 'booking': return '#10B981';
            case 'payment': return '#F59E0B';
            case 'achievement': return '#8B5CF6';
            default: return '#6B7280';
        }
    };

    const handleNotificationPress = async (notification: Notification) => {
        // Haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        setSelectedNotification(notification);
        setPreviewVisible(true);
        
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
                console.log('✅ Student notification marked as read successfully');
            } catch (error) {
                console.error('❌ Error marking student notification as read:', error);
            }
        }
    };

    const closePreview = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPreviewVisible(false);
        setSelectedNotification(null);
    };

    const markAllAsRead = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            const unreadNotifications = notifications.filter(n => !n.is_read);
            if (unreadNotifications.length === 0) return;

            const updatedNotifications = notifications.map(item => ({ ...item, is_read: true }));
            setNotifications(updatedNotifications);

            const token = await getAuthData();
            await axios.post(`${BASE_URL}/api/notifications/mark-all-read`, {}, {
                headers: {
                    'Authorization': `Bearer ${token?.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('❌ Error marking all notifications as read:', error);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const clearAllNotifications = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setNotifications([]);
            setPreviewVisible(false);
            
            const token = await getAuthData();
            await axios.delete(`${BASE_URL}/api/notifications/clear-all`, {
                headers: {
                    'Authorization': `Bearer ${token?.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('❌ Error clearing notifications:', error);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        const matchesFilter = filterType === 'all' || 
            (filterType === 'unread' && !notification.is_read) || 
            (filterType === 'read' && notification.is_read);
        
        const matchesSearch = searchQuery === '' || 
            notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (notification.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        
        return matchesFilter && matchesSearch;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const renderNotificationItem = ({ item, index }: { item: Notification; index: number }) => {
        const iconColor = getNotificationColor(item.type);
        const isUnread = !item.is_read;
        
        return (
            <Animated.View
                style={[
                    {
                        opacity: fadeAnim,
                        transform: [
                            {
                                translateY: slideAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0]
                                })
                            }
                        ]
                    }
                ]}
            >
                <TouchableOpacity 
                    style={[
                        styles.notificationItem,
                        isUnread && styles.unreadNotification,
                        index === 0 && styles.firstNotification
                    ]}
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
                        <Ionicons 
                            name={getNotificationIcon(item.type)} 
                            size={24} 
                            color={iconColor}
                        />
                        {isUnread && <View style={[styles.unreadDot, { backgroundColor: iconColor }]} />}
                    </View>
                    
                    <View style={styles.contentContainer}>
                        <View style={styles.headerRow}>
                            <Text style={styles.senderName}>
                                {item.sender_name || 'GoGrowSmart'}
                            </Text>
                            <Text style={styles.timeText}>
                                {formatTime(item.created_at)}
                            </Text>
                        </View>
                        <Text 
                            style={[
                                styles.messageText,
                                isUnread && styles.unreadMessageText
                            ]} 
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {item.message}
                        </Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.moreButton}
                        onPress={() => handleNotificationPress(item)}
                    >
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <BackButton 
                        size={24} 
                        color="#1F2937" 
                        onPress={() => {
                            console.log('Back button pressed in StudentNotification');
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            try {
                                // Try multiple navigation methods
                                console.log('Attempting router.back()...');
                                router.back();
                                
                                // Fallback after a short delay
                                setTimeout(() => {
                                    console.log('Fallback: navigating to StudentDashBoard');
                                    router.replace('/(tabs)/StudentDashBoard');
                                }, 100);
                            } catch (error) {
                                console.error('Router back error:', error);
                                // Immediate fallback
                                router.replace('/(tabs)/StudentDashBoard');
                            }
                        }}
                    />
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <View style={styles.headerActions}>
                        {unreadCount > 0 && (
                            <TouchableOpacity 
                                style={styles.actionButton}
                                onPress={markAllAsRead}
                            >
                                <MaterialIcons name="done-all" size={20} color="#3B82F6" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => setShowSearch(!showSearch)}
                        >
                            <Ionicons name="search-outline" size={20} color="#1F2937" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Search Bar */}
                {showSearch && (
                    <Animated.View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search notifications..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                )}
                
                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[styles.filterTab, filterType === 'all' && styles.activeFilterTab]}
                        onPress={() => setFilterType('all')}
                    >
                        <Text style={[styles.filterText, filterType === 'all' && styles.activeFilterText]}>
                            All ({notifications.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, filterType === 'unread' && styles.activeFilterTab]}
                        onPress={() => setFilterType('unread')}
                    >
                        <Text style={[styles.filterText, filterType === 'unread' && styles.activeFilterText]}>
                            Unread ({unreadCount})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, filterType === 'read' && styles.activeFilterTab]}
                        onPress={() => setFilterType('read')}
                    >
                        <Text style={[styles.filterText, filterType === 'read' && styles.activeFilterText]}>
                            Read ({notifications.length - unreadCount})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                        <Text style={styles.errorTitle}>Connection Error</Text>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
                            <Ionicons name="refresh" size={20} color="#FFFFFF" />
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={filteredNotifications}
                        renderItem={renderNotificationItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#3B82F6']}
                                tintColor="#3B82F6"
                                progressBackgroundColor="#F8FAFC"
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconContainer}>
                                    <Ionicons name="notifications-off-outline" size={64} color="#CBD5E1" />
                                </View>
                                <Text style={styles.emptyTitle}>
                                    {filterType === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
                                </Text>
                                <Text style={styles.emptyText}>
                                    {filterType === 'unread' 
                                        ? 'All your notifications have been read!' 
                                        : 'You\'re all caught up! Check back later for updates.'
                                    }
                                </Text>
                            </View>
                        }
                        ListHeaderComponent={
                            filteredNotifications.length > 0 && (
                                <View style={styles.listHeader}>
                                    <Text style={styles.listHeaderText}>
                                        {filteredNotifications.length} {filteredNotifications.length === 1 ? 'notification' : 'notifications'}
                                    </Text>
                                    {notifications.length > 0 && (
                                        <TouchableOpacity onPress={clearAllNotifications}>
                                            <Text style={styles.clearAllText}>Clear All</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )
                        }
                    />
                )}
            </Animated.View>

            {/* Notification Detail Modal */}
            <Modal
                visible={previewVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closePreview}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
                        {selectedNotification && (
                            <>
                                <View style={styles.modalHeader}>
                                    <View style={[styles.modalIconContainer, { backgroundColor: `${getNotificationColor(selectedNotification.type)}15` }]}>
                                        <Ionicons 
                                            name={getNotificationIcon(selectedNotification.type)} 
                                            size={24} 
                                            color={getNotificationColor(selectedNotification.type)}
                                        />
                                    </View>
                                    <TouchableOpacity onPress={closePreview} style={styles.modalCloseButton}>
                                        <Ionicons name="close" size={24} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>
                                
                                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                                    <Text style={styles.modalSenderName}>
                                        {selectedNotification.sender_name || 'GoGrowSmart'}
                                    </Text>
                                    <Text style={styles.modalTime}>
                                        {formatTime(selectedNotification.created_at)}
                                    </Text>
                                    <Text style={styles.modalMessage}>
                                        {selectedNotification.message}
                                    </Text>
                                </ScrollView>
                                
                                <View style={styles.modalActions}>
                                    <TouchableOpacity 
                                        style={styles.modalButton} 
                                        onPress={closePreview}
                                    >
                                        <Text style={styles.modalButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontFamily: 'System',
    },
    
    // Header
    header: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingTop: isIOS ? 50 : 30,
        zIndex: 10,
        elevation: 5,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        fontFamily: 'System',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 44,
        backgroundColor: '#F9FAFB',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        fontFamily: 'System',
    },
    
    // Filter Tabs
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        alignItems: 'center',
    },
    activeFilterTab: {
        backgroundColor: '#3B82F6',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
        fontFamily: 'System',
    },
    activeFilterText: {
        color: '#FFFFFF',
    },
    
    // Content
    content: {
        flex: 1,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 100,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    listHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        fontFamily: 'System',
    },
    clearAllText: {
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '500',
        fontFamily: 'System',
    },
    
    // Notification Item
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        ...Platform.select({

          web: {

            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',

          },

          default: {

            shadowColor: '#000',

            shadowOffset: { width: 0, height: 4 },

            shadowOpacity: 0.3,

            shadowRadius: 8,

          },

        }),
        elevation: 1,
    },
    firstNotification: {
        marginTop: 0,
    },
    unreadNotification: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
        borderWidth: 1.5,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        position: 'relative',
    },
    unreadDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    senderName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        fontFamily: 'System',
        flex: 1,
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: 'System',
        marginLeft: 8,
    },
    messageText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        fontFamily: 'System',
    },
    unreadMessageText: {
        color: '#1F2937',
        fontWeight: '500',
    },
    moreButton: {
        padding: 4,
        marginLeft: 8,
    },
    
    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        paddingBottom: 100,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        fontFamily: 'System',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: 'System',
        paddingHorizontal: 40,
    },
    
    // Error State
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#EF4444',
        fontFamily: 'System',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: 'System',
        marginBottom: 24,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'System',
    },
    
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: height * 0.8,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    modalSenderName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        fontFamily: 'System',
        marginBottom: 4,
    },
    modalTime: {
        fontSize: 14,
        color: '#9CA3AF',
        fontFamily: 'System',
        marginBottom: 16,
    },
    modalMessage: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
        fontFamily: 'System',
    },
    modalActions: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    modalButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'System',
    },
});

export default StudentNotification;