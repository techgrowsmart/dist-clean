import React, { memo, useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Linking, Platform, ImageBackground, Image, ScrollView, Dimensions, Animated } from "react-native";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { clearAllStorage } from "../../utils/authStorage";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

const { width } = Dimensions.get('window');
const isMobile = width < 768;

type WebSidebarProps = {
  activeItem: string;
  onItemPress: (itemName: string) => void;
  userEmail: string;
  studentName: string;
  profileImage: string | null;
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: (isOpen: boolean) => void;
};

const C = {
  primary: '#3B5BFE',
  text: '#1A1A1A',
  muted: '#6B7280',
  active: '#EEF2FF',
  divider: '#EBEBEB',
  border: '#F0F0F0',
};

// Optimized menu items with icon configuration
const menuItems = [
  { name: "My Tuitions", iconType: "MaterialIcons", iconName: "school" },
  { name: "Connect", iconType: "Ionicons", iconName: "chatbubble-ellipses-outline" },
  { name: "Share", iconType: "Ionicons", iconName: "share-social-outline" },
  { name: "Subscription", iconType: "MaterialIcons", iconName: "loyalty" },
  { name: "Billing", iconType: "MaterialIcons", iconName: "receipt-long" },
  { name: "Faq", iconType: "MaterialIcons", iconName: "help-outline" },
  { name: "Terms & Conditions", iconType: "MaterialIcons", iconName: "description" },
  { name: "Privacy Policy", iconType: "MaterialIcons", iconName: "privacy-tip" },
  { name: "Contact Us", iconType: "MaterialIcons", iconName: "contact-phone" },
  { name: "Raise a Complaint", iconType: "MaterialCommunityIcons", iconName: "alert-decagram-outline" },
];

const WebSidebar = memo(({ activeItem, onItemPress, userEmail, studentName, profileImage, isMobileMenuOpen = false, onMobileMenuToggle }: WebSidebarProps) => {
  const router = useRouter();
  const [translateX] = useState(new Animated.Value(isMobile ? -280 : 0));

  // Animate sidebar open/close
  React.useEffect(() => {
    if (isMobile) {
      Animated.timing(translateX, {
        toValue: isMobileMenuOpen ? 0 : -280,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [isMobileMenuOpen, translateX]);

  const handleItemPress = useCallback((itemName: string) => {
    // Close mobile menu after navigation
    if (isMobile && onMobileMenuToggle) {
      onMobileMenuToggle(false);
    }

    // First handle external links and special actions
    if (itemName === "Terms & Conditions") {
      Linking.openURL("https://gogrowsmart.com/terms-of-service/");
      return;
    }

    if (itemName === "Privacy Policy") {
      Linking.openURL("https://gogrowsmart.com/privacy-policy/");
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
        router.push({ pathname: "/(tabs)/Billing", params: { userEmail, studentName, profileImage } } as any);
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
        Linking.openURL("mailto:support@gogrowsmart.com?subject=Help & Support Request&body=Please describe your issue or question here...");
        break;
      default:
        // Fallback to parent handler for any unhandled menu names
        onItemPress(itemName);
        break;
    }
  }, [router, onItemPress, userEmail, studentName, profileImage, isMobile, onMobileMenuToggle]);

  const handleLogout = useCallback(async () => {
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
  }, [router]);

  // Memoized icon renderer
  const renderIcon = useCallback((item: typeof menuItems[0], isActive: boolean) => {
    const color = isActive ? C.primary : C.text;
    const size = 20;
    
    switch (item.iconType) {
      case "MaterialIcons":
        return <MaterialIcons name={item.iconName as any} size={size} color={color} />;
      case "Ionicons":
        return <Ionicons name={item.iconName as any} size={size} color={color} />;
      case "MaterialCommunityIcons":
        return <MaterialCommunityIcons name={item.iconName as any} size={size} color={color} />;
      default:
        return <Ionicons name="help-circle-outline" size={size} color={color} />;
    }
  }, []);

  // Memoized MenuItem component
  const MenuItem = memo(({ name, item, isActive }: { name: string; item: any; isActive: boolean }) => (
    <TouchableOpacity onPress={() => handleItemPress(name)} style={[s.item, isActive && s.itemActive]}>
      <View style={s.iconWrap}>
        {renderIcon(item, isActive)}
      </View>
      <Text style={[s.itemText, isActive && s.itemTextActive]}>{name}</Text>
    </TouchableOpacity>
  ));

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isMobileMenuOpen && (
        <TouchableOpacity 
          style={s.overlay} 
          activeOpacity={0.5}
          onPress={() => onMobileMenuToggle && onMobileMenuToggle(false)}
        />
      )}
      
      {/* Sidebar */}
      <Animated.View style={[
        s.container, 
        isMobile && s.mobileContainer,
        isMobile && { transform: [{ translateX }] }
      ]}>
        {/* Mobile close button */}
        {isMobile && (
          <TouchableOpacity 
            style={s.mobileCloseButton}
            onPress={() => onMobileMenuToggle && onMobileMenuToggle(false)}
          >
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>
        )}
        
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={s.scroll}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
        >

          {/* Home */}
          <MenuItem 
            name="Home" 
            item={{ iconType: "Ionicons", iconName: "home-outline" }} 
            isActive={activeItem === "Home"} 
          />

          {/* Profile with avatar */}
          <TouchableOpacity onPress={() => handleItemPress("Profile")} style={[s.item, activeItem === "Profile" && s.itemActive]}>
            <View style={s.avatar}>
              {profileImage
                ? <Image source={{ uri: profileImage }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                : <Ionicons name="person-circle-outline" size={24} color={activeItem === "Profile" ? C.primary : C.muted} />}
            </View>
            <Text style={[s.itemText, activeItem === "Profile" && s.itemTextActive]}>Profile</Text>
          </TouchableOpacity>

          <View style={s.divider} />

          {/* Favorites section */}
          <Text style={s.sectionLabel}>Favorites</Text>
          {menuItems.map((item, i) => (
            <MenuItem key={i} name={item.name} item={item} isActive={activeItem === item.name} />
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
          <MenuItem 
            name="Help & Support" 
            item={{ iconType: "Ionicons", iconName: "help-circle-outline" }} 
            isActive={false} 
          />
          <TouchableOpacity onPress={handleLogout} style={s.item}>
            <View style={s.iconWrap}><Ionicons name="log-out-outline" size={20} color={C.text} /></View>
            <Text style={s.itemText}>Log out</Text>
          </TouchableOpacity>

        </ScrollView>
      </Animated.View>
    </>
  );
});

const s = StyleSheet.create({
  container: { 
    width: Platform.OS === 'web' ? 240 : undefined, 
    minWidth: 200, 
    maxWidth: 260, 
    backgroundColor: '#fff', 
    borderRightWidth: 1, 
    borderRightColor: C.border, 
    flex: 1, 
    cursor: 'auto' as any,
    willChange: 'transform',
  },
  mobileContainer: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    height: '100%',
    width: 280,
    zIndex: 1000,
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
    elevation: 10,
  },
  overlay: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  mobileCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  scroll: { 
    paddingVertical: 16,
  },
  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    marginHorizontal: 8, 
    marginBottom: 2, 
    cursor: 'pointer' as any,
  },
  itemActive: { 
    backgroundColor: C.active,
  },
  iconWrap: { 
    width: 24, 
    alignItems: 'center', 
    justifyContent: 'center',
    minWidth: 24,
  },
  avatar: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#E5E7EB', 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden',
  },
  itemText: { 
    marginLeft: 12, 
    fontSize: 14, 
    color: C.text, 
    fontFamily: 'Poppins_400Regular', 
    flex: 1,
  },
  itemTextActive: { 
    color: C.primary, 
    fontFamily: 'Poppins_600SemiBold',
  },
  sectionLabel: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    fontSize: 13, 
    fontWeight: '700', 
    color: C.text, 
    fontFamily: 'Poppins_700Bold',
    opacity: 0.8,
  },
  divider: { 
    height: 1, 
    backgroundColor: C.divider, 
    marginVertical: 8, 
    marginHorizontal: 16,
    opacity: 0.6,
  },
  adCard: { 
    marginHorizontal: 12, 
    marginVertical: 4, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: C.divider, 
    padding: 10, 
    backgroundColor: '#fff',
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
  adLabel: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: C.text, 
    fontFamily: 'Poppins_700Bold', 
    marginBottom: 8,
  },
  adImg: { 
    width: '100%', 
    height: 110, 
    borderRadius: 8, 
    overflow: 'hidden', 
    justifyContent: 'flex-end', 
    marginBottom: 8,
  },
  adOverlay: { 
    backgroundColor: 'rgba(0,0,0,0.32)', 
    padding: 8, 
    borderBottomLeftRadius: 8, 
    borderBottomRightRadius: 8,
  },
  adImgTitle: { 
    color: '#fff', 
    fontSize: 12, 
    fontFamily: 'Poppins_600SemiBold',
  },
  adImgDesc: { 
    color: 'rgba(255,255,255,.85)', 
    fontSize: 10, 
    marginTop: 2, 
    fontFamily: 'Poppins_400Regular',
  },
  adTitle: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: C.text, 
    fontFamily: 'Poppins_600SemiBold',
  },
  adDesc: { 
    fontSize: 11, 
    color: C.muted, 
    marginTop: 3, 
    lineHeight: 16, 
    fontFamily: 'Poppins_400Regular',
  },
});

export default WebSidebar;