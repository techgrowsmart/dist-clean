import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { isTablet } from "../../../../utils/devices";
interface ContactItemProps {
    contact: {
        name: string;
        profilePic: string; 
        lastMessage?: string;
        lastMessageTime?: string;
    };
    onPress: () => void;
}

const ContactItem: React.FC<ContactItemProps> = ({ contact, onPress }) => {
    const [imgError, setImgError] = React.useState(false);
    console.log("contact",contact)
 
    return (
        <TouchableOpacity onPress={onPress} style={styles.contactItem}>
           <Image
        source={
          imgError || !contact.profilePic
            ? require("../../../../assets/images/Profile.png")
            : { uri: contact.profilePic }
        }
        style={styles.contactImage}
        onError={() => setImgError(true)}
      />

          
            <View style={styles.contactDetails}>
          
                <Text style={styles.contactName}>{contact.name}</Text>

              
                <Text 
                  style={[
                    styles.lastMessage, 
                    !contact.lastMessage && styles.noMessageText
                  ]} 
                  numberOfLines={1}
                >
                  {contact.lastMessage || 'No messages yet'}
                </Text>
            </View>

          
            {contact.lastMessageTime && (
                <Text style={styles.timestamp}>{contact.lastMessageTime}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    contactItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical:hp('1.345%'),
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        paddingHorizontal:wp('5.33%')
    },
    contactImage: {
        width: wp('12.8%'),
        height: wp('12.8%'),
        borderRadius: wp('50%'),
        marginRight: 16,
    },
    contactDetails: {
        flex: 1,
    },
    contactName: {
        fontSize: wp('2.933%'),
        fontWeight: "600",
        marginBottom:hp('0.5%'),
        color:"#030303" 
    },
    lastMessage: {
        fontSize: wp(isTablet?'2.1%':'2.95%'),
        color: "#808080",
        lineHeight:hp('2.15%')
    },
    noMessageText: {
        fontStyle: 'italic',
        color: '#a0a0a0'
    },
    timestamp: {
        fontSize: wp('1.51%'),
        color: "#808080",
        alignSelf: "flex-start", 
        marginTop: hp('0.5%'),
    },
});

export default ContactItem;