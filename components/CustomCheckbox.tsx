import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

const CustomCheckbox = ({ value, onValueChange, size = 24 }) => {
  return (
    <TouchableOpacity 
      onPress={onValueChange}
      style={[
        styles.checkbox,
        { 
          width: size, 
          height: size, 
          borderRadius: size / 8, // Rectangular with slight rounding
          borderColor: "#5f5fff",
          backgroundColor: value ? "#5f5fff" : "transparent"
        }
      ]}
    >
      {value && (
        // <Ionicons 
        //   name="checkmark" 
        //   size={size * 0.8} // Slightly larger
        //   color="#4CAF50" // Green check mark
        // />
        <FontAwesome name="check" size={size * 0.8} color="#88ea8bff" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CustomCheckbox;