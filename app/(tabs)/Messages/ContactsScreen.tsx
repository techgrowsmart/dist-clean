import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    StyleSheet,
} from 'react-native';
import { Roboto_600SemiBold, useFonts } from '@expo-google-fonts/roboto';
interface Contact {
    name: string;
    profilePic: any; 
    lastMessage?: string;
    lastMessageTime?: string;
}

interface ContactsScreenProps {
    contacts: Contact[];
    onSelectContact: (contact: Contact) => void;
    onBack: () => void;
}

const ContactsScreen: React.FC<ContactsScreenProps> = ({ contacts, onSelectContact, onBack }) => {
    const [fontLoded] = useFonts({
        Roboto_600SemiBold
    })
    const [searchQuery, setSearchQuery] = useState('');

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    console.log("Filtered",contacts)

    return (
        <View style={styles.container}>
            {/* Header with Back Button & Title */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Image source={require('../../../assets/images/Back.png')} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={styles.title}>Messages</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBar}>
                <Image source={require('../../../assets/images/Search.png')} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Mentors"
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Contacts List */}
            {filteredContacts.length > 0 ? (
                <FlatList
                    data={filteredContacts}
                    keyExtractor={(item) => item.name}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => onSelectContact(item)}
                            style={styles.contactItem}
                        >
                            <Image source={{ uri: item.profilePic }} style={styles.contactImage} />
                            <View style={styles.contactDetails}>
                                <Text style={styles.contactName}>{item.name}</Text>
                                <Text style={styles.lastMessage}>
                                    {item.lastMessage?.trim() !== '' ? item.lastMessage : 'No messages yet'}
                                </Text>
                            </View>
                            {item.lastMessageTime?.trim() !== '' && (
                                <Text style={styles.lastMessageTime}>{item.lastMessageTime}</Text>
                            )}
                        </TouchableOpacity>
                    )}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No contacts found.</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        backgroundColor: '#f8f8f8',
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    backButton: {
        padding: 10,
    },
    backIcon: {
        width: 30,
        height: 30,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
        textAlign: 'center',
        flex: 1,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        marginVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
        height: 45,
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
        fontFamily: 'Poppins',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
    },
    contactImage: {
        width: 48,
        height: 47,
        borderRadius: 27.5,
    },
    contactDetails: {
        marginLeft: 15,
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Roboto_600SemiBold',
        color:"#030303",
        lineHeight:21
    },
    lastMessage: {
        fontSize: 14,
        color: '#888',
        marginTop: 3,
        fontFamily: 'Poppins',
    },
    lastMessageTime: {
        fontSize: 12,
        color: '#999',
        fontFamily: 'Poppins',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
});

export default ContactsScreen;