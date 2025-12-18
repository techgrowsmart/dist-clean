import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { router, usePathname } from "expo-router";
import React from 'react'

//const { width } = Dimensions.get("window");
import responsive from '../../../responsive'
interface BottomNavigationProps {
    userEmail:string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({userEmail}) => {
    const currentPath = usePathname();

    return (
        

        <View style={styles.navBar}>
            {/* Notification Button (Left) */}
            <TouchableOpacity
                style={styles.navItem}
                onPress={() => {
                    if (currentPath !== "/TeacherDashBoard/Notification") {
                        router.replace("/(tabs)/TeacherDashBoard/Notification");
                    }
                }}
            >
                <Image
                    source={require("../../../assets/images/notification.png")}
                    style={[
                        styles.icon,
                        currentPath === "/TeacherDashBoard/Notification" ? styles.activeIcon : styles.inactiveIcon,
                    ]}
                />
                <Text
                    style={[
                        styles.navLabel,
                        currentPath === "/TeacherDashBoard/Notification" ? styles.activeText : styles.inactiveText,
                    ]}
                >
                    Notify
                </Text>
            </TouchableOpacity>

            {/* Home Button (Middle) */}
            <TouchableOpacity
                style={styles.navItem}
                onPress={() => {
                    if (currentPath !== "/TeacherDashBoard/Teacher") {
                        router.replace("/TeacherDashBoard/Teacher");
                    }
                }}
            >
                <Image
                    source={require("../../../assets/images/Home.png")}
                    style={[
                        styles.icon,
                        currentPath === "/TeacherDashBoard/Teacher" ? styles.activeIcon : styles.inactiveIcon,
                    ]}
                />
                <Text
                    style={[
                        styles.navLabel,
                        currentPath === "/TeacherDashBoard/Teacher" ? styles.activeText : styles.inactiveText,
                    ]}
                >
                    Home
                </Text>
            </TouchableOpacity>

            {/* Student Tracker Button (Right) */}
            <TouchableOpacity
                style={styles.navItem}
                onPress={() => {
                    if (currentPath !== "/TeacherDashBoard/StudentTracker") {
                        router.push({
                            pathname: "/TeacherDashBoard/StudentTracker",
                            params: {userEmail: userEmail}
                        });
                    }
                }}
            >
                <Image
                    source={require("../../../assets/images/Saved.png")}
                    style={[
                        styles.icon,
                        currentPath === "/TeacherDashBoard/StudentTracker" ? styles.activeIcon : styles.inactiveIcon,
                    ]}
                />
                <Text
                    style={[
                        styles.navLabel,
                        currentPath === "/TeacherDashBoard/StudentTracker" ? styles.activeText : styles.inactiveText,
                    ]}
                >
                    Students
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
        paddingHorizontal: responsive.width(0.1),
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    navItem: {
        alignItems: "center",
        flex: 1,
    },
    icon: {
        width: 28,
        height: 28,
    },
    activeIcon: {
        tintColor: "#ffffff",
    },
    inactiveIcon: {
        tintColor: "#82878F",
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
});

export default BottomNavigation;