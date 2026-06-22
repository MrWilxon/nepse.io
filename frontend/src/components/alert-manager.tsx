"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Plus, X, TrendingUp, TrendingDown, Trash2, Volume2 } from "lucide-react";

interface Alert {
  id: string;
  symbol: string;
  type: "price_above" | "price_below" | "percent_change";
  target: number;
  active: boolean;
  triggered?: boolean;
  triggeredAt?: string;
}

const ALERT_STORAGE_KEY = "nepse_alerts";

function loadAlerts(): Alert[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ALERT_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAlerts(alerts: Alert[]) {
  localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(alerts));
}

function playAlertSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
}

export default function AlertManager({ symbol, currentPrice }: { symbol?: string; currentPrice?: number }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<Alert["type"]>("price_above");
  const [target, setTarget] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    setAlerts(loadAlerts());
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  useEffect(() => {
    if (!currentPrice || !symbol) return;
    alerts.forEach((alert) => {
      if (!alert.active || alert.symbol !== symbol || alert.triggered) return;
      let triggered = false;
      if (alert.type === "price_above" && currentPrice >= alert.target) triggered = true;
      if (alert.type === "price_below" && currentPrice <= alert.target) triggered = true;
      if (triggered) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alert.id ? { ...a, triggered: true, triggeredAt: new Date().toISOString() } : a
          )
        );
        playAlertSound();
        if (notificationPermission === "granted") {
          new Notification(`NEPSE Alert: ${symbol}`, {
            body: `${symbol} has reached Rs ${currentPrice.toLocaleString()}`,
            icon: "/favicon.ico",
          });
        }
      }
    });
  }, [currentPrice, symbol, alerts, notificationPermission]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
    }
  };

  const addAlert = useCallback(() => {
    if (!symbol || !target) return;
    const newAlert: Alert = {
      id: Date.now().toString(),
      symbol,
      type,
      target: parseFloat(target),
      active: true,
    };
    setAlerts((prev) => [...prev, newAlert]);
    setTarget("");
    setShowForm(false);
  }, [symbol, type, target]);

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const symbolAlerts = symbol ? alerts.filter((a) => a.symbol === symbol) : alerts;

  if (!symbol) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Price Alerts</h2>
          <button
            onClick={requestNotificationPermission}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-primary)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {notificationPermission === "granted" ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            {notificationPermission === "granted" ? "Notifications On" : "Enable Notifications"}
          </button>
        </div>
        {alerts.length === 0 ? (
          <div className="card-3d flex flex-col items-center justify-center py-16">
            <Bell className="mb-3 h-10 w-10 text-[var(--border-primary)]" />
            <p className="text-sm text-[var(--text-muted)]">No alerts set</p>
            <p className="text-xs text-[var(--text-dim)]">Visit a company page to set price alerts</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className={`card-3d flex items-center justify-between p-4 ${alert.triggered ? "border-[var(--accent)]" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    alert.triggered ? "bg-[var(--accent-bg)]" : alert.active ? "bg-[var(--green-bg)]" : "bg-[var(--bg-hover)]"
                  }`}>
                    {alert.type === "price_above" ? <TrendingUp className="h-4 w-4 text-[var(--green)]" /> :
                     alert.type === "price_below" ? <TrendingDown className="h-4 w-4 text-[var(--red)]" /> :
                     <Volume2 className="h-4 w-4 text-[var(--blue)]" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{alert.symbol}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {alert.type === "price_above" ? "Above" : alert.type === "price_below" ? "Below" : "Change >"} Rs {alert.target.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {alert.triggered && (
                    <span className="rounded-full bg-[var(--accent-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">Triggered</span>
                  )}
                  <button onClick={() => toggleAlert(alert.id)} className={`p-1.5 rounded-lg ${alert.active ? "text-[var(--green)]" : "text-[var(--text-dim)]"}`}>
                    {alert.active ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => removeAlert(alert.id)} className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--red)]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)]">Alerts ({symbolAlerts.length})</span>
        <div className="flex gap-1">
          {notificationPermission !== "granted" && (
            <button onClick={requestNotificationPermission} className="rounded p-1 text-[var(--text-dim)] hover:text-[var(--accent)]" title="Enable notifications">
              <BellOff className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)} className="rounded p-1 text-[var(--text-dim)] hover:text-[var(--accent)]" title="Add alert">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] p-3 space-y-2">
          <div className="flex gap-1">
            {(["price_above", "price_below", "percent_change"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  type === t ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]" : "text-[var(--text-muted)] border border-transparent"
                }`}
              >
                {t === "price_above" ? "Above" : t === "price_below" ? "Below" : "% Change"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={type === "percent_change" ? "e.g. 5" : "Price"}
              className="flex-1 rounded-lg border border-[var(--border-input)] bg-[var(--bg-page)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
            <button onClick={addAlert} className="btn-accent px-3 py-1.5 text-xs">
              Add
            </button>
          </div>
        </div>
      )}

      {symbolAlerts.slice(0, 3).map((alert) => (
        <div key={alert.id} className="flex items-center justify-between rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] px-3 py-2">
          <div className="flex items-center gap-2">
            {alert.type === "price_above" ? <TrendingUp className="h-3 w-3 text-[var(--green)]" /> : <TrendingDown className="h-3 w-3 text-[var(--red)]" />}
            <span className="text-[11px] text-[var(--text-muted)]">
              {alert.type === "price_above" ? ">" : "<"} Rs {alert.target.toLocaleString()}
            </span>
            {alert.triggered && <span className="text-[9px] font-bold text-[var(--accent)]">HIT</span>}
          </div>
          <button onClick={() => removeAlert(alert.id)} className="text-[var(--text-dim)] hover:text-[var(--red)]">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
