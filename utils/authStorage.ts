
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AuthData {
    role: string;
    email: string;
    token: string;
    name?: string;
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

        if (isLoggedIn === "true" && role && token) {
            return { role, email: email || "", token, name: name || "" };
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
        // await AsyncStorage.multiRemove([
        //     "user_role",
        //     "user_email",
        //     "user_token",
        //     "is_logged_in",
        //     "profileImage"
        // ]);
        // console.log("Auth data cleared successfully");
    } catch (error) {
        console.error("Error clearing auth data:", error);
    }
};
// export const clearAllStorage = async () => {
//     try {
//       await AsyncStorage.clear();
//       console.log("✅ All AsyncStorage data cleared");
//     } catch (error) {
//       console.error("❌ Error clearing all data:", error);
//     }
//   };
  
