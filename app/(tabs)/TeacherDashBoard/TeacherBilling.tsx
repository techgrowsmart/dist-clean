import React, { useEffect, useState, useRef } from "react";
import {
  Platform,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  FlatList,
  Linking,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { router, useLocalSearchParams } from 'expo-router';
import BackButton from "../../../components/BackButton";
import WebNavbar from "../../../components/ui/WebNavbar";
import TeacherWebSidebar from "../../../components/ui/TeacherWebSidebar";
import { TeacherThoughtsBackground } from "../../../components/ui/TeacherThoughtsCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../../config";
import * as Haptics from 'expo-haptics';
import { getAuthData } from "../../../utils/authStorage";

const { width, height } = Dimensions.get("window");

interface Invoice {
  id: string;
  name: string;
  description: string;
  amount: string;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  pdfUrl?: string;
  downloadUrl?: string;
}

interface BillingStats {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  nextPaymentDate: string;
  nextPaymentAmount: string;
  totalEarnings: number;
  monthlyEarnings: number;
}

const TeacherBilling = () => {
  const { userEmail: routeUserEmail, studentName: routeStudentName, profileImage: routeProfileImage } = useLocalSearchParams<{ userEmail: string; studentName: string; profileImage: string }>();
  const [userEmail, setUserEmail] = useState(routeUserEmail || '');
  const [studentName, setStudentName] = useState(routeStudentName || 'Teacher');
  const [profileImage, setProfileImage] = useState<string | null>(routeProfileImage || null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingStats, setBillingStats] = useState<BillingStats>({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    nextPaymentDate: '',
    nextPaymentAmount: '',
    totalEarnings: 0,
    monthlyEarnings: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sidebarActiveItem, setSidebarActiveItem] = useState("Billing");
  
  // Animation refs
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  // Responsive breakpoints
  const isMobile = width < 768;
  const isDesktop = width >= 1024;
  
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    // Verify user is a teacher, redirect if not
    const verifyUserRole = async () => {
      try {
        const userRole = await AsyncStorage.getItem("user_role");
        if (userRole !== "teacher") {
          console.log("❌ Non-teacher trying to access teacher billing, redirecting...");
          router.replace("/(tabs)/StudentDashBoard/StudentBilling");
          return;
        }
      } catch (error) {
        console.error("Error verifying user role:", error);
        router.replace("/(tabs)/TeacherDashBoard/Teacher");
        return;
      }
    };

    // Fetch user data if not provided via route params
    const fetchUserData = async () => {
      try {
        const auth = await getAuthData();
        if (auth?.email) {
          if (!routeUserEmail) {
            setUserEmail(auth.email);
          }
          
          // Fetch profile data if not provided
          if (!routeStudentName || !routeProfileImage) {
            const headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
            const res = await fetch(`${BASE_URL}/api/userProfile`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ email: auth.email }),
            });

            if (res.ok) {
              const data = await res.json();
              if (!routeStudentName) setStudentName(data.name || "Teacher");
              if (!routeProfileImage) setProfileImage(data.profileimage || null);
              await AsyncStorage.multiSet([
                ["studentName", data.name || ""],
                ["profileImage", data.profileimage || ""]
              ]);
            }
          }
        }
      } catch (error) {
        // Use cached data as fallback
        const cachedName = await AsyncStorage.getItem("studentName") || "Teacher";
        const cachedImage = await AsyncStorage.getItem("profileImage") || null;
        if (!routeStudentName) setStudentName(cachedName);
        if (!routeProfileImage) setProfileImage(cachedImage);
      }
    };

    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();

    const loadBillingData = async () => {
      try {
        const auth = await getAuthData();
        if (!auth?.token) {
          console.error('❌ No auth token found for billing data');
          setInvoices([]);
          setBillingStats({
            totalPaid: 0,
            totalPending: 0,
            totalOverdue: 0,
            nextPaymentDate: '',
            nextPaymentAmount: '',
            totalEarnings: 0,
            monthlyEarnings: 0,
          });
          setLoading(false);
          return;
        }

        const headers = { 
          Authorization: `Bearer ${auth.token}`, 
          "Content-Type": "application/json" 
        };

        // Fetch teacher billing data from API
        const response = await fetch(`${BASE_URL}/api/billing/teacher-invoices`, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          setInvoices(data.invoices || []);
          setBillingStats(data.stats || {
            totalPaid: 0,
            totalPending: 0,
            totalOverdue: 0,
            nextPaymentDate: '',
            nextPaymentAmount: '',
            totalEarnings: 0,
            monthlyEarnings: 0,
          });
        } else {
          console.error('❌ Failed to fetch billing data:', response.status);
          setInvoices([]);
          setBillingStats({
            totalPaid: 0,
            totalPending: 0,
            totalOverdue: 0,
            nextPaymentDate: '',
            nextPaymentAmount: '',
            totalEarnings: 0,
            monthlyEarnings: 0,
          });
        }
      } catch (error) {
        console.error('Error loading billing data:', error);
        setInvoices([]);
        setBillingStats({
          totalPaid: 0,
          totalPending: 0,
          totalOverdue: 0,
          nextPaymentDate: '',
          nextPaymentAmount: '',
          totalEarnings: 0,
          monthlyEarnings: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    verifyUserRole();
    fetchUserData();
    loadBillingData();
  }, [routeUserEmail, routeStudentName, routeProfileImage]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const auth = await getAuthData();
      if (!auth?.token) {
        console.error('❌ No auth token found for refresh');
        setRefreshing(false);
        return;
      }

      const headers = { 
        Authorization: `Bearer ${auth.token}`, 
        "Content-Type": "application/json" 
      };

      // Fetch fresh billing data from API
      const response = await fetch(`${BASE_URL}/api/billing/teacher-invoices`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setBillingStats(data.stats || {
          totalPaid: 0,
          totalPending: 0,
          totalOverdue: 0,
          nextPaymentDate: '',
          nextPaymentAmount: '',
          totalEarnings: 0,
          monthlyEarnings: 0,
        });
      } else {
        console.error('❌ Failed to refresh billing data:', response.status);
      }
    } catch (error) {
      console.error('Error refreshing billing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSidebarSelect = (item: string) => {
    setSidebarActiveItem(item);
    // Handle navigation - only teacher routes allowed
    switch (item) {
      case 'Home':
        router.push('/(tabs)/TeacherDashBoard/Teacher');
        break;
      case 'Create Subject':
        router.push('/(tabs)/TeacherDashBoard/CreateSubject');
        break;
      case 'Your Subjects':
        router.push('/(tabs)/TeacherDashBoard/YourSubjects');
        break;
      case 'Earnings':
        router.push('/(tabs)/TeacherDashBoard/Earnings');
        break;
      case 'Profile':
        router.push('/(tabs)/TeacherDashBoard/Profile');
        break;
      case 'Share':
        router.push({ pathname: "/(tabs)/TeacherDashBoard/Share", params: { userEmail } } as any);
        break;
      case 'Billing':
        // Already on this page
        break;
      case 'Faq':
        router.push('/(tabs)/TeacherDashBoard/Faq');
        break;
      case 'Subscription':
        router.push({ pathname: "/(tabs)/TeacherDashBoard/Subscription", params: { userEmail } } as any);
        break;
      case 'Settings':
        router.push('/(tabs)/TeacherDashBoard/Settings');
        break;
      case 'Contact Us':
        router.push('/(tabs)/Contact');
        break;
      default:
        console.log('Navigate to:', item);
    }
  };

  const triggerHaptic = async (type: 'light' | 'medium' | 'success' | 'error') => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        switch (type) {
          case 'light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
        }
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
  };

  const handleInvoicePress = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
    triggerHaptic('light');
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    triggerHaptic('medium');
    
    try {
      if (invoice.downloadUrl) {
        // In a real app, this would download the PDF
        Alert.alert(
          'Download Invoice',
          `Downloading ${invoice.name}...`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'OK', onPress: () => console.log('Download confirmed') }
          ]
        );
      } else {
        Alert.alert('Error', 'Download not available for this invoice');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download invoice');
    }
  };

  const handlePayInvoice = (invoice: Invoice) => {
    triggerHaptic('medium');
    Alert.alert(
      'Payment',
      `Proceed to pay ${invoice.amount} for ${invoice.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: () => console.log('Payment initiated') }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'overdue': return 'warning';
      default: return 'help-circle';
    }
  };

  const filteredInvoices = invoices.filter(invoice => 
    filterStatus === 'all' || invoice.status === filterStatus
  );

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'amount':
        return parseFloat(b.amount.replace('$', '')) - parseFloat(a.amount.replace('$', ''));
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const renderInvoiceItem = (invoice: Invoice) => (
    <TouchableOpacity
      key={invoice.id}
      style={styles.invoiceItem}
      onPress={() => handleInvoicePress(invoice)}
    >
      <View style={[styles.statusIcon, { backgroundColor: getStatusColor(invoice.status) }]}>
        <Ionicons name={getStatusIcon(invoice.status)} size={20} color="#FFFFFF" />
      </View>
      <View style={styles.invoiceInfo}>
        <Text style={styles.invoiceName}>{invoice.name}</Text>
        <Text style={styles.invoiceDescription}>{invoice.description}</Text>
        <Text style={styles.invoiceDate}>Due: {invoice.dueDate}</Text>
      </View>
      <View style={styles.invoiceRight}>
        <Text style={styles.invoiceAmount}>{invoice.amount}</Text>
        <Text style={[styles.invoiceStatus, { color: getStatusColor(invoice.status) }]}>
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={() => handleDownloadInvoice(invoice)}
      >
        <Ionicons name="download-outline" size={20} color="#3B5BFE" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsHeader}>
        <Text style={styles.statsTitle}>Earnings Overview</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={20} color="#3B5BFE" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${billingStats.totalEarnings}</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${billingStats.monthlyEarnings}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{billingStats.totalPaid}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>
      
      <View style={styles.earningsDetails}>
        <View style={styles.earningRow}>
          <Text style={styles.earningLabel}>Pending Payments:</Text>
          <Text style={styles.earningValue}>{billingStats.totalPending}</Text>
        </View>
        <View style={styles.earningRow}>
          <Text style={styles.earningLabel}>Overdue:</Text>
          <Text style={[styles.earningValue, { color: '#EF4444' }]}>{billingStats.totalOverdue}</Text>
        </View>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(['all', 'paid', 'pending', 'overdue'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              filterStatus === status && styles.filterChipActive
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[
              styles.filterText,
              filterStatus === status && styles.filterTextActive
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B5BFE" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B5BFE" />
        <Text style={styles.loadingText}>Loading billing data...</Text>
      </View>
    );
  }

  if (!isDesktop) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton size={24} color="#FFFFFF" onPress={() => router.back()} />
          <Text style={styles.headerText}>Billing</Text>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Stats Card */}
            {renderStatsCard()}

            {/* Filters */}
            {renderFilters()}

            {/* Invoices List */}
            <View style={styles.invoicesContainer}>
              <View style={styles.invoicesHeader}>
                <Text style={styles.invoicesTitle}>Payment History</Text>
                <Text style={styles.invoicesCount}>{sortedInvoices.length} items</Text>
              </View>
              
              {sortedInvoices.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyText}>No payments found</Text>
                  <Text style={styles.emptySubtext}>Your payment history will appear here</Text>
                </View>
              ) : (
                sortedInvoices.map(renderInvoiceItem)
              )}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Invoice Modal */}
        <Modal
          visible={showInvoiceModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowInvoiceModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Payment Details</Text>
                <TouchableOpacity onPress={() => setShowInvoiceModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              {selectedInvoice && (
                <View style={styles.modalBody}>
                  <View style={styles.modalInvoiceInfo}>
                    <Text style={styles.modalInvoiceName}>{selectedInvoice.name}</Text>
                    <Text style={styles.modalInvoiceDescription}>{selectedInvoice.description}</Text>
                    <View style={styles.modalInvoiceDetails}>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Amount:</Text>
                        <Text style={styles.modalDetailValue}>{selectedInvoice.amount}</Text>
                      </View>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Status:</Text>
                        <Text style={[styles.modalDetailValue, { color: getStatusColor(selectedInvoice.status) }]}>
                          {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Date:</Text>
                        <Text style={styles.modalDetailValue}>{selectedInvoice.date}</Text>
                      </View>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Due Date:</Text>
                        <Text style={styles.modalDetailValue}>{selectedInvoice.dueDate}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.downloadModalButton]}
                      onPress={() => handleDownloadInvoice(selectedInvoice)}
                    >
                      <Ionicons name="download-outline" size={20} color="#3B5BFE" />
                      <Text style={[styles.modalButtonText, { color: '#3B5BFE' }]}>Download</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Desktop Layout - Teacher Version
  return (
    <View style={styles.desktopContainer}>
      <WebNavbar />
      
      <View style={styles.desktopLayout}>
        <TeacherWebSidebar 
          activeItem="Billing" 
          onItemPress={handleSidebarSelect}
          userEmail={userEmail || ""}
          studentName={studentName || "Teacher"}
          profileImage={profileImage || null}
        />
        
        <View style={styles.desktopMain}>
          <TeacherThoughtsBackground>
            <View style={styles.desktopContent}>
              <Animated.View style={[styles.desktopHeader, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Text style={styles.desktopTitle}>Teacher Billing</Text>
                <Text style={styles.desktopSubtitle}>Manage your earnings and payment history</Text>
              </Animated.View>

              <View style={styles.desktopGrid}>
                {/* Left Column - Stats and Filters */}
                <View style={styles.desktopLeft}>
                  {renderStatsCard()}
                  {renderFilters()}
                </View>

                {/* Right Column - Invoices */}
                <View style={styles.desktopRight}>
                  <View style={styles.desktopInvoicesContainer}>
                    <View style={styles.invoicesHeader}>
                      <Text style={styles.invoicesTitle}>Payment History</Text>
                      <Text style={styles.invoicesCount}>{sortedInvoices.length} items</Text>
                    </View>
                    
                    {sortedInvoices.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No payments found</Text>
                        <Text style={styles.emptySubtext}>Your payment history will appear here</Text>
                      </View>
                    ) : (
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {sortedInvoices.map(renderInvoiceItem)}
                      </ScrollView>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </TeacherThoughtsBackground>
        </View>
      </View>

      {/* Invoice Modal */}
      <Modal
        visible={showInvoiceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Details</Text>
              <TouchableOpacity onPress={() => setShowInvoiceModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedInvoice && (
              <View style={styles.modalBody}>
                <View style={styles.modalInvoiceInfo}>
                  <Text style={styles.modalInvoiceName}>{selectedInvoice.name}</Text>
                  <Text style={styles.modalInvoiceDescription}>{selectedInvoice.description}</Text>
                  <View style={styles.modalInvoiceDetails}>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Amount:</Text>
                      <Text style={styles.modalDetailValue}>{selectedInvoice.amount}</Text>
                    </View>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Status:</Text>
                      <Text style={[styles.modalDetailValue, { color: getStatusColor(selectedInvoice.status) }]}>
                        {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Date:</Text>
                      <Text style={styles.modalDetailValue}>{selectedInvoice.date}</Text>
                    </View>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Due Date:</Text>
                      <Text style={styles.modalDetailValue}>{selectedInvoice.dueDate}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.downloadModalButton]}
                    onPress={() => handleDownloadInvoice(selectedInvoice)}
                  >
                    <Ionicons name="download-outline" size={20} color="#3B5BFE" />
                    <Text style={[styles.modalButtonText, { color: '#3B5BFE' }]}>Download</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TeacherBilling;

const styles = StyleSheet.create({
  // Mobile Styles
  container: {
    flex: 1,
    backgroundColor: "#3B5BFE",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontFamily: 'Poppins_400Regular',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "700",
    marginLeft: 16,
    fontFamily: 'Poppins_700Bold',
  },
  content: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  
  // Stats Card
  statsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: 'Poppins_600SemiBold',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: 'Poppins_700Bold',
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },
  earningsDetails: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  earningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  earningLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: 'Poppins_400Regular',
  },
  earningValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: 'Poppins_600SemiBold',
  },
  
  // Filters
  filtersContainer: {
    marginBottom: 24,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#3B5BFE",
  },
  filterText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: 'Poppins_400Regular',
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  
  // Invoices
  invoicesContainer: {
    flex: 1,
  },
  invoicesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  invoicesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: 'Poppins_600SemiBold',
  },
  invoicesCount: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: 'Poppins_400Regular',
  },
  invoiceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  invoiceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  invoiceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: 'Poppins_600SemiBold',
  },
  invoiceDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  invoiceDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  invoiceRight: {
    alignItems: "flex-end",
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: 'Poppins_600SemiBold',
  },
  invoiceStatus: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  downloadButton: {
    padding: 8,
    marginLeft: 12,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
    fontFamily: 'Poppins_400Regular',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: 'Poppins_700Bold',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalInvoiceInfo: {
    marginBottom: 20,
  },
  modalInvoiceName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalInvoiceDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    fontFamily: 'Poppins_400Regular',
  },
  modalInvoiceDetails: {
    gap: 12,
  },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalDetailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: 'Poppins_400Regular',
  },
  modalDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    fontFamily: 'Poppins_500Medium',
  },
  modalActions: {
    gap: 12,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  downloadModalButton: {
    backgroundColor: "#F3F4F6",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: 'Poppins_600SemiBold',
  },
  
  // Desktop Styles
  desktopContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  desktopLayout: {
    flex: 1,
    flexDirection: "row",
  },
  desktopMain: {
    flex: 1,
  },
  desktopContent: {
    flex: 1,
    padding: 32,
  },
  desktopHeader: {
    marginBottom: 32,
  },
  desktopTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: 'Poppins_700Bold',
  },
  desktopSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
    fontFamily: 'Poppins_400Regular',
  },
  desktopGrid: {
    flexDirection: "row",
    gap: 32,
  },
  desktopLeft: {
    width: 300,
  },
  desktopRight: {
    flex: 1,
  },
  desktopInvoicesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
});
