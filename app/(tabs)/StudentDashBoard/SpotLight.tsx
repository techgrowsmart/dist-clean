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
import { addFavoriteTeacher, removeFavoriteTeacher, checkFavoriteStatus } from '../../../services/favoriteTeachers';
import { favoritesEvents, FAVORITES_CHANGED_EVENT } from '../../../utils/favoritesEvents';

const { width } = Dimensions.get("window");
const ITEMS_PER_PAGE = 4; // Changed from 9 to 4

const SpotLight = ({ onBack }) => {
    const [allTeachers, setAllTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalSpotlightCount, setTotalSpotlightCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [likedTeachers, setLikedTeachers] = useState<{[key: string]: boolean}>({});

    // Web header state
    const [studentName, setStudentName] = useState<string | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState("Home");
    const [sidebarActiveItem, setSidebarActiveItem] = useState("Home");

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

    // Check favorite status for teachers when they are loaded
    useEffect(() => {
        const checkFavorites = async () => {
            if (allTeachers.length === 0) return;
            
            const likedStatus: {[key: string]: boolean} = {};
            
            for (const teacher of allTeachers) {
                if (teacher.email) {
                    const isFavorited = await checkFavoriteStatus(teacher.email);
                    likedStatus[teacher.email] = isFavorited;
                }
            }
            
            setLikedTeachers(likedStatus);
        };
        
        checkFavorites();
    }, [allTeachers]);

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

    const handleLikePress = async (teacherEmail: string) => {
        const isLiked = likedTeachers[teacherEmail] || false;
        
        try {
            // Optimistic update
            setLikedTeachers(prev => ({
                ...prev, 
                [teacherEmail]: !isLiked
            }));
            
            if (isLiked) {
                await removeFavoriteTeacher(teacherEmail);
            } else {
                await addFavoriteTeacher(teacherEmail);
            }
            
            // Trigger refresh for other components
            favoritesEvents.emit(FAVORITES_CHANGED_EVENT);
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Revert optimistic update on error
            setLikedTeachers(prev => ({
                ...prev, 
                [teacherEmail]: isLiked
            }));
        }
    };


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
                        {/* Simple Page Header - matching My Tuitions */}
                        <View style={styles.pageHeader}>
                            <BackButton onPress={onBack} color="white" />
                            <Ionicons name="star" size={28} color="#1F2937" />
                            <Text style={styles.pageTitle}>Spotlight Teachers</Text>
                        </View>

                        {/* Content */}
                        <View style={styles.contentLayout}>
                            {/* Teachers Grid */}
                            <ScrollView style={styles.teachersContainer} showsVerticalScrollIndicator={false}>
                                {loading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#4A7BF7" />
                                        <Text style={styles.loadingText}>Loading spotlight teachers...</Text>
                                    </View>
                                ) : paginatedData.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="people-outline" size={60} color="#ccc" />
                                        <Text style={styles.emptyText}>No spotlight teachers found</Text>
                                        <Text style={styles.emptySubtext}>Check back later for featured teachers</Text>
                                    </View>
                                ) : (
                                    <View style={styles.teachersGrid}>
                                        {paginatedData.map((item, index) => (
                                            <View key={item.id?.toString() || item.email || `item-${index}`} style={styles.teacherCard}>
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
                                                    activeOpacity={0.8}
                                                >
                                                    <View style={styles.cardImageContainer}>
                                                        <Image source={{ uri: item.profilePic }} style={styles.teacherImage} />
                                                        <TouchableOpacity 
                                                            style={styles.heartButton}
                                                            onPress={(e) => { e.stopPropagation(); handleLikePress(item.email); }}
                                                        >
                                                            <Ionicons 
                                                                name={likedTeachers[item.email] ? 'heart' : 'heart-outline'} 
                                                                size={16} 
                                                                color={likedTeachers[item.email] ? '#FF0000' : '#FFFFFF'} 
                                                            />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <View style={styles.cardBody}>
                                                        <View style={styles.cardHeaderRow}>
                                                            <Text style={styles.tagText}>{item.subject || 'SUBJECT'}</Text>
                                                            <View style={styles.ratingBadge}>
                                                                <FontAwesome name="star" size={12} color="#FFFFFF" />
                                                                <Text style={styles.ratingText}>4.8</Text>
                                                            </View>
                                                        </View>
                                                        <Text style={styles.teacherName}>{item.name || "Unnamed"}</Text>
                                                        <Text style={styles.teacherDesc} numberOfLines={2}>Professional teacher dedicated to student success and excellence in education.</Text>
                                                        <View style={styles.cardFooter}>
                                                            <TouchableOpacity style={styles.reviewBtn}>
                                                                <Text style={styles.reviewBtnText}>Your Review</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </ScrollView>

                            {/* Pagination - matching My Tuitions style */}
                            {!loading && paginatedData.length > 0 && totalPages > 1 && (
                                <View style={styles.pagination}>
                                    <TouchableOpacity
                                        style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                                        onPress={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#ccc" : "#333"} />
                                    </TouchableOpacity>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <TouchableOpacity
                                            key={page}
                                            style={[styles.pageBtn, currentPage === page && styles.pageBtnActive]}
                                            onPress={() => handlePageChange(page)}
                                        >
                                            <Text style={[styles.pageText, currentPage === page && styles.pageTextActive]}>{page}</Text>
                                        </TouchableOpacity>
                                    ))}
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
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Mobile layout
    return (
        <View style={styles.container}>
            {/* Simple Header - matching My Tuitions */}
            <View style={styles.header}>
                <View style={styles.back}>
                    <BackButton size={24} color="#000" onPress={onBack} style={styles.backButton} />
                    <Ionicons name="star" size={24} color="#1F2937" />
                    <Text style={styles.title}>Spotlights</Text>
                </View>
            </View>

            <View style={styles.content}>
                <FlatList
                    data={paginatedData}
                    numColumns={2}
                    keyExtractor={(item, index) => item.id?.toString() || item.email || `item-${index}`}
                    renderItem={({ item, index }) => {
                        let firstSubject = "Basic Subject";
                        try {
                            const tuitions = JSON.parse(item.tuitions || "[]");
                            if (Array.isArray(tuitions) && tuitions.length > 0) {
                                firstSubject = tuitions[0].subject || "Basic Subject";
                            }
                        } catch (error) {
                            console.error("Error parsing tuitions:", error);
                        }

                        const isLiked = likedTeachers[item.email] || false;

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
                                    <View style={styles.mobileImageContainer}>
                                        <Image source={{ uri: item.profilePic }} style={styles.image} />
                                        <TouchableOpacity 
                                            style={styles.mobileLikeBtn}
                                            onPress={(e) => { e.stopPropagation(); handleLikePress(item.email); }}
                                        >
                                            <Ionicons 
                                                name={isLiked ? 'heart' : 'heart-outline'} 
                                                size={18} 
                                                color={isLiked ? '#FF6B6B' : '#fff'} 
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.name} numberOfLines={1}>{item.name || "Unnamed"}</Text>
                                    <Text style={styles.subject} numberOfLines={1}>{firstSubject}</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    }}
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
    mobileImageContainer: { position: 'relative', marginBottom: hp('1%') },
    mobileLikeBtn: { 
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(255,255,255,0.9)',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
    },
    image: { width: wp('28%'), height: wp('28%'), borderRadius: wp('2%') },
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
        padding: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 24
    },
    backButton: {
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#F3F4F6'
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        fontFamily: 'Poppins_700Bold'
    },
    pageSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        marginTop: 4
    },
    spotlightBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#FFA500'
    },
    spotlightBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#C2410C',
        marginLeft: 6
    },
    contentLayout: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 24
    },
    searchSection: {
        marginBottom: 24
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4
    },
    searchIcon: { marginRight: 16 },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        fontFamily: 'Poppins_400Regular'
    },
    teachersContainer: {
        flex: 1,
        marginBottom: 24
    },
    teachersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    teacherCard: {
        width: '31%',
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardImageContainer: {
        width: '100%',
        height: 180,
        position: 'relative',
    },
    teacherImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    heartButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        padding: 6,
    },
    cardBody: {
        padding: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    tagText: {
        color: '#3B5BFE',
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 10,
        letterSpacing: 0.5,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#22C55E',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    ratingText: {
        color: '#FFFFFF',
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 11,
        marginLeft: 4,
    },
    teacherName: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 14,
        color: '#1F2937',
        marginBottom: 4,
    },
    teacherDesc: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 11,
        color: '#6B7280',
        lineHeight: 16,
        marginBottom: 12,
    },
    cardFooter: {
        alignItems: 'flex-end',
    },
    reviewBtn: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    reviewBtnText: {
        color: '#1F2937',
        fontFamily: 'Poppins_500Medium',
        fontSize: 12,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontFamily: 'Poppins_400Regular'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        color: '#666',
        fontFamily: 'Poppins_600SemiBold'
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
        fontFamily: 'Poppins_400Regular'
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        paddingVertical: 24,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    pageBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center'
    },
    pageBtnDisabled: {
        opacity: 0.4
    },
    pageText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
        fontFamily: 'Poppins_600SemiBold'
    },
});