import merge from "deepmerge";
import { Redirect, Stack } from "expo-router";

import { PaperProvider, adaptNavigationTheme } from "react-native-paper";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MyThemeProvider, useMyThemeContext } from "@/contexts/ThemeContext";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

function InitialLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }
  return (
    <Stack>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="bookmarks" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <MyThemeProvider>
      <RootLayoutContent />
    </MyThemeProvider>
  );
}

function RootLayoutContent() {
  const { theme, isDarkTheme } = useMyThemeContext();
  const paperTheme = theme;

  // Adaptar el tema de Paper para React Navigation
  const navigationTheme = isDarkTheme ? DarkTheme : LightTheme;
  const combinedNavTheme = merge(navigationTheme, paperTheme);

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationThemeProvider value={combinedNavTheme}>
        <AuthProvider>
          <InitialLayout />
        </AuthProvider>
      </NavigationThemeProvider>
    </PaperProvider>
  );
}
