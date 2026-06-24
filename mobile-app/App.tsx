import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { I18nProvider } from "./src/i18n/translations";
import { ThemeProvider, useTheme } from "./src/lib/theme";
import { WebSocketProvider } from "./src/lib/websocket";
import { loadThemeFromStorage } from "./src/stores/useThemeStore";
import { useEffect } from "react";
import { requestNotificationPermission, loadAlerts, checkAlerts } from "./src/lib/notifications";
import { useWatchlistStore } from "./src/stores/useWatchlistStore";

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg.primary },
          headerTintColor: colors.accent.gold,
          headerTitleStyle: { color: colors.text.primary },
          contentStyle: { backgroundColor: colors.bg.primary },
          animation: "slide_from_right",
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const { load: loadWatchlist } = useWatchlistStore();

  useEffect(() => {
    loadThemeFromStorage();
    loadWatchlist();
    requestNotificationPermission();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <ThemeProvider>
          <WebSocketProvider>
            <RootLayoutNav />
          </WebSocketProvider>
        </ThemeProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
