import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { storageGet, storageSet } from "./storage";

export interface PriceAlert {
  id: string;
  symbol: string;
  type: "above" | "below";
  threshold: number;
  active: boolean;
  createdAt: number;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("price-alerts", {
      name: "Price Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

export async function loadAlerts(): Promise<PriceAlert[]> {
  return (await storageGet<PriceAlert[]>("price_alerts")) || [];
}

export async function saveAlerts(alerts: PriceAlert[]): Promise<void> {
  await storageSet("price_alerts", alerts);
}

export async function addAlert(alert: Omit<PriceAlert, "id" | "createdAt" | "active">): Promise<PriceAlert> {
  const alerts = await loadAlerts();
  const newAlert: PriceAlert = {
    ...alert,
    id: `${Date.now()}-${alert.symbol}`,
    active: true,
    createdAt: Date.now(),
  };
  alerts.push(newAlert);
  await saveAlerts(alerts);
  return newAlert;
}

export async function removeAlert(id: string): Promise<void> {
  const alerts = await loadAlerts();
  await saveAlerts(alerts.filter((a) => a.id !== id));
}

export async function toggleAlert(id: string): Promise<void> {
  const alerts = await loadAlerts();
  const alert = alerts.find((a) => a.id === id);
  if (alert) {
    alert.active = !alert.active;
    await saveAlerts(alerts);
  }
}

export async function checkAlerts(prices: Record<string, { price: number }>): Promise<PriceAlert[]> {
  const alerts = await loadAlerts();
  const triggered: PriceAlert[] = [];

  for (const alert of alerts) {
    if (!alert.active) continue;
    const current = prices[alert.symbol];
    if (!current) continue;

    const isTriggered =
      (alert.type === "above" && current.price >= alert.threshold) ||
      (alert.type === "below" && current.price <= alert.threshold);

    if (isTriggered) {
      triggered.push(alert);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${alert.symbol} Price Alert`,
          body: `Price is now Rs ${current.price.toFixed(2)} (${alert.type} ${alert.threshold})`,
          data: { symbol: alert.symbol },
        },
        trigger: null,
      });
      alert.active = false;
    }
  }

  if (triggered.length > 0) {
    await saveAlerts(alerts);
  }

  return triggered;
}

export async function scheduleDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "NEPSE Market Update",
      body: "Check today's market summary and your watchlist",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 10,
      minute: 0,
    },
  });
}
