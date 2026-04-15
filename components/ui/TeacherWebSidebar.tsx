import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { clearAllStorage } from "../../utils/authStorage";
import { BASE_URL } from "../../config";

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
  notificationCounts?: Record<string, number>;
};

const C = {
  primary: "#3B5BFE",
  text: "#1A1A1A",
  muted: "#6B7280",
  active: "#EEF2FF",
  divider: "#EBEBEB",
  border: "#F0F0F0",
  activeBg: "rgba(59, 91, 254, 0.08)",
};

const menuItems = [
  {
    name: "My Subjects",
    icon: <MaterialIcons name="book" size={20} />,
  },
  {
    name: "Spotlights",
    icon: <MaterialCommunityIcons name="lightbulb-on" size={20} />,
  },
  {
    name: "Connect",
    icon: <Ionicons name="chatbubble-ellipses-outline" size={20} />,
  },
  {
    name: "Share",
    icon: <Ionicons name="share-social-outline" size={20} />,
  },
  {
    name: "Create Subject",
    icon: <MaterialIcons name="add-circle" size={20} />,
  },
  {
    name: "Billing",
    icon: <Ionicons name="card-outline" size={20} />,
  },
  {
    name: "Terms & Conditions",
    icon: <MaterialIcons name="description" size={20} />,
  },
  {
    name: "Privacy Policy",
    icon: <MaterialIcons name="privacy-tip" size={20} />,
  },
  {
    name: "Contact Us",
    icon: <MaterialIcons name="contact-phone" size={20} />,
  },
  {
    name: "Raise a Complaint",
    icon: <MaterialCommunityIcons name="alert-decagram-outline" size={20} />,
  },
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
  breakpoint = 768,
  notificationCounts = {},
}: TeacherWebSidebarProps) => {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );
  const [isCollapsed, setIsCollapsed] = useState(propCollapsed || false);

  const isMobile = screenWidth < 768;

  useEffect(() => {
    const updateDimensions = () => {
      const width = Dimensions.get("window").width;
      setScreenWidth(width);
      if (width < breakpoint && !propCollapsed) {
        setIsCollapsed(true);
      } else if (width >= breakpoint && !propCollapsed) {
        setIsCollapsed(false);
      }
    };
    updateDimensions();
    const subscription = Dimensions.addEventListener("change", updateDimensions);
    return () => subscription?.remove();
  }, [propCollapsed, breakpoint]);

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  const shouldCollapse =
    propCollapsed !== undefined ? propCollapsed : isCollapsed;

  // ─── Navigation ───────────────────────────────────────────────────────────
  const handleItemPress = (itemName: string) => {
    if (itemName === "Terms & Conditions") {
      Linking.openURL("https://gogrowsmart.com/terms-and-conditions");
      return;
    }
    if (itemName === "Privacy Policy") {
      Linking.openURL("https://gogrowsmart.com/privacy-policy");
      return;
    }
    if (itemName === "Raise a Complaint") {
      Linking.openURL(
        "mailto:support@gogrowsmart.com?subject=Teacher Complaint&body=Please describe your issue here..."
      );
      return;
    }
    if (itemName === "Log Out" || itemName === "Log out") {
      handleLogout();
      return;
    }

    if (onItemPress && typeof onItemPress === "function") {
      onItemPress(itemName);
    }

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
  };

  const handleLogout = async () => {
    try {
      await clearAllStorage();
      if (Platform.OS === "web") {
        window.location.href = "/login";
      } else {
        router.replace("/(tabs)/LoginScreen");
      }
      Toast.show({
        type: "success",
        text1: "Logged Out",
        text2: "You have been successfully logged out.",
        position: "bottom",
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error("Logout error:", error);
      Toast.show({
        type: "error",
        text1: "Logout Error",
        text2: "There was an error logging out. Please try again.",
        position: "bottom",
        visibilityTime: 3000,
      });
    }
  };

  // ─── Reusable Row Item ────────────────────────────────────────────────────
  const MenuItem = ({
    name,
    iconEl,
    isActive,
  }: {
    name: string;
    iconEl: React.ReactElement;
    isActive: boolean;
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const hoverAnim = React.useRef(new Animated.Value(0)).current;
    const notificationCount = notificationCounts[name] || 0;
    const hasNotification = notificationCount > 0;

    const handleHoverIn = () => {
      setIsHovered(true);
      Animated.timing(hoverAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
    };

    const handleHoverOut = () => {
      setIsHovered(false);
      Animated.timing(hoverAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    };

    const bgColor = hoverAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["rgba(0,0,0,0)", "rgba(59,91,254,0.04)"],
    });

    if (shouldCollapse) {
      // ── Collapsed: icon only, centred ──────────────────────────────────
      return (
        <TouchableOpacity
          onPress={() => handleItemPress(name)}
          activeOpacity={0.7}
          style={[s.itemCollapsed, isActive && s.itemCollapsedActive]}
        >
          <View style={s.iconWithBadge}>
            {React.cloneElement(iconEl, {
              color: isActive ? C.primary : C.muted,
              size: 22,
            } as any)}
            {hasNotification && name === 'Connect' && (
              <View style={s.notificationBadgeCollapsed}>
                <Ionicons name="alert-circle" size={12} color="#EF4444" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    // ── Expanded: icon + label ──────────────────────────────────────────
    return (
      <Animated.View style={{ backgroundColor: bgColor, borderRadius: 10, marginHorizontal: 8, marginBottom: 2 }}>
        <TouchableOpacity
          onPress={() => handleItemPress(name)}
          activeOpacity={0.75}
          // @ts-ignore — web-only hover events
          onMouseEnter={Platform.OS === "web" ? handleHoverIn : undefined}
          onMouseLeave={Platform.OS === "web" ? handleHoverOut : undefined}
          style={[s.item, isActive && s.itemActive]}
        >
          {/* Icon — fixed 20 × 20 box, no extra margins */}
          <View style={s.iconBox}>
            {React.cloneElement(iconEl, {
              color: isActive ? C.primary : C.text,
              size: 20,
            } as any)}
          </View>

          {/* Label with notification count */}
          <View style={s.itemTextContainer}>
            <Text
              style={[s.itemText, isActive && s.itemTextActive]}
              numberOfLines={1}
            >
              {name}
            </Text>
            {hasNotification && name === 'Connect' && (
              <View style={s.notificationBadge}>
                <Text style={s.notificationCount}>{notificationCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[s.container, shouldCollapse && s.containerCollapsed]}>

      {/* Collapse Toggle */}
      {showToggle && (
        <TouchableOpacity
          onPress={handleToggleCollapse}
          style={s.toggleButton}
        >
          <Ionicons
            name={shouldCollapse ? "chevron-forward" : "chevron-back"}
            size={14}
            color={C.muted}
          />
        </TouchableOpacity>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── Dashboard ── */}
        {shouldCollapse ? (
          <TouchableOpacity
            onPress={() => handleItemPress("Dashboard")}
            activeOpacity={0.7}
            style={[s.itemCollapsed, activeItem === "Dashboard" && s.itemCollapsedActive]}
          >
            <Ionicons
              name="home-outline"
              size={22}
              color={activeItem === "Dashboard" ? C.primary : C.muted}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ marginHorizontal: 8, marginBottom: 2 }}>
            <TouchableOpacity
              onPress={() => handleItemPress("Dashboard")}
              activeOpacity={0.75}
              style={[s.item, activeItem === "Dashboard" && s.itemActive]}
            >
              <View style={s.iconBox}>
                <Ionicons
                  name="home-outline"
                  size={20}
                  color={activeItem === "Dashboard" ? C.primary : C.text}
                />
              </View>
              <Text style={[s.itemText, activeItem === "Dashboard" && s.itemTextActive]}>
                Home
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Profile ── */}
        {shouldCollapse ? (
          <TouchableOpacity
            onPress={() => handleItemPress("Profile")}
            activeOpacity={0.7}
            style={[s.itemCollapsed, activeItem === "Profile" && s.itemCollapsedActive]}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage.startsWith('http') ? profileImage : `${BASE_URL}${profileImage.startsWith('/') ? '' : '/'}${profileImage}` }}
                style={{ width: 26, height: 26, borderRadius: 13 }}
              />
            ) : (
              <Ionicons name="person-circle-outline" size={24} color={C.muted} />
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ marginHorizontal: 8, marginBottom: 2 }}>
            <TouchableOpacity
              onPress={() => handleItemPress("Profile")}
              activeOpacity={0.75}
              style={[s.item, activeItem === "Profile" && s.itemActive]}
            >
              <View style={s.iconBox}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage.startsWith('http') ? profileImage : `${BASE_URL}${profileImage.startsWith('/') ? '' : '/'}${profileImage}` }}
                    style={{ width: 26, height: 26, borderRadius: 13 }}
                  />
                ) : (
                  <Ionicons
                    name="person-circle-outline"
                    size={24}
                    color={activeItem === "Profile" ? C.primary : C.text}
                  />
                )}
              </View>
              <Text style={[s.itemText, activeItem === "Profile" && s.itemTextActive]}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Divider ── */}
        {!shouldCollapse && <View style={s.divider} />}

        {/* ── Favorites label ── */}
        {!shouldCollapse && <Text style={s.sectionLabel}>Favorites</Text>}

        {/* ── Menu items ── */}
        {menuItems.map((item, i) => (
          <MenuItem
            key={i}
            name={item.name}
            iconEl={item.icon}
            isActive={activeItem === item.name}
          />
        ))}

        {/* ── Divider ── */}
        {!shouldCollapse && <View style={s.divider} />}

        {/* ── Advertising card ── */}
        {!shouldCollapse && (
          <View style={s.adCard}>
            <Text style={s.adLabel}>Advertising</Text>
            <ImageBackground
              source={require("../../assets/images/Popular1.png")}
              style={s.adImg}
              imageStyle={{ borderRadius: 8 }}
            >
              <View style={s.adOverlay}>
                <Text style={s.adImgTitle}>Summer sale is on!</Text>
                <Text style={s.adImgDesc}>
                  Up to 70% off — limited time offer
                </Text>
              </View>
            </ImageBackground>
            <Text style={s.adTitle}>Summer sale is on!</Text>
            <Text style={s.adDesc}>
              Buy your loved pieces with reduced prices up to 70% off!
            </Text>
          </View>
        )}

        {!shouldCollapse && <View style={s.divider} />}

        {/* ── Help & Support ── */}
        <MenuItem
          name="Help & Support"
          iconEl={<Ionicons name="help-circle-outline" size={20} />}
          isActive={false}
        />

        {/* ── Log out ── */}
        {shouldCollapse ? (
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            style={s.itemCollapsed}
          >
            <Ionicons name="log-out-outline" size={22} color={C.muted} />
          </TouchableOpacity>
        ) : (
          <View style={{ marginHorizontal: 8, marginBottom: 2 }}>
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.75}
              style={s.item}
            >
              <View style={s.iconBox}>
                <Ionicons name="log-out-outline" size={20} color={C.text} />
              </View>
              <Text style={s.itemText}>Log out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Container
  container: {
    width: Platform.OS === "web" ? 240 : undefined,
    minWidth: 220,
    maxWidth: 260,
    backgroundColor: "#fff",
    flex: 1,
    position: "relative",
  },
  containerCollapsed: {
    width: Platform.OS === "web" ? 68 : 68,
    minWidth: 68,
    maxWidth: 68,
  },

  // Toggle
  toggleButton: {
    position: "absolute",
    top: 18,
    right: -16,
    width: 28,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100000000,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 2px 6px rgba(0,0,0,0.12)" } as any)
      : { elevation: 4 }),
  },

  scroll: {
    paddingTop: 20,
    paddingBottom: 24,
  },

  // ── Expanded row item (no outer wrapper margins — wrapper handles them) ──
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    // no marginHorizontal — outer Animated.View handles that
  },
  itemActive: {
    backgroundColor: C.activeBg,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 2px 8px rgba(59,91,254,0.10)" } as any)
      : { elevation: 2 }),
  },

  // ── Icon box: always 28 wide, no extra margins ──
  iconBox: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    // marginRight handled by itemText marginLeft
  },

  // ── Text ──
  itemText: {
    marginLeft: 10,
    fontSize: 14,
    color: C.text,
    fontFamily: "Poppins_500Medium",
    flex: 1,
    lineHeight: 20,
  },
  itemTextActive: {
    color: C.primary,
    fontFamily: "Poppins_600SemiBold",
  },

  // ── Collapsed icon-only item ──
  itemCollapsed: {
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: 10,
    marginHorizontal: 8,
    marginBottom: 2,
  },
  itemCollapsedActive: {
    backgroundColor: C.activeBg,
  },

  // ── Section label ──
  sectionLabel: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 6,
    fontSize: 11,
    fontFamily: "Poppins_700Bold",
    color: C.text,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: C.divider,
    marginVertical: 10,
    marginHorizontal: 16,
  },

  // ── Advertising card ──
  adCard: {
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.divider,
    padding: 12,
    backgroundColor: "#fff",
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" } as any)
      : { elevation: 2 }),
  },
  adLabel: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    color: C.text,
    marginBottom: 8,
  },
  adImg: {
    width: "100%",
    height: 110,
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  adOverlay: {
    backgroundColor: "rgba(0,0,0,0.32)",
    padding: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  adImgTitle: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  adImgDesc: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    marginTop: 2,
    fontFamily: "Poppins_400Regular",
  },
  adTitle: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: C.text,
  },
  adDesc: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: C.muted,
    marginTop: 4,
  },

  // ── Notification Badge ──
  iconWithBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeCollapsed: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0px 1px 2px rgba(0,0,0,0.2)" } as any)
      : { elevation: 2 }),
  },
  itemTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  notificationBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 16,
  },
});

export default TeacherWebSidebar;