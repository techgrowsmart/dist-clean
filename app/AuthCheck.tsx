import { getAuthData } from "../utils/authStorage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function AuthCheck() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authData = await getAuthData();

                if (authData && authData.token) {
                    if (authData.role === "teacher") {
                        router.replace("/(tabs)/TeacherDashBoard");
                    } else if (authData.role === "student") {
                        router.replace("/(tabs)/StudentDashBoard");
                    } else {
                        router.replace("/auth/LoginOptionsScreen");
                    }
                } else {
                    router.replace("/auth/LoginOptionsScreen");
                }
                setChecking(false);
            } catch (error) {
                console.error("Error checking auth:", error);
                router.replace("/Login");
                setChecking(false);
            }
        };

        checkAuth();
    }, [router]);

    if (checking) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0066cc" />
                <Text style={styles.text}>Loading...</Text>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    text: {
        marginTop: 10,
        fontSize: 16,
        fontFamily: "Poppins_Regular",
    },
});