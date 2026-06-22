import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "../../src/i18n/translations";

export default function TabLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: "#09090b", borderTopColor: "#27272a" },
        tabBarActiveTintColor: "#D4A017",
        tabBarInactiveTintColor: "#8892a0",
        headerStyle: { backgroundColor: "#09090b" },
        headerTintColor: "#D4A017",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.dashboard"),
          headerTitle: t("nav.dashboard"),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: t("nav.watchlist"),
          headerTitle: t("nav.watchlist"),
          tabBarIcon: ({ color, size }) => <Ionicons name="bookmark" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="backtest"
        options={{
          title: t("nav.backtest"),
          headerTitle: t("nav.backtest"),
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
