import { getAuthData } from "../../utils/authStorage";
import { useRouter } from "expo-router";
import React from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, View, Image } from "react-native";

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
                        router.replace("/(tabs)/TeacherDashBoard/Teacher");
                    } else {
                      
                        router.replace("/(tabs)/StudentDashBoard/Student");
                    }
                } else {
                    console.log("User is not logged in");
                  
                    router.replace("/(tabs)/MainScreen");
                }
            } catch (error) {
                console.error("Auth check error:", error);
              
                router.replace("/(tabs)/MainScreen");
            }
        }, 6500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
          
            <Image
                source={require("../../assets/image/splash.gif")}
                style={styles.video}
                resizeMode="contain"
            />

          
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
        position: "relative",
    },
    video: {
        width: width,
        height: height,
        position: "absolute",
    },
    loader: {
        position: "absolute",
        bottom: height * 0.05, 
    }
});