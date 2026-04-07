import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WebSidebar from './WebSidebar';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

type ResponsiveSidebarProps = {
  activeItem: string;
  onItemPress: (itemName: string) => void;
  userEmail: string;
  studentName: string;
  profileImage: string | null;
  children?: React.ReactNode;
  showHamburger?: boolean;
};

const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({
  activeItem,
  onItemPress,
  userEmail,
  studentName,
  profileImage,
  children,
  showHamburger = true,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(isMobile);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = Dimensions.get('window').width < 768;
      setIsMobileView(newIsMobile);
      if (!newIsMobile) {
        setIsMobileMenuOpen(false);
      }
    };

    const subscription = Dimensions.addEventListener('change', handleResize);
    return () => subscription?.remove();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <View style={styles.container}>
      {/* Mobile hamburger menu */}
      {isMobileView && showHamburger && (
        <TouchableOpacity 
          style={styles.hamburgerButton} 
          onPress={toggleMobileMenu}
        >
          <Ionicons name="menu-outline" size={24} color="#3B5BFE" />
        </TouchableOpacity>
      )}

      {/* Sidebar */}
      <WebSidebar
        activeItem={activeItem}
        onItemPress={onItemPress}
        userEmail={userEmail}
        studentName={studentName}
        profileImage={profileImage}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={setIsMobileMenuOpen}
      />

      {/* Main content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  hamburgerButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1001,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({

      web: {

        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',

      },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.3,

        shadowRadius: 8,

      },

    }),
    elevation: 3,
  },
});

export default ResponsiveSidebar;
