import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "nepse_";

export async function storageGet<T>(key: string): Promise<T | null> {
  try {
    const val = await AsyncStorage.getItem(`${PREFIX}${key}`);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {}
}

export async function storageRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${PREFIX}${key}`);
  } catch {}
}
