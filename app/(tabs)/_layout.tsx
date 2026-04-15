
import { Slot } from "expo-router";
import React from "react";

// Disable SSR for this layout to prevent Platform access during server-side rendering
export const unstable_settings = {
  ssr: false,
};

export default function TabsLayout() {
  return <Slot />;
}
