import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Animated, Dimensions, Image, ImageBackground, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { clearAllStorage } from "../../utils/authStorage";

type TeacherWebSidebarProps = {
  activeItem: string;
  onItemPress?: (itemName: string) => void;
  userEmail: string;
  teacherName: string;
  profileImage: string | null;
  subjectCount?: number;
  studentCount?: number;
  revenue?: string;
  isSpotlight?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showToggle?: boolean;
  breakpoint?: number;
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
  { name: "My Subjects",         icon: <MaterialIcons name="book" size={20} /> },
  { name: "Spotlights",           icon: <MaterialCommunityIcons name="lightbulb-on" size={20} /> },
  { name: "Connect",         icon: <Ionicons name="chatbubble-ellipses-outline" size={20} /> },
  { name: "Share",               icon: <Ionicons name="share-social-outline" size={20} /> },
  { name: "Create Subject",      icon: <MaterialIcons name="add-circle" size={20} /> },
  { name: "Billing",            icon: <Ionicons name="card-outline" size={20} /> },
  { name: "Settings",           icon: <MaterialIcons name="settings" size={20} /> },
  { name: "Terms & Conditions", icon: <MaterialIcons name="description" size={20} /> },
  { name: "Privacy Policy",     icon: <MaterialIcons name="privacy-tip" size={20} /> },
  { name: "Contact Us",         icon: <MaterialIcons name="contact-phone" size={20} /> },
  { name: "Raise a Complaint",  icon: <MaterialCommunityIcons name="alert-decagram-outline" size={20} /> },
];

const TeacherWebSidebar = ({ 
  activeItem, 
  onItemPress, 
  userEmail, 
  teacherName, 
  profileImage, 
  collapsed: propCollapsed,
  onToggleCollapse,
  showToggle = true,
  breakpoint = 768
}: TeacherWebSidebarProps) => {
  const router = useRouter();
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [isCollapsed, setIsCollapsed] = useState(propCollapsed || false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Auto-collapse on small screens
  useEffect(() => {
    const updateDimensions = () => {
      const width = Dimensions.get('window').width;
      setScreenWidth(width);
      
      // Auto-collapse on screens smaller than breakpoint
      if (width < breakpoint && !propCollapsed) {
        setIsCollapsed(true);
      } else if (width >= breakpoint && !propCollapsed) {
        setIsCollapsed(false);
      }
    };

    updateDimensions();
    
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, [propCollapsed, breakpoint]);

  // Handle manual toggle
  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Use either prop collapsed or internal state
  const shouldCollapse = propCollapsed !== undefined ? propCollapsed : isCollapsed;

  // Animation values
  const animatedValues = React.useRef<{ [key: string]: Animated.Value }>({});
  
  // Initialize animation values for menu items
  React.useEffect(() => {
    menuItems.forEach(item => {
      if (!animatedValues.current[item.name]) {
        animatedValues.current[item.name] = new Animated.Value(0);
      }
    });
  }, []);

  // Handle item press with animation
  const handleItemPress = (itemName: string) => {
    // Animate out previous item
    if (hoveredItem && animatedValues.current[hoveredItem]) {
      Animated.timing(animatedValues.current[hoveredItem], {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }

    // Animate in new item
    setHoveredItem(itemName);
    if (animatedValues.current[itemName]) {
      Animated.timing(animatedValues.current[itemName], {
        toValue: 1,
        duration: 150,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }

    // Execute original press logic
    if (itemName === "Terms & Conditions") {
      Linking.openURL("https://gogrowsmart.com/terms-and-conditions");
    } else if (itemName === "Privacy Policy") {
      Linking.openURL("https://gogrowsmart.com/privacy-policy");
    } else if (itemName === "Raise a Complaint") {
      Linking.openURL("mailto:support@gogrowsmart.com?subject=Teacher Complaint&body=Please describe your issue here...");
    } else if (itemName === "Log Out" || itemName === "Log out") {
      handleLogout();
    } else {
      if (onItemPress && typeof onItemPress === 'function') {
        onItemPress(itemName);
      }
      // Navigate based on item
      switch (itemName) {
        case "Dashboard":
          router.push("/(tabs)/TeacherDashBoard/TutorDashboardWeb" as any);
          break;
        case "My Students":
          router.push("/(tabs)/TeacherDashBoard/StudentsEnrolled" as any);
          break;
        case "My Subjects":
          router.push("/(tabs)/TeacherDashBoard/MySubjectsWeb" as any);
          break;
        case "Create Subject":
          router.push("/(tabs)/TeacherDashBoard/CreateSubject" as any);
          break;
        case "Spotlights":
          router.push("/(tabs)/TeacherDashBoard/Spotlights" as any);
          break;
          case "Connect":
          router.push("/(tabs)/TeacherDashBoard/ConnectWeb" as any);
          break;
        case "Share":
          router.push("/(tabs)/TeacherDashBoard/Share" as any);
          break;
        case "Profile":
          router.push("/(tabs)/TeacherDashBoard/ProfileWeb" as any);
          break;
        case "Billing":
          router.push("/(tabs)/TeacherDashBoard/Billing" as any);
          break;
        case "Settings":
          router.push("/(tabs)/TeacherDashBoard/Settings" as any);
          break;
        case "Contact Us":
          router.push("/(tabs)/Contact" as any);
          break;
      }
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

  const MenuItem = ({ name, iconEl, isActive, showTooltip = false }: { 
    name: string; 
    iconEl: React.ReactElement; 
    isActive: boolean;
    showTooltip?: boolean;
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const animatedValue = animatedValues.current[name] || new Animated.Value(0);

    const handleHoverIn = () => {
      setIsHovered(true);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    };

    const handleHoverOut = () => {
      setIsHovered(false);
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    };

    const animatedStyle = {
      transform: [
        {
          scale: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.05],
          }),
        },
      ],
      opacity: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
      }),
    };

    return (
      <TouchableOpacity 
        onPress={() => handleItemPress(name)} 
        activeOpacity={0.7}
      >
        <Animated.View 
          style={[s.item, isActive && s.itemActive, shouldCollapse && s.itemCollapsed, animatedStyle]}
        >
          <View style={[s.iconWrap, shouldCollapse && s.iconWrapCollapsed]}>
            {React.cloneElement(iconEl as React.ReactElement, { 
              color: isActive ? C.primary : C.text,
              size: shouldCollapse ? 22 : 20 
            } as any)}
          </View>
          {!shouldCollapse && (
            <Animated.Text style={[s.itemText, isActive && s.itemTextActive]}>
              {name}
            </Animated.Text>
          )}
          
          {/* Tooltip for collapsed mode */}
          {shouldCollapse && (isHovered || showTooltip) && (
            <Animated.View 
              style={[
                s.tooltip,
                {
                  opacity: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                  transform: [
                    {
                      translateY: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 0],
                      }),
                    },
                  ],
                }
              ]}
            >
              <Text style={s.tooltipText}>{name}</Text>
              <View style={s.tooltipArrow} />
            </Animated.View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.container, shouldCollapse && s.containerCollapsed]}>
      {/* Collapse Toggle Button */}
      {showToggle && Platform.OS === 'web' && (
        <TouchableOpacity 
          onPress={handleToggleCollapse} 
          style={[s.toggleButton, shouldCollapse && s.toggleButtonCollapsed]}
        >
          <Ionicons 
            name={shouldCollapse ? "chevron-forward" : "chevron-back"} 
            size={16} 
            color={C.muted} 
          />
        </TouchableOpacity>
      )}
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Home */}
        <TouchableOpacity 
          onPress={() => handleItemPress("Dashboard")} 
          activeOpacity={0.7}
          style={[s.item, activeItem === "Dashboard" && s.itemActive, shouldCollapse && s.itemCollapsed]}
        >
          <View style={[s.iconWrap, shouldCollapse && s.iconWrapCollapsed]}>
            <Ionicons 
              name="home-outline" 
              size={shouldCollapse ? 22 : 20} 
              color={activeItem === "Dashboard" ? C.primary : C.text} 
            />
          </View>
          {!shouldCollapse && (
            <Text style={[s.itemText, activeItem === "Dashboard" && s.itemTextActive]}>
              Dashboard
            </Text>
          )}
        </TouchableOpacity>

        {/* Profile with avatar */}
        <TouchableOpacity 
          onPress={() => handleItemPress("Profile")} 
          style={[s.item, activeItem === "Profile" && s.itemActive, shouldCollapse && s.itemCollapsed]}
        >
          <View style={[s.avatar, shouldCollapse && s.avatarCollapsed]}>
            {profileImage
              ? <Image source={{ uri: profileImage }} style={{ width: 28, height: 28, borderRadius: 14 }} />
              : <Ionicons name="person-circle-outline" size={24} color={C.muted} />}
          </View>
          {!shouldCollapse && (
            <Text style={[s.itemText, activeItem === "Profile" && s.itemTextActive]}>Profile</Text>
          )}
        </TouchableOpacity>

        {!shouldCollapse && <View style={s.divider} />}

        {/* Favorites section */}
        {!shouldCollapse && <Text style={s.sectionLabel}>Favorites</Text>}
        {menuItems.map((item, i) => (
          <MenuItem 
            key={i} 
            name={item.name} 
            iconEl={item.icon} 
            isActive={activeItem === item.name}
            showTooltip={shouldCollapse}
          />
        ))}

        {!shouldCollapse && <View style={s.divider} />}

        {/* Advertising card - only show when not collapsed */}
        {!shouldCollapse && (
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
        )}

        {!shouldCollapse && <View style={s.divider} />}

        {/* Bottom actions */}
        <MenuItem name="Help & Support" iconEl={<Ionicons name="help-circle-outline" size={20} />} isActive={false} />
        <TouchableOpacity 
          onPress={handleLogout} 
          style={[s.item, shouldCollapse && s.itemCollapsed]}
        >
          <View style={[s.iconWrap, shouldCollapse && s.iconWrapCollapsed]}>
            <Ionicons name="log-out-outline" size={shouldCollapse ? 22 : 20} color={C.text} />
          </View>
          {!shouldCollapse && <Text style={s.itemText}>Log out</Text>}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

// Amazing Styles - Premium & Professional
const s = StyleSheet.create({
  container: { 
    width: Platform.OS === 'web' ? 240 : undefined, 
    minWidth: 200, 
    maxWidth: 260, 
    backgroundColor: '#fff', 
    borderRightWidth: 1, 
    borderRightColor: C.border, 
    flex: 1,
    position: 'relative',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    elevation: 8,
  },
  containerCollapsed: {
    width: Platform.OS === 'web' ? 70 : 80,
    minWidth: 70,
    maxWidth: 80,
  },
  toggleButton: {
    position: 'absolute',
    top: 20,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
    elevation: 4,
    zIndex: 1000,
  },
  toggleButtonCollapsed: {
    right: 8,
  },
  scroll: { paddingVertical: 16 },
  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 12, 
    marginHorizontal: 8, 
    marginBottom: 2,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  itemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginHorizontal: 4,
    height: 44,
  },
  itemActive: { 
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(59, 91, 254, 0.15)',
    elevation: 3,
  },
  iconWrap: { 
    width: 24, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapCollapsed: {
    width: 'auto',
    marginRight: 0,
  },
  avatar: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#E5E7EB', 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarCollapsed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 0,
  },
  itemText: { 
    marginLeft: 12, 
    fontSize: 14, 
    color: C.text, 
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  itemTextActive: { 
    color: C.primary, 
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
  },
  sectionLabel: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    fontSize: 13, 
    fontWeight: '700', 
    color: C.text, 
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: { 
    height: 1, 
    backgroundColor: C.divider, 
    marginVertical: 8, 
    marginHorizontal: 16,
  },
  adCard: { 
    marginHorizontal: 12, 
    marginVertical: 4, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: C.divider, 
    padding: 10, 
    backgroundColor: '#fff',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
    elevation: 3,
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
  // Premium Tooltip Styles
  tooltip: {
    position: 'absolute',
    left: '100%',
    top: '50%',
    marginLeft: 12,
    marginTop: -20,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25)',
    elevation: 6,
    zIndex: 10000,
    minWidth: 100,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    left: -4,
    top: '50%',
    marginTop: -4,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderTopColor: 'transparent',
    borderRightWidth: 4,
    borderRightColor: '#1a1a1a',
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
    transform: [{ rotate: '45deg' }],
  },
});

export default TeacherWebSidebar;
