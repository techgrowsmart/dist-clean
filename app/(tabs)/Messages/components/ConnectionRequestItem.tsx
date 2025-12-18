
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

interface ConnectionRequestItemProps {
    request: {
        id: string;
        studentName: string;
        studentEmail: string;
        studentProfilePic: string;
    };
    onAccept: (requestId: string, studentEmail: string, studentName: string, studentProfilePic: string) => void;
    onReject: (requestId: string) => void;
}

const ConnectionRequestItem: React.FC<ConnectionRequestItemProps> = ({ request, onAccept, onReject }) => (
    <View style={styles.requestContainer}>
        <Image
            source={request.studentProfilePic ? { uri: request.studentProfilePic } : require('../../../../assets/images/Profile.png')}
            style={styles.profileImage}
        />
        <Text style={styles.name}>{request.studentName}</Text>
        <Text style={styles.email}>{request.studentEmail}</Text>
        <View style={styles.buttonContainer}>
            <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => onAccept(request.id, request.studentEmail, request.studentName, request.studentProfilePic)}
            >
                <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => onReject(request.id)}
            >
                <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
        </View>
    </View>
);

const styles = StyleSheet.create({
    requestContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginBottom: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
    },
    email: {
        fontSize: 14,
        color: "#666",
    },
    buttonContainer: {
        flexDirection: "row",
        marginTop: 10,
    },
    acceptButton: {
        backgroundColor: "#4CAF50",
        padding: 8,
        borderRadius: 5,
        marginRight: 10,
    },
    rejectButton: {
        backgroundColor: "#F44336",
        padding: 8,
        borderRadius: 5,
    },
    buttonText: {
        color: "white",
        fontWeight: "600",
    },
});

export default ConnectionRequestItem;