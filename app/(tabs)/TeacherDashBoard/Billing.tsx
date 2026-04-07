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
import TeacherWebHeader from "../../../components/ui/TeacherWebHeader";
import TeacherWebSidebar from "../../../components/ui/TeacherWebSidebar";
import { getAuthData } from "../../../utils/authStorage";
import { BASE_URL } from "../../../config";

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
}

const Billing = () => {
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingStats, setBillingStats] = useState<BillingStats>({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    nextPaymentDate: '',
    nextPaymentAmount: '',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sidebarActiveItem, setSidebarActiveItem] = useState("Billing");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Billing");
  
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
      case 'overdue': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const handleInvoicePress = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.downloadUrl) {
      Linking.openURL(invoice.downloadUrl);
    } else {
      Alert.alert('Download', 'Invoice download will be available soon.');
    }
  };

  const handlePayInvoice = (invoice: Invoice) => {
    router.push({
      pathname: '/(tabs)/TeacherDashBoard/Payment',
      params: { invoiceId: invoice.id, amount: invoice.amount }
    } as any);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSelect = (item: string) => {
    setActiveItem(item);
    // Navigate based on item
    switch (item) {
      case "Dashboard":
        router.push("/(tabs)/TeacherDashBoard/TutorDashboardWeb" as any);
        break;
      case "My Students":
        router.push("/(tabs)/TeacherDashBoard/StudentsEnrolled" as any);
        break;
      case "My Subjects":
        router.push("/(tabs)/TeacherDashBoard/MySubjectsWeb" as any);
        break;
      case "Create Subject":
        router.push("/(tabs)/TeacherDashBoard/CreateSubject" as any);
        break;
      case "Spotlights":
        router.push("/(tabs)/TeacherDashBoard/Spotlights" as any);
        break;
      case "Connect":
        router.push("/(tabs)/TeacherDashBoard/ConnectWeb" as any);
        break;
      case "Share":
        router.push("/(tabs)/TeacherDashBoard/Share" as any);
        break;
      case "Profile":
        router.push("/(tabs)/TeacherDashBoard/ProfileWeb" as any);
        break;
      case "Billing":
        // Already on this page
        break;
      case "Contact Us":
        router.push("/(tabs)/TeacherDashBoard/Contact" as any);
        break;
      case "Terms & Conditions":
        // External link
        break;
      case "Privacy Policy":
        // External link
        break;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Reload billing data would go here
    setRefreshing(false);
  };

  useEffect(() => {
    // Fetch teacher data
    const fetchTeacherData = async () => {
      try {
        const auth = await getAuthData();
        if (auth?.token) {
          setAuthToken(auth.token);
          setTeacherName(auth.name || '');
          setUserEmail(auth.email || '');
          setProfileImage(auth.profileImage || null);
        }
      } catch (error) {
        console.error('Error loading teacher data:', error);
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
          });
        }
      } catch (error) {
        console.error('❌ Error loading billing data:', error);
        setInvoices([]);
        setBillingStats({
          totalPaid: 0,
          totalPending: 0,
          totalOverdue: 0,
          nextPaymentDate: '',
          nextPaymentAmount: '',
        });
      } finally {
        setLoading(false);
      }
    };



    fetchTeacherData();
    loadBillingData();
  }, [authToken]);

  // Filter and sort invoices
  const filteredInvoices = invoices.filter(invoice => 
    filterStatus === 'all' || invoice.status === filterStatus
  );

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'amount':
        return parseFloat(b.amount.replace('₹', '')) - parseFloat(a.amount.replace('₹', ''));
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
        <Text style={styles.statsTitle}>Billing Overview</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={20} color="#3B5BFE" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{billingStats.totalPaid}</Text>
          <Text style={styles.statLabel}>Total Paid</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{billingStats.totalPending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{billingStats.totalOverdue}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>
      
      {billingStats.nextPaymentDate && (
        <View style={styles.nextPayment}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.nextPaymentText}>
            Next payment: {billingStats.nextPaymentAmount} on {billingStats.nextPaymentDate}
          </Text>
        </View>
      )}
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
        <TeacherWebHeader teacherName={teacherName} profileImage={profileImage} />

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
                <Text style={styles.invoicesTitle}>Invoices</Text>
                <Text style={styles.invoicesCount}>{sortedInvoices.length} items</Text>
              </View>
              
              {sortedInvoices.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyText}>No invoices found</Text>
                  <Text style={styles.emptySubtext}>Your billing history will appear here</Text>
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
                <Text style={styles.modalTitle}>Invoice Details</Text>
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
                    {selectedInvoice.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.modalButton, styles.payButton]}
                        onPress={() => handlePayInvoice(selectedInvoice)}
                      >
                        <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.modalButtonText}>Pay Now</Text>
                      </TouchableOpacity>
                    )}
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
    <View style={styles.container}>
      {/* ── Top header ── */}
      <TeacherWebHeader teacherName={teacherName} profileImage={profileImage} />

      {/* ── Body: sidebar + content area ── */}
      <View style={styles.contentLayout}>

        <TeacherWebSidebar
  teacherName={teacherName}
  profileImage={profileImage}
  activeItem={activeItem}
  onItemPress={handleSelect}
  userEmail={userEmail}
  collapsed={sidebarCollapsed}
  onToggleCollapse={handleSidebarToggle}
/>

        {/* ── Main wrapper: center content only ── */}
        <View style={styles.mainWrapper}>
          {/* ── CENTER: scrollable billing content ── */}
          <View style={styles.centerContent}>
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
                    <Text style={styles.invoicesTitle}>Invoices</Text>
                    <Text style={styles.invoicesCount}>{sortedInvoices.length} items</Text>
                  </View>
                  
                  {sortedInvoices.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                      <Text style={styles.emptyText}>No invoices found</Text>
                      <Text style={styles.emptySubtext}>Your billing history will appear here</Text>
                    </View>
                  ) : (
                    sortedInvoices.map(renderInvoiceItem)
                  )}
                </View>
              </ScrollView>
            </Animated.View>
          </View>
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
              <Text style={styles.modalTitle}>Invoice Details</Text>
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
                  {selectedInvoice.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.modalButton, styles.payButton]}
                      onPress={() => handlePayInvoice(selectedInvoice)}
                    >
                      <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.modalButtonText}>Pay Now</Text>
                    </TouchableOpacity>
                  )}
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

export default Billing;

// Styles matching student billing design
const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  contentLayout: { flex: 1, flexDirection: 'row' },
  mainWrapper: { flex: 1, flexDirection: 'row' },
  centerContent: { flex: 1, backgroundColor: '#F7F9FC' },
  content: {
    flex: 1,
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },

  // Desktop styles
  desktopContainer: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopMain: {
    flex: 1,
    flexDirection: 'row',
  },
  contentColumns: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopContent: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    padding: 24,
  },
  desktopHeader: {
    marginBottom: 32,
  },
  desktopTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'Poppins_700Bold',
  },
  desktopSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: 24,
    flex: 1,
  },
  desktopLeft: {
    flex: 1,
    maxWidth: 400,
  },
  desktopRight: {
    flex: 1,
  },

  // Stats card
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Poppins_600SemiBold',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'Poppins_700Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  nextPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextPaymentText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontFamily: 'Poppins_400Regular',
  },

  // Filters
  filtersContainer: {
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B5BFE',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Invoices
  invoicesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  desktopInvoicesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  invoicesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Poppins_600SemiBold',
  },
  invoicesCount: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },

  // Invoice item
  invoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  invoiceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Poppins_400Regular',
  },
  invoiceDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
  },
  invoiceRight: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  invoiceStatus: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  downloadButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Poppins_600SemiBold',
  },
  modalBody: {
    flex: 1,
  },
  modalInvoiceInfo: {
    marginBottom: 20,
  },
  modalInvoiceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalInvoiceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontFamily: 'Poppins_400Regular',
  },
  modalInvoiceDetails: {
    gap: 12,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  modalDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'Poppins_500Medium',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  payButton: {
    backgroundColor: '#3B5BFE',
  },
  downloadModalButton: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
    fontFamily: 'Poppins_500Medium',
  },

  // Thoughts panel styles
  rightPanel: { 
    width: 350, 
    backgroundColor: '#fff', 
    borderLeftWidth: 1, 
    borderLeftColor: '#E5E7EB' 
  },
  rightPanelCollapsed: { width: 60 },
  rightPanelHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB' 
  },
  rightPanelTitleContainer: { flex: 1 },
  rightPanelTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1F2937', 
    fontFamily: 'Poppins_600SemiBold' 
  },
  collapseBtn: { padding: 4 },
  composerWrapper: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  thoughtsList: { padding: 16 },
  thoughtsScrollView: { flex: 1 },
  thoughtsLoadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  thoughtsLoadingText: { 
    marginTop: 12, 
    fontSize: 14, 
    color: '#4B5563',
    fontFamily: 'Poppins_400Regular'
  },
  emptyStateTitle: { 
    marginTop: 12, 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1F2937',
    fontFamily: 'Poppins_600SemiBold'
  },
  emptyStateText: { 
    marginTop: 4, 
    fontSize: 14, 
    color: '#4B5563',
    fontFamily: 'Poppins_400Regular'
  },
  postWrapper: { marginBottom: 16 },
});

