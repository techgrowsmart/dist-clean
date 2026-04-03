import * as NavigationBar from "expo-navigation-bar";
import { router, usePathname } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View, Animated } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Entypo, AntDesign } from '@expo/vector-icons';

import ChatIcon from "../../assets/svgIcons/ChatIcon";
import HomeIcon from "../../assets/svgIcons/Home";
import PersonIcon from "../../assets/svgIcons/Person";
import { getFavoriteTeachers } from '../../services/favoriteTeachers';
import { favoritesEvents, FAVORITES_CHANGED_EVENT } from '../../utils/favoritesEvents';

const { width } = Dimensions.get("window");

const BottomNavigation = ({ userType }: { userType: "student" | "teacher" }) => {
  const currentPath = usePathname();
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [hasFavorites, setHasFavorites] = useState(false);
  
  // Animation values
  const starScale = useRef(new Animated.Value(1)).current;
  const starOpacity = useRef(new Animated.Value(1)).current;

  // Animation function for star when favorite is added
  const animateStarAddition = () => {
    Animated.sequence([
      // Quick scale up
      Animated.timing(starScale, {
        toValue: 1.4,
        duration: 100, // Reduced from 200ms
        useNativeDriver: true,
      }),
      // Quick spring back
      Animated.spring(starScale, {
        toValue: 1,
        friction: 4, // Increased for faster bounce
        tension: 100, // Increased for quicker response
        useNativeDriver: true,
      }),
      // Very quick flash
      Animated.sequence([
        Animated.timing(starOpacity, {
          toValue: 0.5,
          duration: 50, // Reduced from 100ms
          useNativeDriver: true,
        }),
        Animated.timing(starOpacity, {
          toValue: 1,
          duration: 50, // Reduced from 100ms
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("visible");
    }
  }, []);

  // Fetch actual favorites count
  useEffect(() => {
    fetchFavoritesCount(); // Don't pass previousHasFavorites to avoid animation on initial load
  }, [currentPath]); // Refetch when path changes to catch updates

  // Listen for favorites changes
  useEffect(() => {
    const handleFavoritesChange = () => {
      // Store previous state
      const previousHasFavorites = hasFavorites;
      
      // Fetch new state and trigger animation if needed
      fetchFavoritesCount(previousHasFavorites);
    };

    favoritesEvents.on(FAVORITES_CHANGED_EVENT, handleFavoritesChange);

    return () => {
      favoritesEvents.off(FAVORITES_CHANGED_EVENT, handleFavoritesChange);
    };
  }, [hasFavorites]); // Include hasFavorites to track previous state

  const fetchFavoritesCount = async (previousHasFavorites?: boolean) => {
    try {
      setIsLoadingFavorites(true);
      const favorites = await getFavoriteTeachers();
      const count = Array.isArray(favorites) ? favorites.length : 0;
      const newHasFavorites = count > 0;
      
      setFavoritesCount(count);
      setHasFavorites(newHasFavorites);
      
      // Trigger animation only if star changed from empty to filled
      if (newHasFavorites && previousHasFavorites === false) {
        animateStarAddition();
      }
    } catch (error) {
      console.error("Error fetching favorites count:", error);
      setFavoritesCount(0);
      setHasFavorites(false);
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  const isTabActive = (tabPath: string) => {
    // For Messages/Connect tab - match any messages/chat related paths
    if (tabPath === "Messages") {
      return currentPath.includes("Messages") || 
             currentPath.includes("messages") || 
             currentPath.includes("chat") ||
             currentPath.includes("Chat");
    }
    // For Favourite tab matching
    if (tabPath === "Favourite") {
      return currentPath.includes("Favourite") || 
             currentPath.includes("favourite") || 
             currentPath.includes("favorites") ||
             currentPath.includes("Favorites");
    }
    // For Billing tab matching
    if (tabPath === "Billing") {
      return currentPath.includes("Billing") || 
             currentPath.includes("billing");
    }
    // For exact path matching for other tabs
    return currentPath === tabPath;
  };

  const getTabColor = (tabPath: string) => {
    return isTabActive(tabPath) ? "#ffffff" : "#82878F";
  };

  const getStarIcon = () => {
    const isActive = isTabActive("Favourite");
    
    if (isActive) {
      return "star"; // Filled star when tab is active
    } else if (hasFavorites) {
      return "star"; // Filled star when has favorites
    } else {
      return "staro"; // Outlined star when no favorites
    }
  };

  const getStarStyle = () => {
    const isActive = isTabActive("Favourite");
    
    if (isActive) {
      return "#ffffff"; // White when tab is active
    } else {
      return "#82878F"; // Always gray when not active (same as original)
    }
  };

  const iconSize = width * 0.07;
  const fontSize = width * 0.032;

  const tabs = {
    student: [
      { 
        name: "Home", 
        icon: <HomeIcon width={iconSize} height={iconSize} color={getTabColor("/StudentDashBoard/Student")} />, 
        path: "/StudentDashBoard/Student",
        exactPath: "/StudentDashBoard/Student"
      },
      { 
        name: "Favourite", 
        icon: <AntDesign name={hasFavorites ? "star" : "staro"} size={36} color={getStarStyle()} />,
        path: "/StudentDashBoard/Favourite",
        exactPath: "/StudentDashBoard/Favourite"
      },
      { 
        name: "Connect", 
        icon: <ChatIcon width={iconSize} height={iconSize} color={getTabColor("Messages")} />, 
        path: "Messages",
        exactPath: "/(tabs)/Messages/Messages"
      },
      { 
        name: "Profile", 
        icon: <PersonIcon width={iconSize} height={iconSize} color={getTabColor("/StudentDashBoard/Profile")} />, 
        path: "/StudentDashBoard/Profile",
        exactPath: "/StudentDashBoard/Profile"
      },
      { 
        name: "Billing", 
        icon: <AntDesign name="creditcard" size={36} color={getTabColor("/(tabs)/Billing")} />, 
        path: "/(tabs)/Billing",
        exactPath: "/(tabs)/Billing"
      },
    ],
    teacher: [
      { 
        name: "Home", 
        icon: <HomeIcon width={iconSize} height={iconSize} color={getTabColor("/TeacherDashBoard/Teacher")} />, 
        path: "/TeacherDashBoard/Teacher",
        exactPath: "/TeacherDashBoard/Teacher"
      },
      { 
        name: "Connect", 
        icon: <ChatIcon width={iconSize} height={iconSize} color={getTabColor("Messages")} />, 
        path: "Messages",
        exactPath: "/(tabs)/Messages/Messages"
      },
      { 
        name: "Profile", 
        icon: <PersonIcon width={iconSize} height={iconSize} color={getTabColor("/TeacherDashBoard/Profile2")} />, 
        path: "/TeacherDashBoard/Profile2",
        exactPath: "/TeacherDashBoard/Profile2"
      },
      { 
        name: "Billing", 
        icon: <AntDesign name="creditcard" size={36} color={getTabColor("/(tabs)/TeacherDashBoard/Billing")} />, 
        path: "/(tabs)/TeacherDashBoard/Billing",
        exactPath: "/(tabs)/TeacherDashBoard/Billing"
      },
    ],
  };

  const handleTabPress = (tab: any, index: number) => {
    setPressedIndex(index);
    
    // Use exactPath for navigation to ensure consistent routing
    if (!isTabActive(tab.path)) {
      router.replace(tab.exactPath as never);
    }
    
    // Reset pressed state after a short delay for better UX
    setTimeout(() => setPressedIndex(null), 150);
  };

  const currentTabs = tabs[userType];

  return (
    <SafeAreaView 
      edges={['bottom']} 
      style={[
        styles.safeArea,
        Platform.OS === 'android' && styles.androidSafeArea
      ]}
    >
      <View style={styles.navBar}>
        {currentTabs.map((tab, index) => {
          const isActive = isTabActive(tab.path);
          const iconContainerSize = iconSize + 8;
          const isFavouriteTab = tab.name === "Favourite";
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.navItem,
                pressedIndex === index && styles.pressedItem,
              ]}
              activeOpacity={0.7}
              onPressIn={() => setPressedIndex(index)}
              onPressOut={() => setPressedIndex(null)}
              onPress={() => handleTabPress(tab, index)}
            >
              <View style={[
                styles.iconContainer,
                { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }
              ]}>
                {isFavouriteTab ? (
                  <Animated.View style={{
                    transform: [{ scale: starScale }],
                    opacity: starOpacity,
                  }}>
                    <AntDesign 
                      name={hasFavorites ? "star" : "staro"} 
                      size={32} 
                      color={getStarStyle()} 
                    />
                  </Animated.View>
                ) : React.isValidElement(tab.icon) 
                  ? React.cloneElement(tab.icon as React.ReactElement<any>, {
                      color: isActive ? '#ffffff' : '#82878F'
                    })
                  : tab.icon}
              </View>
              <Text
                style={[
                  styles.navLabel,
                  { fontSize },
                  isActive ? styles.activeText : styles.inactiveText,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    backgroundColor: '#141b27',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  androidSafeArea: {
    paddingBottom: -10,
  },
  navBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'android' ? 6 : 12,
    height: 76,
    paddingHorizontal: 5,
  },
  navItem: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    flex: 1, 
    paddingVertical: 2,
    minWidth: 60,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  pressedItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ scale: 0.95 }],
  },
  activeItem: {
    backgroundColor: 'rgba(95, 95, 255, 0.2)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
    backgroundColor: 'transparent',
  },
  navLabel: { 
    fontFamily: 'Poppins_400Regular', 
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 16,
    minHeight: 16,
    marginTop: 2,
  },
  activeText: { 
    color: '#ffffff', 
    fontWeight: '700',
    fontFamily: 'Poppins_600SemiBold',
  },
  inactiveText: { 
    color: '#82878F',
    fontFamily: 'Poppins_400Regular',
  },
}); 

export default BottomNavigation;