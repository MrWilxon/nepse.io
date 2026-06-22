import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "../i18n/translations";

const STRATEGIES = [
  { value: "sma", label: "SMA Crossover" },
  { value: "rsi", label: "RSI" },
  { value: "macd", label: "MACD" },
];

export default function BacktestScreen() {
  const { t } = useI18n();
  const [strategy, setStrategy] = useState("sma");
  const [symbol, setSymbol] = useState("NABIL");
  const [initialCapital, setInitialCapital] = useState("100000");
  const [running, setRunning] = useState(false);

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("backtest.title")}</Text>

      <Text style={styles.label}>{t("backtest.strategy")}</Text>
      <View style={styles.strategyRow}>
        {STRATEGIES.map(s => (
          <TouchableOpacity
            key={s.value}
            style={[styles.strategyBtn, strategy === s.value && styles.strategyBtnActive]}
            onPress={() => setStrategy(s.value)}
          >
            <Text style={[styles.strategyText, strategy === s.value && styles.strategyTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Symbol</Text>
      <TextInput style={styles.input} value={symbol} onChangeText={setSymbol} placeholder="NABIL" placeholderTextColor="#8892a0" />

      <Text style={styles.label}>Initial Capital (Rs)</Text>
      <TextInput style={styles.input} value={initialCapital} onChangeText={setInitialCapital} keyboardType="numeric" placeholder="100000" placeholderTextColor="#8892a0" />

      <TouchableOpacity style={styles.runBtn} onPress={handleRun} disabled={running}>
        {running ? (
          <ActivityIndicator color="#09090b" />
        ) : (
          <>
            <Ionicons name="play" size={18} color="#09090b" />
            <Text style={styles.runBtnText}>{t("backtest.runBacktest")}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#D4A017", marginBottom: 20 },
  label: { fontSize: 12, color: "#8892a0", marginBottom: 8, fontWeight: "600" },
  strategyRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  strategyBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#27272a", alignItems: "center" },
  strategyBtnActive: { borderColor: "#D4A017", backgroundColor: "rgba(212,160,23,0.1)" },
  strategyText: { color: "#8892a0", fontSize: 13, fontWeight: "500" },
  strategyTextActive: { color: "#D4A017" },
  input: { backgroundColor: "#1a1a25", borderRadius: 8, borderWidth: 1, borderColor: "#27272a", paddingHorizontal: 12, paddingVertical: 10, color: "#fff", fontSize: 14, marginBottom: 16 },
  runBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#D4A017", borderRadius: 8, paddingVertical: 14, marginTop: 8 },
  runBtnText: { color: "#09090b", fontSize: 14, fontWeight: "700" },
});
