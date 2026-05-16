import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useConnectionStore } from '../store/useConnectionStore';

// Polling interval in milliseconds
const TELEMETRY_INTERVAL_MS = 60_000; // every 60 seconds

interface BatteryInfo {
  level: number;
  is_charging: boolean;
}

interface NetworkInfo {
  type: string;
  isConnected: boolean;
}

interface TelemetryPayload {
  device_id: string;
  access_token: string;
  device_name: string;
  battery?: BatteryInfo;
  network?: NetworkInfo;
  timestamp: string;
}

/**
 * Gathers device sensor data and forwards it to the JARVIS backend so the
 * ContextManager can raise proactive mobile alerts (e.g. low-battery warnings).
 *
 * Uses only React-Native core APIs to avoid optional-dependency issues when
 * Expo Battery / NetInfo packages are not installed.
 */
export const useTelemetry = () => {
  const { serverUrl, accessToken, deviceId, isPaired } = useConnectionStore();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<boolean>(false);

  const sendTelemetry = useCallback(async () => {
    if (!isPaired || !accessToken || !deviceId) return;

    const payload: TelemetryPayload = {
      device_id: deviceId,
      access_token: accessToken,
      device_name: `JARVIS-Mobile-${Platform.OS.toUpperCase()}`,
      timestamp: new Date().toISOString(),
    };

    // Try to gather battery info (Expo Battery is optional)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Battery = require('expo-battery');
      const level = await Battery.getBatteryLevelAsync();
      const state = await Battery.getBatteryStateAsync();
      payload.battery = {
        level: Math.round(level * 100),
        is_charging: state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL,
      };
    } catch (_) {
      // expo-battery not available – skip
    }

    // Try to gather network info (@react-native-community/netinfo is optional)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const NetInfo = require('@react-native-community/netinfo');
      const state = await NetInfo.default.fetch();
      payload.network = {
        type: state.type ?? 'unknown',
        isConnected: !!state.isConnected,
      };
    } catch (_) {
      // NetInfo not available – skip
    }

    if (abortRef.current) return;

    try {
      const endpoint = `${serverUrl}/api/v1/sync/telemetry`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(`[Telemetry] Backend rejected payload (${response.status}): ${text}`);
      } else {
        console.log('[Telemetry] ✅ Sensor data synced with JARVIS.');
      }
    } catch (err) {
      console.warn('[Telemetry] Could not reach backend – will retry next cycle.', err);
    }
  }, [isPaired, accessToken, deviceId, serverUrl]);

  useEffect(() => {
    abortRef.current = false;

    if (!isPaired) return;

    // Fire immediately then schedule repeating sync
    sendTelemetry();
    timer.current = setInterval(sendTelemetry, TELEMETRY_INTERVAL_MS);

    return () => {
      abortRef.current = true;
      if (timer.current !== null) clearInterval(timer.current);
    };
  }, [isPaired, sendTelemetry]);
};
