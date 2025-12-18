import { BASE_URL } from "../../../config";
import { db } from "../../../firebaseConfig";
import { getAuthData } from "../../../utils/authStorage";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Student {
    id: string;
    teacherEmail: string;
    studentEmail: string;
    studentName: string;
}

const StudentTracker = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [broadcastData, setBroadcastData] = useState({
        topic: "",
        date: "",
        time: "",
        link: ""
    });
    const [classInfo, setClassInfo] = useState({ selectedClass: "", selectedSubject: "" });
console.log("User Email:", userEmail);

const params = useLocalSearchParams();
    console.log("Local Search Params:", params);
    

const fetchStudents = async () => {
    try {
        const auth = await getAuthData();
        if (!auth || !auth.email) return;
        const token = auth.token;
        const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        };


        const response = await axios.get(`${BASE_URL}/api/assignedStudents`, {
            headers,
            params: { teacherEmail: auth.email }
        });

        setStudents(response.data.students);
    } catch (err) {
        console.error("Error fetching students", err);
        Alert.alert("Error", "Failed to fetch students.");
    }
};

useEffect(() => {
    fetchStudents();
}, []);

    useEffect(() => {
        const fetchData = async () => {
            const storedUserEmail = await AsyncStorage.getItem("userEmail");
            if(storedUserEmail) setUserEmail(storedUserEmail);

            const [storedClass, storedSubject] = await Promise.all([
                AsyncStorage.getItem("selectedClass"),
                AsyncStorage.getItem("selectedSubject")
            ]);
            setClassInfo({
                selectedClass: storedClass || "",
                selectedSubject: storedSubject || ""
            });

            console.log("Class Info:", classInfo);
         
            if (userEmail) {
                const q = query(collection(db, "studentTracker"), where("teacherEmail", "==", userEmail));
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
                    setLoading(false);
                    console.log("Fetched students:", snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }
            );
                
                return unsubscribe;
            }
        };
        setLoading(false);
        fetchData();
    }, []);


    const handleDeleteStudent = async (studentId: string, studentEmail: string) => {
        try {
            Alert.alert(
                "Confirm Delete",
                `Remove ${studentEmail} from your tracker?`,
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Delete",
                        onPress: async () => {
                            await deleteDoc(doc(db, "studentTracker", studentId));
                            Alert.alert("Success", "Student removed successfully");
                        },
                        style: "destructive"
                    }
                ]
            );
        } catch (error) {
            console.error("Error deleting student:", error);
            Alert.alert("Error", "Failed to delete student");
        }
    };

    
    // const handleBroadcast = async () => {
    //     if (!broadcastData.topic || !broadcastData.date || !broadcastData.time || !broadcastData.link) {
    //         Alert.alert("Error", "Please fill all fields");
    //         return;
    //     }

    //     try {
    //         const broadcastRef = await addDoc(collection(db, "broadcasts"), {
    //             ...broadcastData,
    //             teacherEmail: userEmail,
    //             ...classInfo,
    //             status: "processing",
    //             studentCount: students.length,
    //             timestamp: Timestamp.now()
    //         });

    //         const batch = writeBatch(db);
    //         const messageContent = `📢 Broadcast: ${broadcastData.topic}\nDate: ${broadcastData.date}\nTime: ${broadcastData.time}\nLink: ${broadcastData.link}`;

    //         students.forEach(student => {
    //             const chatId = [userEmail, student.studentEmail].sort().join('_');
    //             const messagesRef = collection(db, "chats", chatId, "messages");
    //             const newMessageRef = doc(messagesRef);
    //             batch.set(newMessageRef, {
    //                 text: messageContent,
    //                 sender: userEmail,
    //                 recipient: student.studentEmail,
    //                 timestamp: Timestamp.now(),
    //                 isBroadcast: true
    //             });
    //             batch.update(doc(db, "studentTracker", student.id), {
    //                 lastMessage: messageContent,
    //                 lastMessageTime: Timestamp.now()
    //             });
    //             batch.update(doc(db, "broadcasts", broadcastRef.id), {
    //                 status: "sent",
    //                 sentTo: student.studentEmail
    //             });
    //             batch.set(doc(db, "broadcasts", broadcastRef.id, "recipients", student.studentEmail), {
    //                 studentEmail: student.studentEmail,
    //                 studentName: student.studentName,
    //                 timestamp: Timestamp.now()
    //             });
    //             batch.set(doc(db, "notifications", student.studentEmail), {
    //                 type: "broadcast",
    //                 message: messageContent,
    //                 timestamp: Timestamp.now(),
    //                 broadcastId: broadcastRef.id
    //             });
    //              console.log(`Broadcast sent to ${student.studentEmail}`);
    //         });

    //         await batch.commit();
    //         Alert.alert("Success", `Broadcast sent to ${students.length} students!`);
    //         setModalVisible(false);
    //         setBroadcastData({ topic: "", date: "", time: "", link: "" });
    //     } catch (error) {
    //         console.error("Broadcast error:", error);
    //         Alert.alert("Error", "Failed to send broadcast");
    //     }
    // };
   



    const handleBroadcast = async () => {
        if (!broadcastData.topic || !broadcastData.date || !broadcastData.time || !broadcastData.link) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }
        const auth = await getAuthData();
        if (!auth || !auth.email) {
            Alert.alert("Error", "User not authenticated");
            return;
        }
        const token = auth.token;
        const headers={
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    
        try {
            const response = await axios.post(`${BASE_URL}/api/broadcast`, {

                broadcastData,
                userEmail,
                classInfo,
                students
            },{headers});
    
            Alert.alert("Success", response.data.message);
            setModalVisible(false);
            setBroadcastData({ topic: "", date: "", time: "", link: "" });
    
        } catch (error) {
            console.error("Broadcast error:", error);
            Alert.alert("Error", "Failed to send broadcast");
        }
    };
    

    if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#6C63FF" />;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Student Tracker ({students.length})</Text>
            <Text style={styles.subheader}>{classInfo.selectedClass} • {classInfo.selectedSubject}</Text>

            <FlatList
                data={students}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.avatar}>
                            <Text style={styles.initial}>{item.studentName.charAt(0)}</Text>
                        </View>
                        <View style={styles.studentInfo}>
                            <Text style={styles.name}>{item.studentName}</Text>
                            <Text style={styles.email}>{item.studentEmail}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteStudent(item.id, item.studentEmail)}
                        >
                            <AntDesign name="close" size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                    </View>
                )}
            />

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="megaphone" size={24} color="white" />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modal}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Broadcast</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <AntDesign name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Class Topic"
                             placeholderTextColor="#999"
                            value={broadcastData.topic}
                            onChangeText={text => setBroadcastData({...broadcastData, topic: text})}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Date (YYYY-MM-DD)"
                             placeholderTextColor="#999"
                            value={broadcastData.date}
                            onChangeText={text => setBroadcastData({...broadcastData, date: text})}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Time (HH:MM)"
                             placeholderTextColor="#999"
                            value={broadcastData.time}
                            onChangeText={text => setBroadcastData({...broadcastData, time: text})}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Meeting Link"
                            placeholderTextColor="#999"

                            value={broadcastData.link}
                            onChangeText={text => setBroadcastData({...broadcastData, link: text})}
                            keyboardType="url"
                        />

                        <TouchableOpacity style={styles.button} onPress={handleBroadcast}>
                            <Text style={styles.buttonText}>Send to {students.length} Students</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#F8F9FA" },
    loader: { flex: 1, justifyContent: "center" },
    header: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
    subheader: { color: "#6C63FF", marginBottom: 16 },
    list: { paddingBottom: 80 },
    card: {
        backgroundColor: "white",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    avatar: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: "#6C63FF",
        justifyContent: "center", alignItems: "center",
        marginRight: 16
    },
    initial: { color: "white", fontSize: 20, fontWeight: "bold" },
    name: { fontWeight: "600", fontSize: 16 },
    email: { color: "#666", fontSize: 14 },
    studentInfo: {
        flex: 1,
        marginRight: 10
    },
    deleteButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#FFEEEE'
    },
    fab: {
        position: "absolute",
        right: 20, bottom: 20,
        backgroundColor: "#6C63FF",
        width: 60, height: 60,
        borderRadius: 30,
        justifyContent: "center", alignItems: "center"
    },
    modal: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
    modalContent: { backgroundColor: "white", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: "bold" },
    input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 16, color: "#000", },
    button: { backgroundColor: "#6C63FF", padding: 16, borderRadius: 8, alignItems: "center" },
    buttonText: { color: "white", fontWeight: "bold" }
});

export default StudentTracker;