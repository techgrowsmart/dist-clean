import React, { useState, useEffect } from 'react';
import { Platform,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Image,

  Animated,
} from 'react-native';
import {   Ionicons } from '@expo/vector-icons';
import {   useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import {   useRouter } from 'expo-router';
import WebNavbar from '../../../components/ui/TeacherWebHeader';
import WebTeacherSidebar from './WebTeacherSidebar';
import {   TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';

const { width, height } = Dimensions.get('window');
const isDesktop = width >= 1024;

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const teacherFaqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I become a teacher on GoGrowSmart?',
    answer: 'To become a teacher, sign up on our platform, complete your profile with qualifications and experience, upload necessary documents, and pass our verification process. Once approved, you can start creating and listing your classes.',
    category: 'Getting Started'
  },
  {
    id: '2',
    question: 'What qualifications do I need to teach?',
    answer: 'We require teachers to have relevant educational qualifications, teaching experience, and subject matter expertise. Additional certifications and teaching credentials are preferred but not mandatory for all subjects.',
    category: 'Requirements'
  },
  {
    id: '3',
    question: 'How do I create and schedule classes?',
    answer: 'Use our intuitive dashboard to create class schedules, set pricing, upload course materials, and manage student enrollments. You can set flexible timings and choose between one-on-one or group sessions.',
    category: 'Teaching'
  },
  {
    id: '4',
    question: 'How and when do I get paid?',
    answer: 'Payments are processed weekly through bank transfer, UPI, or other preferred payment methods. You can track your earnings in real-time through the teacher dashboard. We charge a small commission on each completed class.',
    category: 'Payment'
  },
  {
    id: '5',
    question: 'What tools are available for online teaching?',
    answer: 'We provide a comprehensive virtual classroom with whiteboard, screen sharing, video conferencing, chat, file sharing, and recording features. All tools are integrated into our platform for seamless teaching experience.',
    category: 'Features'
  },
  {
    id: '6',
    question: 'How do I manage my students and track progress?',
    answer: 'Our platform includes student management tools where you can track attendance, assign homework, provide feedback, and monitor student progress. You can also communicate with parents through our messaging system.',
    category: 'Management'
  },
  {
    id: '7',
    question: 'What is the commission structure?',
    answer: 'We operate on a transparent commission model. New teachers start with a competitive rate that increases based on performance and student ratings. Detailed commission information is available in your teacher dashboard.',
    category: 'Payment'
  },
  {
    id: '8',
    question: 'How do I handle cancellations and rescheduling?',
    answer: 'Teachers can manage cancellations through the dashboard with our flexible rescheduling policy. We recommend setting clear cancellation policies and communicating them to students. Emergency situations are handled on a case-by-case basis.',
    category: 'Policies'
  },
  {
    id: '9',
    question: 'What kind of support is available for teachers?',
    answer: 'We offer 24/7 teacher support through chat, email, and phone. Additionally, we provide training resources, teaching guides, and a community forum where you can connect with other educators.',
    category: 'Support'
  },
  {
    id: '10',
    question: 'Can I teach multiple subjects?',
    answer: 'Yes! Qualified teachers can teach multiple subjects based on their expertise. Each subject requires separate verification and qualification approval to ensure quality standards are maintained.',
    category: 'Teaching'
  }
];

const TeacherFaq = () => {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenState, setScreenState] = useState(0); // Force re-render counter
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleBackPress = () => {
    router.back();
  };

  // ESC key handler for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleBackPress();
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, []);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const isDesktop = screenWidth >= 1024;

  // Platform switching fixes
  useEffect(() => {
    // Reset animations when component mounts
    fadeAnim.setValue(0);
    setScreenState(prev => prev + 1);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
    
    const handleDimensionChange = ({ window }) => {
      setScreenWidth(window.width);
      // Force re-render when dimensions change (platform switch)
      setScreenState(prev => prev + 1);
    };
    
    const sub = Dimensions.addEventListener?.('change', handleDimensionChange);
    return () => sub?.remove?.();
  }, []);

  // Additional effect to handle platform-specific resets
  useEffect(() => {
    // Reset critical state when platform changes
    setScreenState(prev => prev + 1);
    setExpandedItems([]);
    setSelectedCategory('All');
  }, [Platform.OS]);

  const categories = ['All', 'Getting Started', 'Requirements', 'Teaching', 'Payment', 'Features', 'Management', 'Policies', 'Support'];

  const toggleItem = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredFAQs = selectedCategory === 'All' 
    ? teacherFaqData 
    : teacherFaqData.filter(item => item.category === selectedCategory);

  const handleSidebarSelect = (item: string) => {
    switch (item) {
      case 'Home':
        router.push('/(tabs)/TeacherDashBoard/Teacher');
        break;
      case 'My Subjects':
        router.push('/(tabs)/TeacherDashBoard/Subjects');
        break;
      case 'Students':
        router.push('/(tabs)/TeacherDashBoard/StudentList');
        break;
      case 'Profile':
        router.push('/(tabs)/TeacherDashBoard/Profile2');
        break;
      case 'Settings':
        router.push('/(tabs)/TeacherDashBoard/Settings');
        break;
      case 'Billing':
        router.push('/(tabs)/TeacherDashBoard/Billing');
        break;
      case 'Faq':
        // Already on this page
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
      <View key={`${Platform.OS}-${screenState}`} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtnCircle} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Teacher FAQ</Text>
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
                GoGrowSmart empowers teachers with cutting-edge technology and a global student community. Join thousands of educators transforming lives through quality education.
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
              <TouchableOpacity onPress={() => Linking.openURL('mailto:teachers@gogrowsmart.com')}>
                <Text style={styles.footerLink}>Teacher Support</Text>
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
    <View key={`${Platform.OS}-${screenState}`} style={styles.desktopContainer}>
      <WebNavbar />
      
      <View style={styles.desktopLayout}>
        <WebTeacherSidebar 
          activeItem="Faq" 
          onItemPress={handleSidebarSelect}
        />
        
        <View style={styles.desktopMain}>
          <TeacherThoughtsBackground>
            <View style={styles.desktopContent}>
              <View style={styles.desktopHeader}>
                <Text style={styles.desktopTitle}>Teacher FAQ</Text>
                <Text style={styles.desktopSubtitle}>Everything you need to know about teaching on GoGrowSmart</Text>
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
                        GoGrowSmart empowers teachers with cutting-edge technology and a global student community. Join thousands of educators transforming lives through quality education.
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
                      <TouchableOpacity onPress={() => Linking.openURL('mailto:teachers@gogrowsmart.com')}>
                        <Text style={styles.footerLink}>Teacher Support</Text>
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
      </View>
    </View>
  );
};

export default TeacherFaq;

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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtnCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
