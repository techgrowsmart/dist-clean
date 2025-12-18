import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { router, usePathname } from "expo-router";
import HomeIcon from "../../../assets/svgIcons/Home";
import ChatIcon from "../../../assets/svgIcons/ChatIcon";
import PersonIcon from "../../../assets/svgIcons/Person";
const { width } = Dimensions.get("window");

const BottomNavigation = () => {
  const currentPath = usePathname();
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
        <ChatIcon 
        width={28}
        height={28}
        color={
          currentPath === "/(tabs)/Messages/Messages"
            ? "#ffffff"
            : "#82878F"
        }
        />
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
});

export default BottomNavigation;
