
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export interface AuthData {
    role: string;
    email: string;
    token: string;
    name?: string;
    profileImage?: string;
}

export const storeAuthData = async (authData: Partial<AuthData>) => {
    try {
        if (authData.role) {
            await AsyncStorage.setItem("user_role", authData.role);
        }

        if (authData.email) {
            await AsyncStorage.setItem("user_email", authData.email);
        }

        if (authData.token) {
            await AsyncStorage.setItem("user_token", authData.token);
        }

        if (authData.name) {
            await AsyncStorage.setItem("user_name", authData.name);
        }

        if (authData.profileImage) {
            await AsyncStorage.setItem("user_profile_image", authData.profileImage);
        }
        await AsyncStorage.setItem("is_logged_in", "true");

        console.log("Auth data stored successfully");
    } catch (error) {
        console.error("Error storing auth data:", error);
    }
};

export const getAuthData = async (): Promise<AuthData | null> => {
    try {
        const role = await AsyncStorage.getItem("user_role");
        const email = await AsyncStorage.getItem("user_email");
        const token = await AsyncStorage.getItem("user_token");
        const isLoggedIn = await AsyncStorage.getItem("is_logged_in");
        const name = await AsyncStorage.getItem("user_name");
        const profileImage = await AsyncStorage.getItem("user_profile_image");

        if (isLoggedIn === "true" && role && token) {
            return { role, email: email || "", token, name: name || "", profileImage: profileImage || undefined };
        }

        return null;
    } catch (error) {
        console.error("Error retrieving auth data:", error);
        return null;
    }
};

export const getAuthToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem("user_token");
    } catch (error) {
        console.error("Error retrieving token:", error);
        return null;
    }
};

export const clearAllStorage = async () => {
    try {
        if (Platform.OS === "web") {
            console.log("🌐 Clearing web localStorage and sessionStorage...");
            localStorage.clear();
            sessionStorage.clear();
        } else {
            console.log("📱 Clearing mobile AsyncStorage...");
            await AsyncStorage.clear();
        }
        console.log("✅ All storage data cleared successfully");
    } catch (error) {
        console.error("❌ Error clearing all data:", error);
        throw error;
    }
};
  
