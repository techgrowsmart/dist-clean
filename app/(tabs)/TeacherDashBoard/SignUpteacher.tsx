import React from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Image, Dimensions, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import {Checkbox} from "expo-checkbox";

SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('window');

export default function SignUpteacher() {
    const router = useRouter();
    const [isChecked, setChecked] = React.useState(false);
    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_600SemiBold,
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Image
                        source={require('../../../assets/images/Back.png')} 
                        style={styles.backIcon}
                    />
                </TouchableOpacity>
                <Text style={styles.headerText}>Registration</Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Personal Information */}
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#858597"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#858597"
                    keyboardType="phone-pad"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Enter your email address"
                    placeholderTextColor="#858597"
                    keyboardType="email-address"
                />
                <TextInput
                    style={[styles.input, { height: 100 }]} 
                    placeholder="Enter your residential address"
                    placeholderTextColor="#858597"
                    multiline
                />

                {/* Identity Verification */}
                <Text style={styles.sectionTitle}>Identity Verification</Text>
                <View style={styles.uploadContainer}>
                    <TouchableOpacity style={styles.uploadButton}>
                        <Text style={styles.uploadText}>Upload PAN Card</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.uploadButton}>
                        <Text style={styles.uploadText}>Upload Aadhaar Card</Text>
                    </TouchableOpacity>
                </View>

                {/* Educational Qualifications */}
                <Text style={styles.sectionTitle}>Educational Qualifications</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your highest degree (e.g., M.Sc, Ph.D.)"
                    placeholderTextColor="#858597"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Enter your specialization"
                    placeholderTextColor="#858597"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Enter teaching experience in years"
                    placeholderTextColor="#858597"
                    keyboardType="numeric"
                />

                {/* Certification and Highest Qualification */}
                <Text style={styles.sectionTitle}>Certification</Text>
                <View style={styles.dropboxContainer}>
                    <Text style={styles.dropboxText}>Dropbox for Certification 1</Text>
                    <Text style={styles.dropboxText}>Dropbox for Certification 2</Text>
                    <Text style={styles.dropboxText}>Dropbox for Certification 3</Text>
                </View>

                <Text style={styles.sectionTitle}>Highest Qualification</Text>
                <View style={styles.dropboxContainer}>
                    <Text style={styles.dropboxText}>Dropbox for Qualification 1</Text>
                    <Text style={styles.dropboxText}>Dropbox for Qualification 2</Text>
                    <Text style={styles.dropboxText}>Dropbox for Qualification 3</Text>
                </View>
            </ScrollView>

            {/* Fixed Bottom Section */}
            <View style={styles.bottomSection}>
                <View style={styles.checkboxContainer}>
                    <Checkbox
                        value={isChecked}
                        onValueChange={setChecked}
                        color={isChecked ? '#4255FF' : undefined}
                    />
                    <Text style={styles.checkboxText}>
                        I agree to terms and conditions and verify that the above details are accurate
                    </Text>
                </View>
                <TouchableOpacity style={styles.registerButton}>
                    <Text style={styles.registerButtonText}>Register</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: width * 0.05,
        paddingTop: Platform.OS === 'ios' ? height * 0.06 : height * 0.04,
        paddingBottom: height * 0.02,
        borderBottomWidth: 1,
        borderBottomColor: '#DDE4EE',
    },
    backIcon: {
        width: 24,
        height: 24,
    },
    headerText: {
        fontSize: 20,
        fontFamily: 'Poppins_600SemiBold',
        marginLeft: width * 0.03,
    },
    scrollContent: {
        paddingHorizontal: width * 0.05,
        paddingBottom: height * 0.15,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
        marginTop: height * 0.03,
        marginBottom: height * 0.01,
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: height * 0.02,
        fontFamily: 'Poppins_400Regular',
    },
    uploadContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: height * 0.02,
    },
    uploadButton: {
        width: '48%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: '#858597',
    },
    dropboxContainer: {
        marginBottom: height * 0.02,
    },
    dropboxText: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: '#858597',
        marginBottom: height * 0.01,
    },
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: width * 0.05,
        paddingVertical: height * 0.02,
        borderTopWidth: 1,
        borderTopColor: '#DDE4EE',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: height * 0.02,
    },
    checkboxText: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        marginLeft: width * 0.02,
    },
    registerButton: {
        backgroundColor: '#4255FF',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
    },
});