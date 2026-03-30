import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import BackButton from "../../../components/BackButton";
import { safeBack } from "../../../utils/navigation";

const { width } = Dimensions.get("window");

const Filter = () => {
    const router = useRouter();

    
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedLanguage, setSelectedLanguage] = useState("All");
    const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState([100, 800]); 

    const categories = ["All", "Design", "Marketing", "Developer", "Management"];
    const languages = ["All", "English", "Hindi", "German", "Spanish"];

    const reviews = [
        { value: "4.5+", range: "4.5 and above" },
        { value: "4.0-4.5", range: "4.0 - 4.5" },
        { value: "3.5-4.0", range: "3.5 - 4.0" },
        { value: "3.0-3.5", range: "3.0 - 3.5" },
        { value: "2.5-3.0", range: "2.5 - 3.0" },
        { value: "2.0-2.5", range: "2.0 - 2.5" },
    ];

    const handleReviewSelection = (value: string) => {
        setSelectedReviews((prevSelected) =>
            prevSelected.includes(value)
                ? prevSelected.filter((item) => item !== value)
                : [...prevSelected, value]
        );
    };

    return (
        <View style={styles.container}>
            {/* Top Navigation Bar */}
            <View style={styles.topBar}>
                <BackButton size={24} color="#000" onPress={() => safeBack(router)} />
                <Text style={styles.title}>Filter</Text>
                <View style={{ width: 30 }} />
            </View>

            {/* Scrollable Content */}
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Category Section */}
                <Text style={styles.heading}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.buttonContainer}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.button,
                                    selectedCategory === category && styles.selectedButton,
                                ]}
                                onPress={() => setSelectedCategory(category)}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        selectedCategory === category && styles.selectedButtonText,
                                    ]}
                                >
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Price Range Section */}
                <Text style={styles.heading}>Price Range</Text>
                <View style={styles.priceRangeContainer}>
                    <Text style={styles.priceText}>
                        ₹{priceRange[0]} - ₹{priceRange[1]}
                    </Text>
                    <MultiSlider
                        values={priceRange}
                        onValuesChange={(values) => setPriceRange(values)}
                        min={0}
                        max={1000}
                        step={10}
                        sliderLength={width * 0.8}
                        selectedStyle={{ backgroundColor: "#4255FF" }}
                        unselectedStyle={{ backgroundColor: "#ccc" }}
                        markerStyle={{
                            backgroundColor: "#4255FF",
                            height: 20,
                            width: 20,
                        }}
                    />
                    {/* Price Markers */}
                    <View style={styles.priceMarkers}>
                        {[0, 200, 400, 600, 800, 1000].map((value) => (
                            <Text key={value} style={styles.markerText}>
                                ₹{value}
                            </Text>
                        ))}
                    </View>
                </View>

                {/* Reviews Section */}
                <Text style={styles.heading}>Reviews</Text>
                {reviews.map((review) => (
                    <View key={review.value} style={styles.reviewRow}>
                        <Image source={require("../../../assets/images/Stars.png")} style={styles.starsImage} />
                        <Text style={styles.reviewText}>{review.range}</Text>
                        <TouchableOpacity onPress={() => handleReviewSelection(review.value)}>
                            <View
                                style={[
                                    styles.circle,
                                    selectedReviews.includes(review.value) && styles.filledCircle,
                                ]}
                            />
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Language Section */}
                <Text style={styles.heading}>Languages</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.buttonContainer}>
                        {languages.map((language) => (
                            <TouchableOpacity
                                key={language}
                                style={[
                                    styles.button,
                                    selectedLanguage === language && styles.selectedButton,
                                ]}
                                onPress={() => setSelectedLanguage(language)}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        selectedLanguage === language && styles.selectedButtonText,
                                    ]}
                                >
                                    {language}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.filterButton, styles.resetButton]}
                        onPress={() => {
                            setSelectedCategory("All");
                            setSelectedLanguage("All");
                            setSelectedReviews([]);
                            setPriceRange([100, 800]);
                        }}
                    >
                        <Text style={[styles.filterButtonText, styles.resetButtonText]}>Reset Filter</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterButton, styles.applyButton]}
                        onPress={() => safeBack(router)}
                    >
                        <Text style={[styles.filterButtonText, styles.applyButtonText]}>Apply</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: width * 0.05,
        paddingTop: 40,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    backIcon: {
        width: width * 0.12,
        height: width * 0.12,
    },
    title: {
        fontSize: width * 0.06,
        fontWeight: "bold",
        fontFamily: "Poppins",
        color: "#333",
    },
    scrollContainer: {
        paddingBottom: 20,
    },
    heading: {
        fontSize: width * 0.045,
        fontWeight: "bold",
        fontFamily: "Poppins",
        color: "#333",
        marginBottom: 10,
    },
    buttonContainer: {
        flexDirection: "row",
        marginBottom: 20,
    },
    button: {
        paddingHorizontal: width * 0.04,
        paddingVertical: width * 0.02,
        borderRadius: 10,
        backgroundColor: "#ECEEF1",
        marginRight: 10,
    },
    selectedButton: {
        backgroundColor: "#4255FF",
    },
    buttonText: {
        fontSize: width * 0.04,
        fontFamily: "Poppins",
        color: "#8C8C8C",
    },
    selectedButtonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
    },
    priceRangeContainer: {
        marginBottom: 20,
        alignItems: "center",
    },
    priceText: {
        fontSize: width * 0.05,
        fontWeight: "bold",
        textAlign: "center",
        color: "#4255FF",
        marginBottom: 15,
    },
    priceMarkers: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "90%",
        paddingHorizontal: 5,
    },
    markerText: {
        fontSize: width * 0.03,
        color: "#555",
    },
    reviewRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    starsImage: {
        width: width * 0.3,
        height: width * 0.05,
    },
    reviewText: {
        fontSize: width * 0.04,
        fontFamily: "Poppins",
        color: "#333",
    },
    circle: {
        width: width * 0.05,
        height: width * 0.05,
        borderRadius: width * 0.025,
        borderWidth: 2,
        borderColor: "#4255FF",
    },
    filledCircle: {
        backgroundColor: "#4255FF",
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },
    filterButton: {
        flex: 1,
        paddingVertical: width * 0.035,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#4255FF",
        alignItems: "center",
        marginHorizontal: 5,
    },
    resetButton: {
        backgroundColor: "#FFFFFF",
    },
    applyButton: {
        backgroundColor: "#FFFFFF",
    },
    filterButtonText: {
        fontSize: width * 0.04,
        fontFamily: "Poppins",
        fontWeight: "bold",
    },
    resetButtonText: {
        color: "#4255FF",
    },
    applyButtonText: {
        color: "#4255FF",
    },

    resetButtonPressed: {
        backgroundColor: "#4255FF",
    },
    resetButtonTextPressed: {
        color: "#FFFFFF",
    },
    applyButtonPressed: {
        backgroundColor: "#4255FF",
    },
    applyButtonTextPressed: {
        color: "#FFFFFF",
    },

});

export default Filter;
