import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import BottomNavigation from "../../../app/(tabs)/BottomNavigation";
import { BASE_URL } from "../../../config";
import { db } from "../../../firebaseConfig";
import { getAuthData } from "../../../utils/authStorage";
import { usePushNotifications } from "../../../utils/usePushNotifications";

import {
    collection,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useFonts } from "@expo-google-fonts/poppins";
import { Roboto_400Regular } from '@expo-google-fonts/roboto';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import ConnectionRequestItem from "../Messages/components/ConnectionRequestItem";
import ContactItem from "../Messages/components/ContactItem";
import SearchBar from "../Messages/components/SearchBar";
import ChatScreen from "./ChatScreen";

import {
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
} from "@expo-google-fonts/poppins";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

interface Contact {
  name: string;
  profilePic: string;
  lastMessage?: string;
  lastMessageTime?: string;
  email: string;
}

interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
  timestamp: Date;
  isBroadcast?: boolean;
  userType?: string,
  className?: string,
  subject?: string,
  studentEmails?: string,
  teacherName?: string
}

interface ConnectionRequest {
  id: string;
  studentName: string;
  studentEmail: string;
  studentProfilePic: string;
  teacherEmail: string;
  status: string;
}

const Messages = () => {
  let [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { expoPushToken } = usePushNotifications();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [teacherBroadcastData, setTeacherBroadcastData] = useState<any>([]);
  const [teacherBroadcastMessages, setTeacherBroadcastMessages] = useState<any>([]);

  const { teacherName, profilePic } = useLocalSearchParams<{
    teacherName?: string;
    profilePic?: string;
  }>();
  const [activeTab, setActiveTab] = useState<"contacts" | "broadcast">("contacts");
  const [showSearchBar, setShowSearchBar] = useState(false);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        console.log("🗝️ AsyncStorage Keys:", keys);

        const stores = await AsyncStorage.multiGet(keys);
        stores.forEach(([key, value]) => {
          console.log(`🔑 ${key}:`, value);
        });
        const email = await AsyncStorage.getItem("user_email");
        const role = await AsyncStorage.getItem("user_role");
       
        const profileImage = await AsyncStorage.getItem("profileImage");
 
        if (email) setUserEmail(email);
        if (role === "teacher" || role === "student") setUserType(role);
        if (profileImage) setUserImage(profileImage);

      } catch (error) {
        console.error("❌ Error loading user info:", error);
      }
    };

    loadUserInfo();
  }, []);

  const filteredContacts = contacts
    .filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(contact => ({
      ...contact,
      lastMessage: contact.lastMessage || 'No chats, start by saying Hello',
      lastMessageTime: contact.lastMessageTime || ''
    }));

  useEffect(() => {
    if (userType === "teacher" && userEmail) {
        const fetchTeacherBroadcast = async () => {
          try {
            console.log("Fetching teacher broadcast data")
            const auth = await getAuthData();
            const token = auth?.token;

            const headers = {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            };
            const res = await axios.post(
                `${BASE_URL}/api/messages/get_teacher_broadcast`,
                {userEmail, type: "teacher"},
                {headers}
            );
            console.log("res teacher broadcast",res.data.teacherBroadcastData)
            setTeacherBroadcastData(res.data.teacherBroadcastData);
          } catch (e) {
        }
      }
      fetchTeacherBroadcast();

      const q = query(
        collection(db, "connectionRequests"),
        where("teacherEmail", "==", userEmail),
        where("status", "==", "pending")
      );

      getDocs(q)
        .then((querySnapshot) => {
          const requests: ConnectionRequest[] = [];
          querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() } as ConnectionRequest);
          });
          setConnectionRequests(requests);
        })
        .catch((error) =>
          console.error("Error fetching connection requests:", error)
        );
    }
  }, [userType, userEmail]);
  
  useEffect(() => {
    const fetchContacts = async () => {
      if (!userEmail) return;
  
      try {
        const auth = await getAuthData();
        const token = auth?.token;
 
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
  
        const type = userType === "teacher" ? "teacher" : "student";
  
        // Use Firebase-based contacts endpoint to get subscribed students
        const res = await axios.post(
          `${BASE_URL}/api/firebase-contacts`,
          { userEmail, type },
          { headers }
        );
  
        if (res.data.success) {
          const data = res.data.contacts.map((contact: any) => ({
            name: contact.teacherName || contact.studentName || contact.contactName,
            profilePic: contact.teacherProfilePic || contact.studentProfilePic || contact.contactProfilePic || contact.profilePic || "",
            email: contact.teacherEmail || contact.studentEmail || contact.contactEmail,
            lastMessage: contact.lastMessage || "No messages yet",
            lastMessageTime: contact.lastMessageTime || "Just now",
          }));
  
          setContacts(data);
        } else {
          Alert.alert("Failed", "Could not fetch contacts");
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
        Alert.alert("Error", "Failed to fetch contacts");
      }
    };
  
    fetchContacts();
  }, [userEmail, userType]);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const storedName = await AsyncStorage.getItem(
          userType === "teacher" ? "name" : "studentName"
        );
        const storedImage = await AsyncStorage.getItem(
          userType === "teacher" ? "studentProfilePic" : "teacherProfilePic"
        );
        const storedEmail = await AsyncStorage.getItem(
          userType === "teacher" ? "teacherEmail" : "userEmail"
        );

        if (storedName && storedImage && storedEmail) {
          setContacts((prevContacts) => {
            if (!prevContacts.some((contact) => contact.email === storedEmail)) {
              return [
                ...prevContacts,
                {
                  name: storedName,
                  profilePic: storedImage,
                  email: storedEmail,
                },
              ];
            }
            return prevContacts;
          });
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchProfileData();
  }, [userType]);
  
useEffect(() => {
  const fetchBroadcasts = async () => {
    if (!userEmail) return;

    try {
      const auth = await getAuthData();
      if (!auth?.token) return;
      
      const token = auth.token;
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const requestBody = userType === "teacher" ? { userEmail } : { studentEmail: userEmail };

      const res = await axios.post(
        `${BASE_URL}/api/broadcasts`,
        requestBody,
        { 
          headers,
          timeout: 10000 // Add timeout to prevent hanging
        }
      );

      // Check if response has data
      if (res.data && res.data.broadcasts) {
        const broadcasts = res.data.broadcasts;
        const contactMap = new Map();
        
        broadcasts.forEach((b) => {
          const email = b.teacherEmail;
          const name = b.teacherName || "Teacher";
          const proile = b.teacherProfilePic;
         
          if (!contactMap.has(email)) {
            contactMap.set(email, {
              email,
              name,
              profilePic: proile,
              lastMessage: b.topic,
              lastMessageTime: new Date(b.timestamp._seconds * 1000).toLocaleTimeString(),
            });
          }
        });

        const contactList = Array.from(contactMap.values());
        setContacts((prevContacts) => {
          const mergedMap = new Map<string, Contact>();

          prevContacts.forEach((contact) => mergedMap.set(contact.email, contact));
          contactList.forEach((contact) => {
            if (!mergedMap.has(contact.email)) {
              mergedMap.set(contact.email, contact);
            } else {
              const existing = mergedMap.get(contact.email)!;
              mergedMap.set(contact.email, {
                ...existing,
                lastMessage: contact.lastMessage || existing.lastMessage,
                lastMessageTime: contact.lastMessageTime || existing.lastMessageTime,
              });
            }
          });

          return Array.from(mergedMap.values());
        });
      }
    } catch (err) {
      // Silently catch all errors - don't show anything to user
      console.log("Broadcast fetch error (silent):", err);
    }
  };

  if (activeTab === "broadcast") {
    fetchBroadcasts();
  }
}, [activeTab, userEmail]);

  const broadcastFetchandRender = (item: React.SetStateAction<Contact | null>) => {
    setSelectedContact(item)
    console.log("Usertype testing", userType)
    const fetchBroadcastMessageListForTeacher = async () => {
      try {
        const auth = await getAuthData();
        const token = auth?.token;
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const resp: any = await axios.post(
            `${BASE_URL}/api/broadcast-message-list`,
            { userEmail, userType },
            {headers}
        );
        setTeacherBroadcastMessages(resp.data.teacherBroadcastData)
        console.log("Broadcast get list response:", resp.data.teacherBroadcastData)
      } catch (e) {
        console.log("Error fetching broadcast message list:", e)
      }
    }
    
    if (userType === "teacher") {
      fetchBroadcastMessageListForTeacher();
    }
  };

  useEffect(() => {
    if (!selectedContact || !userEmail) return;

    const recipientEmail = selectedContact.email;
    if (!recipientEmail) return;

    const chatId = [userEmail, recipientEmail].sort().join("_");
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    let retryCount = 0;
    const maxRetries = 3;
    let retryTimeout: NodeJS.Timeout | null = null;
    let currentUnsubscribe: (() => void) | null = null;
    let isMounted = true;

    const createSnapshotListener = () => {
      // Clean up any existing listener before creating a new one
      if (currentUnsubscribe) {
        currentUnsubscribe();
        currentUnsubscribe = null;
      }

      const unsubscribe = onSnapshot(q, { 
        includeMetadataChanges: false,
      }, (querySnapshot) => {
        try {
          retryCount = 0; // Reset retry count on success
          const messagesList: Message[] = [];
          
          if (!querySnapshot || !querySnapshot.docs) {
            console.warn('Empty or invalid snapshot received');
            return;
          }

          querySnapshot.forEach((doc) => {
            try {
              const data = doc.data();
              const isBroadcast = data.isBroadcast || false;
              const isMe = data.sender === userEmail;
              const isRecipient = data.recipient === userEmail;

              const shouldInclude = (activeTab === "broadcast" && isBroadcast) || (activeTab === "contacts" && !isBroadcast);
            
              if ((isMe || isRecipient) && shouldInclude) {
                // Safely handle timestamp conversion
                let timestamp: Date;
                let time: string;
                
                try {
                  if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                    timestamp = data.timestamp.toDate();
                    time = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  } else {
                    timestamp = new Date();
                    time = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  }
                } catch (timeError) {
                  console.warn('Timestamp conversion error:', timeError);
                  timestamp = new Date();
                  time = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                }

                messagesList.push({
                  id: doc.id,
                  text: data.text || '',
                  sender: isMe ? "me" : "other",
                  time,
                  timestamp,
                  isBroadcast: isBroadcast,
                });
              }
            } catch (docError) {
              console.warn('Error processing document:', doc.id, docError);
            }
          });

          if (isMounted) {
            setMessages((prevMessages) => ({
              ...prevMessages,
              [selectedContact.name]: messagesList,
            }));
          
            if (messagesList.length > 0) {
              const lastMessage = messagesList[messagesList.length - 1];
              updateLastMessage(selectedContact.name, lastMessage.text, lastMessage.time);
            }
          }
        } catch (error) {
          console.error('Error processing messages snapshot:', error);
        }
      }, (error) => {
        console.error('Firestore snapshot error:', error);
        
        // Implement retry logic for connection errors
        if (retryCount < maxRetries && isMounted &&
            (error.message?.includes('body stream already read') || 
             error.message?.includes('transport errored') ||
             error.message?.includes('WebChannel') ||
             error.code === 'unavailable' ||
             error.code === 'resource-exhausted')) {
          
          retryCount++;
          console.log(`🔄 Retrying Firestore connection (${retryCount}/${maxRetries})...`);
          
          if (retryTimeout) {
            clearTimeout(retryTimeout);
          }
          
          retryTimeout = setTimeout(() => {
            if (isMounted) {
              console.log('🔄 Attempting to re-establish Firestore connection...');
              createSnapshotListener();
            }
          }, Math.pow(2, retryCount) * 1000); // Exponential backoff
        } else {
          console.error('❌ Max retries reached or non-retryable error:', error);
        }
      });

      currentUnsubscribe = unsubscribe;
      return unsubscribe;
    };

    createSnapshotListener();

    return () => {
      isMounted = false;
      if (currentUnsubscribe) {
        currentUnsubscribe();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [selectedContact, userEmail]);

  const updateLastMessage = (contactName: string, lastMessage: string, lastMessageTime: string) => {
    setContacts((prevContacts) =>
      prevContacts.map((contact) =>
        contact.name === contactName ? { ...contact, lastMessage, lastMessageTime } : contact
      )
    );
  };

  const handleAcceptRequest = async (
    requestId: string,
    studentEmail: string,
    studentName: string,
    studentProfilePic: string
  ) => {
    try {
      const auth = await getAuthData();
      const token = auth?.token;
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      await axios.post(
        `${BASE_URL}/api/accept-request`,
        {
          requestId,
          userEmail,
          studentEmail,
          studentName,
          studentProfilePic,
          teacherName,
          teacherProfilePic: userImage,
        },
        { headers }
      );

      setConnectionRequests((prevRequests) => prevRequests.filter((req) => req.id !== requestId));
      Alert.alert("Success", "Connection request accepted!");
    } catch (error) {
      console.error("Error accepting request:", error);
      Alert.alert("Error", "Failed to accept connection request.");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const auth = await getAuthData();
      const token = auth?.token;
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      await axios.post(`${BASE_URL}/api/reject-request`, { headers, requestId });

      setConnectionRequests((prevRequests) => prevRequests.filter((req) => req.id !== requestId));
      Alert.alert("Success", "Connection request rejected.");
    } catch (error) {
      console.error("Error rejecting request:", error);
      Alert.alert("Error", "Failed to reject connection request.");
    }
  };

  const sendMessage = async (contactName: string, message: { text: string }, broadcastMetadata?: any) => {
    if (!userEmail || !message.text.trim()) {
      Alert.alert("Error", "Message or user email is missing.");
      return;
    }

    const auth = await getAuthData();
    const token = auth?.token;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Broadcast Mode
    if (activeTab === "broadcast" && userType === "teacher") {
      try {
        const params = {
          userType,
          teacherEmail: broadcastMetadata.teacheremail,
          className: broadcastMetadata.classname,
          subject: broadcastMetadata.subject,
          studentEmails: broadcastMetadata.emails,
          studentNames: broadcastMetadata.names,
          isBroadcast: true,
          sender: broadcastMetadata.teacheremail,
          teacherName: broadcastMetadata.teachername,
          text: broadcastMetadata.message
        }

        await axios.post(`${BASE_URL}/api/broadcast-message-list-add`, params, { headers });
      } catch (error) {
        console.error("❌ Broadcast send error:", error);
        Alert.alert("Error", "Something went wrong while sending broadcast");
      }
    } else {
      try {
        const recipientEmail = contacts.find((c) => c.name === contactName)?.email;
        if (!recipientEmail) {
          Alert.alert("Error", "Recipient not found.");
          return;
        }
        const authData = await getAuthData()
        const role = authData?.role
        let name;
        
        if (role === "teacher") {
          name = await AsyncStorage.getItem("teacherName");
        } else {
          name = await AsyncStorage.getItem("studentName");
        }
        
        const res = await axios.post(
          `${BASE_URL}/api/send`,
          {
            sender: userEmail,
            senderName: name,
            recipient: recipientEmail,
            text: message.text.trim(),
            isBroadcast: false,
          },
          { headers }
        );

        if (res.status >= 200 && res.status < 300) {
          updateLastMessage(
            contactName,
            message.text.trim(),
            new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          );
        } else {
          console.error("❌ Direct Message Error:", res.data);
          Alert.alert("Error", res.data.message || "Failed to send message");
        }
      } catch (error) {
        console.error("❌ Direct Message Error:", error);
        Alert.alert("Error", "Failed to send message.");
      }
    }
  };

  return (
    <View style={styles.container}>
<View style={styles.topHeader}>
  <View style={styles.topHeaderContent}>
    {/* Left: Title */}
    <View style={styles.leftSection}>
      <Text style={styles.headerTitle}>Connect</Text>
    </View>
    
    {/* Center: GROWSMART text */}
    <View style={styles.centerSection}>
      <Text style={styles.growsmartText}>GROWSMART</Text>
    </View>
    
    {/* Right: Search Button */}
    <View style={styles.rightSection}>
      <TouchableOpacity style={styles.searchButton} onPress={() => setShowSearchBar((prev) => !prev)}>
        <Image style={styles.searchIcon} source={require("../../../assets/image/search.png")} />
      </TouchableOpacity>
    </View>
  </View>
</View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === "contacts" && styles.activeTab]} onPress={() => setActiveTab("contacts")}>
          <Text style={[styles.tabText, activeTab === "contacts" && styles.activeTabText]}>
            {userType === "teacher" ? "Students" : "Teachers"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === "broadcast" && styles.activeTab]} onPress={() => setActiveTab("broadcast")}>
          <Text style={[styles.tabText, activeTab === "broadcast" && styles.activeTabText]}>
            Broadcast
          </Text>
        </TouchableOpacity>
      </View>

      {showSearchBar && <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}

      {/* Connection Requests for Teachers */}
      {userType === "teacher" && activeTab === "contacts" && connectionRequests.length > 0 && (
        <View style={styles.connectionRequestsContainer}>
          {connectionRequests.map((request) => (
            <ConnectionRequestItem
              key={request.id}
              request={request}
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
            />
          ))}
        </View>
      )}

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Contacts Tab */}
        {activeTab === "contacts" && (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.email}
            renderItem={({ item }) => (
              <ContactItem
                contact={{
                  name: item.name,
                  profilePic: item.profilePic,
                  lastMessage: item.lastMessage,
                  lastMessageTime: item.lastMessageTime,
                }}
                onPress={() => setSelectedContact(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            ItemSeparatorComponent={() => <View style={styles.contactSeparator} />}
          />
        )}
      
        {/* Broadcast Tab for Students */}
        {activeTab === "broadcast" && userType === "student" && (
          filteredContacts.length > 0 ? (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.email}
              renderItem={({ item }) => (
                <ContactItem
                  contact={{
                    name: item.name,
                    profilePic: item.profilePic,
                    lastMessage: item.lastMessage,
                    lastMessageTime: item.lastMessageTime,
                  }}
                  onPress={() => setSelectedContact(item)}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              ItemSeparatorComponent={() => <View style={styles.contactSeparator} />}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No conversations yet</Text>
            </View>
          )
        )}

        {/* Broadcast Tab for Teachers */}
        {activeTab === "broadcast" && userType === "teacher" && (
          teacherBroadcastData.length > 0 ? (
            <FlatList
              data={teacherBroadcastData}
              keyExtractor={(item, index) => `${item.classname}-${item.subject}-${index}`}
              renderItem={({ item }) => (
                <ContactItem
                  contact={{
                    name: item.classname + "-" + item.subject,
                    profilePic: item.profilePic,
                    lastMessage: "Check Last Message",
                    lastMessageTime: item.lastMessageTime,
                  }}
                  onPress={() => broadcastFetchandRender(item)}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              ItemSeparatorComponent={() => <View style={styles.contactSeparator} />}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No conversations yet</Text>
            </View>
          )
        )}
      </View>

      {/* Chat Modal */}
      <Modal visible={!!selectedContact} animationType="slide" transparent={false} onRequestClose={()=> setSelectedContact(null)}>
        {selectedContact && (
          <ChatScreen
            contact={selectedContact}
            messages={messages[selectedContact.name] || []}
            onBack={() => setSelectedContact(null)}
            onNewMessage={updateLastMessage}
            sendMessage={sendMessage}
            tabType={activeTab}
            dataForTeacherBroadcast={{teacherBroadcastMessages, teacherBroadcastData}}
            userType={userType as "student" | "teacher" | null}
          />
        )}
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavigation userType={userType === "teacher" ? "teacher" : "student"} />
    </View>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: { flex: 1, backgroundColor: "#fff" },
  
  // Top Header Styles
  topHeader: { 
    backgroundColor: "#5f5fff", 
    paddingTop: STATUS_BAR_HEIGHT + (SCREEN_HEIGHT * 0.02), 
    paddingBottom: SCREEN_HEIGHT * 0.025, 
    paddingHorizontal: SCREEN_WIDTH * 0.065 
  },
 logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none', // Allows clicks to pass through to title and search
  },
  
 topHeaderContent: { 
  flexDirection: "row", 
  justifyContent: "space-between", 
  alignItems: "center", 
  minHeight: SCREEN_HEIGHT * 0.06,
  width: '100%',
},

leftSection: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'flex-start',
},

centerSection: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},

rightSection: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'flex-end',
  zIndex: 1,
},

headerTitle: { 
  color: "#fff", 
  fontSize: Math.max(16, SCREEN_WIDTH * 0.045), 
  fontWeight: "600", 
  fontFamily: "Roboto_400Regular",
  zIndex: 1,
},
growsmartText: {
  color: '#e5e7eb',
  fontSize: wp('3.78%'),
  fontFamily: 'Poppins_400Regular',
  fontWeight: '500',
  textAlign: 'center',
  letterSpacing: wp('0.15%'),
},

  searchButton: { 
    padding: 8, 
    borderRadius: 20, 
    justifyContent: "center", 
    alignItems: "center",
    zIndex: 1, // Ensure it's above the logo
  },
  searchIcon: { 
    height: Math.max(20, SCREEN_WIDTH * 0.055), 
    width: Math.max(20, SCREEN_WIDTH * 0.055), 

  },
  tabsContainer: { 
    flexDirection: "row", 
    backgroundColor: "#f8f9fa", 
    borderBottomWidth: 1, 
    borderBottomColor: "#e9ecef", 
    elevation: 2, 
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' 
  },
  tab: { 
    flex: 1, 
    paddingVertical: SCREEN_HEIGHT * 0.018, 
    paddingHorizontal: SCREEN_WIDTH * 0.04, 
    alignItems: "center", 
    justifyContent: "center", 
    borderRightWidth: 0.5, 
    borderRightColor: "#dee2e6" 
  },
  activeTab: { 
    backgroundColor: "#ffffff", 
    borderBottomWidth: 3, 
    borderBottomColor: "#007BFF" 
  },
  tabText: { 
    fontSize: Math.max(14, SCREEN_WIDTH * 0.038), 
    fontWeight: "500", 
    color: "#6c757d", 
    fontFamily: "Roboto_400Regular" 
  },
  activeTabText: { 
    color: "#007BFF", 
    fontWeight: "600" 
  },
  connectionRequestsContainer: { 
    backgroundColor: "#f8f9fa", 
    paddingVertical: SCREEN_HEIGHT * 0.01 
  },
  contentContainer: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  flatListContent: { 
    paddingBottom: SCREEN_HEIGHT * 0.02 
  },
  contactSeparator: { 
    height: 1, 
    backgroundColor: "#e9ecef", 
    marginHorizontal: SCREEN_WIDTH * 0.04, 
    marginVertical: 2 
  },
  emptyStateContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    paddingHorizontal: SCREEN_WIDTH * 0.08, 
    paddingVertical: SCREEN_HEIGHT * 0.1 
  },
  emptyStateText: { 
    fontSize: Math.max(16, SCREEN_WIDTH * 0.042), 
    color: "#6c757d", 
    textAlign: "center", 
    fontFamily: "Roboto_400Regular", 
    lineHeight: SCREEN_HEIGHT * 0.028 
  },
});

export default Messages;