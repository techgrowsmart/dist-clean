import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Platform,
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    ImageBackground,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import BackButton from "../../../components/BackButton";
import WebNavbar from '../../../components/ui/WebNavbar';
import WebSidebar from '../../../components/ui/WebSidebar';
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import ThoughtsCard from './ThoughtsCard';

const { width } = Dimensions.get("window");

// --- Post Interface for ThoughtsCard ---
interface Post {
  id: string;
  author: { email: string; name: string; role: string; profile_pic: string; };
  content: string;
  likes: number;
  comments?: any[];
  createdAt: string;
  tags?: string[];
  postImage?: string;
  postImages?: string[];
  isLiked?: boolean;
}

interface Comment {
  id: string; 
  author: { email: string; name: string; role: string; profile_pic: string; };
  content: string; 
  likes: number; 
  createdAt: string; 
  isLiked?: boolean;
}

// --- Constants & Colors ---
const COLORS = {
  primary: '#3B5BFE',
  background: '#F5F7FB',
  cardBackground: '#FFFFFF',
  border: '#E5E7EB',
  blueBorder: '#D4DEFF', 
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  tagBg: '#C7D2FE',
  tagTxt: '#1F2937',
  paginationActiveBg: '#374151',
  paginationInactiveBg: '#E5E7EB',
  paginationInactiveTxt: '#6B7280',
  headerTxt: '#000000',
};

// --- Board Data Interface ---
interface BoardData {
  board: string;
  boardname: string;
  name?: string; // Added for compatibility with existing code
  fullName?: string; // Added for compatibility with existing code
  id?: string;
  count?: number;
  image?: any;
  logo?: string;
  color?: string;
  teacherCount?: number;
  description?: string;
  headquarters?: string;
  established?: string;
}

export default function AllBoardsPage({ onBack, onBoardSelect, category = "Subject teacher" }: {
  onBack?: () => void;
  onBoardSelect?: (boardName: string, boardId: string) => void;
  category?: string;
}) {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [boards, setBoards] = useState<BoardData[]>([]);
  const [filteredBoards, setFilteredBoards] = useState<BoardData[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSidebarItem, setActiveSidebarItem] = useState('All Boards');
  const [studentName, setStudentName] = useState('Student');
  const [profileImage, setProfileImage] = useState(null);
  const [storedUserEmail, setStoredUserEmail] = useState(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // ThoughtsCard states
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'post' | 'comment'>('post');
  const [reportItemId, setReportItemId] = useState('');
  const [reportReason, setReportReason] = useState('');

  const handleSidebarItemPress = (itemName: string) => {
    setActiveSidebarItem(itemName);
    if (itemName === "Home") router.push("/(tabs)/StudentDashBoard/Student");
    if (itemName === "My Tuitions") router.push("/(tabs)/StudentDashBoard/MyTuitions");
    if (itemName === "Connect") router.push("/(tabs)/StudentDashBoard/ConnectWeb");
    if (itemName === "Profile") router.push("/(tabs)/StudentDashBoard/Profile");
    if (itemName === "Billing") router.push({ pathname: "/(tabs)/Billing", params: { userEmail: storedUserEmail, userType: userRole } });
    if (itemName === "Faq") router.push("/(tabs)/StudentDashBoard/Faq");
    if (itemName === "Share") router.push({ pathname: "/(tabs)/StudentDashBoard/Share", params: { userEmail: storedUserEmail, studentName, profileImage } });
    if (itemName === "Subscription") router.push({ pathname: "/(tabs)/StudentDashBoard/Subscription", params: { userEmail: storedUserEmail } });
    if (itemName === "Terms") router.push("/(tabs)/StudentDashBoard/TermsAndConditions");
    if (itemName === "Contact Us") router.push("/(tabs)/Contact");
    if (itemName === "Privacy Policy") router.push("/(tabs)/StudentDashBoard/PrivacyPolicy");
    if (itemName === "Log out") { AsyncStorage.clear(); router.push("/login"); }
  };

  const boardsPerPage = Platform.OS === 'web' ? 6 : 4;
  const totalPages = Math.ceil(filteredBoards.length / boardsPerPage);
  const startIndex = (currentPage - 1) * boardsPerPage;
  const currentBoards = filteredBoards.slice(startIndex, startIndex + boardsPerPage);

  // Helper functions for ThoughtsCard
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

  const resolvePostAuthor = (post: Post) => {
    const cached = userProfileCache.get(post.author.email) || { name: '', profilePic: '' };
    let name = cached.name || post.author.name || '';
    let pic: string | null = cached.profilePic || post.author.profile_pic || null;
    if (!name || name === 'null' || name.includes('@')) name = post.author.email?.split('@')[0] || 'User';
    if (pic && !pic.startsWith('http') && !pic.startsWith('/')) pic = `/${pic}`;
    if (pic === '' || pic === 'null') pic = null;
    return { name, pic, role: post.author.role || 'User' };
  };

  // Fetch boards from API
  const fetchBoards = useCallback(async () => {
    try {
      setBoardsLoading(true);
      const auth = await getAuthData();
      
      // Always use comprehensive boards data with All Universities and all major Indian boards
      console.log("📚 Using comprehensive boards data for all users");
      const mockBoards: BoardData[] = [
          // All Universities - First
          { board: "All Universities", boardname: "All Universities", name: "All Universities", fullName: "All Universities", id: '0', teacherCount: 3500, description: "All universities and higher education institutions", headquarters: "Pan India", established: "Various", color: '#6C5CE7', logo: 'https://ui-avatars.com/api/?name=All+Universities&background=F5F7FB&color=3B5BFE&rounded=true&size=150' },
          
          // National Boards
          { board: "CBSE", boardname: "Central Board of Secondary Education", name: "CBSE", fullName: "Central Board of Secondary Education", id: '1', teacherCount: 1250, description: "India's largest education board", headquarters: "New Delhi", established: "1962", color: '#FF6B6B', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/CBSE_logo.svg/2560px-CBSE_logo.svg.png' },
          { board: "ICSE", boardname: "Indian Certificate of Secondary Education", name: "ICSE", fullName: "Indian Certificate of Secondary Education", id: '2', teacherCount: 890, description: "Comprehensive education system", headquarters: "New Delhi", established: "1958", color: '#4ECDC4', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/CISCE_logo.png/2560px-CISCE_logo.png' },
          { board: "NIOS", boardname: "National Institute of Open Schooling", name: "NIOS", fullName: "National Institute of Open Schooling", id: '3', teacherCount: 450, description: "Open schooling system", headquarters: "Noida", established: "1989", color: '#9B59B6', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/Nios_logo.svg/2560px-Nios_logo.svg.png' },
          { board: "IB", boardname: "International Baccalaureate", name: "IB", fullName: "International Baccalaureate", id: '4', teacherCount: 320, description: "International education foundation", headquarters: "Geneva", established: "1968", color: '#3498DB', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/55/IB_logo.svg/2560px-IB_logo.svg.png' },
          { board: "CAIE", boardname: "Cambridge Assessment International Education", name: "Cambridge", fullName: "Cambridge Assessment International Education", id: '5', teacherCount: 280, description: "International examination board", headquarters: "Cambridge", established: "1858", color: '#E74C3C', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Cambridge_Assessment_Logo.svg/2560px-Cambridge_Assessment_Logo.svg.png' },
          
          // State Boards - North India
          { board: "UP Board", boardname: "Uttar Pradesh Board of Secondary Education", name: "UP Board", fullName: "Uttar Pradesh Board of Secondary Education", id: '6', teacherCount: 980, description: "Uttar Pradesh state education board", headquarters: "Prayagraj", established: "1921", color: '#FF9F43', logo: 'https://ui-avatars.com/api/?name=UP+Board&background=FFF3E0&color=FF9F43&rounded=true&size=150' },
          { board: "BSEB", boardname: "Bihar School Examination Board", name: "BSEB", fullName: "Bihar School Examination Board", id: '7', teacherCount: 750, description: "Bihar state education board", headquarters: "Patna", established: "1952", color: '#6C5CE7', logo: 'https://ui-avatars.com/api/?name=BSEB&background=F3E5F5&color=6C5CE7&rounded=true&size=150' },
          { board: "HPBOSE", boardname: "Himachal Pradesh Board of School Education", name: "HPBOSE", fullName: "Himachal Pradesh Board of School Education", id: '8', teacherCount: 420, description: "Himachal Pradesh state education board", headquarters: "Dharamshala", established: "1969", color: '#00B894', logo: 'https://ui-avatars.com/api/?name=HPBOSE&background=E8F8F5&color=00B894&rounded=true&size=150' },
          { board: "JKBOSE", boardname: "Jammu and Kashmir Board of School Education", name: "JKBOSE", fullName: "Jammu and Kashmir Board of School Education", id: '9', teacherCount: 380, description: "Jammu & Kashmir education board", headquarters: "Srinagar/Jammu", established: "1975", color: '#0984E3', logo: 'https://ui-avatars.com/api/?name=JKBOSE&background=EBF5FB&color=0984E3&rounded=true&size=150' },
          { board: "PSEB", boardname: "Punjab School Education Board", name: "PSEB", fullName: "Punjab School Education Board", id: '10', teacherCount: 520, description: "Punjab state education board", headquarters: "Mohali", established: "1969", color: '#F39C12', logo: 'https://ui-avatars.com/api/?name=PSEB&background=FEF5E7&color=F39C12&rounded=true&size=150' },
          { board: "RBSE", boardname: "Rajasthan Board of Secondary Education", name: "RBSE", fullName: "Rajasthan Board of Secondary Education", id: '11', teacherCount: 680, description: "Rajasthan state education board", headquarters: "Ajmer", established: "1957", color: '#E67E22', logo: 'https://ui-avatars.com/api/?name=RBSE&background=FAF2E6&color=E67E22&rounded=true&size=150' },
          { board: "UK Board", boardname: "Uttarakhand Board of School Education", name: "UK Board", fullName: "Uttarakhand Board of School Education", id: '12', teacherCount: 340, description: "Uttarakhand state education board", headquarters: "Ramnagar", established: "2001", color: '#16A085', logo: 'https://ui-avatars.com/api/?name=UK+Board&background=E8F6F3&color=16A085&rounded=true&size=150' },
          { board: "Haryana Board", boardname: "Board of School Education Haryana", name: "Haryana Board", fullName: "Board of School Education Haryana", id: '13', teacherCount: 460, description: "Haryana state education board", headquarters: "Bhiwani", established: "1969", color: '#8E44AD', logo: 'https://ui-avatars.com/api/?name=HBSE&background=F4ECF7&color=8E44AD&rounded=true&size=150' },
          { board: "Delhi Board", boardname: "Delhi Board of Secondary and Senior Secondary Education", name: "Delhi Board", fullName: "Delhi Board of Secondary and Senior Secondary Education", id: '14', teacherCount: 290, description: "Delhi state education board", headquarters: "Delhi", established: "2021", color: '#2ECC71', logo: 'https://ui-avatars.com/api/?name=DBSE&background=EAF2F8&color=2ECC71&rounded=true&size=150' },
          { board: "Chandigarh Board", boardname: "Chandigarh Education Board", name: "Chandigarh Board", fullName: "Chandigarh Education Board", id: '15', teacherCount: 180, description: "Chandigarh education board", headquarters: "Chandigarh", established: "2021", color: '#34495E', logo: 'https://ui-avatars.com/api/?name=CEB&background=EAEDF2&color=34495E&rounded=true&size=150' },
          
          // State Boards - East India
          { board: "WBBSE", boardname: "West Bengal Board of Secondary Education", name: "WBBSE", fullName: "West Bengal Board of Secondary Education", id: '16', teacherCount: 720, description: "West Bengal secondary education board", headquarters: "Kolkata", established: "1951", color: '#E74C3C', logo: 'https://ui-avatars.com/api/?name=WBBSE&background=FDEDDD&color=E74C3C&rounded=true&size=150' },
          { board: "WBCHSE", boardname: "West Bengal Council of Higher Secondary Education", name: "WBCHSE", fullName: "West Bengal Council of Higher Secondary Education", id: '17', teacherCount: 580, description: "West Bengal higher secondary board", headquarters: "Kolkata", established: "1975", color: '#C0392B', logo: 'https://ui-avatars.com/api/?name=WBCHSE&background=FADBD8&color=C0392B&rounded=true&size=150' },
          { board: "BSE Odisha", boardname: "Board of Secondary Education Odisha", name: "BSE Odisha", fullName: "Board of Secondary Education Odisha", id: '18', teacherCount: 540, description: "Odisha state education board", headquarters: "Cuttack", established: "1955", color: '#D35400', logo: 'https://ui-avatars.com/api/?name=BSE+Odisha&background=FAE5DD&color=D35400&rounded=true&size=150' },
          { board: "CHSE Odisha", boardname: "Council of Higher Secondary Education Odisha", name: "CHSE Odisha", fullName: "Council of Higher Secondary Education Odisha", id: '19', teacherCount: 420, description: "Odisha higher secondary board", headquarters: "Bhubaneswar", established: "1982", color: '#E67E22', logo: 'https://ui-avatars.com/api/?name=CHSE+Odisha&background=FAF2E6&color=E67E22&rounded=true&size=150' },
          { board: "JAC", boardname: "Jharkhand Academic Council", name: "JAC", fullName: "Jharkhand Academic Council", id: '20', teacherCount: 380, description: "Jharkhand state education board", headquarters: "Ranchi", established: "2000", color: '#27AE60', logo: 'https://ui-avatars.com/api/?name=JAC&background=E8F8F5&color=27AE60&rounded=true&size=150' },
          { board: "TBSE", boardname: "Tripura Board of Secondary Education", name: "TBSE", fullName: "Tripura Board of Secondary Education", id: '21', teacherCount: 260, description: "Tripura state education board", headquarters: "Agartala", established: "1973", color: '#2980B9', logo: 'https://ui-avatars.com/api/?name=TBSE&background=EBF5FB&color=2980B9&rounded=true&size=150' },
          { board: "MBOSE", boardname: "Meghalaya Board of School Education", name: "MBOSE", fullName: "Meghalaya Board of School Education", id: '22', teacherCount: 220, description: "Meghalaya state education board", headquarters: "Tura", established: "1974", color: '#8E44AD', logo: 'https://ui-avatars.com/api/?name=MBOSE&background=F4ECF7&color=8E44AD&rounded=true&size=150' },
          { board: "NBSE", boardname: "Nagaland Board of School Education", name: "NBSE", fullName: "Nagaland Board of School Education", id: '23', teacherCount: 180, description: "Nagaland state education board", headquarters: "Kohima", established: "1974", color: '#16A085', logo: 'https://ui-avatars.com/api/?name=NBSE&background=E8F6F3&color=16A085&rounded=true&size=150' },
          { board: "COHSEM", boardname: "Council of Higher Secondary Education Manipur", name: "COHSEM", fullName: "Council of Higher Secondary Education Manipur", id: '24', teacherCount: 200, description: "Manipur higher secondary board", headquarters: "Imphal", established: "1992", color: '#C0392B', logo: 'https://ui-avatars.com/api/?name=COHSEM&background=FADBD8&color=C0392B&rounded=true&size=150' },
          { board: "BSEM", boardname: "Board of Secondary Education Manipur", name: "BSEM", fullName: "Board of Secondary Education Manipur", id: '25', teacherCount: 190, description: "Manipur secondary education board", headquarters: "Imphal", established: "1972", color: '#E74C3C', logo: 'https://ui-avatars.com/api/?name=BSEM&background=FDEDDD&color=E74C3C&rounded=true&size=150' },
          
          // State Boards - West India
          { board: "GSEB", boardname: "Gujarat Secondary and Higher Secondary Education Board", name: "GSEB", fullName: "Gujarat Secondary and Higher Secondary Education Board", id: '26', teacherCount: 820, description: "Gujarat state education board", headquarters: "Gandhinagar", established: "1960", color: '#F39C12', logo: 'https://ui-avatars.com/api/?name=GSEB&background=FEF5E7&color=F39C12&rounded=true&size=150' },
          { board: "MSBSHSE", boardname: "Maharashtra State Board of Secondary and Higher Secondary Education", name: "MSBSHSE", fullName: "Maharashtra State Board of Secondary and Higher Secondary Education", id: '27', teacherCount: 1150, description: "Maharashtra state education board", headquarters: "Pune", established: "1965", color: '#2ECC71', logo: 'https://ui-avatars.com/api/?name=MSBSHSE&background=EAF2F8&color=2ECC71&rounded=true&size=150' },
          { board: "Goa Board", boardname: "Goa Board of Secondary and Higher Secondary Education", name: "Goa Board", fullName: "Goa Board of Secondary and Higher Secondary Education", id: '28', teacherCount: 240, description: "Goa state education board", headquarters: "Panaji", established: "1975", color: '#3498DB', logo: 'https://ui-avatars.com/api/?name=Goa+Board&background=EBF5FB&color=3498DB&rounded=true&size=150' },
          { board: "DDTE", boardname: "Directorate of Technical Education", name: "DDTE", fullName: "Directorate of Technical Education", id: '29', teacherCount: 180, description: "Daman and Diu technical education", headquarters: "Daman", established: "1988", color: '#9B59B6', logo: 'https://ui-avatars.com/api/?name=DDTE&background=F4ECF7&color=9B59B6&rounded=true&size=150' },
          
          // State Boards - South India
          { board: "KSEEB", boardname: "Karnataka Secondary Education Examination Board", name: "KSEEB", fullName: "Karnataka Secondary Education Examination Board", id: '30', teacherCount: 980, description: "Karnataka state education board", headquarters: "Bengaluru", established: "1966", color: '#E74C3C', logo: 'https://ui-avatars.com/api/?name=KSEEB&background=FDEDDD&color=E74C3C&rounded=true&size=150' },
          { board: "PUEB", boardname: "Department of Pre-University Education", name: "PUEB", fullName: "Department of Pre-University Education", id: '31', teacherCount: 620, description: "Karnataka pre-university board", headquarters: "Bengaluru", established: "1994", color: '#C0392B', logo: 'https://ui-avatars.com/api/?name=PUEB&background=FADBD8&color=C0392B&rounded=true&size=150' },
          { board: "TNDGE", boardname: "Tamil Nadu Directorate of Government Examinations", name: "TNDGE", fullName: "Tamil Nadu Directorate of Government Examinations", id: '32', teacherCount: 1080, description: "Tamil Nadu state education board", headquarters: "Chennai", established: "1975", color: '#2980B9', logo: 'https://ui-avatars.com/api/?name=TNDGE&background=EBF5FB&color=2980B9&rounded=true&size=150' },
          { board: "DGE Telangana", boardname: "Directorate of Government Examinations Telangana", name: "DGE Telangana", fullName: "Directorate of Government Examinations Telangana", id: '33', teacherCount: 680, description: "Telangana state education board", headquarters: "Hyderabad", established: "2014", color: '#8E44AD', logo: 'https://ui-avatars.com/api/?name=DGE+Telangana&background=F4ECF7&color=8E44AD&rounded=true&size=150' },
          { board: "BSEAP", boardname: "Board of Secondary Education Andhra Pradesh", name: "BSEAP", fullName: "Board of Secondary Education Andhra Pradesh", id: '34', teacherCount: 720, description: "Andhra Pradesh state education board", headquarters: "Vijayawada", established: "1953", color: '#27AE60', logo: 'https://ui-avatars.com/api/?name=BSEAP&background=E8F8F5&color=27AE60&rounded=true&size=150' },
          { board: "BIEAP", boardname: "Board of Intermediate Education Andhra Pradesh", name: "BIEAP", fullName: "Board of Intermediate Education Andhra Pradesh", id: '35', teacherCount: 540, description: "Andhra Pradesh intermediate board", headquarters: "Vijayawada", established: "1971", color: '#229954', logo: 'https://ui-avatars.com/api/?name=BIEAP&background=E8F6F3&color=229954&rounded=true&size=150' },
          { board: "DHSE Kerala", boardname: "Directorate of Higher Secondary Education Kerala", name: "DHSE Kerala", fullName: "Directorate of Higher Secondary Education Kerala", id: '36', teacherCount: 620, description: "Kerala higher secondary board", headquarters: "Thiruvananthapuram", established: "1990", color: '#E67E22', logo: 'https://ui-avatars.com/api/?name=DHSE+Kerala&background=FAF2E6&color=E67E22&rounded=true&size=150' },
          { board: "SSLC Kerala", boardname: "Kerala SSLC Examination Board", name: "SSLC Kerala", fullName: "Kerala SSLC Examination Board", id: '37', teacherCount: 480, description: "Kerala SSLC examination board", headquarters: "Thiruvananthapuram", established: "1960", color: '#D35400', logo: 'https://ui-avatars.com/api/?name=SSLC+Kerala&background=FAE5DD&color=D35400&rounded=true&size=150' },
          
          // Autonomous Boards
          { board: "CISCE", boardname: "Council for the Indian School Certificate Examinations", name: "CISCE", fullName: "Council for the Indian School Certificate Examinations", id: '38', teacherCount: 890, description: "National examination board", headquarters: "New Delhi", established: "1958", color: '#4ECDC4', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/CISCE_logo.png/2560px-CISCE_logo.png' },
          { board: "NABET", boardname: "National Board of Accreditation", name: "NABET", fullName: "National Board of Accreditation", id: '39', teacherCount: 150, description: "Technical education accreditation", headquarters: "New Delhi", established: "1994", color: '#34495E', logo: 'https://ui-avatars.com/api/?name=NABET&background=EAEDF2&color=34495E&rounded=true&size=150' },
          { board: "AICTE", boardname: "All India Council for Technical Education", name: "AICTE", fullName: "All India Council for Technical Education", id: '40', teacherCount: 280, description: "Technical education regulator", headquarters: "New Delhi", established: "1945", color: '#2C3E50', logo: 'https://ui-avatars.com/api/?name=AICTE&background=E8E9EA&color=2C3E50&rounded=true&size=150' },
          { board: "UGC", boardname: "University Grants Commission", name: "UGC", fullName: "University Grants Commission", id: '41', teacherCount: 320, description: "Higher education regulator", headquarters: "New Delhi", established: "1956", color: '#7F8C8D', logo: 'https://ui-avatars.com/api/?name=UGC&background=F0F3F4&color=7F8C8D&rounded=true&size=150' },
          { board: "NCERT", boardname: "National Council of Educational Research and Training", name: "NCERT", fullName: "National Council of Educational Research and Training", id: '42', teacherCount: 180, description: "Educational research and training", headquarters: "New Delhi", established: "1961", color: '#E74C3C', logo: 'https://ui-avatars.com/api/?name=NCERT&background=FDEDDD&color=E74C3C&rounded=true&size=150' },
          
          // Religious Boards
          { board: "Madrasa Board", boardname: "Central Madrasa Board", name: "Madrasa Board", fullName: "Central Madrasa Board", id: '43', teacherCount: 220, description: "Islamic education board", headquarters: "New Delhi", established: "2022", color: '#27AE60', logo: 'https://ui-avatars.com/api/?name=Madrasa+Board&background=E8F8F5&color=27AE60&rounded=true&size=150' },
          { board: "Sanskrit Board", boardname: "Maharshi Sandipani Rashtriya Sanskrit Sansthan", name: "Sanskrit Board", fullName: "Maharshi Sandipani Rashtriya Sanskrit Sansthan", id: '44', teacherCount: 120, description: "Sanskrit education board", headquarters: "Ujjain", established: "2002", color: '#F39C12', logo: 'https://ui-avatars.com/api/?name=Sanskrit+Board&background=FEF5E7&color=F39C12&rounded=true&size=150' },
          
          // Special Boards
          { board: "NDA", boardname: "National Defence Academy", name: "NDA", fullName: "National Defence Academy", id: '45', teacherCount: 280, description: "Defence education board", headquarters: "Pune", established: "1954", color: '#2C3E50', logo: 'https://ui-avatars.com/api/?name=NDA&background=E8E9EA&color=2C3E50&rounded=true&size=150' },
          { board: "Sainik School", boardname: "Sainik Schools Society", name: "Sainik School", fullName: "Sainik Schools Society", id: '46', teacherCount: 340, description: "Military school board", headquarters: "New Delhi", established: "1961", color: '#34495E', logo: 'https://ui-avatars.com/api/?name=Sainik+School&background=EAEDF2&color=34495E&rounded=true&size=150' },
          { board: "KV", boardname: "Kendriya Vidyalaya Sangathan", name: "KV", fullName: "Kendriya Vidyalaya Sangathan", id: '47', teacherCount: 520, description: "Central school system", headquarters: "New Delhi", established: "1963", color: '#0056B3', logo: 'https://ui-avatars.com/api/?name=KV&background=E7F3FF&color=0056B3&rounded=true&size=150' },
          { board: "JNV", boardname: "Jawahar Navodaya Vidyalaya", name: "JNV", fullName: "Jawahar Navodaya Vidyalaya", id: '48', teacherCount: 480, description: "Navodaya school system", headquarters: "New Delhi", established: "1986", color: '#FF6B35', logo: 'https://ui-avatars.com/api/?name=JNV&background=FFF5F0&color=FF6B35&rounded=true&size=150' },
        ];
        setBoards(mockBoards);
        setFilteredBoards(mockBoards);
        return;
      
      // Try API fallback if needed (optional)
      if (!auth?.token) {
        console.log("No auth token found, using mock data");
        return;
      }
      
      const headers = {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      };

      const response = await axios.post(`${BASE_URL}/api/allboards`, { category }, { headers });
      console.log("Boards Response:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        const boardsWithDetails = response.data.map((board: any, index: number) => ({
          ...board,
          id: board.boardId || board.id || (index + 1).toString(),
          name: board.boardName || board.name || board.board,
          fullName: board.boardName || board.name || board.board,
          board: board.boardName || board.name || board.board,
          boardname: board.boardName || board.name || board.board,
          teacherCount: board.teacherCount || Math.floor(Math.random() * 2000) + 500,
          description: board.description || `${board.boardName || 'Educational Board'} - Learn and grow`,
          headquarters: board.headquarters || 'India',
          established: board.established || 'Various',
          color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'][index % 6],
          logo: board.logo || `https://ui-avatars.com/api/?name=${board.boardName || board.board || 'Board'}&background=F5F7FB&color=3B5BFE&rounded=true&size=150`
        }));
        
        setBoards(boardsWithDetails);
        setFilteredBoards(boardsWithDetails);
      }
    } catch (error) {
      console.error("Error fetching boards:", error);
      // Fallback to mock data with All Universities and all major Indian boards
      const fallbackBoards: BoardData[] = [
        // All Universities - First
        { board: "All Universities", boardname: "All Universities", name: "All Universities", fullName: "All Universities", id: '0', teacherCount: 3500, description: "All universities and higher education institutions", headquarters: "Pan India", established: "Various", color: '#6C5CE7', logo: 'https://ui-avatars.com/api/?name=All+Universities&background=F5F7FB&color=3B5BFE&rounded=true&size=150' },
        
        // National Boards
        { board: "CBSE", boardname: "Central Board of Secondary Education", name: "CBSE", fullName: "Central Board of Secondary Education", id: '1', teacherCount: 1250, description: "India's largest education board", headquarters: "New Delhi", established: "1962", color: '#FF6B6B', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/CBSE_logo.svg/2560px-CBSE_logo.svg.png' },
        { board: "ICSE", boardname: "Indian Certificate of Secondary Education", name: "ICSE", fullName: "Indian Certificate of Secondary Education", id: '2', teacherCount: 890, description: "Comprehensive education system", headquarters: "New Delhi", established: "1958", color: '#4ECDC4', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/CISCE_logo.png/2560px-CISCE_logo.png' },
        { board: "NIOS", boardname: "National Institute of Open Schooling", name: "NIOS", fullName: "National Institute of Open Schooling", id: '3', teacherCount: 450, description: "Open schooling system", headquarters: "Noida", established: "1989", color: '#9B59B6', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/Nios_logo.svg/2560px-Nios_logo.svg.png' },
        { board: "IB", boardname: "International Baccalaureate", name: "IB", fullName: "International Baccalaureate", id: '4', teacherCount: 320, description: "International education foundation", headquarters: "Geneva", established: "1968", color: '#3498DB', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/55/IB_logo.svg/2560px-IB_logo.svg.png' },
        { board: "CAIE", boardname: "Cambridge Assessment International Education", name: "Cambridge", fullName: "Cambridge Assessment International Education", id: '5', teacherCount: 280, description: "International examination board", headquarters: "Cambridge", established: "1858", color: '#E74C3C', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Cambridge_Assessment_Logo.svg/2560px-Cambridge_Assessment_Logo.svg.png' },
        
        // State Boards - North India
        { board: "UP Board", boardname: "Uttar Pradesh Board of Secondary Education", name: "UP Board", fullName: "Uttar Pradesh Board of Secondary Education", id: '6', teacherCount: 980, description: "Uttar Pradesh state education board", headquarters: "Prayagraj", established: "1921", color: '#FF9F43', logo: 'https://upmsp.edu.in/assets/images/upmsp-logo.png' },
        { board: "BSEB", boardname: "Bihar School Examination Board", name: "BSEB", fullName: "Bihar School Examination Board", id: '7', teacherCount: 750, description: "Bihar state education board", headquarters: "Patna", established: "1952", color: '#6C5CE7', logo: 'https://bsebpatna.com/images/logo.png' },
        { board: "HPBOSE", boardname: "Himachal Pradesh Board of School Education", name: "HPBOSE", fullName: "Himachal Pradesh Board of School Education", id: '8', teacherCount: 420, description: "Himachal Pradesh state education board", headquarters: "Dharamshala", established: "1969", color: '#00B894', logo: 'https://hpbose.org/images/hpbose-logo.png' },
        { board: "JKBOSE", boardname: "Jammu and Kashmir Board of School Education", name: "JKBOSE", fullName: "Jammu and Kashmir Board of School Education", id: '9', teacherCount: 380, description: "Jammu & Kashmir education board", headquarters: "Srinagar/Jammu", established: "1975", color: '#0984E3', logo: 'https://jkbose.nic.in/images/jkbose-logo.png' },
        { board: "PSEB", boardname: "Punjab School Education Board", name: "PSEB", fullName: "Punjab School Education Board", id: '10', teacherCount: 520, description: "Punjab state education board", headquarters: "Mohali", established: "1969", color: '#F39C12', logo: 'https://www.pseb.ac.in/images/pseb-logo.png' },
        { board: "RBSE", boardname: "Rajasthan Board of Secondary Education", name: "RBSE", fullName: "Rajasthan Board of Secondary Education", id: '11', teacherCount: 680, description: "Rajasthan state education board", headquarters: "Ajmer", established: "1957", color: '#E67E22', logo: 'https://rajeduboard.rajasthan.gov.in/images/rajasthan-board-logo.png' },
        { board: "UK Board", boardname: "Uttarakhand Board of School Education", name: "UK Board", fullName: "Uttarakhand Board of School Education", id: '12', teacherCount: 340, description: "Uttarakhand state education board", headquarters: "Ramnagar", established: "2001", color: '#16A085', logo: 'https://ubse.uk.gov.in/images/ubse-logo.png' },
        { board: "Haryana Board", boardname: "Board of School Education Haryana", name: "Haryana Board", fullName: "Board of School Education Haryana", id: '13', teacherCount: 460, description: "Haryana state education board", headquarters: "Bhiwani", established: "1969", color: '#8E44AD', logo: 'https://www.bseh.org.in/images/bseh-logo.png' },
        { board: "Delhi Board", boardname: "Delhi Board of Secondary and Senior Secondary Education", name: "Delhi Board", fullName: "Delhi Board of Secondary and Senior Secondary Education", id: '14', teacherCount: 290, description: "Delhi state education board", headquarters: "Delhi", established: "2021", color: '#2ECC71', logo: 'https://delhiboard.delhi.gov.in/images/delhi-board-logo.png' },
        { board: "Chandigarh Board", boardname: "Chandigarh Education Board", name: "Chandigarh Board", fullName: "Chandigarh Education Board", id: '15', teacherCount: 180, description: "Chandigarh education board", headquarters: "Chandigarh", established: "2021", color: '#34495E', logo: 'https://cebchd.org/images/ceb-logo.png' },
        
        // State Boards - East India
        { board: "WBBSE", boardname: "West Bengal Board of Secondary Education", name: "WBBSE", fullName: "West Bengal Board of Secondary Education", id: '16', teacherCount: 720, description: "West Bengal secondary education board", headquarters: "Kolkata", established: "1951", color: '#E74C3C', logo: 'https://wbbse.org/images/wbbse-logo.png' },
        { board: "WBCHSE", boardname: "West Bengal Council of Higher Secondary Education", name: "WBCHSE", fullName: "West Bengal Council of Higher Secondary Education", id: '17', teacherCount: 580, description: "West Bengal higher secondary board", headquarters: "Kolkata", established: "1975", color: '#C0392B', logo: 'https://wbchse.wb.gov.in/images/wbchse-logo.png' },
        { board: "BSE Odisha", boardname: "Board of Secondary Education Odisha", name: "BSE Odisha", fullName: "Board of Secondary Education Odisha", id: '18', teacherCount: 540, description: "Odisha state education board", headquarters: "Cuttack", established: "1955", color: '#D35400', logo: 'https://bseodisha.nic.in/images/bse-odisha-logo.png' },
        { board: "CHSE Odisha", boardname: "Council of Higher Secondary Education Odisha", name: "CHSE Odisha", fullName: "Council of Higher Secondary Education Odisha", id: '19', teacherCount: 420, description: "Odisha higher secondary board", headquarters: "Bhubaneswar", established: "1982", color: '#E67E22', logo: 'https://chseodisha.nic.in/images/chse-odisha-logo.png' },
        { board: "JAC", boardname: "Jharkhand Academic Council", name: "JAC", fullName: "Jharkhand Academic Council", id: '20', teacherCount: 380, description: "Jharkhand state education board", headquarters: "Ranchi", established: "2000", color: '#27AE60', logo: 'https://jac.jharkhand.gov.in/images/jac-logo.png' },
        { board: "TBSE", boardname: "Tripura Board of Secondary Education", name: "TBSE", fullName: "Tripura Board of Secondary Education", id: '21', teacherCount: 260, description: "Tripura state education board", headquarters: "Agartala", established: "1973", color: '#2980B9', logo: 'https://tbse.tripura.gov.in/images/tbse-logo.png' },
        { board: "MBOSE", boardname: "Meghalaya Board of School Education", name: "MBOSE", fullName: "Meghalaya Board of School Education", id: '22', teacherCount: 220, description: "Meghalaya state education board", headquarters: "Tura", established: "1974", color: '#8E44AD', logo: 'https://www.mbose.in/images/mbose-logo.png' },
        { board: "NBSE", boardname: "Nagaland Board of School Education", name: "NBSE", fullName: "Nagaland Board of School Education", id: '23', teacherCount: 180, description: "Nagaland state education board", headquarters: "Kohima", established: "1974", color: '#16A085', logo: 'https://www.nbsenagaland.com/images/nbse-logo.png' },
        { board: "COHSEM", boardname: "Council of Higher Secondary Education Manipur", name: "COHSEM", fullName: "Council of Higher Secondary Education Manipur", id: '24', teacherCount: 200, description: "Manipur higher secondary board", headquarters: "Imphal", established: "1992", color: '#C0392B', logo: 'https://ui-avatars.com/api/?name=COHSEM&background=FADBD8&color=C0392B&rounded=true&size=150' },
        { board: "BSEM", boardname: "Board of Secondary Education Manipur", name: "BSEM", fullName: "Board of Secondary Education Manipur", id: '25', teacherCount: 190, description: "Manipur secondary education board", headquarters: "Imphal", established: "1972", color: '#E74C3C', logo: 'https://ui-avatars.com/api/?name=BSEM&background=FDEDDD&color=E74C3C&rounded=true&size=150' },
        
        // State Boards - West India
        { board: "GSEB", boardname: "Gujarat Secondary and Higher Secondary Education Board", name: "GSEB", fullName: "Gujarat Secondary and Higher Secondary Education Board", id: '26', teacherCount: 820, description: "Gujarat state education board", headquarters: "Gandhinagar", established: "1960", color: '#F39C12', logo: 'https://ui-avatars.com/api/?name=GSEB&background=FEF5E7&color=F39C12&rounded=true&size=150' },
        { board: "MSBSHSE", boardname: "Maharashtra State Board of Secondary and Higher Secondary Education", name: "MSBSHSE", fullName: "Maharashtra State Board of Secondary and Higher Secondary Education", id: '27', teacherCount: 1150, description: "Maharashtra state education board", headquarters: "Pune", established: "1965", color: '#2ECC71', logo: 'https://ui-avatars.com/api/?name=MSBSHSE&background=EAF2F8&color=2ECC71&rounded=true&size=150' },
        { board: "Goa Board", boardname: "Goa Board of Secondary and Higher Secondary Education", name: "Goa Board", fullName: "Goa Board of Secondary and Higher Secondary Education", id: '28', teacherCount: 240, description: "Goa state education board", headquarters: "Panaji", established: "1975", color: '#3498DB', logo: 'https://ui-avatars.com/api/?name=Goa+Board&background=EBF5FB&color=3498DB&rounded=true&size=150' },
        { board: "DDTE", boardname: "Directorate of Technical Education", name: "DDTE", fullName: "Directorate of Technical Education", id: '29', teacherCount: 180, description: "Daman and Diu technical education", headquarters: "Daman", established: "1988", color: '#9B59B6', logo: 'https://ui-avatars.com/api/?name=DDTE&background=F4ECF7&color=9B59B6&rounded=true&size=150' },
        
        // State Boards - South India
        { board: "KSEEB", boardname: "Karnataka Secondary Education Examination Board", name: "KSEEB", fullName: "Karnataka Secondary Education Examination Board", id: '30', teacherCount: 980, description: "Karnataka state education board", headquarters: "Bengaluru", established: "1966", color: '#E74C3C', logo: 'https://ui-avatars.com/api/?name=KSEEB&background=FDEDDD&color=E74C3C&rounded=true&size=150' },
        { board: "PUEB", boardname: "Department of Pre-University Education", name: "PUEB", fullName: "Department of Pre-University Education", id: '31', teacherCount: 620, description: "Karnataka pre-university board", headquarters: "Bengaluru", established: "1994", color: '#C0392B', logo: 'https://ui-avatars.com/api/?name=PUEB&background=FADBD8&color=C0392B&rounded=true&size=150' },
        { board: "TNDGE", boardname: "Tamil Nadu Directorate of Government Examinations", name: "TNDGE", fullName: "Tamil Nadu Directorate of Government Examinations", id: '32', teacherCount: 1080, description: "Tamil Nadu state education board", headquarters: "Chennai", established: "1975", color: '#2980B9', logo: 'https://ui-avatars.com/api/?name=TNDGE&background=EBF5FB&color=2980B9&rounded=true&size=150' },
        { board: "DGE Telangana", boardname: "Directorate of Government Examinations Telangana", name: "DGE Telangana", fullName: "Directorate of Government Examinations Telangana", id: '33', teacherCount: 680, description: "Telangana state education board", headquarters: "Hyderabad", established: "2014", color: '#8E44AD', logo: 'https://ui-avatars.com/api/?name=DGE+Telangana&background=F4ECF7&color=8E44AD&rounded=true&size=150' },
        { board: "BSEAP", boardname: "Board of Secondary Education Andhra Pradesh", name: "BSEAP", fullName: "Board of Secondary Education Andhra Pradesh", id: '34', teacherCount: 720, description: "Andhra Pradesh state education board", headquarters: "Vijayawada", established: "1953", color: '#27AE60', logo: 'https://ui-avatars.com/api/?name=BSEAP&background=E8F8F5&color=27AE60&rounded=true&size=150' },
        { board: "BIEAP", boardname: "Board of Intermediate Education Andhra Pradesh", name: "BIEAP", fullName: "Board of Intermediate Education Andhra Pradesh", id: '35', teacherCount: 540, description: "Andhra Pradesh intermediate board", headquarters: "Vijayawada", established: "1971", color: '#229954', logo: 'https://ui-avatars.com/api/?name=BIEAP&background=E8F6F3&color=229954&rounded=true&size=150' },
        { board: "DHSE Kerala", boardname: "Directorate of Higher Secondary Education Kerala", name: "DHSE Kerala", fullName: "Directorate of Higher Secondary Education Kerala", id: '36', teacherCount: 620, description: "Kerala higher secondary board", headquarters: "Thiruvananthapuram", established: "1990", color: '#E67E22', logo: 'https://ui-avatars.com/api/?name=DHSE+Kerala&background=FAF2E6&color=E67E22&rounded=true&size=150' },
        { board: "SSLC Kerala", boardname: "Kerala SSLC Examination Board", name: "SSLC Kerala", fullName: "Kerala SSLC Examination Board", id: '37', teacherCount: 480, description: "Kerala SSLC examination board", headquarters: "Thiruvananthapuram", established: "1960", color: '#D35400', logo: 'https://ui-avatars.com/api/?name=SSLC+Kerala&background=FAE5DD&color=D35400&rounded=true&size=150' },
        
        // Autonomous Boards
        { board: "CISCE", boardname: "Council for the Indian School Certificate Examinations", name: "CISCE", fullName: "Council for the Indian School Certificate Examinations", id: '38', teacherCount: 890, description: "National examination board", headquarters: "New Delhi", established: "1958", color: '#4ECDC4', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/CISCE_logo.png/2560px-CISCE_logo.png' },
        { board: "NABET", boardname: "National Board of Accreditation", name: "NABET", fullName: "National Board of Accreditation", id: '39', teacherCount: 150, description: "Technical education accreditation", headquarters: "New Delhi", established: "1994", color: '#34495E', logo: 'https://ui-avatars.com/api/?name=NABET&background=EAEDF2&color=34495E&rounded=true&size=150' },
        { board: "AICTE", boardname: "All India Council for Technical Education", name: "AICTE", fullName: "All India Council for Technical Education", id: '40', teacherCount: 280, description: "Technical education regulator", headquarters: "New Delhi", established: "1945", color: '#2C3E50', logo: 'https://ui-avatars.com/api/?name=AICTE&background=E8E9EA&color=2C3E50&rounded=true&size=150' },
        { board: "UGC", boardname: "University Grants Commission", name: "UGC", fullName: "University Grants Commission", id: '41', teacherCount: 320, description: "Higher education regulator", headquarters: "New Delhi", established: "1956", color: '#7F8C8D', logo: 'https://ui-avatars.com/api/?name=UGC&background=F0F3F4&color=7F8C8D&rounded=true&size=150' },
        { board: "NCERT", boardname: "National Council of Educational Research and Training", name: "NCERT", fullName: "National Council of Educational Research and Training", id: '42', teacherCount: 180, description: "Educational research and training", headquarters: "New Delhi", established: "1961", color: '#E74C3C', logo: 'https://ui-avatars.com/api/?name=NCERT&background=FDEDDD&color=E74C3C&rounded=true&size=150' },
        
        // Religious Boards
        { board: "Madrasa Board", boardname: "Central Madrasa Board", name: "Madrasa Board", fullName: "Central Madrasa Board", id: '43', teacherCount: 220, description: "Islamic education board", headquarters: "New Delhi", established: "2022", color: '#27AE60', logo: 'https://ui-avatars.com/api/?name=Madrasa+Board&background=E8F8F5&color=27AE60&rounded=true&size=150' },
        { board: "Sanskrit Board", boardname: "Maharshi Sandipani Rashtriya Sanskrit Sansthan", name: "Sanskrit Board", fullName: "Maharshi Sandipani Rashtriya Sanskrit Sansthan", id: '44', teacherCount: 120, description: "Sanskrit education board", headquarters: "Ujjain", established: "2002", color: '#F39C12', logo: 'https://ui-avatars.com/api/?name=Sanskrit+Board&background=FEF5E7&color=F39C12&rounded=true&size=150' },
        
        // Special Boards
        { board: "NDA", boardname: "National Defence Academy", name: "NDA", fullName: "National Defence Academy", id: '45', teacherCount: 280, description: "Defence education board", headquarters: "Pune", established: "1954", color: '#2C3E50', logo: 'https://ui-avatars.com/api/?name=NDA&background=E8E9EA&color=2C3E50&rounded=true&size=150' },
        { board: "Sainik School", boardname: "Sainik Schools Society", name: "Sainik School", fullName: "Sainik Schools Society", id: '46', teacherCount: 340, description: "Military school board", headquarters: "New Delhi", established: "1961", color: '#34495E', logo: 'https://ui-avatars.com/api/?name=Sainik+School&background=EAEDF2&color=34495E&rounded=true&size=150' },
        { board: "KV", boardname: "Kendriya Vidyalaya Sangathan", name: "KV", fullName: "Kendriya Vidyalaya Sangathan", id: '47', teacherCount: 520, description: "Central school system", headquarters: "New Delhi", established: "1963", color: '#0056B3', logo: 'https://ui-avatars.com/api/?name=KV&background=E7F3FF&color=0056B3&rounded=true&size=150' },
        { board: "JNV", boardname: "Jawahar Navodaya Vidyalaya", name: "JNV", fullName: "Jawahar Navodaya Vidyalaya", id: '48', teacherCount: 480, description: "Navodaya school system", headquarters: "New Delhi", established: "1986", color: '#FF6B35', logo: 'https://ui-avatars.com/api/?name=JNV&background=FFF5F0&color=FF6B35&rounded=true&size=150' },
      ];
      setBoards(fallbackBoards);
      setFilteredBoards(fallbackBoards);
    } finally {
      setBoardsLoading(false);
    }
  }, [category]);

  // Fetch posts for ThoughtsCard (same as Student.tsx)
  const fetchPosts = async (token: string) => {
    try {
      setPostsLoading(true);
      const res = await axios.get(`${BASE_URL}/api/posts/all`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.data.success) {
        const postsWithComments = await Promise.all(res.data.data.map(async (post: any) => {
          try {
            const cr = await axios.get(`${BASE_URL}/api/posts/${post.id}/comments`, { headers: { 'Authorization': `Bearer ${token}` } });
            return { ...post, createdAt: formatTimeAgo(post.createdAt), isLiked: post.isLiked || false, comments: cr.data.success ? cr.data.data.map((c: any) => ({ ...c, createdAt: formatTimeAgo(c.createdAt), isLiked: false })) : [] };
          } catch { return { ...post, createdAt: formatTimeAgo(post.createdAt), isLiked: false, comments: [] }; }
        }));
        const uniqueEmails = [...new Set(postsWithComments.map((p: Post) => p.author.email))];
        await Promise.all(uniqueEmails.map(e => fetchUserProfile(token, e)));
        setPosts(postsWithComments);
      } else setPosts([]);
    } catch { setPosts([]); }
    finally { setPostsLoading(false); }
  };

  const fetchUserProfile = async (token: string, profileEmail: string) => {
    if (userProfileCache.has(profileEmail)) return userProfileCache.get(profileEmail)!;
    try {
      const res = await axios.post(`${BASE_URL}/api/userProfile`, { email: profileEmail, source: 'astraDB' }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
      if (res.data) {
        const pic = res.data.profileimage || res.data.profilePic || res.data.profilepic || '';
        const name = res.data.name || res.data.userName || res.data.fullname || '';
        let finalPic = pic;
        if (finalPic && !finalPic.startsWith('http') && !finalPic.startsWith('/')) finalPic = `/${finalPic}`;
        const data = { name: name || 'Unknown User', profilePic: finalPic || '' };
        setUserProfileCache(prev => new Map(prev.set(profileEmail, data)));
        return data;
      }
    } catch {}
    return { name: 'Unknown User', profilePic: '' };
  };

  const handleLike = async (postId: string) => {
    if (!authToken) return;
    const post = posts.find(p => p.id === postId); if (!post) return;
    const newLiked = !post.isLiked;
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes: newLiked ? p.likes + 1 : Math.max(0, p.likes - 1), isLiked: newLiked } : p));
    try {
      if (newLiked) await axios.post(`${BASE_URL}/api/posts/${postId}/like`, {}, { headers: { 'Authorization': `Bearer ${authToken}` } });
      else await axios.delete(`${BASE_URL}/api/posts/${postId}/like`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    } catch { setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes: post.likes, isLiked: post.isLiked } : p)); }
  };

  const fetchPostComments = async (postId: string) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/posts/${postId}/comments`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.data.success) setPostComments(res.data.data.map((c: any) => ({ ...c, createdAt: formatTimeAgo(c.createdAt), isLiked: false })));
    } catch { setPostComments([]); }
  };

  const openCommentsModal = async (post: Post) => {
    setSelectedPost(post); setShowCommentsModal(true); setCommentText('');
    await fetchPostComments(post.id);
  };

  const addComment = async () => {
    if (!commentText.trim() || !selectedPost || !authToken) return;
    try {
      const res = await axios.post(`${BASE_URL}/api/posts/${selectedPost.id}/comments`, { content: commentText.trim() }, { headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } });
      if (res.data.success) {
        const newC: Comment = { ...res.data.data, createdAt: 'Just now', isLiked: false };
        setPostComments(prev => [newC, ...prev]);
        setCommentText('');
        setPosts(ps => ps.map(p => p.id === selectedPost.id ? { ...p, comments: [newC, ...(p.comments || [])] } : p));
        await fetchPostComments(selectedPost.id);
      }
    } catch (err: any) { Alert.alert('Error', err.response?.data?.message || 'Failed to add comment'); }
  };

  const submitReport = async () => {
    if (!authToken || !reportReason.trim()) { Alert.alert('Error', 'Please provide a reason'); return; }
    try {
      const ep = reportType === 'post' ? `${BASE_URL}/api/posts/${reportItemId}/report` : `${BASE_URL}/api/comments/${reportItemId}/report`;
      await axios.post(ep, { reason: reportReason.trim() }, { headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } });
      Alert.alert('Success', 'Report submitted'); setShowReportModal(false); setReportReason('');
    } catch (err: any) { Alert.alert('Error', err.response?.data?.message || 'Failed to submit report'); }
  };

  // Load user data and fetch boards/posts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const auth = await getAuthData();
        if (!auth?.token) return;
        
        setStoredUserEmail(auth.email);
        setAuthToken(auth.token);
        
        // Load profile
        try {
          const profileResponse = await axios.post(`${BASE_URL}/api/userProfile`, { email: auth.email }, { headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" } });
          const profileData = profileResponse.data;
          setStudentName(profileData.name || "Student");
          setProfileImage(profileData.profileimage || null);
          setUserRole(auth.role || null);
          await AsyncStorage.multiSet([["studentName", profileData.name || ""], ["profileImage", profileData.profileimage || ""], ["user_role", auth.role || ""]]);
        } catch {
          const cachedName = await AsyncStorage.getItem("studentName");
          const cachedImage = await AsyncStorage.getItem("profileImage");
          const cachedRole = await AsyncStorage.getItem("user_role");
          setStudentName(cachedName || "Student");
          setProfileImage(cachedImage || null);
          setUserRole(cachedRole || null);
        }
        
        // Fetch boards and posts
        await fetchBoards();
        await fetchPosts(auth.token);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const filtered = boards.filter(board => {
      const name = board.name || board.board || '';
      const fullName = board.fullName || board.boardname || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             fullName.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredBoards(filtered);
  }, [searchQuery, boards]);

  const handleBoardPress = (board: BoardData) => {
    const boardName = board.name || board.board || '';
    const boardId = board.id || '';
    
    if (onBoardSelect) {
      onBoardSelect(boardName, boardId);
    } else {
      // If accessed as standalone route, navigate to ClassSelection page
      console.log('Board selected:', { boardName, boardId });
      router.push({
        pathname: '/(tabs)/StudentDashBoard/ClassSelection',
        params: { boardName, boardId }
      } as any);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7BF7" />
      </View>
    );
  }

  // Web Layout with reusable components
  if (Platform.OS === 'web') {
    const Banner = () => (
      <View style={styles.bannerContainer}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&fit=crop' }} style={styles.bannerImage} />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerSmallText}>Education is not preparation for life</Text>
          <Text style={styles.bannerLargeText}>Education is life itself</Text>
        </View>
      </View>
    );

    const BoardCard = ({ item }: { item: BoardData }) => (
      <TouchableOpacity 
        style={styles.boardCardWrapper}
        onPress={() => handleBoardPress(item)}
      >
        <View style={styles.boardCardContainer}>
          <Image source={{ uri: item.logo }} style={styles.boardLogo} resizeMode="contain" />
        </View>
        <View style={styles.boardLabelPill}>
          <Text style={styles.boardLabelText}>{item.name || item.board}</Text>
        </View>
      </TouchableOpacity>
    );

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.rootLayout}>
          <WebNavbar 
            studentName={studentName} 
            profileImage={profileImage}
          />

          <View style={styles.mainColumnsLayout}>
            <WebSidebar 
              activeItem={activeSidebarItem}
              onItemPress={handleSidebarItemPress}
              userEmail={storedUserEmail || ''}
              studentName={studentName}
              profileImage={profileImage}
            />

            {/* 2. CENTER CONTENT */}
            <View style={styles.centerContentContainer}>
              <ImageBackground 
                source={{ uri: 'https://www.transparenttextures.com/patterns/clean-texturing.png' }} 
                style={{ flex: 1 }}
                imageStyle={{ opacity: 0.15 }}
              >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.centerContentScroll}>
                  
                  {/* Navigation Title Header */}
                  <View style={styles.pageNavHeader}>
                    <TouchableOpacity onPress={onBack || (() => router.back())} style={styles.backButton}>
                      <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.pageTitle}>All Boards</Text>
                  </View>

                  {/* Main Bounded Container */}
                  <View style={styles.boxContainer}>
                    
                    <Banner />

                    <View style={styles.gridContainer}>
                      {boardsLoading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                          <ActivityIndicator size="large" color="#4A7BF7" />
                          <Text style={{ marginTop: 12, color: '#666', fontFamily: 'Poppins_400Regular' }}>Loading boards...</Text>
                        </View>
                      ) : filteredBoards.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                          <MaterialCommunityIcons name="school-outline" size={40} color="#ccc" />
                          <Text style={{ marginTop: 12, color: '#aaa', fontFamily: 'Poppins_400Regular' }}>No boards found</Text>
                        </View>
                      ) : (
                        filteredBoards.map(board => (
                          <BoardCard key={board.id} item={board} />
                        ))
                      )}
                    </View>

                  </View>

                  {/* Pagination */}
                  <View style={styles.paginationRow}>
                    <TouchableOpacity style={styles.pageBtnInactiveArrow}>
                      <Ionicons name="chevron-back" size={16} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.pageBtnActive}>
                      <Text style={styles.pageBtnUserTextActive}>1</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.pageBtnInactive}>
                      <Text style={styles.pageBtnUserTextInactive}>2</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.pageBtnInactive}>
                      <Text style={styles.pageBtnUserTextInactive}>3</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.pageBtnInactiveArrow}>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                  </View>

                </ScrollView>
              </ImageBackground>
            </View>

            {/* Right Panel with ThoughtsCard */}
            <View style={styles.rightPanel}>
              <Text style={styles.rightPanelTitle}>Thoughts</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.thoughtsList}>
                {postsLoading && posts.length === 0 && <ActivityIndicator color="#4A7BF7" style={{ marginTop: 30 }} />}
                {!postsLoading && posts.length === 0 && (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <MaterialCommunityIcons name="post-outline" size={40} color="#ccc" />
                    <Text style={{ color: '#aaa', marginTop: 12, fontFamily: 'Poppins_400Regular' }}>No thoughts yet</Text>
                  </View>
                )}
                {posts.map((post) => (
                  <ThoughtsCard 
                    key={post.id} 
                    post={post} 
                    onLike={handleLike} 
                    onComment={openCommentsModal}
                    onReport={(post) => { setReportType('post'); setReportItemId(post.id); setReportReason(''); setShowReportModal(true); }}
                    getProfileImageSource={getProfileImageSource} 
                    initials={initials} 
                    resolvePostAuthor={resolvePostAuthor} 
                  />
                ))}
              </ScrollView>

              {/* Comments Modal */}
              <Modal visible={showCommentsModal} animationType="slide" transparent onRequestClose={() => setShowCommentsModal(false)}>
                <View style={styles.modalOverlay}>
                  <View style={styles.modalBox}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Text style={styles.modalTitle}>Comments</Text>
                      <TouchableOpacity onPress={() => setShowCommentsModal(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
                      <TextInput style={styles.commentInput} placeholder="Add a comment..." placeholderTextColor="#999" value={commentText} onChangeText={setCommentText} multiline maxLength={200} />
                      <TouchableOpacity style={[styles.postBtn, !commentText.trim() && { backgroundColor: '#ccc' }]} onPress={addComment} disabled={!commentText.trim()}>
                        <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular' }}>Post</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 300 }}>
                      {postComments.length === 0
                        ? <Text style={{ textAlign: 'center', color: '#aaa', paddingVertical: 30, fontFamily: 'Poppins_400Regular' }}>No comments yet</Text>
                        : postComments.map((c) => {
                            const ca = resolvePostAuthor({ author: c.author } as Post);
                            const cSrc = getProfileImageSource(ca.pic || undefined);
                            return (
                              <View key={c.id} style={{ flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
                                {cSrc ? <Image source={cSrc} style={styles.commentAvatar} /> : <View style={[styles.commentAvatar, styles.avatarPlaceholder]}><Text style={styles.avatarTxt}>{initials(ca.name)}</Text></View>}
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#222', fontFamily: 'Poppins_600SemiBold' }}>{ca.name}</Text>
                                  <Text style={{ fontSize: 13, color: '#374151', marginTop: 2, fontFamily: 'Poppins_400Regular' }}>{c.content}</Text>
                                  <Text style={{ fontSize: 11, color: '#aaa', marginTop: 3, fontFamily: 'Poppins_400Regular' }}>{c.createdAt}</Text>
                                </View>
                              </View>
                            );
                          })}
                    </ScrollView>
                  </View>
                </View>
              </Modal>

              {/* Report Modal */}
              <Modal visible={showReportModal} animationType="fade" transparent onRequestClose={() => setShowReportModal(false)}>
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalBox, { maxHeight: undefined }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Text style={styles.modalTitle}>Report {reportType === 'post' ? 'Post' : 'Comment'}</Text>
                      <TouchableOpacity onPress={() => setShowReportModal(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 13, color: '#555', marginBottom: 12, fontFamily: 'Poppins_400Regular' }}>Please provide a reason for reporting:</Text>
                    <TextInput style={styles.reportInput} placeholder="Enter reason..." placeholderTextColor="#999" value={reportReason} onChangeText={setReportReason} multiline maxLength={200} />
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 }}>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReportModal(false)}><Text style={{ color: '#666', fontFamily: 'Poppins_400Regular' }}>Cancel</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.reportBtn, !reportReason.trim() && { backgroundColor: '#ccc' }]} onPress={submitReport} disabled={!reportReason.trim()}>
                        <Text style={{ color: '#fff', fontFamily: 'Poppins_400Regular' }}>Submit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </View>

          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Mobile Layout
  return (
    <View style={styles.mobileContainer}>
      {/* Header */}
      <View style={styles.mobileHeader}>
        <View style={styles.mobileHeaderLeft}>
          <BackButton size={24} color="#000" onPress={onBack || (() => router.back())} />
          <View>
            <Text style={styles.mobileTitle}>Educational Boards</Text>
            <Text style={styles.mobileSubtitle}>{filteredBoards.length} Available</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.mobileSearchSection}>
        <View style={styles.mobileSearchBar}>
          <FontAwesome name="search" size={16} color="#999" style={styles.mobileSearchIcon} />
          <TextInput
            style={styles.mobileSearchInput}
            placeholder="Search educational boards..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Boards List */}
      {boardsLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size="large" color="#4A7BF7" />
          <Text style={{ marginTop: 12, color: '#666', fontFamily: 'Poppins_400Regular' }}>Loading boards...</Text>
        </View>
      ) : filteredBoards.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
          <MaterialCommunityIcons name="school-outline" size={40} color="#ccc" />
          <Text style={{ marginTop: 12, color: '#aaa', fontFamily: 'Poppins_400Regular' }}>No boards found</Text>
        </View>
      ) : (
        <FlatList
          data={currentBoards}
          keyExtractor={(item) => item.id?.toString() || item.board || ''}
          contentContainerStyle={styles.mobileBoardsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.mobileBoardCard}
              onPress={() => handleBoardPress(item)}
            >
              <View style={[styles.mobileBoardHeader, { backgroundColor: (item.color || '#4A7BF7') + '20' }]}>
                <Image source={item.logo ? { uri: item.logo } : require('../../../assets/images/Profile.png')} style={styles.mobileBoardLogo} />
                <View style={styles.mobileBoardBadge}>
                  <Text style={styles.mobileBoardBadgeText}>{item.teacherCount || 0}</Text>
                </View>
              </View>
              <View style={styles.mobileBoardInfo}>
                <Text style={styles.mobileBoardName}>{item.name || item.board || 'Unknown Board'}</Text>
                <Text style={styles.mobileBoardFullName}>{item.fullName || item.boardname || ''}</Text>
                <Text style={styles.mobileBoardDescription}>{item.description || `${item.boardname || 'Educational Board'} - Learn and grow`}</Text>
                <View style={styles.mobileBoardMeta}>
                  <View style={styles.mobileBoardMetaItem}>
                    <Ionicons name="location-outline" size={12} color="#666" />
                    <Text style={styles.mobileBoardMetaText}>{item.headquarters || 'India'}</Text>
                  </View>
                  <View style={styles.mobileBoardMetaItem}>
                    <Ionicons name="calendar-outline" size={12} color="#666" />
                    <Text style={styles.mobileBoardMetaText}>Est. {item.established || 'Various'}</Text>
                  </View>
                </View>
                <View style={styles.mobileBoardFooter}>
                  <Text style={styles.mobileTeacherCount}>{item.teacherCount || 0} Teachers</Text>
                  <Ionicons name="arrow-forward" size={16} color="#4A7BF7" />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Mobile Pagination */}
      {!boardsLoading && filteredBoards.length > 0 && (
        <View style={styles.mobilePagination}>
          <TouchableOpacity 
            style={[styles.mobilePageBtn, currentPage === 1 && styles.mobilePageBtnDisabled]}
            onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#ccc' : '#333'} />
          </TouchableOpacity>
          <Text style={styles.mobilePageText}>Page {currentPage} of {totalPages}</Text>
          <TouchableOpacity 
            style={[styles.mobilePageBtn, currentPage === totalPages && styles.mobilePageBtnDisabled]}
            onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? '#ccc' : '#333'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // New Web Layout Styles
  safeArea: { flex: 1, backgroundColor: COLORS.cardBackground },
  rootLayout: { flex: 1, flexDirection: 'column', backgroundColor: COLORS.cardBackground },
  mainColumnsLayout: { flex: 1, flexDirection: 'row' },

  // --- CENTER CONTENT ---
  centerContentContainer: { flex: 1 },
  centerContentScroll: { padding: 32, paddingBottom: 60 },
  
  pageNavHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { 
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, 
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBackground, marginRight: 16 
  },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.headerTxt },

  boxContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.blueBorder,
    padding: 24,
    marginBottom: 32,
  },

  // --- BANNER ---
  bannerContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 32,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0, top: 0,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'flex-end',
  },
  bannerSmallText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerLargeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
  },

  // --- BOARDS GRID & CARD ---
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  boardCardWrapper: {
    width: '23%',  // Forms a 4-column grid (23*4 = 92% + 3 gaps)
    position: 'relative',
    marginBottom: 26, // Space for over-flowing label pill
  },
  boardCardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 140, 
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.03)',
    elevation: 2,
  },
  boardLogo: {
    width: 80,
    height: 80,
  },
  boardLabelPill: {
    position: 'absolute',
    bottom: -15,   // Overlaps the bottom edge cleanly
    alignSelf: 'center',
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 16,
  },
  boardLabelText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.tagTxt,
    letterSpacing: 0.5,
  },

  // --- PAGINATION ---
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pageBtnInactiveArrow: {
    width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
  },
  pageBtnActive: {
    width: 34, height: 34, backgroundColor: COLORS.paginationActiveBg,
    borderRadius: 6, justifyContent: 'center', alignItems: 'center',
  },
  pageBtnInactive: {
    width: 34, height: 34, backgroundColor: COLORS.paginationInactiveBg,
    borderRadius: 6, justifyContent: 'center', alignItems: 'center',
  },
  pageBtnUserTextActive: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  pageBtnUserTextInactive: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.paginationInactiveTxt },

  // --- THOUGHTS PANEL ---
  rightPanel: {
    width: Platform.OS === 'web' ? '25%' : wp(25), minWidth: 300, backgroundColor: COLORS.cardBackground,
    borderLeftWidth: 1, borderLeftColor: COLORS.border, paddingTop: 32, paddingHorizontal: 24,
  },
  rightPanelTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: COLORS.primary, marginBottom: 24, textAlign: 'center' },
  thoughtsList: { paddingBottom: 40 },

  // Web Styles
  webContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  webHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webBackBtn: {
    padding: 8,
    marginRight: 15,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
  },
  webSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  webHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webTotalCount: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  webSearchSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  webSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  webSearchIcon: {
    marginRight: 10,
  },
  webSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  webBoardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  webBoardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
  },
  webBoardCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden',
    marginBottom: 20,
  },
  webBoardHeader: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  webBoardLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  webBoardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4A7BF7',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  webBoardBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  webBoardInfo: {
    padding: 15,
  },
  webBoardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  webBoardFullName: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 8,
    textAlign: 'center',
  },
  webBoardDescription: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  webBoardMeta: {
    marginBottom: 12,
  },
  webBoardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  webBoardMetaText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginLeft: 4,
  },
  webBoardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  webTeacherCount: {
    fontSize: 12,
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
  },
  webPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  webPageBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  webPageBtnDisabled: {
    opacity: 0.5,
  },
  webPageText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },

  // Mobile Styles
  mobileContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mobileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
    marginLeft: 15,
  },
  mobileSubtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  mobileSearchSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  mobileSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  mobileSearchIcon: {
    marginRight: 10,
  },
  mobileSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  mobileBoardsList: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  mobileBoardCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    marginBottom: 15,
    overflow: 'hidden',
  },
  mobileBoardHeader: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  mobileBoardLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
  },
  mobileBoardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4A7BF7',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  mobileBoardBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  mobileBoardInfo: {
    padding: 15,
  },
  mobileBoardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  mobileBoardFullName: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 8,
    textAlign: 'center',
  },
  mobileBoardDescription: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  mobileBoardMeta: {
    marginBottom: 12,
  },
  mobileBoardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mobileBoardMetaText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginLeft: 4,
  },
  mobileBoardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  mobileTeacherCount: {
    fontSize: 12,
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
  },
  mobilePagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  mobilePageBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mobilePageBtnDisabled: {
    opacity: 0.5,
  },
  mobilePageText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.25)',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginRight: 10,
  },
  postBtn: {
    backgroundColor: '#4A7BF7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#4A7BF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: 'Poppins_400Regular',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reportBtn: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
