import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { isTablet } from "../../../utils/devices";
import { router } from 'expo-router';
import ChatReadIcon from '../../../assets/svgIcons/ChatReadIcon';
import { Poppins_400Regular, useFonts } from '@expo-google-fonts/poppins';
import { RedHatDisplay_500Medium,RedHatDisplay_400Regular } from '@expo-google-fonts/red-hat-display';

const ReviewVerification = () => {
    let[fontsLoaded] = useFonts({
        Poppins_400Regular,
        RedHatDisplay_500Medium,
        RedHatDisplay_400Regular
    })
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Me</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeIcon}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        <View style={styles.iconWrapper}>
          <ChatReadIcon width={wp('12%')} height={wp('12%')} />
        </View>

        <Text style={styles.messageText}>
          Thank you for your review! Your review is currently being verified. It will appear on the company profile within a few minutes.
        </Text>

        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace('/(tabs)/StudentDashBoard/Student')}>
          <Text style={styles.backHomeText}>Back Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ReviewVerification;
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    header: {
      height: hp('11%'),
      backgroundColor: '#5f5fff',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
    headerTitle: {
      marginTop: hp('2.5%'),
      fontSize: isTablet ? wp('4.5%') : wp('5.3%'),
      lineHeight: hp('3.2%'),
      color: '#fff',
      fontFamily: 'Poppins_400Regular',
    },
    closeIcon: {
      position: 'absolute',
      right: wp('5.3%'),
      top: hp('3.8%'),
    },
    contentWrapper: {
      flex: 1,
      backgroundColor: '#5f5fff',
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp('5%'),
    },
    iconWrapper: {
      marginBottom: hp('2.5%'),
    },
    messageText: {
      textAlign: 'center',
      fontSize: isTablet ? wp('3.7%') : wp('4.2%'),
      color: '#fff',
      marginBottom: hp('4%'),
      fontFamily: 'RedHatDisplay_400Regular',
      lineHeight: hp('3.2%'),
    },
    backHomeBtn: {
      width: wp('44%'),
      height: hp('5.381%'),
      backgroundColor: "#ffffff",
      paddingHorizontal: wp('2.13%'),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: wp("6.66%"),
    },
    backHomeText: {
      fontSize: isTablet ? wp('3.4%') : wp('3.733%'),
      lineHeight: hp('2.422%'),
      color: '#000000',
      fontWeight: '600',
      fontFamily:"RedHatDisplay_500Medium"
    },
  });
  