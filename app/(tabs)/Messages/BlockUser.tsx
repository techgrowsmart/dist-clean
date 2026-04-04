import {
    Raleway_300Light,
    Raleway_400Regular,
    Raleway_600SemiBold,
    Raleway_700Bold,
} from '@expo-google-fonts/raleway';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFonts } from 'expo-font';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import Flag from '../../../assets/svgIcons/Flag';

const BlockUser = () => {
  // Load fonts unconditionally at the top
  const [fontsLoaded] = useFonts({
    Raleway_300Light,
    Raleway_400Regular,
    Raleway_600SemiBold,
    Raleway_700Bold,
  });

  const [selectReason, setSelectReason] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [pickerOpen, setPickerOpen] = useState(false);

  const { name, profilePic } = useLocalSearchParams();

  const openModal = (type: string) => {
    setModalType(type);
    setModalVisible(true);
  };

  // Return loading screen if fonts aren't loaded yet
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Block or Report User</Text>

      <Image
        source={{ uri: Array.isArray(profilePic) ? profilePic[0] : profilePic }}
        style={styles.image}
      />
      <Text style={styles.name}>{name}</Text>

      <View style={styles.divider}></View>

      <View style={styles.content}>
        {/* Block Section */}
        <View style={styles.section}>
          <MaterialIcons name="block" size={wp('8%')} color="#c30707" />
          <View style={styles.textBlock}>
            <Text style={styles.blockTitle}>Block this User</Text>
            <Text style={styles.description}>
              Prevent this user from interacting with you in the Grow Smart platform. They won't be able to send messages, view your classes, or access your shared content.
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => openModal('block')}>
              <Text style={styles.buttonText}>Block User</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Report Section */}
        <View style={styles.section}>
          <Flag width={wp('8%')} height={wp('8%')} color="#c30707" />
          <View style={styles.textBlock}>
            <Text style={styles.blockTitle}>Report this User</Text>
            <Text style={styles.description}>
              Report this user for inappropriate behavior. Select a reason below and submit your report for review.
            </Text>
            
            <View style={[styles.pickerContainer, pickerOpen && styles.pickerOpen]}>
              <Picker
                selectedValue={selectReason}
                style={styles.picker}
                onValueChange={(itemValue) => setSelectReason(itemValue)}
                onFocus={() => setPickerOpen(true)}
                onBlur={() => setPickerOpen(false)}
                dropdownIconColor="#c30707"
              >
                <Picker.Item label="Select Reason" value="" />
                <Picker.Item label="Inappropriate Messages" value="inappropriate" />
                <Picker.Item label="Class Disruption" value="disruption" />
                <Picker.Item label="Fraud or Misleading Info" value="fraud" />
                <Picker.Item label="Harassment" value="harassment" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>

            <TouchableOpacity 
              style={[styles.button, !selectReason && styles.buttonDisabled]} 
              onPress={() => selectReason && openModal('report')}
              disabled={!selectReason}
            >
              <Text style={styles.buttonText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
     
      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType='fade'>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Pressable style={styles.closeIcon} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={wp('6%')} color="black" />
            </Pressable>
            <Text style={styles.modalTitle}>
              {modalType === 'block' ? 'Block this User' : 'Submit Report'}
            </Text>
            <Text style={styles.modalText}>
              {modalType === 'block'
                ? 'Are you sure you want to block this user?'
                : `Submit report for reason: ${selectReason}?`}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.buttonModelCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonModel} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BlockUser;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: hp('5%'), paddingHorizontal: wp('4%'), backgroundColor: '#fff' },
  title: { fontSize: wp('5%'), marginBottom: hp('2%'), textAlign: 'center', fontFamily: 'Raleway_700Bold' },
  image: { height: wp('20%'), width: wp('20%'), borderRadius: wp('10%'), alignSelf: 'center', marginBottom: hp('1%') },
  name: { textAlign: 'center', fontSize: wp('4%'), marginBottom: hp('2%'), fontFamily: 'Raleway_600SemiBold' },
  divider: { height: hp('0.5%'), backgroundColor: '#000', marginVertical: hp('2%'), width: wp('80%'), alignSelf: 'center', borderRadius: 90 },
  content: { flex: 1, padding: wp('4%') },
  section: { flexDirection: 'row', marginBottom: hp('3%'), gap: wp('3%'), marginTop: hp('2.5%'), backgroundColor: '#0000' },
  textBlock: { flex: 1, flexDirection: 'column' },
  blockTitle: { fontSize: wp('4%'), marginBottom: hp('0.8%'), fontFamily: 'Raleway_600SemiBold', color: '#030303' },
  description: { fontSize: wp('3.8%'), marginBottom: hp('1.2%'), lineHeight: hp('2.5%'), color: '#000000', fontFamily: 'Raleway_300Light' },
  button: { 
  height: hp('5%'), 
  backgroundColor: '#c30707', 
  borderRadius: wp('2.5%'), 
  alignItems: 'center', 
  justifyContent: 'center', 
  marginTop: hp('1.2%'), 
  elevation: 2, 
  boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.25)', 
  width: '110%',
  marginHorizontal: -wp('7%') 
},
  buttonDisabled: { backgroundColor: '#cccccc' },
  buttonText: { color: '#fff', fontFamily: 'Raleway_700Bold', fontSize: wp('3.8%') },
  pickerContainer: { 
  width: '100%', 
  marginTop: hp('0.8%'), 
  marginBottom: hp('1%'), 
  backgroundColor: '#ffffff', 
  borderRadius: wp('1%'), 
  borderWidth: 1, 
  borderColor: '#c30707', 
  height: hp('5.5%'),
  justifyContent: 'center' 
},
pickerOpen: { borderColor: '#c30707', borderWidth: 2 },
picker: { 
  height: hp('6.5%'),
  width: '100%',
  marginTop: -hp('0.5%'), 
},
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center' },
modalBox: { 
  width: wp('88%'), 
  backgroundColor: '#fff', 
  borderRadius: wp('4%'), 
  borderRightWidth: wp('0.3%'), 
  borderBottomWidth: wp('0.3%'),
  borderColor: '#21338e', 
  padding: wp('5%'), 
  boxShadow: '2px 2px 0px #21338e',
  elevation: 4,
  alignItems: 'center', 
  position: 'relative' 
},
  closeIcon: { position: 'absolute', right: wp('2.5%'), top: wp('2.5%') },
  modalTitle: { color: '#000', fontSize: wp('4.8%'), marginBottom: hp('1.2%'), lineHeight: hp('3%'), fontFamily: 'Raleway_700Bold', textAlign: 'center' },
  modalText: { fontSize: wp('3.8%'), marginBottom: hp('2.5%'), textAlign: 'center', fontFamily: 'Raleway_400Regular', lineHeight: hp('2.2%') },
  modalButtons: { flexDirection: 'row', gap: wp('3%'), width: '100%', justifyContent: 'space-between' },
  buttonModel: { flex: 1, height: hp('5%'), alignItems: 'center', justifyContent: 'center', borderRadius: wp('25%'), backgroundColor: '#c30707' },
  buttonModelCancel: { flex: 1, height: hp('5%'), alignItems: 'center', justifyContent: 'center', borderRadius: wp('25%'), backgroundColor: '#e3e7fd' },
  buttonCancelText: { color: '#21338e', fontFamily: 'Raleway_600SemiBold', fontSize: wp('3.8%') },
});