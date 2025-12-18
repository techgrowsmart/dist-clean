import * as NavigationBar from "expo-navigation-bar";
import { router, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Entypo, } from '@expo/vector-icons';

import ChatIcon from "../../assets/svgIcons/ChatIcon";
import HomeIcon from "../../assets/svgIcons/Home";
import PersonIcon from "../../assets/svgIcons/Person";

const { width } = Dimensions.get("window");

const BottomNavigation = ({ userType }: { userType: "student" | "teacher" }) => {
  const currentPath = usePathname();
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const [hasFavorites, setHasFavorites] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("visible");
    }
  }, []);

  // Check if user is on Favourite page and has favorites
  useEffect(() => {
    const checkFavorites = async () => {
      try {
        // Check if we're on the Favourite page
        const isOnFavouritePage = currentPath.includes("Favourite") || 
                                 currentPath.includes("favourite") || 
                                 currentPath.includes("Favorites") ||
                                 currentPath.includes("favorites");
        
        if (isOnFavouritePage) {
          setHasFavorites(true); // Assume has favorites if on the page
        } else {
          setHasFavorites(false);
        }
      } catch (error) {
        console.error("Error checking favorites:", error);
      }
    };

    checkFavorites();
  }, [currentPath]);

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
    // For exact path matching for other tabs
    return currentPath === tabPath;
  };

  const getTabColor = (tabPath: string) => {
    return isTabActive(tabPath) ? "#ffffff" : "#82878F";
  };

  const getStarStyle = () => {
    const isActive = isTabActive("Favourite");
    
    if (isActive) {
      return "#ffffff"; // White when tab is active
    } else if (hasFavorites) {
      return "#4255ff"; // Blue when has favorites
    } else {
      return "#82878F"; // Gray when no favorites
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
        icon: <Entypo name="star" size={36} color={getStarStyle()} />,
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
                    <Entypo name="star" size={32} color={getStarStyle()} />
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
    paddingBottom: 2,
  },
  navBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'android' ? 10 : 12,
    height: 76,
    paddingHorizontal: 5,
  },
  navItem: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    flex: 1, 
    paddingVertical: 8,
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
    marginBottom: 2,
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