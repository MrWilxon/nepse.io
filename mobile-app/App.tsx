import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nProvider } from "./src/i18n/translations";

export default function RootLayout() {
  return (
    <I18nProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#09090b" },
          headerTintColor: "#D4A017",
          contentStyle: { backgroundColor: "#09090b" },
        }}
      />
    </I18nProvider>
  );
}
