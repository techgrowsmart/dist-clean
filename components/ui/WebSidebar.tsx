import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Linking, Platform, ImageBackground, Image, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { clearAllStorage } from "../../utils/authStorage";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

type WebSidebarProps = {
  activeItem: string;
  onItemPress: (itemName: string) => void;
  userEmail: string;
  studentName: string;
  profileImage: string | null;
};

const C = {
  primary: '#3B5BFE',
  text: '#1A1A1A',
  muted: '#6B7280',
  active: '#EEF2FF',
  divider: '#EBEBEB',
  border: '#F0F0F0',
};

const menuItems = [
  { name: "My Tuitions",         icon: <MaterialIcons name="school" size={20} /> },
  { name: "Connect",             icon: <Ionicons name="chatbubble-ellipses-outline" size={20} /> },
  { name: "Share",               icon: <Ionicons name="share-social-outline" size={20} /> },
  { name: "Subscription",       icon: <MaterialIcons name="loyalty" size={20} /> },
  { name: "Billing",            icon: <MaterialIcons name="receipt-long" size={20} /> },
  { name: "Faq",                icon: <MaterialIcons name="help-outline" size={20} /> },
  { name: "Terms & Conditions", icon: <MaterialIcons name="description" size={20} /> },
  { name: "Privacy Policy",     icon: <MaterialIcons name="privacy-tip" size={20} /> },
  { name: "Contact Us",         icon: <MaterialIcons name="contact-phone" size={20} /> },
  { name: "Raise a Complaint",  icon: <MaterialCommunityIcons name="alert-decagram-outline" size={20} /> },
];

const WebSidebar = ({ activeItem, onItemPress, userEmail, studentName, profileImage }: WebSidebarProps) => {
  const router = useRouter();

  const handleItemPress = (itemName: string) => {
    // First handle external links and special actions
    if (itemName === "Terms & Conditions") {
      Linking.openURL("https://gogrowsmart.com/terms-and-conditions");
      return;
    }

    if (itemName === "Privacy Policy") {
      Linking.openURL("https://gogrowsmart.com/privacy-policy");
      return;
    }

    if (itemName === "Raise a Complaint") {
      Linking.openURL("mailto:support@gogrowsmart.com?subject=Complaint&body=Please describe your issue here...");
      return;
    }

    if (itemName === "Log Out") {
      handleLogout();
      return;
    }

    // Internal routing for common items (make web sidebar behave like android)
    switch (itemName) {
      case 'Home':
        router.push("/(tabs)/StudentDashBoard/Student");
        break;
      case 'My Tuitions':
        router.push("/(tabs)/StudentDashBoard/MyTuitions");
        break;
      case 'Connect':
        router.push("/(tabs)/StudentDashBoard/ConnectWeb");
        break;
      case 'Profile':
        router.push("/(tabs)/StudentDashBoard/Profile");
        break;
      case 'Billing':
        router.push("/(tabs)/Billing");
        break;
      case 'Faq':
        router.push("/(tabs)/StudentDashBoard/Faq");
        break;
      case 'Share':
        router.push({ pathname: "/(tabs)/StudentDashBoard/Share", params: { userEmail, studentName, profileImage } } as any);
        break;
      case 'Subscription':
        router.push({ pathname: "/(tabs)/StudentDashBoard/Subscription", params: { userEmail } } as any);
        break;
      case 'Contact Us':
        router.push("/(tabs)/Contact");
        break;
      case 'Help & Support':
        router.push("/(tabs)/Contact");
        break;
      default:
        // Fallback to parent handler for any unhandled menu names
        onItemPress(itemName);
        break;
    }
  };

  const handleLogout = async () => {
    try {
      await clearAllStorage();
      if (Platform.OS === "web") {
        window.location.href = '/login';
      } else {
        router.replace("/(tabs)/LoginScreen");
      }
      Toast.show({ type: 'success', text1: 'Logged Out', text2: 'You have been successfully logged out.', position: 'bottom', visibilityTime: 2000 });
    } catch (error) {
      console.error("Logout error:", error);
      Toast.show({ type: 'error', text1: 'Logout Error', text2: 'There was an error logging out. Please try again.', position: 'bottom', visibilityTime: 3000 });
    }
  };

  const MenuItem = ({ name, iconEl, isActive }: { name: string; iconEl: React.ReactElement; isActive: boolean }) => (
    <TouchableOpacity onPress={() => handleItemPress(name)} style={[s.item, isActive && s.itemActive]}>
      <View style={s.iconWrap}>
        {React.cloneElement(iconEl, { color: isActive ? C.primary : C.text })}
      </View>
      <Text style={[s.itemText, isActive && s.itemTextActive]}>{name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Home */}
        <MenuItem name="Home" iconEl={<Ionicons name="home-outline" size={20} />} isActive={activeItem === "Home"} />

        {/* Profile with avatar */}
        <TouchableOpacity onPress={() => handleItemPress("Profile")} style={[s.item, activeItem === "Profile" && s.itemActive]}>
          <View style={s.avatar}>
            {profileImage
              ? <Image source={{ uri: profileImage }} style={{ width: 28, height: 28, borderRadius: 14 }} />
              : <Ionicons name="person-circle-outline" size={24} color={C.muted} />}
          </View>
          <Text style={[s.itemText, activeItem === "Profile" && s.itemTextActive]}>Profile</Text>
        </TouchableOpacity>

        <View style={s.divider} />

        {/* Favorites section */}
        <Text style={s.sectionLabel}>Favorites</Text>
        {menuItems.map((item, i) => (
          <MenuItem key={i} name={item.name} iconEl={item.icon} isActive={activeItem === item.name} />
        ))}

        <View style={s.divider} />

        {/* Advertising card */}
        <View style={s.adCard}>
          <Text style={s.adLabel}>Advertising</Text>
          <ImageBackground source={require('../../assets/images/Popular1.png')} style={s.adImg} imageStyle={{ borderRadius: 8 }}>
            <View style={s.adOverlay}>
              <Text style={s.adImgTitle}>Summer sale is on!</Text>
              <Text style={s.adImgDesc}>Up to 70% off — limited time offer</Text>
            </View>
          </ImageBackground>
          <Text style={s.adTitle}>Summer sale is on!</Text>
          <Text style={s.adDesc}>Buy your loved pieces with reduced prices up to 70% off!</Text>
        </View>

        <View style={s.divider} />

        {/* Bottom actions */}
        <MenuItem name="Help & Support" iconEl={<Ionicons name="help-circle-outline" size={20} />} isActive={false} />
        <TouchableOpacity onPress={handleLogout} style={s.item}>
          <View style={s.iconWrap}><Ionicons name="log-out-outline" size={20} color={C.text} /></View>
          <Text style={s.itemText}>Log out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { width: Platform.OS === 'web' ? 240 : undefined, minWidth: 200, maxWidth: 260, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: C.border, flex: 1, cursor: 'auto' as any },
  scroll: { paddingVertical: 16 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginHorizontal: 8, marginBottom: 2, cursor: 'auto' as any },
  itemActive: { backgroundColor: C.active },
  iconWrap: { width: 24, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  itemText: { marginLeft: 12, fontSize: 14, color: C.text, fontFamily: 'Poppins_400Regular', flex: 1 },
  itemTextActive: { color: C.primary, fontFamily: 'Poppins_600SemiBold' },
  sectionLabel: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 13, fontWeight: '700', color: C.text, fontFamily: 'Poppins_700Bold' },
  divider: { height: 1, backgroundColor: C.divider, marginVertical: 8, marginHorizontal: 16 },
  adCard: { marginHorizontal: 12, marginVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: C.divider, padding: 10, backgroundColor: '#fff' },
  adLabel: { fontSize: 12, fontWeight: '700', color: C.text, fontFamily: 'Poppins_700Bold', marginBottom: 8 },
  adImg: { width: '100%', height: 110, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end', marginBottom: 8 },
  adOverlay: { backgroundColor: 'rgba(0,0,0,0.32)', padding: 8, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  adImgTitle: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  adImgDesc: { color: 'rgba(255,255,255,.85)', fontSize: 10, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  adTitle: { fontSize: 12, fontWeight: '700', color: C.text, fontFamily: 'Poppins_600SemiBold' },
  adDesc: { fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 16, fontFamily: 'Poppins_400Regular' },
});

export default WebSidebar;