// Usage: <WebTeacherSidebar activeItem={activeItem} onItemPress={handleSidebarItemPress} userEmail={userEmail} teacherName={teacherName} profileImage={profileImage} />
// Add to TeacherDashboard web views the same way WebSidebar is used in StudentDashBoard screens

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { useRouter } from 'expo-router';
import { getAuthData } from '../../../utils/authStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WebTeacherSidebarProps {
  activeItem: string;
  onItemPress: (itemName: string) => void;
  userEmail?: string;
  teacherName?: string;
  profileImage?: string | null;
}

export default function WebTeacherSidebar({
  activeItem,
  onItemPress,
  userEmail,
  teacherName,
  profileImage,
}: WebTeacherSidebarProps) {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const handleNavigation = async (itemName: string, route: string) => {
    try {
      onItemPress(itemName);
      if (route === 'logout') {
        Alert.alert(
          'Log Out',
          'Are you sure you want to log out?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Log Out',
              style: 'destructive',
              onPress: async () => {
                await AsyncStorage.clear();
                router.push('/login' as any);
              },
            },
          ]
        );
      } else {
        router.push(route as any);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Growsmart</Text>
        </View>

        {/* Main Navigation Items */}
        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Dashboard' && styles.activeNavItem]}
          onPress={() => handleNavigation('Dashboard', '/(tabs)/TeacherDashboard/Teacher')}
        >
          <Ionicons
            name="home-outline"
            size={20}
            color={activeItem === 'Dashboard' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Dashboard' && styles.activeNavItemText]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Profile' && styles.activeNavItem]}
          onPress={() => handleNavigation('Profile', '/(tabs)/TeacherDashboard/Profile')}
        >
          <Ionicons
            name="person-circle-outline"
            size={20}
            color={activeItem === 'Profile' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Profile' && styles.activeNavItemText]}>
            Profile
          </Text>
        </TouchableOpacity>

        {/* Horizontal Divider */}
        <View style={styles.divider} />

        {/* Section Label */}
        <Text style={styles.sectionLabel}>Favorites</Text>

        {/* More Navigation Items */}
        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Spotlights' && styles.activeNavItem]}
          onPress={() => handleNavigation('Spotlights', '/(tabs)/TeacherDashboard/Spotlights')}
        >
          <Ionicons
            name="school-outline"
            size={20}
            color={activeItem === 'Spotlights' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Spotlights' && styles.activeNavItemText]}>
            Spotlights
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Connect' && styles.activeNavItem]}
          onPress={() => handleNavigation('Connect', '/(tabs)/TeacherDashboard/Connect')}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={activeItem === 'Connect' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Connect' && styles.activeNavItemText]}>
            Connect
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Share' && styles.activeNavItem]}
          onPress={() => handleNavigation('Share', '/(tabs)/TeacherDashboard/Share')}
        >
          <Ionicons
            name="share-social-outline"
            size={20}
            color={activeItem === 'Share' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Share' && styles.activeNavItemText]}>
            Share
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Create Subject' && styles.activeNavItem]}
          onPress={() => handleNavigation('Create Subject', '/(tabs)/TeacherDashboard/CreateSubject')}
        >
          <Ionicons
            name="pricetag-outline"
            size={20}
            color={activeItem === 'Create Subject' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Create Subject' && styles.activeNavItemText]}>
            Create Subject
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Billing' && styles.activeNavItem]}
          onPress={() => handleNavigation('Billing', '/(tabs)/TeacherDashboard/Billing')}
        >
          <MaterialIcons
            name="receipt-long"
            size={20}
            color={activeItem === 'Billing' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Billing' && styles.activeNavItemText]}>
            Billing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Faq' && styles.activeNavItem]}
          onPress={() => handleNavigation('Faq', '/(tabs)/TeacherDashboard/Faq')}
        >
          <Ionicons
            name="help-circle-outline"
            size={20}
            color={activeItem === 'Faq' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Faq' && styles.activeNavItemText]}>
            Faq
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Terms & Conditions' && styles.activeNavItem]}
          onPress={() => handleNavigation('Terms & Conditions', '/(tabs)/TeacherDashboard/TermsAndConditions')}
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color={activeItem === 'Terms & Conditions' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Terms & Conditions' && styles.activeNavItemText]}>
            Terms & Conditions
          </Text>
        </TouchableOpacity>

        {/* Horizontal Divider */}
        <View style={styles.divider} />

        {/* More Navigation Items */}
        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Privacy Policy' && styles.activeNavItem]}
          onPress={() => handleNavigation('Privacy Policy', '/(tabs)/TeacherDashboard/PrivacyPolicy')}
        >
          <Ionicons
            name="shield-outline"
            size={20}
            color={activeItem === 'Privacy Policy' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Privacy Policy' && styles.activeNavItemText]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Contact Us' && styles.activeNavItem]}
          onPress={() => handleNavigation('Contact Us', '/(tabs)/Contact')}
        >
          <MaterialIcons
            name="headset-mic"
            size={20}
            color={activeItem === 'Contact Us' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Contact Us' && styles.activeNavItemText]}>
            Contact Us
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Raise a Complaint' && styles.activeNavItem]}
          onPress={() => handleNavigation('Raise a Complaint', '/(tabs)/TeacherDashboard/RaiseComplaint')}
        >
          <MaterialIcons
            name="report-problem"
            size={20}
            color={activeItem === 'Raise a Complaint' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Raise a Complaint' && styles.activeNavItemText]}>
            Raise a Complaint
          </Text>
        </TouchableOpacity>

        {/* Horizontal Divider */}
        <View style={styles.divider} />

        {/* Advertising Card */}
        <View style={styles.advertisingCard}>
          <Text style={styles.advertisingTitle}>Advertising</Text>
          <Image
            source={require('../../../assets/images/Profile.png')}
            style={styles.advertisingImage}
            resizeMode="cover"
          />
          <Text style={styles.advertisingHeadline}>Summer sale is on!</Text>
          <Text style={styles.advertisingBody}>
            Buy your loved pieces with reduced prices up to 70% off!
          </Text>
        </View>

        {/* Horizontal Divider */}
        <View style={styles.divider} />

        {/* Bottom Navigation Items */}
        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Help & Support' && styles.activeNavItem]}
          onPress={() => handleNavigation('Help & Support', '/(tabs)/TeacherDashboard/HelpSupport')}
        >
          <Ionicons
            name="help-buoy-outline"
            size={20}
            color={activeItem === 'Help & Support' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Help & Support' && styles.activeNavItemText]}>
            Help & Support
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeItem === 'Log out' && styles.activeNavItem]}
          onPress={() => handleNavigation('Log out', 'logout')}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={activeItem === 'Log out' ? '#4255ff' : '#374151'}
          />
          <Text style={[styles.navItemText, activeItem === 'Log out' && styles.activeNavItemText]}>
            Log out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    minHeight: '100%',
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    paddingTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  logoContainer: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4255ff',
    fontFamily: 'Poppins_700Bold',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 8,
  },
  activeNavItem: {
    backgroundColor: '#eef0ff',
  },
  navItemText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Poppins_400Regular',
    marginLeft: 12,
  },
  activeNavItemText: {
    color: '#4255ff',
    fontFamily: 'Poppins_600SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
    marginHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Poppins_600SemiBold',
    paddingHorizontal: 20,
    paddingVertical: 6,
    letterSpacing: 0.8,
  },
  advertisingCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    margin: 12,
  },
  advertisingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
  },
  advertisingImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  advertisingHeadline: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  advertisingBody: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
  },
});
