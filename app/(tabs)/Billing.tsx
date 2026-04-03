import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Pdf from "../../assets/svgIcons/Pdf";
import BottomNavigation from "./BottomNavigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import DownloadIcon from "../../assets/svgIcons/Downlode";
import BackButton from "../../components/BackButton";
import { safeBack } from "../../utils/navigation";
import { BASE_URL } from "../../config";

const { width, height } = Dimensions.get("window");

const Billing = () => {
  const [userType, setUserType] = useState<"student" | "teacher" | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadBillingData = async () => {
    try {
      const authData = await AsyncStorage.getItem("auth_token");
      if (!authData) return;

      // TODO: Replace with actual API endpoint
      const response = await fetch(`${BASE_URL}/api/billing/invoices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authData}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      } else {
        console.error('Failed to load billing data:', response.statusText);
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      setInvoices([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBillingData();
    setRefreshing(false);
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const type = await AsyncStorage.getItem("user_role");
        const email = await AsyncStorage.getItem("user_email");

        if (type && email) {
          setUserType(type as "student" | "teacher");
          setUserEmail(email);
        }
      } catch (err) {
        console.error("❌ Failed to load user data", err);
      }
    };

    loadUserData();
    loadBillingData();
  }, []);

  useEffect(() => {
    if (userType && userEmail) {
      console.log("✅ Loaded User:", userEmail, "Role:", userType);
    }
  }, [userEmail, userType]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#5f5fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton size={30} color="#000" onPress={() => safeBack(router)} />
        <Text style={styles.headerText}>Billing</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Invoices</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.invoiceList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {invoices.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No invoices found</Text>
              <Text style={styles.emptySubtext}>Your billing history will appear here</Text>
            </View>
          ) : (
            invoices.map((invoice) => (
              <TouchableOpacity key={invoice.id} style={styles.invoiceItem}>
                <Pdf width={24} height={24} />
                <View style={styles.invoiceInfo}>
                  <Text style={styles.invoiceName}>{invoice.name || invoice.description}</Text>
                  <Text style={styles.invoiceDate}>{invoice.date}</Text>
                </View>
                <Text style={styles.invoiceAmount}>{invoice.amount}</Text>
                <TouchableOpacity
                  onPress={() => {
                    console.log(`Downloading ${invoice.name || invoice.description}`);
                  }}
                  style={styles.downloadButton}
                >
                  <DownloadIcon/>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      <BottomNavigation userType={userType} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5f5fff",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.08,
    paddingBottom: height * 0.02,
  },
  headerText: {
    fontSize: width * 0.06,
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 12,
  },
  content: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: width * 0.06,
    paddingTop: height * 0.03,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  title: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#333",
  },
  seeAll: {
    fontSize: width * 0.035,
    color: "#c2c2c2",
   lineHeight:16
  },
  invoiceList: {
    paddingBottom: 80,
  },
  invoiceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
  },
  invoiceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  invoiceName: {
    fontSize: width * 0.04,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  invoiceDate: {
    fontSize: width * 0.03,
    color: "#666",
  },
  invoiceAmount: {
    fontSize: width * 0.04,
    fontWeight: "bold",
    color: "#007AFF",
    marginRight: 12,
  },
  downloadButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: width * 0.045,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: width * 0.035,
    color: '#999',
  },
  invoiceText: {
    fontSize: width * 0.04,
    marginLeft: 12,
    color: "#333",
  },
});

export default Billing;
