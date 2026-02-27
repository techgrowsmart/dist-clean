import React, { useState } from "react";
import {
  Alert,
  View,
  StyleSheet,
  TextInput,
  Linking,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons, FontAwesome, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useNavigation } from '@react-navigation/native';
import BackButton from "../../components/BackButton";

const Contact = () => {
  const [message, setMessage] = useState("");
  const navigation = useNavigation();
  
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleSubmit = async () => {
    const email = "contact@gogrowsmart.com";
    const subject = "User Problem Report";
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

    if (message.trim() === "") {
      Alert.alert("Error", "Please enter your problem before submitting");
      return;
    }

    Linking.openURL(mailto).catch((err) => Alert.alert("Error", "Could not open email client"));
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header */}
       {/* Header */}
<View style={styles.header}>
  <View style={styles.headerTextContainer}>
    <Text style={styles.headerTitle}>Get in Touch !</Text>
    <Text style={styles.headerSubtitle}>We'd love to hear from you .</Text>
  </View>
  <BackButton size={hp('3.8%')} color="black" onPress={() => navigation.goBack()} style={styles.crossIcon} />
        </View>

        {/* Input Card */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Write us a message ..."
            placeholderTextColor="#626a79"
            multiline
            value={message}
            onChangeText={setMessage}
            numberOfLines={8}
          />
          <TouchableOpacity onPress={handleSubmit} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info - Email Only */}
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <View style={styles.iconCircle}><Ionicons name="mail" size={20} color="#4f46e5" /></View>
            <Text style={styles.contactText}>contact@gogrowsmart.com</Text>
          </View>
        </View>

        {/* Social Media Section */}
        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>Follow Us on</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity style={styles.socialButton}><FontAwesome name="facebook-f" size={24} color="#4255ff" /></TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}><FontAwesome name="instagram" size={24} color="#E4405F" /></TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}><FontAwesome name="linkedin" size={24} color="#0077B5" /></TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome6 name="x-twitter" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, backgroundColor: "#f3f4f6", paddingHorizontal: wp('5%'), paddingVertical: hp('4%'), paddingTop: hp('12%') },
  // header: { alignItems: "center", marginBottom: hp('4%') },
  header: { 
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: hp('4%'),
},
  headerTitle: { fontSize: wp('7%'), color: "#030303", fontFamily: 'Poppins_700Bold' },
  headerSubtitle: { fontSize: wp('3.5%'), color: "#6b7280", fontFamily: 'Poppins_400Regular' },
  card: { backgroundColor: "#ffffff", borderRadius: 16, padding: wp('5%'), marginBottom: hp('3%'), shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  input: { height: hp('15%'), borderColor: "#f3f4f6", borderWidth: 1, borderRadius: 12, paddingHorizontal: wp('4%'), paddingVertical: hp('2%'), textAlignVertical: "top", backgroundColor: "#f9fafb", fontSize: wp('3.8%'), color: "#1f2937", marginBottom: hp('2%'), fontFamily: 'Poppins_400Regular' },
  sendButton: { backgroundColor: "#4f46e5", paddingVertical: hp('1.5%'), borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sendButtonText: { color: "#ffffff", fontSize: wp('4.2%'), fontFamily: 'Poppins_600SemiBold' },
  contactInfo: { 
    backgroundColor: "#ffffff", 
    borderRadius: 16, 
    padding: wp('5%'), 
    marginBottom: hp('3%'), 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactItem: { 
    flexDirection: "row", 
    alignItems: "center",
    width: '100%',
    justifyContent: 'center',
  },
  iconCircle: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: "#e0e7ff", 
    justifyContent: "center", 
    alignItems: "center", 
    marginRight: wp('3%') 
  },
  contactText: { 
    flex: 1, 
    fontSize: wp('3.5%'), 
    color: "#4f46e5", 
    fontFamily: 'Poppins_500SemiBold',
    textAlign: 'center',
    paddingVertical: 4,
  },
  socialSection: { alignItems: "center" },
  socialTitle: { fontSize: wp('5.5%'), color: "#030303", marginBottom: hp('2%'), fontFamily: 'Poppins_700Bold' },
  socialIcons: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: wp('4%') },
  socialButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp('4%'),
  },
  
  // Update header style to remove marginBottom
 
  headerTextContainer: {
  flex: 1,
  alignItems: 'center'
},
crossIcon: {
  marginLeft: 10, // Change this number to move cross more right
},

});

export default Contact;