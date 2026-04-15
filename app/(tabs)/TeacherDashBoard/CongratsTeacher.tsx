import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const CongratsTeacher = () => {
  const router = useRouter();
  const { teacherName, createdAt, userEmail } = useLocalSearchParams<{ 
    teacherName: string; 
    createdAt: string; 
    userEmail: string 
  }>();

  const handleClose = () => {
    router.back();
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, []);

  const handleShare = async () => {
    try {
      const shareUrl = `https://gogrowsmart.com/teacher-profile/${teacherName}`;
      await Linking.openURL(`whatsapp://send?text=Check out my teacher profile: ${shareUrl}`);
    } catch (error) {
      Alert.alert('Share', 'Sharing not available on this device');
    }
  };

  const handleViewProfile = () => {
    // Navigate to teacher profile
    console.log('Navigate to teacher profile');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      return "Recent";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Congratulations!</Text>
            <Text style={styles.subtitle}>Your teacher profile is ready</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Message */}
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Welcome, {teacherName || 'Teacher'}!</Text>
          <Text style={styles.successMessage}>
            Your teacher profile has been successfully created and is now live. Students can now discover and connect with you for personalized learning experiences.
          </Text>
        </View>
        {/* Profile Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Active</Text>
              <Text style={styles.statLabel}>Profile Status</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail">{formatDate(createdAt || new Date().toISOString())}</Text>
              <Text style={styles.statLabel}>Joined Date</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail">{userEmail || 'teacher@example.com'}</Text>
              <Text style={styles.statLabel}>Email</Text>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsSection}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Complete Your Profile</Text>
              <Text style={styles.stepDescription}>Add your qualifications, experience, and teaching subjects</Text>
            </View>
          </View>


          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Start Teaching</Text>
              <Text style={styles.stepDescription}>Connect with students and begin your teaching journey</Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Pro Tips</Text>
          
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
            <Text style={styles.tipText}>Keep your profile updated with latest qualifications and achievements</Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="star-outline" size={20} color="#F59E0B" />
            <Text style={styles.tipText}>Respond quickly to student inquiries for better engagement</Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="camera-outline" size={20} color="#F59E0B" />
            <Text style={styles.tipText}>Add a professional profile photo to build trust with students</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default CongratsTeacher;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  header: {
    backgroundColor: "#3B5BFE",
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 4,
  },
  headerContent: {
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerText: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  actionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  statsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
    textAlign: "center",
    maxWidth: "100%",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
  },
  nextStepsSection: {
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3B5BFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});