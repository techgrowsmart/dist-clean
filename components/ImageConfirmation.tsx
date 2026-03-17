import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  useFonts,
} from "@expo-google-fonts/poppins";

interface CropConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const CropConfirmationModal: React.FC<CropConfirmationModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Confirm Crop</Text>
          <Text style={styles.modalMessage}>
            Are you sure you want to save this image?.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp("5%"),
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: wp("4%"),
    padding: wp("6%"),
    width: "90%",
    maxWidth: wp("80%"),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: wp("4.5%"),
    fontFamily: "Poppins_600SemiBold",
    color: "#030303",
    marginBottom: hp("1.5%"),
    textAlign: "center",
  },
  modalMessage: {
    fontSize: wp("3.8%"),
    fontFamily: "Poppins_400Regular",
    color: "#374151",
    textAlign: "center",
    lineHeight: hp("2.5%"),
    marginBottom: hp("3%"),
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: wp("3%"),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: hp("1.8%"),
    borderRadius: wp("2.5%"),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cancelButtonText: {
    fontSize: wp("3.8%"),
    fontFamily: "Poppins_600SemiBold",
    color: "#374151",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#5f5fff",
    paddingVertical: hp("1.8%"),
    borderRadius: wp("2.5%"),
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: wp("3.8%"),
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
});

export default CropConfirmationModal;