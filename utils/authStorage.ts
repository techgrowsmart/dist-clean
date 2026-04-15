
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { decodeJWT } from "./jwtDecode";

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

        // Also sync to localStorage for web platform to handle reloads better
        if (Platform.OS === 'web') {
            if (authData.role) localStorage.setItem("user_role", authData.role);
            if (authData.email) localStorage.setItem("user_email", authData.email);
            if (authData.token) localStorage.setItem("user_token", authData.token);
            if (authData.name) localStorage.setItem("user_name", authData.name);
            if (authData.profileImage) localStorage.setItem("user_profile_image", authData.profileImage);
            localStorage.setItem("is_logged_in", "true");
        }

        console.log("Auth data stored successfully");
    } catch (error) {
        console.error("Error storing auth data:", error);
    }
};

export const getAuthData = async (): Promise<AuthData | null> => {
    try {
        let role = await AsyncStorage.getItem("user_role");
        let email = await AsyncStorage.getItem("user_email");
        let token = await AsyncStorage.getItem("user_token");
        let isLoggedIn = await AsyncStorage.getItem("is_logged_in");
        let name = await AsyncStorage.getItem("user_name");
        let profileImage = await AsyncStorage.getItem("user_profile_image");

        // On web, also check localStorage if AsyncStorage returns null/empty
        if (Platform.OS === 'web') {
            if (!role) role = localStorage.getItem("user_role");
            if (!email) email = localStorage.getItem("user_email");
            if (!token) token = localStorage.getItem("user_token");
            if (!isLoggedIn) isLoggedIn = localStorage.getItem("is_logged_in");
            if (!name) name = localStorage.getItem("user_name");
            if (!profileImage) profileImage = localStorage.getItem("user_profile_image");
        }

        if (isLoggedIn === "true" && role && token) {
            // If email is missing from storage, try to extract from JWT token
            if (!email && token) {
                const decoded = decodeJWT(token);
                if (decoded?.email) {
                    email = decoded.email;
                    // Also store it for future use
                    await AsyncStorage.setItem("user_email", email);
                    if (Platform.OS === 'web') localStorage.setItem("user_email", email);
                }
            }
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
        await AsyncStorage.clear();
        console.log("✅ All AsyncStorage data cleared");
    } catch (error) {
        console.error("❌ Error clearing all data:", error);
    }
};
