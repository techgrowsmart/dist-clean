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
                {teacherName ? teacherName[0]?.toUpperCase() : "?"}
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
        <Text style={{ fontSize: wp('3%'), color: "#FFF", fontFamily: "Poppins", fontWeight: "400", marginBottom: hp('1%'), marginTop: hp('0.5%') }}>
          Raise a Complaint
        </Text>

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
            You will need to log back in to access your personalized teaching dashboard and live classes.
          </Text>
          <View style={{ width: "100%", alignItems: "center" }}>
            <TouchableOpacity style={{ width: wp('70%'), paddingVertical: hp('1.8%'), borderRadius: wp('2%'), backgroundColor: "#EF4444", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }} onPress={confirmLogout}>
              <Text style={{ color: "#FFF", fontSize: wp('3.5%'), fontWeight: "600", fontFamily: "Poppins" }}>
                Confirm Log Out
              </Text>
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