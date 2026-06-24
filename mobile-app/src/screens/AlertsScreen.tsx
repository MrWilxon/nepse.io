import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme";
import { useI18n } from "../i18n/translations";
import { useWs } from "../lib/websocket";
import {
  loadAlerts, addAlert, removeAlert, toggleAlert, checkAlerts,
  PriceAlert, requestNotificationPermission
} from "../lib/notifications";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { formatPrice } from "../lib/format";
import { hapticLight, hapticSuccess, hapticError } from "../lib/haptics";
import { useRouter } from "expo-router";

export default function AlertsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { prices, connected } = useWs();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [symbol, setSymbol] = useState("");
  const [threshold, setThreshold] = useState("");
  const [alertType, setAlertType] = useState<"above" | "below">("above");

  useEffect(() => {
    loadAlerts().then(setAlerts);
    requestNotificationPermission();
  }, []);

  const handleAdd = async () => {
    if (!symbol || !threshold) return;
    const newAlert = await addAlert({
      symbol: symbol.toUpperCase(),
      type: alertType,
      threshold: parseFloat(threshold),
    });
    setAlerts((prev) => [...prev, newAlert]);
    setSymbol("");
    setThreshold("");
    hapticSuccess();
  };

  const handleRemove = (id: string) => {
    Alert.alert("Delete Alert", "Remove this price alert?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeAlert(id);
          setAlerts((prev) => prev.filter((a) => a.id !== id));
          hapticLight();
        },
      },
    ]);
  };

  const handleToggle = async (id: string) => {
    await toggleAlert(id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
    hapticLight();
  };

  const handleCheckNow = async () => {
    const triggered = await checkAlerts(prices);
    if (triggered.length > 0) {
      Alert.alert("Alerts Triggered", `${triggered.length} alert(s) were triggered!`);
    } else {
      Alert.alert("No Triggers", "No alerts were triggered at current prices.");
    }
    loadAlerts().then(setAlerts);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <ScreenHeader
        title="Price Alerts"
        leftIcon="chevron-back"
        onLeftPress={() => router.back()}
        rightComponent={
          <TouchableOpacity onPress={handleCheckNow} style={styles.checkBtn}>
            <Ionicons name="refresh" size={18} color={colors.accent.gold} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {/* Add Alert Form */}
            <Card style={styles.formCard}>
              <Text style={[styles.formTitle, { color: colors.text.primary }]}>Add Alert</Text>

              <TextInput
                style={[styles.input, { color: colors.text.primary, backgroundColor: colors.bg.input, borderColor: colors.border.default }]}
                value={symbol}
                onChangeText={setSymbol}
                placeholder="Symbol (e.g. NABIL)"
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="characters"
              />

              <View style={styles.typeRow}>
                <TouchableOpacity
                  onPress={() => setAlertType("above")}
                  style={[styles.typeBtn, {
                    backgroundColor: alertType === "above" ? colors.semantic.profitBg : colors.bg.elevated,
                    borderColor: alertType === "above" ? colors.semantic.profit : colors.border.default,
                  }]}
                >
                  <Ionicons name="arrow-up" size={14} color={alertType === "above" ? colors.semantic.profit : colors.text.secondary} />
                  <Text style={[styles.typeText, { color: alertType === "above" ? colors.semantic.profit : colors.text.secondary }]}>
                    Above
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAlertType("below")}
                  style={[styles.typeBtn, {
                    backgroundColor: alertType === "below" ? colors.semantic.lossBg : colors.bg.elevated,
                    borderColor: alertType === "below" ? colors.semantic.loss : colors.border.default,
                  }]}
                >
                  <Ionicons name="arrow-down" size={14} color={alertType === "below" ? colors.semantic.loss : colors.text.secondary} />
                  <Text style={[styles.typeText, { color: alertType === "below" ? colors.semantic.loss : colors.text.secondary }]}>
                    Below
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { color: colors.text.primary, backgroundColor: colors.bg.input, borderColor: colors.border.default }]}
                value={threshold}
                onChangeText={setThreshold}
                keyboardType="decimal-pad"
                placeholder="Price threshold (Rs)"
                placeholderTextColor={colors.text.tertiary}
              />

              <Button
                title="Add Alert"
                onPress={handleAdd}
                variant="primary"
                fullWidth
                disabled={!symbol || !threshold}
                icon={<Ionicons name="add-circle" size={18} color={colors.text.inverse} />}
              />
            </Card>

            {/* Connection Status */}
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: connected ? colors.semantic.profit : colors.semantic.loss }]} />
              <Text style={[styles.statusText, { color: colors.text.tertiary }]}>
                {connected ? "Connected — alerts check in real-time" : "Offline — alerts will check when connected"}
              </Text>
            </View>

            {alerts.length > 0 && (
              <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
                Active Alerts ({alerts.filter((a) => a.active).length})
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="notifications-outline" size={32} color={colors.text.tertiary} />}
            title="No Alerts"
            description="Add price alerts to get notified when stocks hit your target"
          />
        }
        renderItem={({ item }) => {
          const livePrice = prices[item.symbol];
          const currentPrice = livePrice?.price;
          const isTriggered = currentPrice
            ? (item.type === "above" && currentPrice >= item.threshold) ||
              (item.type === "below" && currentPrice <= item.threshold)
            : false;

          return (
            <Card style={[styles.alertCard, isTriggered && { borderColor: colors.accent.gold }]}>
              <View style={styles.alertRow}>
                <View style={styles.alertLeft}>
                  <View style={styles.alertHeader}>
                    <Text style={[styles.alertSymbol, { color: colors.text.primary }]}>{item.symbol}</Text>
                    <Badge
                      label={item.type === "above" ? "Above" : "Below"}
                      variant={item.type === "above" ? "success" : "danger"}
                    />
                    {!item.active && <Badge label="Paused" variant="warning" />}
                  </View>
                  <Text style={[styles.alertThreshold, { color: colors.text.secondary }]}>
                    Target: {formatPrice(item.threshold)}
                  </Text>
                  {currentPrice && (
                    <Text style={[styles.alertCurrent, { color: isTriggered ? colors.accent.gold : colors.text.tertiary }]}>
                      Current: {formatPrice(currentPrice)} {isTriggered ? "✓ TRIGGERED" : ""}
                    </Text>
                  )}
                </View>
                <View style={styles.alertActions}>
                  <TouchableOpacity onPress={() => handleToggle(item.id)} style={styles.alertActionBtn}>
                    <Ionicons
                      name={item.active ? "pause" : "play"}
                      size={16}
                      color={item.active ? colors.semantic.warning : colors.semantic.profit}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.alertActionBtn}>
                    <Ionicons name="trash" size={16} color={colors.semantic.loss} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  checkBtn: { padding: 8 },
  formCard: { marginBottom: 12 },
  formTitle: { fontSize: 15, fontWeight: "600", marginBottom: 12 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 10,
  },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  typeText: { fontSize: 13, fontWeight: "600" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  alertCard: { marginBottom: 8 },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  alertLeft: { flex: 1 },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  alertSymbol: { fontSize: 16, fontWeight: "700" },
  alertThreshold: { fontSize: 13, marginTop: 4 },
  alertCurrent: { fontSize: 12, marginTop: 2 },
  alertActions: { gap: 8 },
  alertActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
});
