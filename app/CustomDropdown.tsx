
import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { isTablet } from "../utils/devices";
export default function CustomDropdown({ label, options, selected, onSelect }) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={styles.input}
      >
        <Text style={styles.labelValue}>{selected || `Select ${label}`}</Text>
        <Ionicons name="chevron-down" size={20} color="#555" />
      </TouchableOpacity>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.dropdown}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.optionLabel}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: wp('3.733%'),
    color: "#000",
    marginBottom: hp('0.807%'),
    fontFamily: "Poppins_400Regular",
  },
  labelValue:{
    fontSize: wp(isTablet ? '4.2%' : '3.8%'),
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: wp('2.667%'),
    borderWidth: wp('0.22%'),
    borderColor: "#888",
    height: hp('6.056%'),
    paddingHorizontal: wp('2.667%'),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  dropdown: {
    backgroundColor: "#fff",
    margin: wp('8%'),
    borderRadius: wp('2.667%'),
    maxHeight: hp('40.376%'),
    padding: wp('2.667%'),
  },
  option: {
    paddingVertical: hp('1.61%'),
    paddingHorizontal: wp('2.667%'),
    borderBottomWidth: wp('0.22%'),
    borderBottomColor: "#eee",
    fontSize:wp('4.27%'),
  },
  optionLabel:{
    fontSize:wp('4.27%'),
  
  }
});
