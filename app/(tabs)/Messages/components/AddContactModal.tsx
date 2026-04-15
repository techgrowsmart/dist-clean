import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert } from "react-native";

interface AddContactModalProps {
    visible: boolean;
    onClose: () => void;
    onAddContact: (name: string, profilePic: string) => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ visible, onClose, onAddContact }) => {
    const [name, setName] = useState("");
    const [profilePic, setProfilePic] = useState("");

    const handleAddContact = () => {
        if (name.trim() === "") {
            Alert.alert("Error", "Please enter a name for the contact.");
            return;
        }
        onAddContact(name, profilePic); 
        setName("");
        setProfilePic("");
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Add New Contact</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter contact name"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter profile picture URL (optional)"
                        value={profilePic}
                        onChangeText={setProfilePic}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
                        <Text style={styles.addButtonText}>Add Contact</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalView: {
        width: "80%",
        backgroundColor: "white",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
    },
    input: {
        width: "100%",
        height: 40,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    addButton: {
        backgroundColor: "#007AFF",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginBottom: 10,
    },
    addButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    cancelButton: {
        backgroundColor: "#ccc",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    cancelButtonText: {
        color: "#333",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default AddContactModal;
