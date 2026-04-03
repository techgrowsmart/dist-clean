import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View, Linking, Platform } from "react-native";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import BillIcon from "../../../assets/svgIcons/Bill";
import ContactPhoneIcon from "../../../assets/svgIcons/ContactPhone";
import FaqIcon from "../../../assets/svgIcons/FaqIcon";
import LogoutIcon from "../../../assets/svgIcons/Logout";
import PrivacyAndPolicy from "../../../assets/svgIcons/PrivacyandPolicy";
import ShareIcon from "../../../assets/svgIcons/Share";
import SubscriptionIcon from "../../../assets/svgIcons/SubscriptionIcon";
import Terms from "../../../assets/svgIcons/Terms";
import TutorCap from "../../../assets/svgIcons/TutorCap";
import { clearAllStorage } from "../../../utils/authStorage";
import Toast from "react-native-toast-message";
import { styles } from "./Student";

const menuItems = [
  { name: "My Tuitions", icon: TutorCap },
  { name: "Share", icon: ShareIcon },
  { name: "Subscription", icon: SubscriptionIcon },
  { name: "Billing", icon: BillIcon },
  { name: "Faq", icon: FaqIcon },
  { name: "Terms & Conditions", icon: Terms },
  { name: "Privacy Policy", icon: PrivacyAndPolicy },
  { name: "Contact Us", icon: ContactPhoneIcon },
];

type SidebarProps = {
  visible: boolean;
  onClose: () => void;
  activeItem: string;
  onItemPress: (itemName: string) => void;
  userEmail: string;
  studentName: string;
  profileImage: string | null;
};

const Sidebar = ({ visible, onClose, activeItem, onItemPress, userEmail, studentName, profileImage }: SidebarProps) => {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const isWeb = Platform.OS === 'web';

  if (!visible && !isWeb) return null;

  const handleLogout = () => setShowLogoutModal(true);

  // Render a persistent   sidebar for web (like teacher's sidebar)
  if (isWeb) {
    return (
      <View style={styles.container}>
        <View style={styles.webSidebar}>
          <View style={styles.webProfileSection}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.webProfilePlaceholder}>
                <Text style={styles.webProfileInitial}>{studentName ? studentName[0]?.toUpperCase() : '?'}</Text>
              </View>
            )}
            <Text style={styles.webStudentName}>{studentName || 'Student'}</Text>
          </View>

          <View style={styles.webMenuItems}>
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              const isActive = activeItem === item.name;
              return (
                <TouchableOpacity key={index} onPress={() => handleItemPress(item.name)} style={[styles.webNavItem, isActive && styles.webNavItemActive]}>
                  <IconComponent size={20} color={isActive ? '#FFF' : '#374151'} />
                  <Text style={[styles.webNavText, isActive && styles.webNavTextActive]}>{item.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.webFooter}>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:support@gogrowsmart.com?subject=Complaint')}>
              <Text style={styles.webFooterLink}>Raise a Complaint</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.webLogoutRow}>
              <LogoutIcon size={18} color="#374151" />
              <Text style={styles.webLogoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const handleItemPress = (itemName: string) => {
    if (itemName === "Terms & Conditions") {
      Linking.openURL("https://gogrowsmart.com/terms-and-conditions");
    } else if (itemName === "Privacy Policy") {
      Linking.openURL("https://gogrowsmart.com/privacy-policy");
    } else {
      onItemPress(itemName);
    }
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await clearAllStorage();
      
      if (Platform.OS === "web") {
        // Force redirect to login page on web
        window.location.href = '/login';
      } else {
        router.replace("/(tabs)/LoginScreen");
      }
      
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out.',
        position: 'bottom',
        visibilityTime: 2000,
      });
      onClose();
    } catch (error) {
      console.error("Logout error:", error);
      Toast.show({
        type: 'error',
        text1: 'Logout Error',
        text2: 'There was an error logging out. Please try again.',
        position: 'bottom',
        visibilityTime: 3000,
      });
      // Still try to navigate even if storage clear fails
      if (Platform.OS === "web") {
        window.location.href = '/login';
      } else {
        router.replace("/(tabs)/LoginScreen");
      }
      onClose();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ position: "absolute", top: hp('5%'), left: 0, right: 0, bottom: hp('10%'), zIndex: 99, justifyContent: "flex-start" }}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: wp('35%'), height: hp('85%'), backgroundColor: "#3131b0", paddingHorizontal: wp('3%'), paddingTop: hp('2%'), paddingBottom: hp('2%'), zIndex: 100, justifyContent: "space-between" }}>
        
        {/* Profile Section at Top */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: hp('2%') }}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={{ width: wp('12%'), height: wp('12%'), borderRadius: wp('6%'), borderWidth: 1, borderColor: "#FFF" }} />
          ) : (
            <View style={{ width: wp('12%'), height: wp('12%'), borderRadius: wp('6%'), borderWidth: 1, borderColor: "#FFF", backgroundColor: "#9CA3AF", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: wp('4.5%'), color: "#FFF", fontWeight: "600", fontFamily: "Poppins" }}>
                {studentName ? studentName[0]?.toUpperCase() : "?"}
              </Text>
            </View>
          )}
        </View>

        {/* Menu Items - Vertical Column with Icons on Top, Text Below */}
        <View style={{ flex: 1, justifyContent: "flex-start" }}>
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = activeItem === item.name;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleItemPress(item.name)}
                style={{
                  backgroundColor: isActive ? "#FF7B42" : "#5f5fff",
                  paddingVertical: hp('1.5%'),
                  borderRadius: wp('1.5%'),
                  marginBottom: hp('1.2%'),
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  height: hp('7%')
                }}
              >
                <View style={{ marginBottom: hp('0.3%') }}>
                  <IconComponent size={wp('4%')} color="#FFF" />
                </View>
                <Text style={{
                  fontSize: wp('2.5%'),
                  color: "#FFF",
                  fontFamily: "Poppins",
                  fontWeight: isActive ? "600" : "400",
                  textAlign: "center",
                }}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Raise a Complaint Text */}
        <TouchableOpacity 
          style={{ marginBottom: hp('1%'), marginTop: hp('0.5%') }}
          onPress={() => {
            Linking.openURL("mailto:support@gogrowsmart.com?subject=Complaint&body=Please describe your issue here...");
          }}
        >
          <Text style={{ fontSize: wp('3%'), color: "#FFF", fontFamily: "Poppins", fontWeight: "400", textDecorationLine: "underline" }}>
            Raise a Complaint
          </Text>
        </TouchableOpacity>

        {/* Logout Button at Bottom */}
        <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", paddingVertical: hp('1%') }} onPress={handleLogout}>
          <LogoutIcon size={wp('4%')} color="#FFF" />
          <Text style={{ fontSize: wp('3.2%'), color: "#FFF", fontWeight: "600", marginLeft: wp('1.2%'), fontFamily: "Poppins" }}>
            Log Out
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Logout Modal */}
      {showLogoutModal && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center", zIndex: 1000, paddingHorizontal: wp('8%') }}>
          <TouchableOpacity style={{ position: "absolute", top: hp('6%'), right: wp('6%'), zIndex: 1001, backgroundColor: "#F3F4F6", width: wp('8%'), height: wp('8%'), borderRadius: wp('4%'), justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }} onPress={() => setShowLogoutModal(false)}>
            <Text style={{ fontSize: wp('4%'), fontWeight: "600", color: "#6B7280", fontFamily: "Poppins" }}>×</Text>
          </TouchableOpacity>
          <Text style={{ color: "#111827", fontSize: wp('5%'), fontWeight: "700", textAlign: "center", fontFamily: "Poppins", marginBottom: hp('2%') }}>
            Are you sure you want to sign out?
          </Text>
          <Text style={{ color: "#6B7280", fontSize: wp('3.2%'), textAlign: "center", marginBottom: hp('4%'), paddingHorizontal: wp('4%'), lineHeight: hp('2.8%'), fontFamily: "Poppins", fontWeight: "400" }}>
            You will need to log back in to access your personalized learning dashboard and live classes.
          </Text>
          <View style={{ width: "100%", alignItems: "center" }}>
            <TouchableOpacity 
              style={{ 
                width: wp('70%'), 
                paddingVertical: hp('1.8%'), 
                borderRadius: wp('2%'), 
                backgroundColor: isLoggingOut ? "#9CA3AF" : "#EF4444", 
                justifyContent: "center", 
                alignItems: "center", 
                shadowColor: "#000", 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: 0.1, 
                shadowRadius: 8, 
                elevation: 4 
              }} 
              onPress={confirmLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Text style={{ color: "#FFF", fontSize: wp('3.5%'), fontWeight: "600", fontFamily: "Poppins" }}>
                  Logging Out...
                </Text>
              ) : (
                <Text style={{ color: "#FFF", fontSize: wp('3.5%'), fontWeight: "600", fontFamily: "Poppins" }}>
                  Confirm Log Out
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Sidebar;

