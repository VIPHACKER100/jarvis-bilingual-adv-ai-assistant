import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, Dimensions, Platform, Vibration, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Brain, Cpu, Wifi, Shield, Settings as SettingsIcon } from 'lucide-react-native';

import ArcReactor from './src/components/ArcReactor';
import PairingScreen from './src/screens/PairingScreen';

import { useWebSocket } from './src/hooks/useWebSocket';
import { useConnectionStore } from './src/store/useConnectionStore';
import { registerForPushNotificationsAsync } from './src/utils/notifications';

const StyledView = styled(View);
const StyledText = styled(Text);

// Setup Notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const { isConnected, isPaired, resetPairing } = useConnectionStore();
  const { sendMessage, systemStatus } = useWebSocket({
    onWake: () => {
      setIsActive(true);
      Vibration.vibrate([0, 100, 50, 100]); // Pulse pattern
      // Auto-standby after 10 seconds
      setTimeout(() => setIsActive(false), 10000);
    }
  });

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('Mobile Push Registered');
      }
    });
  }, []);

  const toggleActivation = () => {
    setIsActive(!isActive);
    sendMessage({ type: 'toggle_activation', data: { active: !isActive } });
  };

  const handleLogout = () => {
    resetPairing();
  };

  if (!isPaired) {
    return <PairingScreen />;
  }

  const connectionStatus = isConnected ? 'online' : 'offline';
  const statusColor = isConnected ? 'bg-green-500' : 'bg-red-500';

  const cpuLoad = systemStatus?.cpu?.percent !== undefined ? `${systemStatus.cpu.percent}%` : '---';
  const memLoad = systemStatus?.memory?.percent !== undefined ? `${systemStatus.memory.percent}%` : '---';
  const platform = systemStatus?.platform || 'Syncing...';

  return (
    <StyledView className="flex-1 bg-background-deep items-center justify-between py-12">
      <StatusBar style="light" />
      
      {/* Header Area */}
      <StyledView className="w-full px-8 flex-row justify-between items-center">
        <StyledView className="flex-row items-center">
          <StyledView className={`w-2 h-2 rounded-full ${statusColor} mr-2 animate-pulse`} />
          <StyledText className="text-foreground-subtle text-xs uppercase tracking-widest font-bold">
            System {connectionStatus}
          </StyledText>
        </StyledView>
        <StyledTouchableOpacity className="flex-row gap-4" onPress={handleLogout}>
          <SettingsIcon size={20} color="#8A8F98" />
        </StyledTouchableOpacity>
      </StyledView>

      {/* Main HUD */}
      <StyledView className="items-center justify-center">
        <ArcReactor isActive={isActive} onPress={toggleActivation} size={280} />
        <StyledView className="mt-8 items-center">
          <StyledText className="text-foreground text-3xl font-light tracking-tighter">
            {isActive ? "LISTENING" : "STANDBY"}
          </StyledText>
          <StyledText className="text-accent text-xs mt-1 tracking-widest font-bold uppercase">
            Protocol V3.9.0
          </StyledText>
        </StyledView>
      </StyledView>

      {/* Quick Stats Panel */}
      <StyledView className="w-full px-6 gap-3">
        <StyledView className="flex-row gap-3">
          <StyledView className="flex-1 bg-surface border border-border-default rounded-2xl p-4 flex-row items-center">
            <Cpu size={18} color="#5E6AD2" />
            <StyledView className="ml-3">
              <StyledText className="text-foreground-muted text-[10px] uppercase font-bold">Logic Engine</StyledText>
              <StyledText className="text-foreground text-sm font-medium">{cpuLoad} Load</StyledText>
            </StyledView>
          </StyledView>
          <StyledView className="flex-1 bg-surface border border-border-default rounded-2xl p-4 flex-row items-center">
            <Brain size={18} color="#5E6AD2" />
            <StyledView className="ml-3">
              <StyledText className="text-foreground-muted text-[10px] uppercase font-bold">Neural Net</StyledText>
              <StyledText className="text-foreground text-sm font-medium">{memLoad} Used</StyledText>
            </StyledView>
          </StyledView>
        </StyledView>

        <StyledView className="bg-surface border border-border-default rounded-3xl p-5 flex-row justify-between items-center">
          <StyledView className="flex-row items-center">
             <StyledView className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center border border-accent/20">
                <Shield size={20} color="#5E6AD2" />
             </StyledView>
             <StyledView className="ml-4">
                <StyledText className="text-foreground font-medium">Security Matrix</StyledText>
                <StyledText className="text-foreground-subtle text-xs">{platform} Node</StyledText>
             </StyledView>
          </StyledView>
          <Wifi size={20} color={isConnected ? "#5E6AD2" : "#8A8F98"} />
        </StyledView>
      </StyledView>

      {/* Decorative Grid Lines (Simulated) */}
      <StyledView className="absolute inset-0 z-[-1] opacity-10">
         {/* Vertical and horizontal grid lines could be added here as SVG or styled Views */}
      </StyledView>
    </StyledView>
  );
}
