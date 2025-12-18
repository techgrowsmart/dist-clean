import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";

interface CategoriesProps {
    onSelectClass: (classTitle: string) => void;
    onSelectSubject: (subject: string) => void;
}

const Categories: React.FC<CategoriesProps> = ({ onSelectClass, onSelectSubject }) => {
    const router = useRouter();
    const categories = [
        { title: "Primary Classes (Class 1 to 5)", subcategories: [
                "English", "Hindi", "Mathematics", "Environmental Studies (EVS)", "General Knowledge", "Computer Science",
                "Moral Science (Value Education)", "Art & Craft", "Physical Education", "Music"
            ]},
        { title: "Middle School (Class 6 to 8)", subcategories: [
                "English (Language & Literature)", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit",
                "French", "German", "Computer Applications", "General Knowledge", "Moral Science", "Art & Craft",
                "Physical Education", "Music"
            ]},
        { title: "Secondary (Class 9 & 10)", subcategories: [
                "English Language & Literature", "Hindi Course A", "Hindi Course B", "Mathematics", "Science", "Social Science",
                "Sanskrit", "French", "German", "Computer Applications", "Artificial Intelligence", "Home Science",
                "Elements of Business", "Elements of Book Keeping & Accountancy", "Health and Physical Education",
                "Painting", "Music", "NCC", "Information Technology"
            ]},
        { title: "Senior Secondary (Class 11 & 12)", subcategories: [
                "Science Stream: Physics, Chemistry, Biology, Mathematics, Computer Science, Informatics Practices, Biotechnology",
                "Commerce Stream: Accountancy, Business Studies, Economics, Mathematics, Informatics Practices, Entrepreneurship",
                "Humanities/Arts Stream: History, Political Science, Geography, Sociology, Psychology, Economics, Philosophy",
                "Vocational Subjects: Tourism, Hospitality Management, Retail Operations, etc."
            ]},
        { title: "ICSE Subjects (Class 1 to Class 10)", subcategories: [
                "Primary Classes (Class 1 to 5)", "Middle & High School (Class 6 to 10)", "ISC Subjects (Class 11 & 12)"
            ]}
    ];

    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [showAllCategories, setShowAllCategories] = useState(false);

   
    const handleSubcategorySelect = (categoryTitle: string, subcategory: string) => {
        onSelectClass(categoryTitle); 
        onSelectSubject(subcategory); 
    };

    return (
        <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>Categories</Text>

                <TouchableOpacity onPress={() => setShowAllCategories(true)}>
                    <MaskedView maskElement={<Text style={styles.seeAllText}>See all</Text>}>
                        <LinearGradient
                            colors={['#FA6660', '#FF9457']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={[styles.seeAllText, { opacity: 0 }]}>See all</Text>
                        </LinearGradient>
                    </MaskedView>
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
                {categories.map((cat, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.categoryButton,
                            activeCategory === index && styles.categoryButtonActive,
                        ]}
                        onPress={() => setActiveCategory(index === activeCategory ? null : index)}
                    >
                        <Text style={[
                            styles.categoryText,
                            activeCategory === index && styles.categoryTextActive,
                        ]}>
                            {cat.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Subcategories */}
            {activeCategory !== null && (
                <View style={styles.subcategoriesContainer}>
                    {categories[activeCategory].subcategories.map((sub, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.subcategoryButton}
                            onPress={() => handleSubcategorySelect(categories[activeCategory].title, sub)}
                        >
                            <Text style={styles.subcategoryText}>{sub}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Modal for "See all" Categories */}
            <Modal visible={showAllCategories} transparent animationType="fade">
                <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Select Category</Text>
                        {categories.map((cat, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.categoryButtonModal,
                                    activeCategory === index && styles.categoryButtonModalActive,
                                ]}
                                onPress={() => {
                                    setActiveCategory(index);
                                    setShowAllCategories(false);
                                }}
                            >
                                <Text style={[
                                    styles.categoryTextModal,
                                    activeCategory === index && styles.categoryTextModalActive,
                                ]}>
                                    {cat.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setShowAllCategories(false)}>
                            <Text style={styles.modalClose}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    categorySection: {paddingHorizontal: 20, paddingVertical: 10,},
    categoryHeader: {flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10,},
    categoryTitle: {fontSize: 25, fontFamily: "Poppins_400Regular", color: "#000",},
    seeAllText: {fontSize: 14, fontFamily: "Poppins_700Bold", color: "#fff",},
    categoriesContainer: {flexDirection: "row", alignItems: "center",},
    categoryButton: {backgroundColor: "#E5E9EF", borderRadius: 30, paddingVertical: 10, paddingHorizontal: 15, marginRight: 10,},
    categoryButtonActive: {backgroundColor: "#4255FF",},
    categoryText: {fontSize: 18, fontFamily: "Poppins_400Regular", color: "#000",},
    categoryTextActive: {color: "#fff",},
    subcategoriesContainer: {paddingTop: 10,},
    subcategoryButton: {paddingVertical: 10, paddingHorizontal: 15, marginVertical: 5, backgroundColor: "#F0F4F8", borderRadius: 10,},
    subcategoryText: {fontSize: 16, fontFamily: "Poppins_400Regular", color: "#000",},
    modalContainer: {flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20,},
    modalTitle: {fontSize: 20, fontFamily: "Poppins_700Bold", color: "#fff", marginBottom: 20,},
    categoryButtonModal: {backgroundColor: "#E5E9EF", borderRadius: 20, paddingVertical: 10, paddingHorizontal: 15, marginBottom: 10, width: "100%", alignItems: "center",},
    categoryButtonModalActive: {backgroundColor: "#4255FF",},
    categoryTextModal: {fontSize: 16, fontFamily: "Poppins_400Regular", color: "#000",},
    categoryTextModalActive: {color: "#fff",},
    modalClose: {marginTop: 20, fontSize: 16, fontFamily: "Poppins_700Bold", color: "#fff",},
});

export default Categories;