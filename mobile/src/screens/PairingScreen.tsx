import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Shield, Smartphone, ArrowRight, Server, Zap } from 'lucide-react-native';
import axios from 'axios';
import { useConnectionStore } from '../store/useConnectionStore';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function PairingScreen() {
  const [pairingCode, setPairingCode] = useState('');
  const [serverUrl, setServerUrl] = useState('http://localhost:8000');
  const [isLoading, setIsLoading] = useState(false);
  const { setPairingData, setServerUrl: setStoreServerUrl } = useConnectionStore();

  const handlePairing = async () => {
    if (!pairingCode.trim()) {
      Alert.alert('Error', 'Please enter a pairing code');
      return;
    }

    setIsLoading(true);
    try {
      // Validate server URL
      let formattedUrl = serverUrl.trim();
      if (!formattedUrl.startsWith('http')) {
        formattedUrl = `http://${formattedUrl}`;
      }

      const response = await axios.post(`${formattedUrl}/api/v1/sync/pair`, {
        pairing_code: pairingCode.trim(),
        device_name: Platform.OS === 'ios' ? 'iPhone' : 'Android Device',
        device_type: 'mobile'
      }, { timeout: 5000 });

      if (response.data.success) {
        setStoreServerUrl(formattedUrl);
        setPairingData(response.data.access_token, response.data.device_id);
        Alert.alert('Success', 'Device paired successfully');
      } else {
        Alert.alert('Pairing Failed', response.data.message || 'Invalid code');
      }
    } catch (error: any) {
      console.error('Pairing Error:', error);
      const msg = error.response?.data?.detail || 'Could not connect to JARVIS server';
      Alert.alert('Connection Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0A0B0E' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <StyledView className="flex-1 px-8 py-20 justify-between">
          <StyledView>
            <StyledView className="items-center mb-10">
              <StyledView className="w-20 h-20 rounded-3xl bg-accent/10 items-center justify-center border border-accent/20 mb-6">
                <Shield size={40} color="#5E6AD2" />
              </StyledView>
              <StyledText className="text-foreground text-3xl font-bold tracking-tight text-center">
                Initialize Sync
              </StyledText>
              <StyledText className="text-foreground-muted text-center mt-2 px-4">
                Connect your mobile node to the JARVIS core system.
              </StyledText>
            </StyledView>

            <StyledView className="gap-5">
              <StyledView className="gap-2">
                <StyledText className="text-foreground-muted text-[10px] uppercase font-bold tracking-widest ml-1">
                  Server Endpoint
                </StyledText>
                <StyledView className="flex-row items-center bg-surface border border-border-default rounded-2xl px-4 h-14">
                  <Server size={18} color="#8A8F98" />
                  <StyledTextInput
                    className="flex-1 ml-3 text-foreground font-medium"
                    placeholder="e.g. 192.168.1.100:8000"
                    placeholderTextColor="#4B4F58"
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </StyledView>
              </StyledView>

              <StyledView className="gap-2">
                <StyledText className="text-foreground-muted text-[10px] uppercase font-bold tracking-widest ml-1">
                  Pairing Code
                </StyledText>
                <StyledView className="flex-row items-center bg-surface border border-border-default rounded-2xl px-4 h-14">
                  <Zap size={18} color="#8A8F98" />
                  <StyledTextInput
                    className="flex-1 ml-3 text-foreground font-black tracking-[0.2em] uppercase"
                    placeholder="ENTER 6-DIGIT CODE"
                    placeholderTextColor="#4B4F58"
                    value={pairingCode}
                    onChangeText={setPairingCode}
                    maxLength={12}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </StyledView>
              </StyledView>
            </StyledView>
          </StyledView>

          <StyledView className="gap-6">
            <StyledTouchableOpacity
              className={`h-16 rounded-2xl flex-row items-center justify-center ${isLoading ? 'bg-accent/50' : 'bg-accent'}`}
              onPress={handlePairing}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <StyledText className="text-white font-bold text-lg mr-2 uppercase tracking-widest">
                    Link Device
                  </StyledText>
                  <ArrowRight size={20} color="white" />
                </>
              )}
            </StyledTouchableOpacity>

            <StyledView className="flex-row justify-center items-center gap-2 opacity-50">
              <Smartphone size={14} color="#8A8F98" />
              <StyledText className="text-foreground-muted text-[10px] font-bold uppercase tracking-widest">
                Node Authorization Protocol v3.9
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
