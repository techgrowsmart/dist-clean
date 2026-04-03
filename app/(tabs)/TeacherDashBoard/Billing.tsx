import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity, FlatList, RefreshControl } from 'react-native'
import React, { useState, useEffect } from 'react'
import { router } from 'expo-router'
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader'
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar'
import { getAuthData } from '../../../utils/authStorage'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BASE_URL } from '../../../config'

const Billing = () => {
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [sidebarActiveItem, setSidebarActiveItem] = useState('Billing');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [billingData, setBillingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load teacher data and billing information
  useEffect(() => {
    if (Platform.OS === 'web') {
      const loadTeacherData = async () => {
        try {
          const authData = await getAuthData();
          if (authData?.name) {
            setTeacherName(authData.name);
          }
          if (authData?.profileImage) {
            setProfileImage(authData.profileImage);
          }
          if (authData?.email) {
            setUserEmail(authData.email);
          }
        } catch (error) {
          console.error('Error loading teacher data:', error);
        }
      };
      loadTeacherData();
    }
    
    // Load billing data
    loadBillingData();
  }, []);
  
  const loadBillingData = async () => {
    try {
      setLoading(true);
      const authData = await getAuthData();
      if (!authData?.token) return;
      
      // TODO: Replace with actual API endpoint
      const response = await fetch(`${BASE_URL}/api/teacher/billing`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBillingData(data.billing || []);
      } else {
        console.error('Failed to load billing data:', response.statusText);
        setBillingData([]);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      setBillingData([]);
    } finally {
      setLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadBillingData();
    setRefreshing(false);
  };

  // Handle sidebar navigation
  const handleSidebarSelect = (item: string) => {
    setSidebarActiveItem(item);
    // Handle navigation for sidebar items
    switch (item) {
      case 'Dashboard':
        router.push('/(tabs)/TeacherDashBoard/TutorDashboardWeb');
        break;
      case 'My Students':
        router.push('/(tabs)/TeacherDashBoard/StudentsEnrolled');
        break;
      case 'My Subjects':
        router.push('/(tabs)/TeacherDashBoard/SubjectsListWeb');
        break;
      case 'Create Subject':
        router.push('/(tabs)/TeacherDashBoard/CreateSubject');
        break;
      case 'Spotlights':
        router.push('/(tabs)/TeacherDashBoard/JoinedDateWeb');
        break;
      case 'Share':
        router.push('/(tabs)/TeacherDashBoard/Share');
        break;
      case 'Billing':
        // Already on this page
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

  const renderBillingItem = ({ item }: { item: any }) => (
    <View style={styles.billingItem}>
      <View style={styles.itemHeader}>
        <View style={[styles.statusDot, { backgroundColor: item.status === 'Paid' ? '#10b981' : '#f59e0b' }]} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemDescription}>{item.description}</Text>
          <Text style={styles.itemDate}>{item.date}</Text>
        </View>
        <View style={styles.itemAmount}>
          <Text style={styles.amountText}>{item.amount}</Text>
          <Text style={[styles.statusText, { color: item.status === 'Paid' ? '#10b981' : '#f59e0b' }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.itemFooter}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
        <TouchableOpacity style={styles.downloadBtn}>
          <Ionicons name="download-outline" size={16} color="#3B5BFE" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    // Web Layout - Only show on web
    Platform.OS === 'web' ? (
      <View style={styles.webLayout}>
        {/* Web Header */}
        <TeacherWebHeader 
          teacherName={teacherName}
          profileImage={profileImage}
          showSearch={true}
        />
        
        {/* Main Content with Sidebar */}
        <View style={styles.webContent}>
          {/* Sidebar */}
          <TeacherWebSidebar 
            teacherName={teacherName}
            profileImage={profileImage}
            activeItem={sidebarActiveItem}
            onItemPress={handleSidebarSelect}
            userEmail={userEmail}
            subjectCount={0}
            studentCount={0}
            revenue="₹4.3K"
            isSpotlight={false}
          />
          
          {/* Main Content Area */}
          <View style={styles.webMainContent}>
            <ScrollView 
              style={styles.scrollContainer} 
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              <View style={styles.container}>
                <View style={styles.headerSection}>
                  <Text style={styles.title}>Billing & Payments</Text>
                  <TouchableOpacity style={styles.addPaymentBtn}>
                    <MaterialIcons name="add" size={20} color="#fff" />
                    <Text style={styles.addPaymentText}>Add Payment Method</Text>
                  </TouchableOpacity>
                </View>
                
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading billing information...</Text>
                  </View>
                ) : billingData.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No billing records found</Text>
                    <Text style={styles.emptySubtext}>Your payment history will appear here</Text>
                  </View>
                ) : (
                  <>
                    <FlatList
                      data={billingData}
                      renderItem={renderBillingItem}
                      keyExtractor={(item) => item.id}
                      contentContainerStyle={styles.listContainer}
                      showsVerticalScrollIndicator={false}
                    />
                    
                    <View style={styles.summarySection}>
                      <Text style={styles.summaryTitle}>Payment Summary</Text>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Paid:</Text>
                        <Text style={styles.summaryValue}>
                          ₹{billingData
                            .filter(item => item.status === 'Paid')
                            .reduce((sum, item) => sum + parseFloat(item.amount.replace('₹', '').replace(',', '')), 0)
                            .toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Pending:</Text>
                        <Text style={styles.summaryValue}>
                          ₹{billingData
                            .filter(item => item.status === 'Pending')
                            .reduce((sum, item) => sum + parseFloat(item.amount.replace('₹', '').replace(',', '')), 0)
                            .toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    ) : (
      // Mobile Layout - Original content
      <View style={styles.container}>
        <Text style={styles.title}>Billing</Text>
        <Text style={styles.subtitle}>Billing information and payment history will be displayed here.</Text>
      </View>
    )
  )
}

const styles = StyleSheet.create({
  // Web-specific styles
  webLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  webContent: {
    flex: 1,
    flexDirection: 'row',
  },
  webMainContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  
  // Common styles
  container: {
    flex: 1,
    padding: 20,
  },
  headerSection: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addPaymentBtn: {
    backgroundColor: '#3B5BFE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addPaymentText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Billing item styles
  billingItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    color: '#666',
  },
  itemAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  downloadBtn: {
    padding: 8,
  },
  
  // Loading and list styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
  
  // Summary section
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
})

export default Billing