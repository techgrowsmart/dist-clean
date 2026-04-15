import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

const CustomCheckbox = ({ value, onValueChange, size = 24, disabled = false }) => {
  return (
    <TouchableOpacity
      onPress={!disabled ? onValueChange : undefined}
      activeOpacity={disabled ? 1 : 0.7}
      style={[
        styles.checkbox,
        {
          width: size,
          height: size,
          borderRadius: size / 8,
          borderColor: disabled ? "#ccc" : "#5f5fff",
          backgroundColor: value ? (disabled ? "#ccc" : "#5f5fff") : "transparent",
          opacity: disabled ? 0.5 : 1
        }
      ]}
    >
      {value && (
        <FontAwesome name="check" size={size * 0.8} color={disabled ? "#888" : "#88ea8bff"} />
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