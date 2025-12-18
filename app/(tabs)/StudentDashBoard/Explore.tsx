import React from "react";
import {View, Text, TextInput, Image, TouchableOpacity, StyleSheet, ScrollView} from "react-native";
import { router } from "expo-router";
import {Link} from "expo-router"
import BottomNavigation from "../../../app/(tabs)/StudentDashBoard/BottomNavigation";

const videos = [
    { id: "bv5w8Nc4CQI", title: "AI Revolution", thumbnail: "https://img.youtube.com/vi/bv5w8Nc4CQI/0.jpg" },
    { id: "j6a9kMvN2Kk", title: "Future Tech", thumbnail: "https://img.youtube.com/vi/j6a9kMvN2Kk/0.jpg" },
    { id: "IjS9eTpmhgk", title: "Robotics Explained", thumbnail: "https://img.youtube.com/vi/IjS9eTpmhgk/0.jpg" },
    { id: "Fkd9TWUtFm0", title: "Space Exploration", thumbnail: "https://img.youtube.com/vi/Fkd9TWUtFm0/0.jpg" }
];

export default function Explore() {
    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Image source={require("../../../assets/images/Search.png")} style={styles.searchIcon} />
                <TextInput
                    placeholder="Search"
                    placeholderTextColor="#82878F"
                    style={styles.searchInput}
                />
                {/* Filter Icon - Clickable */}
                <TouchableOpacity onPress={() => router.push("/(tabs)/StudentDashBoard/Filter")}>
                    <Image source={require("../../../assets/images/Filter(1).png")} style={styles.filterIcon} />
                </TouchableOpacity>
            </View>



            {/* Scrollable Video List */}
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {videos.map((video) => (
                    <Link key={video.id} href={{ pathname: "/video/[id]", params: { id: video.id } }} asChild>
                        <TouchableOpacity style={styles.videoContainer}>
                            <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />
                            <Text style={styles.videoTitle} numberOfLines={1} ellipsizeMode="tail">
                                {video.title}
                            </Text>
                        </TouchableOpacity>
                    </Link>
                ))}
            </ScrollView>


            {/* Bottom Navigation */}
            <BottomNavigation />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFFFFF", padding: 20 },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 10,
        paddingHorizontal: 10,
        width: "90%",
        height: 90,
        marginTop: 50,
        borderBottomWidth: 0.2,
    },
    text: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
        marginTop: 20,
    },
    searchIcon: { width: 30, height: 30, marginRight: 10, tintColor: "black" },
    searchInput: { flex: 1, fontSize: 20, color: "#333" },
    filterIcon: { width: 50, height: 50, marginLeft: 10 },
    scrollContainer: { paddingBottom: 100 },
    videoContainer: { width: "100%", alignItems: "center", marginVertical: 10 },
    thumbnail: { width: "90%", height: 200, borderRadius: 10 },
    videoTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginTop: 5, textAlign: "left", width: "90%" },
});



