import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ConfettiCannon from 'react-native-confetti-cannon';

const { width, height } = Dimensions.get("window");

const CongratsStudent = () => {
  const router = useRouter();
  const { planTitle, validityDate } = useLocalSearchParams<{ 
    planTitle: string; 
    validityDate: string;
  }>();

  const handleGoHome = () => {
    router.replace("/(tabs)/StudentDashBoard/Student");
  };

  const handleExploreTeachers = () => {
    router.replace("/(tabs)/StudentDashBoard/Student");
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
      return "Valid for 365 days";
    }
  };

  // Get validity text based on plan
  const getValidityText = () => {
    if (planTitle === "Intro Offer") return "Valid for 365 days";
    if (planTitle === "TeachLite") return "Valid for 90 days";
    if (planTitle === "TeachStart") return "Valid for 180 days";
    if (planTitle === "GuruGrade") return "Valid for 365 days";
    return validityDate ? `Valid until ${formatDate(validityDate)}` : "Active subscription";
  };

  return (
    <View style={styles.container}>
      {/* Confetti Animation for mobile */}
      {Platform.OS !== 'web' && (
        <ConfettiCannon
          count={200}
          origin={{ x: width / 2, y: -10 }}
          autoStart
          fadeOut
          colors={['#3B5BFE', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Congratulations!</Text>
            <Text style={styles.subtitle}>Your subscription is active</Text>
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
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Welcome to {planTitle || 'Premium'}!</Text>
          <Text style={styles.successMessage}>
            Your subscription has been successfully activated. You now have unlimited access to all our premium features and expert teachers.
          </Text>
        </View>

        {/* Subscription Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Subscription Details</Text>
          
          <View style={styles.detailItem}>
            <Ionicons name="ribbon-outline" size={24} color="#3B5BFE" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Plan</Text>
              <Text style={styles.detailValue}>{planTitle || 'Premium'}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={24} color="#3B5BFE" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Validity</Text>
              <Text style={styles.detailValue}>{getValidityText()}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#3B5BFE" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, styles.activeStatus]}>Active</Text>
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="people-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.featureText}>Unlimited access to all teachers</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.featureText}>Direct messaging with teachers</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="videocam-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.featureText}>Priority class bookings</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="star-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.featureText}>Premium tools & analytics</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleExploreTeachers}>
            <Ionicons name="search-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Explore Teachers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
            <Ionicons name="home-outline" size={20} color="#3B5BFE" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CongratsStudent;

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
    marginTop: 20,
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
  detailsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  activeStatus: {
    color: "#10B981",
  },
  featuresSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3B5BFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: "#1F2937",
    flex: 1,
  },
  actionsSection: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: "#3B5BFE",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3B5BFE",
  },
  secondaryButtonText: {
    color: "#3B5BFE",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
});
