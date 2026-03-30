import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuthData } from '../../../utils/authStorage';
import { BASE_URL } from '../../../config';
import WebHeader from '../../../components/ui/TeacherWebHeader';
import WebSidebar from '../../../components/ui/TeacherWebSidebar';
import { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Feather, FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window')
const ICON_SIZE = wp(16)

const items = [
  { id: "1", title: "Copy", icon: "copy", iconType: "Feather", color: "#6C757D" },
  { id: "2", title: "Messenger", icon: "facebook-messenger", iconType: "FontAwesome6", color: "#7B61FF" },
  { id: "3", title: "Linkedin", icon: "linkedin", iconType: "FontAwesome", color: "#0A66C2" },
  { id: "4", title: "Facebook", icon: "facebook", iconType: "FontAwesome", color: "#1877F2" },
  { id: "5", title: "WhatsApp", icon: "whatsapp", iconType: "FontAwesome", color: "#25D366" },
  { id: "6", title: "Mail", icon: "mail", iconType: "Feather", color: "#EA4335" },
]

// Global Design Tokens
const COLORS = {
  background: '#F5F7FB',
  cardBg: '#FFFFFF',
  primaryBlue: '#3B5BFE',
  gradientBlueStart: '#4F6EF7',
  gradientBlueEnd: '#3B5BFE',
  border: '#E5E7EB',
  textDark: '#111827',
  textSecondary: '#6B7280',
  white: '#FFFFFF',
};

const Share = () => {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [auth, setAuth] = useState<any>(null);
  const [sidebarActiveItem, setSidebarActiveItem] = useState("Share");

  // Fetch teacher data
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const authData = await getAuthData();
        if (authData?.token) {
          setAuth(authData);
          setTeacherName(authData.name || '');
          setProfileImage(authData.profileImage || null);
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      }
    };

    fetchTeacherData();
  }, []);

  const handleSelect = (item: string) => {
    setSidebarActiveItem(item);
    // Handle navigation for sidebar items
    switch (item) {
      case 'Dashboard':
        router.push('/(tabs)/TeacherDashBoard/TutorDashboardWeb');
        break;
      case 'My Students':
        router.push('/(tabs)/TeacherDashBoard/StudentsEnrolled');
        break;
      case 'My Subjects':
        router.push('/(tabs)/TeacherDashBoard/SubjectsListWeb');
        break;
      case 'Create Subject':
        router.push('/(tabs)/TeacherDashBoard/CreateSubject');
        break;
      case 'Spotlights':
        router.push('/(tabs)/TeacherDashBoard/JoinedDateWeb');
        break;
      case 'Share':
        // Already on this page
        break;
      case 'Billing':
        router.push('/(tabs)/TeacherDashBoard/Settings');
        break;
      case 'Settings':
        router.push('/(tabs)/TeacherDashBoard/Settings');
        break;
      case 'Contact Us':
        router.push('/(tabs)/Contact');
        break;
      default:
        console.log('Navigate to:', item);
    }
  };

  const handleShare = (item: { id?: string; title: any; icon?: string; iconType?: string; color?: string }) => {
    console.log(`Sharing via ${item.title}`)
  }

  const renderIcon = (item: { id?: string; title?: string; icon: any; iconType: any; color: any }) => {
    const IconComponent = item.iconType === "Feather" ? Feather : item.iconType === "FontAwesome6" ? FontAwesome6 : FontAwesome
    return <IconComponent name={item.icon} size={ICON_SIZE * 0.5} color="#FFFFFF" />
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebHeader 
        teacherName={teacherName}
        profileImage={profileImage}
      />
      
      <View style={styles.contentLayout}>
        <WebSidebar 
          teacherName={teacherName}
          profileImage={profileImage}
          activeItem={sidebarActiveItem}
          onItemPress={handleSelect}
          userEmail={auth?.email || ''}
        />
        
        <View style={styles.mainWrapper}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Share</Text>
            <Text style={styles.pageSubtitle}>Share your profile with others</Text>
          </View>
          
          {/* Teacher Thoughts Section */}
          <TeacherThoughtsBackground>
            <View style={styles.shareContainer}>
              <Image source={require('../../../assets/image/share.png')} style={styles.shareImage} resizeMode="contain" />
              
              <View style={styles.shareGrid}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.shareItem, { backgroundColor: item.color }]}
                    onPress={() => handleShare(item)}
                  >
                    {renderIcon(item)}
                    <Text style={styles.shareItemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TeacherThoughtsBackground>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pageHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: 'Poppins_700Bold',
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  shareContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 32,
  },
  shareImage: {
    width: 200,
    height: 200,
    marginBottom: 32,
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
  },
  shareItem: {
    width: 100,
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 8,
  },
  shareItemText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
})

export default Share;