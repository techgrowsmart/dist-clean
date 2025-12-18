import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon'; 
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { isTablet } from "../../../utils/devices";
export default function PaymentSuccess() {
  const router = useRouter();
  const { teacherEmail, subject } = useLocalSearchParams();
  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCongrats(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} autoStart fadeOut />

      {!showCongrats ? (
        <>
          <Image

           source={require('../../../assets/image/payment_success.png')}
            style={styles.image}
          />
          <Text style={styles.title}>Payment Successful!</Text>
          <Text style={styles.subtitle}>Your class is booked 🎉</Text>
        </>
      ) : (
        <>
        <Text style={styles.title}>Congratulations!</Text>
          <Image
            source={require('../../../assets/image/cap.png')}
            style={styles.image}
          />
          <Text style={styles.title}>Your tution is confirmed!</Text>
          <Text style={styles.subtitle}>Congratulations ! You have been join in teacher's broadast list{subject}!</Text>

        <View style={styles.btnContainer}>
        <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/(tabs)/StudentDashBoard/Student")}
          >
            <Text style={styles.buttonText}>Go to homepage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => {
              router.push({
                pathname: "/(tabs)/Messages/Messages",
                params: { teacherEmail },
              });
            }}
          >
            <Text style={styles.buttonText}>Connect with Teacher</Text>
          </TouchableOpacity>
        </View>
        
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
    backgroundColor: '#5f5fff',
  },
  image: {
    width: wp(isTablet ? '30%' : '40%'),
    height: hp(isTablet ? '18%' : '18%'),
    marginBottom: hp('2%'),
    resizeMode: 'contain',
  },
  title: {
    fontSize: wp(isTablet ? '5.5%' : '8%'),
    fontWeight: '700',
    color: '#FFF',
    marginBottom: hp('1%'),
    fontFamily: 'Sora',
    lineHeight: hp('5%'),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: wp(isTablet ? '3%' : '4.5%'),
    color: '#fff',
    marginBottom: hp('2%'),
    textAlign: 'center',
    fontFamily: 'open-sans',
  },
  btnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: wp('5%'),
    marginTop: hp('2.5%'),
    gap: wp('3%'),
    flexWrap: 'wrap',

  },
  button: {
    backgroundColor: '#f5b726',
    borderRadius: wp('1.2%'),
    borderWidth: 1,
    borderColor: '#FFF',
    marginVertical: hp('1.5%'),
    width: wp(isTablet ? '28%' : '30%'),
    height: hp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#FFF',
    borderRadius: wp('1.2%'),
    borderWidth: 1,
    marginVertical: hp('1.5%'),
    width: wp(isTablet ? '35%' : '40%'),
    height: hp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: wp(isTablet ? '2.5%' : '3.8%'),
    fontWeight: '600',
  },
});
