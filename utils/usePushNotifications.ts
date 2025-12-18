import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../config";
import { getAuthData } from "./authStorage";
import { Platform } from "react-native";

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    const register = async () => {
      if (!Device.isDevice) {
        // alert("Must use physical device for Push Notifications");
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        alert("Failed to get push token for notifications");
        return;
      }

      
      if (Platform.OS !== "web") {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;
        setExpoPushToken(token);

        const auth = await getAuthData();
        if (auth?.email) {
          await axios.post(`${BASE_URL}/api/save-token`, {
            email: auth.email,
            token,
          });
        }
      }
    };

    register();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Received notification:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Tapped notification:", response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken };
};
