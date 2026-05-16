import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, Dimensions, Platform, Vibration, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Brain, Cpu, Wifi, Shield, Settings as SettingsIcon } from 'lucide-react-native';

import ArcReactor from './src/components/ArcReactor';
import CommandTerminal from './src/components/CommandTerminal';
import PairingScreen from './src/screens/PairingScreen';

import { useWebSocket } from './src/hooks/useWebSocket';
import { useTelemetry } from './src/hooks/useTelemetry';
import { useConnectionStore } from './src/store/useConnectionStore';
import { registerForPushNotificationsAsync } from './src/utils/notifications';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

// Setup Notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const { isConnected, isPaired, resetPairing } = useConnectionStore();
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  
  const { 
    sendMessage, systemStatus, isAgentThinking, 
    agentThought, lastResponse, pendingConfirmation, confirmAction,
    proactiveSuggestion
  } = useWebSocket({
    onWake: () => {
      setIsActive(true);
      Vibration.vibrate([0, 100, 50, 100]); // Pulse pattern
      // Auto-standby after 10 seconds
      setTimeout(() => setIsActive(false), 10000);
    }
  });

  // Sync device sensor data with the backend proactive engine
  useTelemetry();

  useEffect(() => {
    if (isAgentThinking) {
      Vibration.vibrate(50); // Small haptic feedback
    }
  }, [isAgentThinking]);

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
      
      {/* Header / Connectivity */}
      <StyledView className="w-full flex-row justify-between items-center px-6 mt-4">
        <StyledView className="flex-row items-center">
          <StyledView className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <StyledText className="text-foreground-subtle text-xs font-bold tracking-widest uppercase">
            {isConnected ? "Linked" : "Offline"}
          </StyledText>
        </StyledView>
        <StyledTouchableOpacity onPress={resetPairing}>
          <SettingsIcon size={20} color="#8A8F98" />
        </StyledTouchableOpacity>
      </StyledView>

      {/* Proactive Suggestion Banner */}
      {proactiveSuggestion && (
        <StyledView className="mx-6 mt-4 bg-accent/20 border border-accent/40 px-4 py-3 rounded-2xl flex-row items-center">
          <Brain size={16} color="#00E5FF" />
          <StyledText className="text-cyan-100 text-[11px] font-medium flex-1">
            {proactiveSuggestion}
          </StyledText>
        </StyledView>
      )}

      {/* Main HUD */}
      <StyledView className="items-center justify-center">
        <ArcReactor isActive={isActive || isAgentThinking} onPress={toggleActivation} size={280} />
        <StyledView className="mt-8 items-center">
          <StyledText className={`text-foreground text-3xl font-light tracking-tighter ${isAgentThinking ? 'text-cyan-400' : ''}`}>
            {isAgentThinking ? "NEURAL ANALYSIS" : (isActive ? "LISTENING" : "STANDBY")}
          </StyledText>
          {isAgentThinking && agentThought && (
            <StyledText className="text-cyan-200/60 text-[10px] mt-2 font-light italic text-center px-10">
              Thought: {agentThought}
            </StyledText>
          )}
          {!isAgentThinking && lastResponse && (
            <StyledText className="text-foreground-subtle text-xs mt-3 text-center px-8 italic border-t border-border-default/20 pt-2">
              JARVIS: "{lastResponse}"
            </StyledText>
          )}
          <StyledText className="text-accent text-xs mt-1 tracking-widest font-bold uppercase">
            Protocol V3.9.0
          </StyledText>
        </StyledView>
      </StyledView>

      {/* Remote Command Terminal */}
      <CommandTerminal 
        isConnected={isConnected} 
        onSendCommand={(cmd) => sendMessage({ type: 'command', command: cmd, language: 'en' })}
      />

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

      {/* Security Confirmation Modal Overlay */}
      {pendingConfirmation && (
        <StyledView className="absolute inset-0 bg-background/90 items-center justify-center px-10 z-50">
          <Shield size={64} color="#FACC15" />
          <StyledText className="text-foreground text-xl font-bold text-center mb-2">
            SECURITY PROTOCOL
          </StyledText>
          <StyledText className="text-foreground-subtle text-center mb-8">
            JARVIS is requesting permission for: {"\n"}
            <StyledText className="text-accent font-bold">
              {pendingConfirmation.command_key?.replace('_', ' ').toUpperCase()}
            </StyledText>
          </StyledText>
          
          <StyledView className="flex-row gap-4 w-full">
            <StyledTouchableOpacity 
              onPress={() => confirmAction(false)}
              className="flex-1 bg-surface border border-border-default py-4 rounded-2xl items-center"
            >
              <StyledText className="text-foreground font-bold">CANCEL</StyledText>
            </StyledTouchableOpacity>
            
            <StyledTouchableOpacity 
              onPress={() => confirmAction(true)}
              className="flex-1 bg-yellow-500 py-4 rounded-2xl items-center"
            >
              <StyledText className="text-background font-bold">APPROVE</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      )}

      {/* Decorative Grid Lines (Simulated) */}
      <StyledView className="absolute inset-0 z-[-1] opacity-10">
         {/* Vertical and horizontal grid lines could be added here as SVG or styled Views */}
      </StyledView>
    </StyledView>
  );
}
