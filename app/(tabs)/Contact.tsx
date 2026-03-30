import React, { useState } from "react";
import {
  Alert,
  View,
  StyleSheet,
  TextInput,
  Linking,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons, FontAwesome, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import BackButton from "../../components/BackButton";
import TeacherWebHeader from '../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../components/ui/TeacherWebSidebar';
import { getAuthData } from '../../utils/authStorage';

const Contact = () => {
  const [message, setMessage] = useState("");
  const navigation = useNavigation();
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [sidebarActiveItem, setSidebarActiveItem] = useState('Contact');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Load teacher data for web header and sidebar
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const loadTeacherData = async () => {
        try {
          const authData = await getAuthData();
          if (authData?.name) {
            setTeacherName(authData.name);
          }
          if (authData?.profileImage) {
            setProfileImage(authData.profileImage);
          }
          if (authData?.email) {
            setUserEmail(authData.email);
          }
        } catch (error) {
          console.error('Error loading teacher data:', error);
        }
      };
      loadTeacherData();
    }
  }, []);

  // Handle sidebar navigation
  const handleSidebarSelect = (item: string) => {
    setSidebarActiveItem(item);
    // Handle navigation for sidebar items
    switch (item) {
      case 'Dashboard':
        router.push('/(tabs)/TeacherDashBoard/TutorDashboardWeb');
        break;
      case 'subjects':
        router.push('/(tabs)/TeacherDashBoard/SubjectsListWeb');
        break;
      case 'students':
        router.push('/(tabs)/TeacherDashBoard/StudentsEnrolled');
        break;
      case 'joinedDate':
        router.push('/(tabs)/TeacherDashBoard/JoinedDateWeb');
        break;
      case 'Create Subject':
        router.push('/(tabs)/TeacherDashBoard/CreateSubject');
        break;
      case 'Settings':
        router.push('/(tabs)/TeacherDashBoard/Settings');
        break;
      case 'Contact':
        // Already on this page
        break;
      default:
        console.log('Navigate to:', item);
    }
  };
  
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleSubmit = async () => {
    const email = "contact@gogrowsmart.com";
    const subject = "User Problem Report";
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

    if (message.trim() === "") {
      Alert.alert("Error", "Please enter your problem before submitting");
      return;
    }

    Linking.openURL(mailto).catch((err) => Alert.alert("Error", "Could not open email client"));
  };

  return (
    // Web Layout - Only show on web
    Platform.OS === 'web' ? (
      <View style={styles.webLayout}>
        {/* Web Header */}
        <TeacherWebHeader 
          teacherName={teacherName}
          profileImage={profileImage}
          showSearch={true}
        />
        
        {/* Main Content with Sidebar */}
        <View style={styles.webContent}>
          {/* Sidebar */}
          <TeacherWebSidebar 
            teacherName={teacherName}
            profileImage={profileImage}
            activeItem={sidebarActiveItem}
            onItemPress={handleSidebarSelect}
            userEmail={userEmail || ''}
          />
          
          {/* Main Content Area */}
          <View style={styles.webMainContent}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <View style={styles.container}>
                {/* Mobile Header - Only show on non-web platforms */}
                {Platform.OS !== 'web' && (
                  <View style={styles.header}>
                    <View style={styles.headerTextContainer}>
                      <Text style={styles.headerTitle}>Get in Touch !</Text>
                      <Text style={styles.headerSubtitle}>We'd love to hear from you .</Text>
                    </View>
                    <BackButton size={hp('3.8%')} color="black" onPress={() => navigation.goBack()} style={styles.crossIcon} />
                  </View>
                )}

                {/* Input Card */}
                <View style={styles.card}>
                  <TextInput
                    style={styles.input}
                    placeholder="Write us a message ..."
                    placeholderTextColor="#626a79"
                    multiline
                    value={message}
                    onChangeText={setMessage}
                    numberOfLines={8}
                  />
                  <TouchableOpacity onPress={handleSubmit} style={styles.sendButton}>
                    <Text style={styles.sendButtonText}>Send</Text>
                  </TouchableOpacity>
                </View>

                {/* Contact Info - Email Only */}
                <View style={styles.contactInfo}>
                  <View style={styles.contactItem}>
                    <View style={styles.iconCircle}><Ionicons name="mail" size={20} color="#4f46e5" /></View>
                    <Text style={styles.contactText}>contact@gogrowsmart.com</Text>
                  </View>
                </View>

                {/* Social Media Section */}
                <View style={styles.socialSection}>
                  <Text style={styles.socialTitle}>Follow Us on</Text>
                  <View style={styles.socialIcons}>
                    <TouchableOpacity style={styles.socialButton}><FontAwesome name="facebook-f" size={24} color="#4255ff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}><FontAwesome name="instagram" size={24} color="#E4405F" /></TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}><FontAwesome name="linkedin" size={24} color="#0077B5" /></TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                      <FontAwesome6 name="x-twitter" size={24} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    ) : (
      // Mobile Layout
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Get in Touch !</Text>
              <Text style={styles.headerSubtitle}>We'd love to hear from you .</Text>
            </View>
            <BackButton size={hp('3.8%')} color="black" onPress={() => navigation.goBack()} style={styles.crossIcon} />
          </View>

          {/* Input Card */}
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Write us a message ..."
              placeholderTextColor="#626a79"
              multiline
              value={message}
              onChangeText={setMessage}
              numberOfLines={8}
            />
            <TouchableOpacity onPress={handleSubmit} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>

          {/* Contact Info - Email Only */}
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <View style={styles.iconCircle}><Ionicons name="mail" size={20} color="#4f46e5" /></View>
              <Text style={styles.contactText}>contact@gogrowsmart.com</Text>
            </View>
          </View>

          {/* Social Media Section */}
          <View style={styles.socialSection}>
            <Text style={styles.socialTitle}>Follow Us on</Text>
            <View style={styles.socialIcons}>
              <TouchableOpacity style={styles.socialButton}><FontAwesome name="facebook-f" size={24} color="#4255ff" /></TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}><FontAwesome name="instagram" size={24} color="#E4405F" /></TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}><FontAwesome name="linkedin" size={24} color="#0077B5" /></TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome6 name="x-twitter" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    )
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, backgroundColor: "#f3f4f6", paddingHorizontal: wp('5%'), paddingVertical: hp('4%'), paddingTop: hp('12%') },
  // Web-specific styles
  webLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  webContent: {
    flex: 1,
    flexDirection: 'row',
  },
  webMainContent: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: { 
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: hp('4%'),
},
  headerTitle: { fontSize: wp('7%'), color: "#030303", fontFamily: 'Poppins_700Bold' },
  headerSubtitle: { fontSize: wp('3.5%'), color: "#6b7280", fontFamily: 'Poppins_400Regular' },
  card: { backgroundColor: "#ffffff", borderRadius: 16, padding: wp('5%'), marginBottom: hp('3%'), shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  input: { height: hp('15%'), borderColor: "#f3f4f6", borderWidth: 1, borderRadius: 12, paddingHorizontal: wp('4%'), paddingVertical: hp('2%'), textAlignVertical: "top", backgroundColor: "#f9fafb", fontSize: wp('3.8%'), color: "#1f2937", marginBottom: hp('2%'), fontFamily: 'Poppins_400Regular' },
  sendButton: { backgroundColor: "#4f46e5", paddingVertical: hp('1.5%'), borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sendButtonText: { color: "#ffffff", fontSize: wp('4.2%'), fontFamily: 'Poppins_600SemiBold' },
  contactInfo: { 
    backgroundColor: "#ffffff", 
    borderRadius: 16, 
    padding: wp('5%'), 
    marginBottom: hp('3%'), 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactItem: { 
    flexDirection: "row", 
    alignItems: "center",
    width: '100%',
    justifyContent: 'center',
  },
  iconCircle: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: "#e0e7ff", 
    justifyContent: "center", 
    alignItems: "center", 
    marginRight: wp('3%') 
  },
  contactText: { 
    flex: 1, 
    fontSize: wp('3.5%'), 
    color: "#4f46e5", 
    fontFamily: 'Poppins_500SemiBold',
    textAlign: 'center',
    paddingVertical: 4,
  },
  socialSection: { alignItems: "center" },
  socialTitle: { fontSize: wp('5.5%'), color: "#030303", marginBottom: hp('2%'), fontFamily: 'Poppins_700Bold' },
  socialIcons: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: wp('4%') },
  socialButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp('4%'),
  },
  
  // Update header style to remove marginBottom
 
  headerTextContainer: {
  flex: 1,
  alignItems: 'center'
},
crossIcon: {
  marginLeft: 10, // Change this number to move cross more right
},

});

export default Contact;