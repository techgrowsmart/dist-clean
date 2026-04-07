import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useRouter } from 'expo-router';
import WebNavbar from '../../../components/ui/WebNavbar';
import WebSidebar from '../../../components/ui/WebSidebar';
import ResponsiveSidebar from '../../../components/ui/ResponsiveSidebar';
import { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import BackButton from '../../../components/BackButton';

const { width, height } = Dimensions.get('window');
const isDesktop = width >= 1024;

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'What is GoGrowSmart?',
    answer: 'GoGrowSmart is an innovative online learning platform that connects students with qualified teachers for personalized tutoring sessions. We offer interactive classes, skill development programs, and comprehensive educational resources.',
    category: 'General'
  },
  {
    id: '2',
    question: 'How do I create an account?',
    answer: 'Creating an account is simple! Click on the "Sign Up" button, fill in your details including email, password, and educational information. Verify your email address and you\'re ready to start learning.',
    category: 'Account'
  },
  {
    id: '3',
    question: 'What subjects are available?',
    answer: 'We offer a wide range of subjects including Mathematics, Science, English, Social Studies, Computer Science, and specialized skill courses. Our curriculum covers all major educational boards and standards.',
    category: 'Subjects'
  },
  {
    id: '4',
    question: 'How do I book a class?',
    answer: 'Browse through our teacher profiles, select a subject and teacher that matches your needs, check their availability, and book a session at your preferred time. You\'ll receive confirmation details via email.',
    category: 'Booking'
  },
  {
    id: '5',
    question: 'What are the payment options?',
    answer: 'We accept various payment methods including credit/debit cards, UPI, net banking, and digital wallets. We offer both pay-per-session and subscription-based payment options.',
    category: 'Payment'
  },
  {
    id: '6',
    question: 'Can I reschedule or cancel a class?',
    answer: 'Yes, you can reschedule or cancel classes up to 24 hours before the scheduled time without any penalty. Late cancellations may incur a fee as per our policy.',
    category: 'Policies'
  },
  {
    id: '7',
    question: 'How do I access my class recordings?',
    answer: 'All live classes are recorded and available in your dashboard within 24 hours. You can access them anytime for revision or if you missed the live session.',
    category: 'Features'
  },
  {
    id: '8',
    question: 'Is there a mobile app available?',
    answer: 'Yes! GoGrowSmart is available on both iOS and Android platforms. Download our app from the App Store or Google Play Store for learning on the go.',
    category: 'Mobile'
  }
];

const Faq = () => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const categories = ['All', 'General', 'Account', 'Subjects', 'Booking', 'Payment', 'Policies', 'Features', 'Mobile'];

  const toggleItem = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredFAQs = selectedCategory === 'All' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const handleSidebarSelect = (item: string) => {
    switch (item) {
      case 'Home':
        router.push('/(tabs)/StudentDashBoard/Student');
        break;
      case 'My Tuitions':
        router.push('/(tabs)/StudentDashBoard/MyTuitions');
        break;
      case 'Connect':
        router.push('/(tabs)/StudentDashBoard/ConnectWeb');
        break;
      case 'Profile':
        router.push('/(tabs)/StudentDashBoard/Profile');
        break;
      case 'Share':
        router.push('/(tabs)/StudentDashBoard/Share');
        break;
      case 'Billing':
        router.push('/(tabs)/Billing');
        break;
      case 'Faq':
        // Already on this page
        break;
      case 'Subscription':
        router.push('/(tabs)/StudentDashBoard/Subscription');
        break;
      case 'Contact Us':
        router.push('/(tabs)/Contact');
        break;
      default:
        console.log('Navigate to:', item);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!isDesktop) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton size={24} color="#FFFFFF" onPress={() => router.back()} />
          <Text style={styles.headerText}>FAQ</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Categories */}
          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* FAQ Items */}
          <View style={styles.faqContainer}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {filteredFAQs.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.faqItem}
                onPress={() => toggleItem(item.id)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Ionicons
                    name={expandedItems.includes(item.id) ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#3B5BFE"
                  />
                </View>
                {expandedItems.includes(item.id) && (
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>About GoGrowSmart</Text>
              <Text style={styles.footerText}>
                GoGrowSmart is committed to providing quality education through innovative technology and experienced teachers.
              </Text>
            </View>

            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Quick Links</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://gogrowsmart.com/terms-of-service/')}>
                <Text style={styles.footerLink}>Terms of Service</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://gogrowsmart.com/privacy-policy/')}>
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('mailto:support@gogrowsmart.com')}>
                <Text style={styles.footerLink}>Contact Support</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Connect With Us</Text>
              <View style={styles.socialLinks}>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-facebook" size={24} color="#3B5BFE" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-twitter" size={24} color="#3B5BFE" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-linkedin" size={24} color="#3B5BFE" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-instagram" size={24} color="#3B5BFE" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footerBottom}>
              <Text style={styles.copyright}>
                © 2024 GoGrowSmart. All rights reserved.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Desktop Layout
  return (
    <View style={styles.desktopContainer}>
      <WebNavbar />
      
      <View style={styles.desktopLayout}>
        <ResponsiveSidebar 
          activeItem="Faq" 
          onItemPress={handleSidebarSelect}
          userEmail=""
          studentName="Student"
          profileImage={null}
        >
          <View style={styles.desktopMain}>
            <TeacherThoughtsBackground>
              <View style={styles.desktopContent}>
                <View style={styles.desktopHeader}>
                  <Text style={styles.desktopTitle}>Frequently Asked Questions</Text>
                  <Text style={styles.desktopSubtitle}>Find answers to common questions about GoGrowSmart</Text>
                </View>

                <View style={styles.desktopGrid}>
                  {/* Left Column - Categories and FAQ */}
                  <View style={styles.desktopLeft}>
                    <View style={styles.categoriesContainer}>
                      <Text style={styles.sectionTitle}>Categories</Text>
                      <View style={styles.categoryGrid}>
                        {categories.map((category) => (
                          <TouchableOpacity
                            key={category}
                            style={[
                              styles.categoryChipDesktop,
                              selectedCategory === category && styles.categoryChipActive
                            ]}
                            onPress={() => setSelectedCategory(category)}
                          >
                            <Text style={[
                              styles.categoryText,
                              selectedCategory === category && styles.categoryTextActive
                            ]}>
                              {category}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.faqContainer}>
                      {filteredFAQs.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.faqItem}
                          onPress={() => toggleItem(item.id)}
                        >
                          <View style={styles.faqHeader}>
                            <Text style={styles.faqQuestion}>{item.question}</Text>
                            <Ionicons
                              name={expandedItems.includes(item.id) ? "chevron-up" : "chevron-down"}
                              size={20}
                              color="#3B5BFE"
                            />
                          </View>
                          {expandedItems.includes(item.id) && (
                            <Text style={styles.faqAnswer}>{item.answer}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Right Column - Footer */}
                  <View style={styles.desktopRight}>
                    <View style={styles.footerContainerDesktop}>
                      <View style={styles.footerSection}>
                        <Text style={styles.footerTitle}>About GoGrowSmart</Text>
                        <Text style={styles.footerText}>
                          GoGrowSmart is committed to providing quality education through innovative technology and experienced teachers.
                        </Text>
                      </View>

                      <View style={styles.footerSection}>
                        <Text style={styles.footerTitle}>Quick Links</Text>
                        <TouchableOpacity onPress={() => Linking.openURL('https://gogrowsmart.com/terms-of-service/')}>
                          <Text style={styles.footerLink}>Terms of Service</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => Linking.openURL('https://gogrowsmart.com/privacy-policy/')}>
                          <Text style={styles.footerLink}>Privacy Policy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@gogrowsmart.com')}>
                          <Text style={styles.footerLink}>Contact Support</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.footerSection}>
                        <Text style={styles.footerTitle}>Connect With Us</Text>
                        <View style={styles.socialLinks}>
                          <TouchableOpacity style={styles.socialButton}>
                            <Ionicons name="logo-facebook" size={24} color="#3B5BFE" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.socialButton}>
                            <Ionicons name="logo-twitter" size={24} color="#3B5BFE" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.socialButton}>
                            <Ionicons name="logo-linkedin" size={24} color="#3B5BFE" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.socialButton}>
                            <Ionicons name="logo-instagram" size={24} color="#3B5BFE" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.footerBottom}>
                        <Text style={styles.copyright}>
                          © 2024 GoGrowSmart. All rights reserved.
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </TeacherThoughtsBackground>
          </View>
        </ResponsiveSidebar>
      </View>
    </View>
  );
};

export default Faq;

const styles = StyleSheet.create({
  // Mobile Styles
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#3B5BFE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
    marginLeft: 16,
    fontFamily: 'Poppins_700Bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  
  // Categories
  categoriesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3B5BFE',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  categoryChipDesktop: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  
  // FAQ Items
  faqContainer: {
    marginBottom: 32,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  
  // Footer
  footerContainer: {
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 12,
    marginBottom: 32,
  },
  footerContainerDesktop: {
    backgroundColor: '#F9FAFB',
    padding: 32,
    borderRadius: 12,
  },
  footerSection: {
    marginBottom: 24,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  footerLink: {
    fontSize: 14,
    color: '#3B5BFE',
    marginBottom: 4,
    fontFamily: 'Poppins_400Regular',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBottom: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  copyright: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  
  // Desktop Styles
  desktopContainer: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
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
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Poppins_700Bold',
  },
  desktopSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'Poppins_400Regular',
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: 32,
  },
  desktopLeft: {
    flex: 2,
  },
  desktopRight: {
    flex: 1,
  },
});