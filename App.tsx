import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./navigation/RootNavigator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useDeviceColorScheme } from "react-native";
import { useColorScheme } from "nativewind";
import "./global.css";

export default function App() {
  const { colorScheme, setColorScheme } = useColorScheme(); // NativeWind theme
  const deviceScheme = useDeviceColorScheme(); // system theme (light/dark)
  setColorScheme(deviceScheme || "light");

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("app-theme");
        if (storedTheme === "light" || storedTheme === "dark") {
          setColorScheme(storedTheme); // user-chosen theme
        } else {
          // use system default if nothing stored
          setColorScheme(deviceScheme || "light");
        }
      } catch (error) {
        console.warn("Failed to load theme:", error);
      }
    };

    loadTheme();
  }, [deviceScheme]);

  // persist theme when user changes it manually (e.g. from a toggle)
  useEffect(() => {
    if (colorScheme) {
      AsyncStorage.setItem("app-theme", colorScheme).catch((err) =>
        console.warn("Failed to save theme:", err)
      );
    }
  }, [colorScheme]);

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
