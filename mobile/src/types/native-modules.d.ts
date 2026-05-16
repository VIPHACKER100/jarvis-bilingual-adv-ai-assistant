/**
 * Type shims for packages whose @types are not installed in the
 * workstation dev environment but are present on the mobile build target.
 *
 * These declarations let `tsc --noEmit` pass without requiring the actual
 * packages to be installed on the developer machine.
 */

// ── nativewind ──────────────────────────────────────────────────────────────
declare module 'nativewind' {
  import type { ComponentType } from 'react';
  /**
   * Wraps a React Native component and returns a version that accepts
   * Tailwind `className` strings via NativeWind's runtime.
   */
  export function styled<T extends ComponentType<any>>(
    Component: T,
    options?: Record<string, unknown>
  ): T;
}

// ── @react-native-async-storage/async-storage ───────────────────────────────
declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    mergeItem(key: string, value: string): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<readonly string[]>;
    multiGet(keys: string[]): Promise<readonly [string, string | null][]>;
    multiSet(keyValuePairs: string[][]): Promise<void>;
    multiRemove(keys: string[]): Promise<void>;
  };
  export default AsyncStorage;
}

// ── expo-battery (optional, used with dynamic require in useTelemetry) ──────
declare module 'expo-battery' {
  export enum BatteryState {
    UNKNOWN = 0,
    UNPLUGGED = 1,
    CHARGING = 2,
    FULL = 3,
  }
  export function getBatteryLevelAsync(): Promise<number>;
  export function getBatteryStateAsync(): Promise<BatteryState>;
}

// ── @react-native-community/netinfo (optional) ──────────────────────────────
declare module '@react-native-community/netinfo' {
  interface NetInfoState {
    type: string;
    isConnected: boolean | null;
  }
  const NetInfo: {
    fetch(): Promise<NetInfoState>;
  };
  export default NetInfo;
}
