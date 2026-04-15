import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import HomeIcon from "../../../assets/svgIcons/Home";
import ChatIcon from "../../../assets/svgIcons/ChatIcon";
import PersonIcon from "../../../assets/svgIcons/Person";
import socketService from "../../../services/socketService";
const { width } = Dimensions.get("window");

const BottomNavigation = () => {
  const currentPath = usePathname();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Check socket connection status
    const checkConnection = () => {
      setSocketConnected(socketService.isConnected());
    };

    checkConnection();
    
    // Listen for connection changes
    const unsubscribe = socketService.on('connect', checkConnection);
    const unsubscribeDisconnect = socketService.on('disconnect', () => setSocketConnected(false));
    
    const interval = setInterval(checkConnection, 5000); // Check every 5 seconds

    return () => {
      unsubscribe();
      unsubscribeDisconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <View style={styles.navBar}>
      {/* Home Button */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (currentPath !== "/StudentDashBoard/Student") {
            router.replace("/StudentDashBoard/Student");
          }
        }}
      >
        <HomeIcon
          width={28}
          height={28}
          color={
            currentPath === "/StudentDashBoard/Student"
              ? "#ffffff"
              : "#82878F"
          }
        />
        <Text
          style={[
            styles.navLabel,
            currentPath === "/StudentDashBoard/Student"
              ? styles.activeText
              : styles.inactiveText,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Notification Button */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (currentPath !== "/(tabs)/Messages/Messages") {
            router.replace("/(tabs)/Messages/Messages");
          }
        }}
      >
        <View style={styles.iconContainer}>
          <ChatIcon 
          width={28}
          height={28}
          color={
            currentPath === "/(tabs)/Messages/Messages"
              ? "#ffffff"
              : "#82878F"
          }
          />
          {!socketConnected && (
            <View style={styles.connectionIndicator}>
              <Ionicons name="alert" size={10} color="#EF4444" />
            </View>
          )}
        </View>
        <Text
          style={[
            styles.navLabel,
            currentPath === "/(tabs)/Messages/Messages"
              ? styles.activeText
              : styles.inactiveText,
          ]}
        >
          Connect
        </Text>
      </TouchableOpacity>

      {/* Profile Button */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (currentPath !== "/StudentDashBoard/Profile") {
            router.replace("/StudentDashBoard/Profile");
          }
        }}
      >
       <PersonIcon 
         width={28}
         height={28}
         color={
           currentPath === "/StudentDashBoard/Profile"
             ? "#ffffff"
             : "#82878F"
         }
       />
        <Text
          style={[
            styles.navLabel,
            currentPath === "/StudentDashBoard/Profile"
              ? styles.activeText
              : styles.inactiveText,
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#101827",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    height: 92,
  },
  navItem: {
    alignItems: "center",
    flex: 1,
  },
  navLabel: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Poppins_400Regular",
  },
  activeText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  inactiveText: {
    color: "#82878F",
  },
  iconPlaceholder: {
    fontSize: 24,
  },
  iconContainer: {
    position: "relative",
  },
  connectionIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default BottomNavigation;
