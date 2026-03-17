import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    Image, 
    TextInput, 
    StyleSheet, 
    Dimensions,
    StatusBar,
    SafeAreaView, 
    BackHandler
} from 'react-native';
import { Roboto_600SemiBold, useFonts } from '@expo-google-fonts/roboto';
import BottomNavigation from '../BottomNavigation';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 45) / 2; // 2 columns with padding

// Responsive size function
const responsiveSize = (size: number) => {
    const standardHeight = 800; // Standard screen height reference
    return (size * height) / standardHeight;
};

interface Student {
    name: string;
    profilePic: string;
}

interface StudentsListProps {
    students: Student[];
    onBack: () => void;
}
// Inside your component
const StudentsList: React.FC<StudentsListProps> = ({ students, onBack }) => {
    const [fontsLoaded] = useFonts({ Roboto_600SemiBold });
    const [searchQuery, setSearchQuery] = useState('');

    // Add back button handler
    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                onBack(); // Call your existing onBack function
                return true; // Prevent default behavior (app closing)
            }
        );

        return () => backHandler.remove(); // Cleanup on unmount
    }, [onBack]);
    
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderStudentCard = ({ item }: { item: Student }) => (
        <View style={styles.studentCard}>
            <Image 
                source={{ uri: item.profilePic }} 
                style={styles.studentImage} 
                resizeMode="cover"
            />
            <Text style={styles.studentName} numberOfLines={2}>
                {item.name}
            </Text>
        </View>
    );

    if (!fontsLoaded) {
        return <Text>Loading...</Text>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Image 
                            source={require('../../../assets/images/Search.png')} 
                            style={styles.searchIcon} 
                        />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search students"
                            placeholderTextColor="#4e637e"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>Enrolled Students</Text>

                {/* Students Grid */}
                {filteredStudents.length > 0 ? (
                    <FlatList
                        data={filteredStudents}
                        keyExtractor={(item, index) => `${item.name}-${index}`}
                        renderItem={renderStudentCard}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No students found.</Text>
                    </View>
                )}
                
                <BottomNavigation userType={'teacher'}/>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#5f5fff',
    },
    container: { 
        flex: 1, 
        backgroundColor: '#5f5fff', 
        paddingTop: responsiveSize(10) 
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: responsiveSize(15), 
        paddingVertical: responsiveSize(10) 
    },
    backButton: { 
        padding: responsiveSize(5) 
    },
    searchContainer: { 
        paddingHorizontal: responsiveSize(15), 
        marginTop: responsiveSize(20), // Increased top margin for status bar
        marginBottom: responsiveSize(15) 
    },
    searchBar: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        borderRadius: responsiveSize(70), 
        paddingHorizontal: responsiveSize(15), 
        height: responsiveSize(48) 
    },
    searchIcon: { 
        width: responsiveSize(20), 
        height: responsiveSize(20), 
        tintColor: '#4e637e', 
        marginRight: responsiveSize(10) 
    },
    searchInput: { 
        flex: 1, 
        fontSize: responsiveSize(15), 
        color: '#4e637e', 
        fontFamily: 'Poppins' 
    },
    title: { 
        fontSize: responsiveSize(20), 
        fontWeight: 'bold', 
        color: '#fff', 
        paddingHorizontal: responsiveSize(15), 
        marginBottom: responsiveSize(15), 
        fontFamily: 'Roboto_600SemiBold',
        marginTop: responsiveSize(5) 
    },
    listContainer: { 
        paddingHorizontal: responsiveSize(15), 
        paddingBottom: responsiveSize(20),
        flexGrow: 1 
    },
    row: { 
        justifyContent: 'space-between', 
        marginBottom: responsiveSize(15) 
    },
    studentCard: { 
        width: CARD_WIDTH, 
        backgroundColor: '#5f5fff', 
        borderRadius: responsiveSize(8),
        padding: responsiveSize(10), 
        alignItems: 'center',
        marginHorizontal: responsiveSize(2),
        marginBottom: responsiveSize(10) // Added bottom margin for better spacing
    },
    studentImage: { 
        width: '100%', 
        aspectRatio: 3/4,
        borderRadius: responsiveSize(6), 
        marginBottom: responsiveSize(10),
        backgroundColor: '#fff',
        minHeight: responsiveSize(120) // Minimum height for very small screens
    },
    studentName: { 
        fontSize: responsiveSize(16),
        fontWeight: '400', 
        color: '#fff', 
        fontFamily: 'Roboto_600SemiBold', 
        textAlign: 'left', 
        width: '100%',
        lineHeight: responsiveSize(20),
        minHeight: responsiveSize(40) // Fixed height for text to maintain consistency
    },
    emptyContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        paddingVertical: responsiveSize(50)
    },
    emptyText: { 
        fontSize: responsiveSize(16), 
        color: '#fff', 
        fontFamily: 'Poppins' 
    },
});

export default StudentsList;