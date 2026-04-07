import { OpenSans_600SemiBold } from "@expo-google-fonts/open-sans";
import BackButton from "../../../components/BackButton";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import axios from "axios";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    SafeAreaView,
    TextInput,
    ActivityIndicator,
    Platform,
} from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import WebNavbar from "../../../components/ui/WebNavbar";
import WebSidebar from "../../../components/ui/WebSidebar";
import ThoughtsCard from "./ThoughtsCard";
import { autoRefreshToken } from '../../../utils/tokenRefresh';

const { width } = Dimensions.get("window");
const ITEMS_PER_PAGE = 4; // Changed from 9 to 4

const SpotLight = ({ onBack }) => {
    const [allTeachers, setAllTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalSpotlightCount, setTotalSpotlightCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // Web header and ThoughtsCard state
    const [studentName, setStudentName] = useState<string | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState("Home");
    const [sidebarActiveItem, setSidebarActiveItem] = useState("Home");
    const [posts, setPosts] = useState<any[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [postComments, setPostComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState<'post' | 'comment'>('post');
    const [reportItemId, setReportItemId] = useState('');
    const [reportReason, setReportReason] = useState('');

    const isDesktop = Platform.OS === 'web' && Dimensions.get('window').width >= 1024;

    const [fontsLoaded] = useFonts({
        'OpenSans-SemiBold': OpenSans_600SemiBold,
    });

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 3;
        
        const fetchTeachers = async () => {
            try {
                const auth = await getAuthData();
                if (!auth || !auth.token) {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        console.log(`Auth not ready, retrying... (${retryCount}/${maxRetries})`);
                        setTimeout(fetchTeachers, 1000); // Retry after 1 second
                        return;
                    }
                    console.error("No auth token after retries");
                    setLoading(false);
                    return;
                }
                
                console.log("Fetching teachers with token");
                const headers = {
                    Authorization: `Bearer ${auth.token}`,
                    "Content-Type": "application/json",
                };

                const response = await axios.post(
                    `${BASE_URL}/api/teachers`,
                    {
                        count: 100,
                        page: 1,
                    },
                    { headers }
                );
                
                const data = response.data;
                console.log("Fetched teachers data:", data);
                
                if (!data || !data.spotlightTeachers) {
                    console.error("Invalid data format received:", data);
                    setLoading(false);
                    return;
                }
                
                const subject = data.spotlightTeachers?.["Subject teacher"] || [];
                if (!Array.isArray(subject)) {
                    console.error("Invalid data format for Subject teachers:", subject);
                    setLoading(false);
                    return;
                }
                
                const uniqueTeachers = Array.from(new Map(subject.map(item => [item.email, item])).values());
                setAllTeachers(uniqueTeachers);
                setTotalSpotlightCount(uniqueTeachers.length);

            } catch (error) {
                console.error("Failed to fetch teachers:", error);
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Retrying fetch... (${retryCount}/${maxRetries})`);
                    setTimeout(fetchTeachers, 1500);
                    return;
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTeachers();
    }, []);

    const totalPages = Math.ceil(totalSpotlightCount / ITEMS_PER_PAGE);
    
    // Calculate paginated data based on current page
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedData = allTeachers.slice(startIndex, endIndex);

    // Thanksgiving offer - COMMENTED OUT
    // const offerIndex = 4;
    // const paginatedDataWithOffer = [...paginatedData];
    // if (paginatedData.length > offerIndex) {
    //     paginatedDataWithOffer.splice(offerIndex, 0, {
    //         type: "offer",
    //         id: "offer-banner",
    //     });
    // }

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const renderPagination = () => (
        <View style={styles.paginationWrapper}>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.pagination}
                style={{ overflow: 'visible' }}
            >
                <TouchableOpacity
                    onPress={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={styles.arrows}
                >
                    <Text style={styles.arrowText}>{'<'}</Text>
                </TouchableOpacity>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <TouchableOpacity key={page} onPress={() => handlePageChange(page)} style={styles.page}>
                        <View style={[styles.pageNumber, currentPage === page && styles.activePage]}>
                            <Text style={styles.pageNum}>
                                {page}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    onPress={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={styles.rightArrow}
                >
                    <Text style={styles.arrowText}>{'>'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );

    const renderItem = ({ item, index }) => {
        // Thanksgiving offer rendering - COMMENTED OUT
        // if (item.type === "offer") {
        //     return (
        //         <View style={[styles.offerContainer, { width: '100%' }]}>
        //             <View style={{ marginTop: 20 }}>
        //                 <Text style={styles.thanksTitle}>🎉 Thanksgiving is Coming!</Text>
        //                 <Text style={styles.thanksDescription}>
        //                     Get up to 50% off every course. Keep learning daily and grow your
        //                     skills. Don't miss it!
        //                 </Text>
        //             </View>
        //         </View>
        //     );
        // }

        let firstSubject = "Basic Subject";
        try {
            const tuitions = JSON.parse(item.tuitions || "[]");
            if (Array.isArray(tuitions) && tuitions.length > 0) {
                firstSubject = tuitions[0].subject || "Basic Subject";
            }
        } catch (error) {
            console.error("Error parsing tuitions:", error);
        }

        return (
            <View style={styles.card}>
                <TouchableOpacity
                    onPress={() => {
                        router.push({
                            pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
                            params: {
                                name: item.name,
                                email: item.email,
                                board: item.board,
                                subject: item.subject,
                                language: item.language,
                                profilePic: item.profilePic,
                            },
                        });
                    }}
                    style={styles.touchableContainer}
                >
                    <Image source={{ uri: item.profilePic }} style={styles.image} />
                    <Text style={styles.name} numberOfLines={1}>{item.name || "Unnamed"}</Text>
                    <Text style={styles.subject} numberOfLines={1}>{firstSubject}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // Helper functions for web functionality
    const handleSidebarItemPress = (itemName: string) => {
        setSidebarActiveItem(itemName);
        if (itemName === "Home") router.push("/(tabs)/StudentDashBoard/Student");
        if (itemName === "My Tuitions") router.push("/(tabs)/StudentDashBoard/MyTuitions");
        if (itemName === "Connect") router.push("/(tabs)/StudentDashBoard/ConnectWeb");
        if (itemName === "Profile") router.push("/(tabs)/StudentDashBoard/Profile");
        if (itemName === "Billing") router.push({ pathname: "/(tabs)/Billing", params: { userEmail, userType: userRole } });
        if (itemName === "Faq") router.push("/(tabs)/StudentDashBoard/Faq");
        if (itemName === "Share") router.push({ pathname: "/(tabs)/StudentDashBoard/Share", params: { userEmail, studentName, profileImage } });
        if (itemName === "Subscription") router.push({ pathname: "/(tabs)/StudentDashBoard/Subscription", params: { userEmail } });
        if (itemName === "Terms") router.push("/(tabs)/StudentDashBoard/TermsAndConditions");
        if (itemName === "Contact Us") router.push("/(tabs)/Contact");
        if (itemName === "Privacy Policy") router.push("/(tabs)/StudentDashBoard/PrivacyPolicy");
        if (itemName === "Log out") { 
            AsyncStorage.clear(); 
            router.push("/login"); 
        }
    };

    const formatTimeAgo = (dateString?: string): string => {
        if (!dateString) return 'Just now';
        if (typeof dateString === 'string' && dateString.includes('ago')) return dateString;
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Just now';
        const diff = Date.now() - date.getTime();
        if (diff < 0) return 'Just now';
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        const days = Math.floor(hrs / 24);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} min. ago`;
        if (hrs < 24) return `${hrs}h ago`;
        return `${days}d ago`;
    };

    const initials = (name: string) =>
        name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2) || '?';

    const getProfileImageSource = (profilePic?: string) => {
        if (!profilePic || ['', 'null', 'undefined'].includes(profilePic)) return null;
        if (typeof profilePic === 'string') {
            if (profilePic.startsWith('http') || profilePic.startsWith('file://')) return { uri: profilePic };
            const clean = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
            return { uri: `${BASE_URL}/${clean}` };
        }
        return null;
    };

    const resolvePostAuthor = (post: any) => {
        const cached = userProfileCache.get(post.author.email) || { name: '', profilePic: '' };
        let name = cached.name || post.author.name || '';
        let pic: string | null = cached.profilePic || post.author.profile_pic || null;
        if (!name || name === 'null' || name.includes('@')) name = post.author.email?.split('@')[0] || 'User';
        if (pic && !pic.startsWith('http') && !pic.startsWith('/')) pic = `/${pic}`;
        if (pic === '' || pic === 'null') pic = null;
        return { name, pic, role: post.author.role || 'User' };
    };

    const handleLike = (postId: string) => {
        setPosts(prevPosts => 
            prevPosts.map(post => 
                post.id === postId 
                    ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
                    : post
            )
        );
    };

    const openCommentsModal = (post: any) => {
        setSelectedPost(post);
        setShowCommentsModal(true);
    };

    // ThoughtsCard functionality (simplified)
    useEffect(() => {
        if (Platform.OS === 'web' && isDesktop) {
            // Load mock posts for web
            setPosts([
                {
                    id: '1',
                    author: { email: 'teacher1@example.com', name: 'John Doe', role: 'Teacher', profile_pic: '' },
                    content: 'Great teaching experience today!',
                    likes: 12,
                    createdAt: new Date().toISOString(),
                    isLiked: false
                },
                {
                    id: '2',
                    author: { email: 'teacher2@example.com', name: 'Jane Smith', role: 'Teacher', profile_pic: '' },
                    content: 'Students are making amazing progress.',
                    likes: 8,
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    isLiked: true
                }
            ]);
            setPostsLoading(false);
        }
    }, [isDesktop]);

    // Web layout with header, sidebar, and ThoughtsCard
    if (Platform.OS === 'web' && isDesktop) {
        return (
            <SafeAreaView style={styles.webContainer}>
                <WebNavbar
                    studentName={studentName || 'Student'}
                    profileImage={profileImage}
                />
                <View style={styles.rootContainer}>
                    <WebSidebar
                        activeItem={sidebarActiveItem}
                        onItemPress={handleSidebarItemPress}
                        userEmail={userEmail || ''}
                        studentName={studentName || 'Student'}
                        profileImage={profileImage}
                    />
                    <View style={styles.mainLayout}>
                        {/* Page Header */}
                        <View style={styles.pageHeader}>
                            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#333" />
                            </TouchableOpacity>
                            <View>
                                <Text style={styles.pageTitle}>Spotlight Teachers</Text>
                                <Text style={styles.pageSubtitle}>Subject Teachers</Text>
                            </View>
                            <View style={styles.spotlightBadge}>
                                <Ionicons name="star" size={16} color="#856404" />
                                <Text style={styles.spotlightBadgeText}>Spotlight</Text>
                            </View>
                        </View>

                        {/* Content */}
                        <View style={styles.contentColumns}>
                            <View style={styles.centerContent}>
                                {/* Search Bar */}
                                <View style={styles.searchSection}>
                                    <View style={styles.searchBar}>
                                        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Search teachers..."
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                </View>

                                {/* Teachers Grid */}
                                <ScrollView style={styles.teachersContainer} showsVerticalScrollIndicator={false}>
                                    <View style={styles.teachersGrid}>
                                        {paginatedData.map((item, index) => (
                                            <View key={item.id?.toString() || item.email || `item-${index}`} style={styles.teacherCard}>
                                                <View style={styles.teacherHeader}>
                                                    <Image source={{ uri: item.profilePic }} style={styles.teacherImage} />
                                                    <View style={styles.teacherOverlay}>
                                                        <View style={styles.spotlightIcon}>
                                                            <Ionicons name="star" size={16} color="#fff" />
                                                        </View>
                                                        <TouchableOpacity style={styles.likeBtn}>
                                                            <Ionicons name="heart-outline" size={16} color="#FF6B6B" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                                <View style={styles.teacherInfo}>
                                                    <Text style={styles.teacherName}>{item.name || "Unnamed"}</Text>
                                                    <Text style={styles.teacherSpecialty}>Subject Teacher</Text>
                                                    <View style={styles.teacherMeta}>
                                                        <View style={styles.rating}>
                                                            <Ionicons name="star" size={12} color="#FFA500" />
                                                            <Text style={styles.ratingText}>4.8</Text>
                                                            <Text style={styles.reviewsText}>(124)</Text>
                                                        </View>
                                                        <Text style={styles.experience}>5+ years</Text>
                                                    </View>
                                                    <Text style={styles.teacherDescription}>
                                                        {item.description || 'Experienced subject teacher dedicated to student success'}
                                                    </Text>
                                                    <View style={styles.achievements}>
                                                        <Text style={styles.achievementsTitle}>Achievements</Text>
                                                        <View style={styles.achievementBadge}>
                                                            <Ionicons name="trophy" size={12} color="#856404" />
                                                            <Text style={styles.achievementText}>Top Rated</Text>
                                                        </View>
                                                    </View>
                                                    <View style={styles.teacherFooter}>
                                                        <Text style={styles.teacherPrice}>₹{item.charge || '500'}/hr</Text>
                                                        <View style={styles.teacherActions}>
                                                            <TouchableOpacity style={styles.viewProfileBtn}>
                                                                <Text style={styles.viewProfileBtnText}>View Profile</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity 
                                                                style={styles.bookBtn}
                                                                onPress={() => {
                                                                    router.push({
                                                                        pathname: "/(tabs)/StudentDashBoard/BookClass",
                                                                        params: {
                                                                            name: item.name,
                                                                            email: item.email,
                                                                            board: item.board,
                                                                            subject: item.subject,
                                                                            language: item.language,
                                                                            profilePic: item.profilePic,
                                                                        },
                                                                    });
                                                                }}
                                                            >
                                                                <Text style={styles.bookBtnText}>Book</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <View style={styles.pagination}>
                                        <TouchableOpacity
                                            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                                            onPress={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#ccc" : "#333"} />
                                        </TouchableOpacity>
                                        <Text style={styles.pageText}>
                                            Page {currentPage} of {totalPages}
                                        </Text>
                                        <TouchableOpacity
                                            style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                                            onPress={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? "#ccc" : "#333"} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Right: Thoughts Panel */}
                            <View style={styles.rightPanel}>
                                <Text style={styles.rightPanelTitle}>Thoughts</Text>
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.thoughtsList}>
                                    {postsLoading && posts.length === 0 && <ActivityIndicator color="#4A7BF7" style={{ marginTop: 30 }} />}
                                    {!postsLoading && posts.length === 0 && (
                                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                            <Ionicons name="apps-outline" size={40} color="#ccc" />
                                            <Text style={{ color: '#aaa', marginTop: 12, fontFamily: 'Poppins_400Regular' }}>No thoughts yet</Text>
                                        </View>
                                    )}
                                    {posts.map((post) => (
                                        <ThoughtsCard
                                            key={post.id}
                                            post={post}
                                            onLike={handleLike}
                                            onComment={openCommentsModal}
                                            onReport={(p) => { setReportType('post'); setReportItemId(p.id); setReportReason(''); setShowReportModal(true); }}
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Mobile layout
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.back}>
                    <BackButton size={24} color="#000" onPress={onBack} style={styles.backButton} />
                    <Text style={styles.title}>Spotlights</Text>
                </View>
                <Text style={styles.totalCount}>{totalSpotlightCount} Found</Text>
            </View>

            <View style={styles.content}>
                <FlatList
                    data={paginatedData} // Changed from paginatedDataWithOffer to paginatedData
                    numColumns={2}
                    keyExtractor={(item, index) => item.id?.toString() || item.email || `item-${index}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                />
            </View>

            {totalPages > 1 && renderPagination()}
        </View>
    );
};

export default SpotLight;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 20, paddingBottom: hp("18%") },
    content: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", marginBottom: hp('2.15%'), justifyContent: "space-between" },
    backButton: { width: wp('12.8%'), height: wp('12.8%'), alignItems: "center", justifyContent: "center", borderRadius: wp('6.4%'), padding: wp("1.04%"), backgroundColor: "#f5f6f8" },
    back: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start" },
    title: { fontSize: wp('4.27%'), fontWeight: "600", marginLeft: wp('2.4%'), color: "#0d0c12" },
    totalCount: { fontSize: wp('3.73%'), color: "#4255ff", textAlign: "right" },
    grid: { paddingHorizontal: wp('2%'), paddingBottom: 16 },
    columnWrapper: { justifyContent: "space-between", gap: wp('2%') },
    card: { 
        backgroundColor: "#ffffff", 
        borderWidth: 1,
        borderColor: "#edeeee",
        borderRadius: wp('4%'),
        alignItems: "center", 
        paddingVertical: hp('2%'),
        marginBottom: hp('1.5%'),
        flex: 1,
        maxWidth: wp('46%'),
    },
    touchableContainer: { width: '100%', alignItems: 'center' },
    image: { width: wp('28%'), height: wp('28%'), borderRadius: wp('2%'), marginBottom: hp('1%') },
    name: { fontSize: wp('3.8%'), textAlign: "center", fontFamily: "OpenSans_400Regular", width: '90%', marginBottom: hp('0.5%') },
    subject: { fontSize: wp('3.2%'), color: 'rgba(27,27,27,0.6)', textAlign: "center", lineHeight: hp('2%'), width: '90%' },
    paginationWrapper: { 
        position: 'absolute', 
        bottom: hp('13%'),
        left: 0,
        right: 0,
        width: "100%", 
        alignItems: "center", 
        justifyContent: "center", 
        paddingVertical: hp("2%"),
        backgroundColor: '#fff',
    },
    pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: hp("1.34%"), gap: wp("2%"), overflow: 'visible' },
    page: { alignItems: "center", justifyContent: "center", overflow: 'visible' },
    pageNumber: { alignItems: "center", justifyContent: "center", height: wp("8%"), width: wp("8%"), paddingHorizontal: wp("2.13%"), borderRadius: 5, backgroundColor: "#ffffff", marginHorizontal: 0, boxShadow: "0px 4px 35px 4px rgba(0,0,0,0.25)" },
    pageNum: { fontSize: wp("4.27%"), color: "#000000ff", fontFamily: 'OpenSans-SemiBold' },
    activePage: { color: "#000000", elevation: 1 },
    arrowText: { fontSize: wp("5%"), color: "#000000", fontFamily: 'OpenSans-SemiBold', textAlign: 'center', fontWeight: '600' },
    arrows: { height: wp("8%"), width: wp("8%"), alignItems: "center", justifyContent: "center", borderRadius: wp("1.33%"), backgroundColor: "#ffffff", marginHorizontal: wp("1.06%"), elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, boxShadow: "0px 4px 35px 4px rgba(0,0,0,0.25)" },
    rightArrow: { height: wp("8%"), width: wp("8%"), alignItems: "center", justifyContent: "center", borderRadius: wp("1.33%"), backgroundColor: "#ffffff", marginHorizontal: wp("1.06%"), elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, boxShadow: "0px 4px 35px 4px rgba(0,0,0,0.25)" },
    // Thanksgiving styles - kept for future use
    offerContainer: { backgroundColor: "#663259", padding: wp('4%'), justifyContent: "center", marginBottom: hp('2.69%'), width: '100%', borderRadius: wp('2%') },
    thanksTitle: { color: "#fff", fontSize: wp('4.5%'), fontWeight: "bold", marginBottom: hp('1.08%'), fontFamily: "OpenSans_300Light" },
    thanksDescription: { color: "rgba(255,255,255,0.6)", fontFamily: "OpenSans_300Light", fontSize: wp('3.1%'), lineHeight: wp('5.5%') },
    
    // Web styles
    webContainer: { flex: 1, backgroundColor: '#F5F7FB' },
    rootContainer: { flex: 1, flexDirection: 'row' },
    mainLayout: { flex: 1, backgroundColor: '#F5F7FB' },
    pageHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 20
    },
    backButton: { 
        padding: 8, 
        borderRadius: 8, 
        backgroundColor: '#F3F4F6'
    },
    pageTitle: { 
        fontSize: 24, 
        fontWeight: '600', 
        color: '#1F2937',
        fontFamily: 'Poppins_600SemiBold'
    },
    pageSubtitle: { 
        fontSize: 14, 
        color: '#6B7280',
        marginTop: 2
    },
    spotlightBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F59E0B'
    },
    spotlightBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400E',
        marginLeft: 4
    },
    contentColumns: { 
        flex: 1, 
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 20
    },
    centerContent: { 
        flex: 1,
        maxWidth: 800
    },
    searchSection: { 
        marginBottom: 20 
    },
    searchBar: { 
        flexDirection: 'row', 
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
    },
    searchIcon: { marginRight: 12 },
    searchInput: { 
        flex: 1, 
        fontSize: 16,
        color: '#1F2937',
        fontFamily: 'Poppins_400Regular'
    },
    teachersContainer: { 
        flex: 1,
        marginBottom: 20
    },
    teachersGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap',
        gap: 16
    },
    teacherCard: { 
        width: '48%', 
        backgroundColor: '#fff', 
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    teacherHeader: { 
        position: 'relative',
        height: 120,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden'
    },
    teacherImage: { 
        width: '100%', 
        height: '100%',
        resizeMode: 'cover'
    },
    teacherOverlay: { 
        position: 'absolute', 
        top: 8, 
        right: 8,
        flexDirection: 'row',
        gap: 8
    },
    spotlightIcon: { 
        backgroundColor: '#F59E0B', 
        width: 32, 
        height: 32, 
        borderRadius: 16,
        alignItems: 'center', 
        justifyContent: 'center'
    },
    likeBtn: { 
        backgroundColor: 'rgba(255,255,255,0.9)', 
        width: 32, 
        height: 32, 
        borderRadius: 16,
        alignItems: 'center', 
        justifyContent: 'center'
    },
    teacherInfo: { 
        padding: 16 
    },
    teacherName: { 
        fontSize: 18, 
        fontWeight: '600', 
        color: '#1F2937',
        fontFamily: 'Poppins_600SemiBold',
        marginBottom: 4
    },
    teacherSpecialty: { 
        fontSize: 14, 
        color: '#6B7280',
        marginBottom: 12
    },
    teacherMeta: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    rating: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    ratingText: { 
        fontSize: 14, 
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: 4
    },
    reviewsText: { 
        fontSize: 12, 
        color: '#6B7280',
        marginLeft: 4
    },
    experience: { 
        fontSize: 12, 
        color: '#059669',
        fontWeight: '500'
    },
    teacherDescription: { 
        fontSize: 14, 
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 12
    },
    achievements: { 
        marginBottom: 12 
    },
    achievementsTitle: { 
        fontSize: 12, 
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 6
    },
    achievementBadge: { 
        flexDirection: 'row', 
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start'
    },
    achievementText: { 
        fontSize: 10, 
        fontWeight: '600',
        color: '#92400E',
        marginLeft: 4
    },
    teacherFooter: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    teacherPrice: { 
        fontSize: 18, 
        fontWeight: '700',
        color: '#059669'
    },
    teacherActions: { 
        flexDirection: 'row', 
        gap: 8 
    },
    viewProfileBtn: { 
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8
    },
    viewProfileBtnText: { 
        fontSize: 12, 
        fontWeight: '600',
        color: '#4B5563'
    },
    bookBtn: { 
        backgroundColor: '#3B5BFE',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8
    },
    bookBtnText: { 
        fontSize: 12, 
        fontWeight: '600',
        color: '#fff'
    },
    pagination: { 
        flexDirection: 'row', 
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        paddingVertical: 20
    },
    pageBtn: { 
        width: 40, 
        height: 40,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center'
    },
    pageBtnDisabled: { 
        opacity: 0.5 
    },
    pageText: { 
        fontSize: 14, 
        fontWeight: '500',
        color: '#6B7280'
    },
    rightPanel: { 
        width: 320, 
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 'fit-content',
        maxHeight: 'calc(100vh - 200px)'
    },
    rightPanelTitle: { 
        fontSize: 18, 
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 16,
        fontFamily: 'Poppins_600SemiBold'
    },
    thoughtsList: { 
        gap: 12 
    },
});