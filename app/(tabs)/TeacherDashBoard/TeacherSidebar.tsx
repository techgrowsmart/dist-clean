import BillIcon from "../../../assets/svgIcons/Bill";
import Book from "../../../assets/svgIcons/Book";
import ContactPhoneIcon from "../../../assets/svgIcons/ContactPhone";
import LogoutIcon from "../../../assets/svgIcons/Logout";
import SparkleSettingsIcon from "../../../assets/svgIcons/SettingsIcon";
import ShareIcon from "../../../assets/svgIcons/Share";
import Spotlight from "../../../assets/svgIcons/SpotlightIcon";
import { clearAllStorage } from "../../../utils/authStorage";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Terms from "../../../assets/svgIcons/Terms";
import PrivacyAndPolicy from "../../../assets/svgIcons/PrivacyandPolicy";

const menuItems = [
  { name: "Spotlight", icon: Spotlight },
  { name: "Share", icon: ShareIcon },
  // { name: "Add on Class", icon: ClassIcon },
  { name: "Settings", icon: SparkleSettingsIcon },
  { name: "Create Subject", icon: Book },
  { name: "Billing", icon: BillIcon },
  { name: "Contact", icon: ContactPhoneIcon },
    { name: "Terms & Conditions", icon: Terms },
  { name: "Privacy Policy", icon: PrivacyAndPolicy },
];

type SidebarProps = {
  visible: boolean;
  onClose: () => void;
  activeItem: string;
  onItemPress: (itemName: string) => void;
  userEmail: string;
  teacherName: string;
  profileImage: string | null;
};

const SidebarMenu = ({
  visible,
  onClose,
  activeItem,
  onItemPress,
  userEmail,
  teacherName,
  profileImage,
}: SidebarProps) => {
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const router = useRouter();
  if (!visible) return null;

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleItemPress = (itemName: string) => {
    if (itemName === "Terms & Conditions") {
      // Open terms and conditions in browser
      Linking.openURL("https://gogrowsmart.com/terms-and-conditions");
    } else if (itemName === "Privacy Policy") {
      // Open privacy policy in browser
      Linking.openURL("https://gogrowsmart.com/privacy-policy");
    } else {
      // Handle other menu items normally
      onItemPress(itemName);
    }
  };

  const confirmLogout = async () => {
    try {
      await clearAllStorage();
      router.replace("/");
      onClose();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const rows = [];
  for (let i = 0; i < menuItems.length; i += 2) {
    rows.push(menuItems.slice(i, i + 2));
  }

  return (
    <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.overlay}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.sidebar}>
        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((item, index) => {
                const IconComponent = item.icon;
                const isActive = activeItem === item.name;
                return (
                  <TouchableOpacity
                    key={`${rowIndex}-${index}`}
                    onPress={() => handleItemPress(item.name)}
                    style={[styles.card, isActive && styles.activeCard]}
                  >
                    <IconComponent size={wp('5%')} color="#FFF" />
                    <Text 
                      style={[styles.cardText, isActive && styles.activeCardText]}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {row.length === 1 && <View style={styles.cardPlaceholder} />}
            </View>
          ))}
        </View>

        {/* Profile Section */}
        <View style={styles.profileContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.initialText}>
                {teacherName ? teacherName[0]?.toUpperCase() : "?"}
              </Text>
            </View>
          )}
          <View style={styles.profileDetails}>
            <Text style={styles.helloText}>Hello</Text>
            <Text 
              style={styles.teacherName} 
              numberOfLines={1} 
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {teacherName}
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogoutIcon size={wp('5%')} color="#FFF" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Logout Modal */}
      {showLogoutModal && (
        <View style={styles.fullscreenModal}>
          <TouchableOpacity style={styles.closeIcon} onPress={() => setShowLogoutModal(false)}>
            <Text style={styles.closeIconText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.fullscreenTitle}>Are you sure you want to sign out?</Text>
          <Text style={styles.fullscreenSubtext}>
            You will need to log back in to access your personalized teaching dashboard and classes.
          </Text>
          <View style={styles.fullscreenButtonContainer}>
            <TouchableOpacity style={[styles.fullscreenButton, styles.fullscreenLogout]} onPress={confirmLogout}>
              <Text style={styles.fullscreenButtonText}>Confirm Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const CARD_GAP = wp('2%');
const CARD_MARGIN = CARD_GAP / 2;

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: hp('5%'), left: 0, right: 0, bottom: 0, zIndex: 99, justifyContent: "flex-start" },
  sidebar: { width: wp('50%'), minHeight: hp('60%'), backgroundColor: "#3131b0", padding: CARD_GAP, zIndex: 100, justifyContent: "space-between" },
  menuContainer: { flex: 1, justifyContent: "flex-start" },
  row: { flexDirection: "row", marginBottom: CARD_GAP, minHeight: hp('8%') },
  card: { flex: 1, backgroundColor: "#5f5fff", paddingVertical: hp('1.5%'), alignItems: "center", justifyContent: "center", marginHorizontal: CARD_MARGIN, minHeight: hp('7%'), borderRadius: wp('1%') },
  activeCard: { backgroundColor: "#FF7B42" },
  cardText: { fontSize: wp('2.8%'), color: "#FFF", marginTop: hp('0.5%'), textAlign: "center", fontFamily: "Poppins", fontWeight: "400", lineHeight: hp('1.8%'), includeFontPadding: false, textAlignVertical: "center" },
  activeCardText: { color: "#FFF", fontWeight: "600", fontFamily: "Poppins" },
  cardPlaceholder: { flex: 1, marginHorizontal: CARD_MARGIN },
  profileContainer: { flexDirection: "row", alignItems: "center", marginBottom: hp('1%'), marginTop: hp('1%'), minHeight: hp('8%') },
  profileImage: { width: wp('16%'), height: wp('16%'), borderRadius: wp('16%'), borderWidth: 1, borderColor: "#FFF" },
  placeholderImage: { width: wp('12%'), height: wp('12%'), borderRadius: wp('6%'), borderWidth: 1, borderColor: "#FFF", backgroundColor: "#9CA3AF", alignItems: "center", justifyContent: "center" },
  initialText: { fontSize: wp('4%'), color: "#FFF", fontWeight: "600", fontFamily: "Poppins" },
  profileDetails: { marginLeft: wp('3%'), flex: 1, justifyContent: "center" },
  helloText: { fontSize: wp('5.2%'), color: "#FFF", fontFamily: "Poppins", fontWeight: "400",  },
  teacherName: { fontSize: wp('5%'), color: "#FFF", fontWeight: "600", fontFamily: "Poppins", includeFontPadding: false, textAlignVertical: "center" },
  logoutButton: { flexDirection: "row", alignItems: "center", paddingVertical: hp('1%'), minHeight: hp('6%') },
  logoutText: { fontSize: wp('3.8%'), color: "#FFF", fontWeight: "600", marginLeft: wp('2%'), fontFamily: "Poppins", includeFontPadding: false },
  fullscreenModal: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center", zIndex: 1000, paddingHorizontal: wp('8%') },
  fullscreenTitle: { color: "#111827", fontSize: wp('5%'), fontWeight: "700", textAlign: "center", fontFamily: "Poppins", marginBottom: hp('2%') },
  fullscreenSubtext: { color: "#6B7280", fontSize: wp('3.2%'), textAlign: "center", marginBottom: hp('4%'), paddingHorizontal: wp('4%'), lineHeight: hp('2.8%'), fontFamily: "Poppins", fontWeight: "400" },
  fullscreenButtonContainer: { width: "100%", alignItems: "center" },
  fullscreenButton: { width: wp('70%'), paddingVertical: hp('1.8%'), borderRadius: wp('2%'), backgroundColor: "#4F46E5", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  fullscreenLogout: { backgroundColor: "#EF4444" },
  fullscreenButtonText: { color: "#FFF", fontSize: wp('3.5%'), fontWeight: "600", fontFamily: "Poppins" },
  closeIcon: { position: "absolute", top: hp('6%'), right: wp('6%'), zIndex: 1001, backgroundColor: "#F3F4F6", width: wp('8%'), height: wp('8%'), borderRadius: wp('4%'), justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  closeIconText: { fontSize: wp('4%'), fontWeight: "600", color: "#6B7280", fontFamily: "Poppins" },
});

export default SidebarMenu;