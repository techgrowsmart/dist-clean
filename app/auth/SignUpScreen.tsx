import {
    Mulish_400Regular,
    Mulish_600SemiBold,
    Mulish_700Bold,
    useFonts
} from '@expo-google-fonts/mulish';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Keyboard, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, Pressable, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import Toast from 'react-native-toast-message';
import { BASE_URL } from '../../config';

const { width } = Dimensions.get('window');

export default function SignUpScreen() {
    const [errorName, setErrorName] = useState("");
    const [errorPhone, setErrorPhone] = useState("");
    const [errorEmail, setErrorEmail] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const isWeb = Platform.OS === 'web';

    let [fontsLoaded] = useFonts({
        Mulish_Regular: Mulish_400Regular,
        Mulish_SemiBold: Mulish_600SemiBold,
        Mulish_Bold: Mulish_700Bold,
    });

    if (!fontsLoaded) return <Text>Loading...</Text>;

    const handleSignUp = async () => {
        let isValid = true;
        setErrorName(""); 
        setErrorPhone(""); 
        setErrorEmail("");

        if (!name.trim()) { 
            setErrorName("Full Name is required."); 
            isValid = false; 
        }
        if (!phone.trim()) { 
            setErrorPhone("Phone Number is required."); 
            isValid = false; 
        }
        if (!email.trim()) { 
            setErrorEmail("Email is required."); 
            isValid = false; 
        }
        
        if (!isValid) return;

        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/api/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName: name, phonenumber: phone, email }), 
            });
    
            const data = await response.json();
            setLoading(false);
    
            if (response.ok) {
                Alert.alert("Success", "OTP Sent! Check your email.");
                router.push({
                    pathname: "/auth/OTPScreen",
                    params: { otpId: data.otpId, email, name, phone },
                });
            } else {
                // Handle 409 Conflict - User already registered
                if (response.status === 409 || data.alreadyRegistered) {
                    Toast.show({ 
                        type: "error", 
                        text1: data.message || "Email already registered",
                        text2: "Please login instead"
                    });
                    // Optionally redirect to login after a delay
                    setTimeout(() => {
                        router.push("/auth/LoginOptionsScreen");
                    }, 2000);
                } else {
                    Alert.alert("Error", data.message || "Signup failed!");
                }
            }
        } catch (error: any) {
            setLoading(false);
            Alert.alert("Error", error.message || "Something went wrong.");
        }
    };

    if (isWeb) {
        return (
            <View style={webStyles.container}>
                {/* Left Column - Background Image Only */}
                {width >= 900 && (
                    <View style={webStyles.leftColumn}>
                        <Image 
                            source={require("../../assets/image/Signup.png")} 
                            style={webStyles.backgroundImage} 
                            resizeMode="contain" 
                        />
                    </View>
                )}

                {/* Right Column - Content */}
                <View style={webStyles.rightColumn}>
                    <View style={webStyles.content}>
                        {/* Back Button */}
                        <View style={webStyles.backButtonContainer}>
                            <TouchableOpacity style={webStyles.backButton} onPress={() => router.back()}>
                                <Text style={webStyles.backButtonText}>← Back</Text>
                            </TouchableOpacity>
                        </View>

                        <Image source={require("../../assets/image/Signup.png")} style={webStyles.image} resizeMode="contain" />

                        <Text style={webStyles.title}>Sign up</Text>
                        <Text style={webStyles.subtitle}>
                            {`By signing up, you agree to our${' '}${'\n'}`}
                            <Text 
                                style={webStyles.link}
                                onPress={() => Linking.openURL("https://gogrowsmart.com/terms-and-conditions")}
                            >Terms & Conditions</Text> and{" "}
                            <Text 
                                style={webStyles.link}
                                onPress={() => Linking.openURL("https://gogrowsmart.com/privacy-policy")}
                            >Privacy Policy</Text>.
                        </Text>

                        <View style={webStyles.inputGroup}>
                            <Text style={webStyles.label}>Full Name</Text>
                            <TextInput
                                style={[webStyles.input, errorName ? webStyles.inputError : null]}
                                placeholder="Enter your full name"
                                placeholderTextColor="#94a3b8"
                                value={name}
                                onChangeText={(text) => { setName(text); if (text.trim()) setErrorName(""); }}
                            />
                            {errorName ? <Text style={webStyles.errorText}>{errorName}</Text> : null}
                        </View>

                        <View style={webStyles.inputGroup}>
                            <Text style={webStyles.label}>Phone Number</Text>
                            <TextInput
                                style={[webStyles.input, errorPhone ? webStyles.inputError : null]}
                                placeholder="Enter your phone number"
                                placeholderTextColor="#94a3b8"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={(text) => { setPhone(text); if (text.trim()) setErrorPhone(""); }}
                            />
                            {errorPhone ? <Text style={webStyles.errorText}>{errorPhone}</Text> : null}
                        </View>

                        <View style={webStyles.inputGroup}>
                            <Text style={webStyles.label}>Email Address</Text>
                            <TextInput
                                style={[webStyles.input, errorEmail ? webStyles.inputError : null]}
                                placeholder="Enter your email"
                                placeholderTextColor="#94a3b8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={(text) => { setEmail(text); if (text.trim()) setErrorEmail(""); }}
                            />
                            {errorEmail ? <Text style={webStyles.errorText}>{errorEmail}</Text> : null}
                        </View>

                        <TouchableOpacity style={webStyles.button} onPress={handleSignUp} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={webStyles.buttonText}>Register</Text>}
                        </TouchableOpacity>

                        <View style={webStyles.loginContainer}>
                            <Text style={webStyles.loginText}>Already have an account!</Text>
                            <TouchableOpacity onPress={() => router.push("/auth/LoginOptionsScreen")}>
                                <Text style={webStyles.loginLink}> Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // Mobile fallback
    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable onPress={Keyboard.dismiss} style={styles.contentContainer}>
                    <View style={styles.backButtonContainer}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Text style={styles.backButtonText}>← Back</Text>
                        </TouchableOpacity>
                    </View>

                    <Image source={require("../../assets/image/Signup.png")} style={styles.image} resizeMode="contain" />

                    <Text style={styles.title}>Sign up</Text>
                    <Text style={styles.subtitle}>
                        {`By signing up, you agree to our${' '}${'\n'}`}
                        <Text 
                            style={styles.link}
                            onPress={() => Linking.openURL("https://gogrowsmart.com/terms-and-conditions")}
                        >Terms & Conditions</Text> and{" "}
                        <Text 
                            style={styles.link}
                            onPress={() => Linking.openURL("https://gogrowsmart.com/privacy-policy")}
                        >Privacy Policy</Text>.
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={[styles.input, errorName ? styles.inputError : null]}
                            placeholder="Enter your full name"
                            placeholderTextColor="#94a3b8"
                            value={name}
                            onChangeText={(text) => { setName(text); if (text.trim()) setErrorName(""); }}
                        />
                        {errorName ? <Text style={styles.errorText}>{errorName}</Text> : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, errorPhone ? styles.inputError : null]}
                            placeholder="Enter your phone number"
                            placeholderTextColor="#94a3b8"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={(text) => { setPhone(text); if (text.trim()) setErrorPhone(""); }}
                        />
                        {errorPhone ? <Text style={styles.errorText}>{errorPhone}</Text> : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={[styles.input, errorEmail ? styles.inputError : null]}
                            placeholder="Enter your email"
                            placeholderTextColor="#94a3b8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={(text) => { setEmail(text); if (text.trim()) setErrorEmail(""); }}
                        />
                        {errorEmail ? <Text style={styles.errorText}>{errorEmail}</Text> : null}
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
                    </TouchableOpacity>

                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account!</Text>
                        <TouchableOpacity onPress={() => router.push("/auth/LoginOptionsScreen")}>
                            <Text style={styles.loginLink}> Login</Text>
                        </TouchableOpacity>
                    </View>
            </Pressable>
        </KeyboardAvoidingView>
    );
}

// Web-specific styles
const webStyles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    leftColumn: {
        width: '50%',
        minWidth: 300,
        backgroundColor: '#3131b0',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    backgroundImage: {
        width: '100%',
        height: '60%',
        maxHeight: 400,
    },
    rightColumn: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: '5%',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxWidth: 500,
    },
    backButtonContainer: {
        position: 'absolute',
        top: 40,
        left: 0,
        width: '100%',
        alignItems: 'flex-start',
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    backButtonText: {
        fontSize: 16,
        color: '#7C4DDB',
        fontWeight: '600',
    },
    image: {
        width: "60%",
        height: hp("20%"),
        marginBottom: 20,
    },
    title: {
        fontSize: wp("6.5%"),
        color: "#03070E",
        marginBottom: hp("1%"),
        fontFamily: "Poppins-Bold",
        textAlign: 'center',
    },
    subtitle: {
        fontSize: wp("3.7%"),
        color: "#82878F",
        textAlign: "center",
        marginBottom: hp("3%"),
        fontFamily: "Poppins-Regular",
        lineHeight: hp("2.8%"),
        paddingHorizontal: 20,
    },
    link: {
        color: "#107eff",
        fontFamily: "Poppins-SemiBold",
    },
    inputGroup: {
        width: "100%",
        marginBottom: hp("1.5%"),
    },
    label: {
        textAlign: "left",
        color: "#6a6a6a",
        fontSize: wp("3.5%"),
        fontFamily: "Poppins-Regular",
        marginBottom: 8,
    },
    input: {
        width: "100%",
        height: hp("6.5%"),
        backgroundColor: "#ffffff",
        borderRadius: wp("3%"),
        paddingHorizontal: wp("4%"),
        color: "#03070E",
        fontSize: wp("4%"),
        fontFamily: "Poppins-Regular",
        borderColor: "#e5e7eb",
        borderWidth: 1,
    },
    inputError: {
        borderColor: "red",
        borderWidth: 1,
    },
    errorText: {
        color: "red",
        fontSize: wp("3.2%"),
        marginTop: 4,
        fontFamily: "Poppins-Regular",
    },
    button: {
        width: "100%",
        height: hp("6%"),
        backgroundColor: "#5f5fff",
        borderRadius: wp("2.5%"),
        justifyContent: "center",
        alignItems: "center",
        marginTop: hp("2%"),
        boxShadow: '0 4px 8px rgba(95, 95, 255, 0.3)',
        elevation: 8,
    },
    buttonText: {
        color: "#fff",
        fontSize: wp("4.2%"),
        fontFamily: "Poppins-Bold",
    },
    loginContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: hp("2.5%"),
    },
    loginText: {
        color: "#82878F",
        fontSize: wp("3.8%"),
        fontFamily: "Poppins-Regular",
    },
    loginLink: {
        color: "#107eff",
        fontSize: wp("3.8%"),
        fontFamily: "Poppins-SemiBold",
        marginLeft: wp("1%"),
    },
});

// Mobile styles (similar to original)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    contentContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: wp("6.4%"), paddingVertical: hp("2%") },
    backButtonContainer: {
        position: 'absolute',
        top: 40,
        left: 20,
        width: '100%',
        alignItems: 'flex-start',
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    backButtonText: {
        fontSize: 16,
        color: '#7C4DDB',
        fontWeight: '600',
    },
    image: { width: "200%", height: hp("30%"), marginBottom: -hp("1.5%") },
    title: { fontSize: wp("6.5%"), color: "#03070E", marginBottom: hp("1%"), fontFamily: "Poppins-Bold" },
    subtitle: { fontSize: wp("3.7%"), color: "#82878F", textAlign: "center", marginBottom: hp("3%"), fontFamily: "Poppins-Regular", lineHeight: hp("2.8%") },
    link: { color: "#107eff", fontFamily: "Poppins-SemiBold" },
    inputGroup: { width: "100%", marginBottom: hp("1.5%") },
    label: { textAlign: "left", color: "#6a6a6a", fontSize: wp("3.5%"), fontFamily: "Poppins-Regular" },
    input: { width: "100%", height: hp("6.5%"), backgroundColor: "#ffffff", borderRadius: wp("3%"), paddingHorizontal: wp("4%"), color: "#03070E", marginTop: hp("0.5%"), fontSize: wp("4%"), fontFamily: "Poppins-Regular", borderColor: "#e5e7eb", borderWidth: 1 },
    inputError: { borderColor: "red", borderWidth: 1 },
    errorText: { color: "red", fontSize: wp("3.2%"), marginTop: 4, fontFamily: "Poppins-Regular" },
    button: { width: "100%", height: hp("6%"), backgroundColor: "#5f5fff", borderRadius: wp("2.5%"), justifyContent: "center", alignItems: "center", marginTop: hp("2%") },
    buttonText: { color: "#fff", fontSize: wp("4.2%"), fontFamily: "Poppins-Bold" },
    loginContainer: { flexDirection: "row", alignItems: "center", marginTop: hp("2.5%") },
    loginText: { color: "#82878F", fontSize: wp("3.8%"), fontFamily: "Poppins-Regular" },
    loginLink: { color: "#107eff", fontSize: wp("3.8%"), fontFamily: "Poppins-SemiBold", marginLeft: wp("1%") },
});
