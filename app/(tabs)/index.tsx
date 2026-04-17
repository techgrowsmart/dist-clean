import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, StyleSheet, View } from "react-native";
import { getAuthData } from "../../utils/authStorage";

export default function SplashScreen() {
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            setIsCheckingAuth(true);
            try {

                const authData = await getAuthData();

                if (authData) {
                    console.log("User is logged in as:", authData.role);

                    if (authData.role === "teacher") {
                        router.replace("/(tabs)/TeacherDashBoard");
                    } else {

                        router.replace("/(tabs)/StudentDashBoard");
                    }
                } else {
                    console.log("User is not logged in");

                    router.replace("/auth/InitialScreen");
                }
            } catch (error) {
                console.error("Auth check error:", error);

                router.replace("/auth/InitialScreen");
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            {isCheckingAuth && (
                <ActivityIndicator
                    style={styles.loader}
                    size="small"
                    color="#FF4343"
                />
            )}
        </View>
    );
}


const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        alignItems: "center",
        justifyContent: "center",
    },
    loader: {
        position: "absolute",
        bottom: height * 0.05,
    }
});