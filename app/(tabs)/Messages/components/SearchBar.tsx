import React from "react";
import { View, TextInput, Image, StyleSheet, Dimensions } from "react-native";

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const { width } = Dimensions.get("window"); 

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery }) => (
    <View style={styles.container}>
        <View style={styles.searchBar}>
            <Image source={require('../../../../assets/images/Search.png')} style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Search Mentors"
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingHorizontal: width * 0.05, 
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F1F1',
        paddingHorizontal: 15,
        borderRadius: 10,
        height: 45,
        width: "100%", 
    },
    searchIcon: {
        width: 22,
        height: 22,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        fontFamily: "Poppins", 
    },
});

export default SearchBar;
