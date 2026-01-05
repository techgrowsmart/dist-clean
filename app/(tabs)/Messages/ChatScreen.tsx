import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  BackHandler,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  NativeEventSubscription,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Bars from "../../../assets/svgIcons/Bars";
import PersonIcon from "../../../assets/svgIcons/Person";
import ShareIcon from "../../../assets/svgIcons/Share";
import CrossIcon from "../../../assets/svgIcons/CrossIcon";
import { router } from "expo-router";
import { Roboto_600SemiBold, useFonts } from "@expo-google-fonts/roboto";
import { Poppins_400Regular } from "@expo-google-fonts/poppins";
import ChatBg1 from "../../../assets/svgIcons/ChatBg1";
import ChatBg2 from "../../../assets/svgIcons/ChatBg2";
import ChatBg3 from "../../../assets/svgIcons/ChatBg3";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { isTablet } from "../../../utils/devices";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useFocusEffect } from "@react-navigation/native";
const { width } = Dimensions.get("window");

interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
  isBroadcast?: boolean;
}


interface ChatScreenProps {
  contact: any;
  messages: Message[];
  filterMode?: "contacts" | "broadcast";
  onBack: () => void;
  onNewMessage: (
    contactName: string,
    lastMessage: string,
    lastMessageTime: string
  ) => void;
  sendMessage: (contactName: string, message: Message, broadcastMetadata?: any) => Promise<void>;
  tabType: string;
  dataForTeacherBroadcast?: any;
  // userType: string | null;
  userType: "student" | "teacher" | null;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  contact,
  messages,
  onBack,
  onNewMessage,
  sendMessage,
    tabType,
  filterMode = "contacts",
  dataForTeacherBroadcast = null,
    userType
}) => {
  const [messageInput, setMessageInput] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showOnlyBroadcasts, setShowOnlyBroadcasts] = useState(false);
  const [isStudentDisables, setIsStudentDisables] = useState(false);
  const [fontsLoaded] = useFonts({
    Roboto_600SemiBold,
    Poppins_400Regular
  });

useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    console.log('Hardware back button pressed');
    onBack();
    return true;
  });

  const loadRole = async () => {
    try {
      const role = await AsyncStorage.getItem("user_role");
      console.log("Data for teacher broadcast: ", dataForTeacherBroadcast)
      if (role === "student") {
        if (messages.length > 0) {
          if (messages[0].isBroadcast === true) {
            setIsStudentDisables(true)
          } else {
            setIsStudentDisables(false)
          }
        } else {
          setIsStudentDisables(false)
        }
      } else {
        setIsStudentDisables(false)
      }
    } catch (error) {
      console.error("Error fetching role from AsyncStorage", error);
    }
  };

  loadRole();

  return () => {
    backHandler.remove();
  };
}, []);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending) return;

    setIsSending(true);

    try {

      if (tabType === 'broadcast' && userType === 'teacher') {
        const newMessage: Message = {
          id: new Date().toISOString(),
          text: messageInput,
          sender: "me",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        const emails: any[]=[];
        const names: any[]=[];
        dataForTeacherBroadcast.teacherBroadcastData.forEach((obj: { classname: any; subject: any; studentemail: any; studentname: any; })=>{
          if (obj.classname === contact.classname && obj.subject === contact.subject) {
            emails.push(obj.studentemail)
            names.push(obj.studentname)
          }
        })
        console.log("Checking contact variable: ", contact)
        const broadcastMetadata = {
          teacheremail: contact.teacheremail,
          teachername: contact.teachername,
          emails,
          names,
          message: messageInput,
          subject: contact.subject,
          classname: contact.classname,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        };

        await sendMessage(contact.name, newMessage, broadcastMetadata)
        setMessageInput("");
        setIsSending(false);
        Toast.show({ type: "success", text1: "Broadcast sent successfully" });
        router.push("/Messages/Messages")
      } else {
        const newMessage: Message = {
          id: new Date().toISOString(),
          text: messageInput,
          sender: "me",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        await sendMessage(contact.name, newMessage).then(()=>{
          setMessageInput("");
          onNewMessage(contact.name, messageInput, newMessage.time);
        });
      }


    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isBroadcast) {
      return (
        <View style={styles.broadcastContainer}>
          <View style={styles.broadcastHeader}>
            <Ionicons name="megaphone" size={16} color="#6C63FF" />
            <Text style={styles.broadcastTitle}>Broadcast Message</Text>
          </View>
          <View style={styles.broadcastMessage}>
            <Text style={styles.broadcastText}>{item.text}</Text>
            <Text style={styles.broadcastTime}>{item.time}</Text>
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageBubble,
          item.sender === "me" ? styles.myMessage : styles.otherMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.sender === "me"
              ? styles.myMessageText
              : styles.otherMessageText,
          ]}
        >
          {item.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            item.sender === "me"
              ? styles.myMessageTime
              : styles.otherMessageTime,
          ]}
        >
          {item.time}
        </Text>
      </View>
    );
  };

  return (
      <View style={{ flex: 1, backgroundColor: "#f1f1f1" }}>
        <View style={styles.backgroundIcons}>
          <ChatBg1
            name="chatbubbles-outline"
            size={40}
            color="#465efc"
            style={{
              position: "absolute",
              top: 40,
              left: 20,
              opacity: 0.12,
              transform: [{ rotate: "15deg" }],
            }}
          />
          <ChatBg2
            name="people-outline"
            size={50}
            color="#465efc"
            style={{
              position: "absolute",
              bottom: 120,
              right: 40,
              opacity: 0.1,
              transform: [{ rotate: "-10deg" }],
            }}
          />
          <ChatBg3
            name="send-outline"
            size={45}
            color="#465efc"
            style={{
              position: "absolute",
              top: 180,
              right: 80,
              opacity: 0.08,
            }}
          />
          <ChatBg1
            name="chatbubbles-outline"
            size={36}
            color="#465efc"
            style={{
              position: "absolute",
              top: 300,
              left: 90,
              opacity: 0.1,
              transform: [{ rotate: "30deg" }],
            }}
          />
          <ChatBg2
            name="people-outline"
            size={40}
            color="#465efc"
            style={{
              position: "absolute",
              bottom: 200,
              left: 40,
              opacity: 0.07,
              transform: [{ rotate: "20deg" }],
            }}
          />
          <ChatBg3
            name="send-outline"
            size={38}
            color="#465efc"
            style={{
              position: "absolute",
              top: 400,
              right: 40,
              opacity: 0.08,
              transform: [{ rotate: "-20deg" }],
            }}
          />
          <ChatBg1
            name="chatbubbles-outline"
            size={48}
            color="#465efc"
            style={{
              position: "absolute",
              bottom: 100,
              left: 100,
              opacity: 0.06,
              transform: [{ rotate: "45deg" }],
            }}
          />
          <ChatBg2
            name="people-outline"
            size={44}
            color="#465efc"
            style={{
              position: "absolute",
              top: 500,
              left: 20,
              opacity: 0.08,
            }}
          />
          <ChatBg3
            name="send-outline"
            size={40}
            color="#465efc"
            style={{
              position: "absolute",
              bottom: 50,
              right: 120,
              opacity: 0.07,
              transform: [{ rotate: "10deg" }],
            }}
          />
        </View>

{/* Header */}
<View style={styles.header}>
  {showOptions && (
    <View style={styles.popupMenu}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowOptions(false);
        }}
      >
        <PersonIcon />
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: "/(tabs)/Messages/BlockUser",
              params: {
                name: contact.name,
                email: contact.email,
                profilePic: contact.profilePic,
              },
            });
          }}
        >
          <Text style={styles.menuText}>Block User</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowOptions(false);
        }}
      >
        <ShareIcon />
        <Text style={styles.menuText}>Share Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowOptions(false);
           router.push({
              pathname: "/(tabs)/Messages/BlockUser",
              params: {
                name: contact.name,
                email: contact.email,
                profilePic: contact.profilePic,
              },
            });
        }}
      >
        <CrossIcon />
        <Text style={styles.menuText}>Report Profile</Text>
      </TouchableOpacity>
    </View>
  )}

  <TouchableOpacity onPress={onBack}
    style={styles.back}
  >
    <Ionicons name="arrow-back" size={wp('7.27%')} color="#FFF" />
  </TouchableOpacity>

 {/* Conditional TouchableOpacity - Only for students to review teachers */}
{userType === "student" ? (
  <TouchableOpacity
    onPress={() => {
      console.log('Navigating to ReviewPage with profile pic:', contact.profilePic);
      router.push({
        pathname: "/(tabs)/StudentDashBoard/ReviewPage",
        params: {
          teacherName: contact.name,
          teacherEmail: contact.email,
          teacherProfilePic: typeof contact.profilePic === 'string' 
            ? contact.profilePic 
            : contact.profilePic?.uri || "",
        },
      });
    }}
    style={{ flexDirection: "row", alignItems: "center" }}
  >
    <Image source={contact.profilePic} style={styles.profilePic} />
    <View style={styles.contactInfo}>
      <Text style={styles.contactName}>
        {tabType === "broadcast" ? contact.classname + "-" + contact.subject : contact.name}
      </Text>
    </View>
  </TouchableOpacity>
) : (
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <Image source={contact.profilePic} style={styles.profilePic} />
    <View style={styles.contactInfo}>
      <Text style={styles.contactName}>
        {tabType === "broadcast" && userType === "teacher" ? contact.classname + "-" + contact.subject : contact.name}
      </Text>
    </View>
  </View>
)}

  <View style={styles.headerIcons}>
    <TouchableOpacity 
      style={styles.iconButton} 
      onPress={() => Alert.alert('Coming Soon', 'Voice call feature will be available soon!')}
      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
    >
      <Ionicons name="call-outline" size={wp('5.5%')} color="#FFF" />
    </TouchableOpacity>
    <TouchableOpacity 
      style={[styles.iconButton, {marginHorizontal: wp('2%')}]} 
      onPress={() => Alert.alert('Coming Soon', 'Video call feature will be available soon!')}
      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
    >
      <Ionicons name="videocam-outline" size={wp('5.5%')} color="#FFF" />
    </TouchableOpacity>
    <TouchableOpacity 
      onPress={() => setShowOptions(!showOptions)}
      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
    >
      <Bars />
    </TouchableOpacity>
  </View>
</View>

        {/* Chat Messages */}
      {userType && userType === "teacher" && tabType === "broadcast" ? (
      <FlatList
        data={
          dataForTeacherBroadcast.teacherBroadcastMessages
            .filter((m: { classname: any; subject: any; }) => m.classname === contact.classname && m.subject === contact.subject)
            .map((m: any) => m)
        }
        keyExtractor={(item) => item.id}
        initialNumToRender={10}
        contentContainerStyle={{ paddingVertical: 10 }}
        renderItem={renderMessage}
      />
    ) : (
      <FlatList
        data={
          showOnlyBroadcasts
            ? messages.filter((msg) => msg.isBroadcast)
            : messages
        }
        keyExtractor={(item) => item.id}
        initialNumToRender={10}
        contentContainerStyle={{ paddingVertical: 10 }}
        renderItem={renderMessage}
      />
    )}

    {/* Bottom area - Different for student broadcast */}
    {userType === "student" && tabType === "broadcast" ? (
      // Student Broadcast Mode - Show message only
      <View style={styles.studentBroadcastMessage}>
        <Text style={styles.studentBroadcastText}>
          You cannot send messages in broadcast mode. Broadcasts are for teacher announcements only.
        </Text>
      </View>
    ) : (
      // Normal Mode - Show input field
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageInput}
          onChangeText={setMessageInput}
          placeholder="Message to connect"
          placeholderTextColor="#888"
          editable={!isSending && !isStudentDisables}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          style={styles.sendButton}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#5c60ff" />
          ) : (
            <Image
              source={require("../../../assets/images/SendButton.png")}
              style={styles.sendIcon}
            />
          )}
        </TouchableOpacity>
      </View>
    )}
  </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#5f5fff",
    height: hp('14.401%'),
    
  },
  back:{
    marginLeft: wp('7.4665%'),
  },
  profilePic: {
    width: wp('8.53'),
    height:  wp('8.53'),
    borderRadius: wp('50%'),
    marginLeft:wp('2.13%')
  },
  contactInfo: {
    flexDirection: "column",
    marginLeft: 15,
  },
  contactName: {
    color: "#fff",
    fontSize: wp(isTablet?'3.5%':'4.27%'),
    fontWeight: "600",
    fontFamily:"Roboto_400Regular"
  },
  contactStatus: {
    fontSize: 16,
    color: "#888",
    fontFamily: "Poppins_400Regular",
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: wp('4.8%'),
    minWidth: wp('30%'),
    justifyContent: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal:wp('5.33%'),
    borderRadius: 10,
    margin: 8,
    maxWidth: width * 0.75,
    position: "relative",
   
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#605eff",
    borderBottomRightRadius: 0,
    marginRight:wp('5.33%')
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 0,
    marginLeft:wp('5.33%')
  },
  messageText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
  },
  myMessageText: {
    color: "#ffffff",
    fontSize:wp('3.2%'),
    lineHeight:hp('2.88%'),
    marginVertical:hp('0.34%')
  },
  otherMessageText: {
    color: "000000",
    fontSize:wp(isTablet?'2.8%':'3.2%'),
    lineHeight:hp('2.88%')
  },
  messageTime: {
    fontSize: wp(isTablet?'1.8%':'2.13%'),
    marginTop: 5,
    alignSelf: "flex-end",
    fontFamily: "Poppins_400Regular",
  },
  myMessageTime: {
    color: "#ffffff",
  },
  otherMessageTime: {
    color: "#888",
  },
  backgroundIcons: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#ffffff",
    paddingHorizontal: wp('5.33%'),
    paddingTop:hp('0.95%'),
    paddingBottom:hp('5.248%'),
    height: hp('12.247%'),
    gap:wp('2.13%')
  },
  input: {
    flex: 1,
    height: hp('6.0456%'),
    width:wp('76.8%'),
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: wp('3.2%'),
    paddingHorizontal: wp('2.13%'),
    
    fontSize: wp('3.2%'),
    lineHeight:hp('2.2%'),
    fontFamily: "Poppins_400Regular",
    backgroundColor: "#fff",
  },
  sendButton: {
    width: wp('10.4%'),
    height: wp('10.4%'),
    justifyContent: "center",
    alignItems: "center",
  },
  
  sendIcon: {
    width: wp('15.4%'),
    height: wp('15.4%'),
    marginTop:hp('1.61%')
  },
  broadcastContainer: {
    alignSelf: "center",
    width: width * 0.85,
    marginVertical: 10,
  },
  broadcastHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  broadcastTitle: {
    color: "#6C63FF",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
    fontFamily: "Poppins-Bold",
  },
  broadcastMessage: {
    backgroundColor: "#F0F0FF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0FF",
  },
  broadcastText: {
    color: "#333",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  broadcastTime: {
    color: "#6C63FF",
    fontSize: 10,
    textAlign: "right",
    marginTop: 5,
    fontFamily: "Poppins_400Regular",
  },
  popupMenu: {
    position: "absolute",
    top: 70,
    right: 5,
    backgroundColor: "#3131b0",
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  menuText: {
    fontSize: 16,
    color: "#FFF",
  },
    // Add these new styles at the end:
  studentBroadcastMessage: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: wp('5.33%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('5.248%'),
    height: hp('12.247%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
  },
  iconButton: {
    padding: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentBroadcastText: {
    fontSize: wp('3.5%'),
    color: "#666",
    textAlign: 'center',
    fontFamily: "Poppins_400Regular",
    lineHeight: hp('2.5%'),
    paddingHorizontal: wp('5%'),
  },
});

export default ChatScreen;
