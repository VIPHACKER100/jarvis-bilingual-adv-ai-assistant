import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Keyboard } from 'react-native';
import { styled } from 'nativewind';
import { Send } from 'lucide-react-native';

const StyledView = styled(View);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);

interface CommandTerminalProps {
  onSendCommand: (command: string) => void;
  isConnected: boolean;
}

const CommandTerminal: React.FC<CommandTerminalProps> = ({ onSendCommand, isConnected }) => {
  const [command, setCommand] = useState('');

  const handleSend = () => {
    if (command.trim() && isConnected) {
      onSendCommand(command.trim());
      setCommand('');
      Keyboard.dismiss();
    }
  };

  return (
    <StyledView className="w-full px-6 mb-6">
      <StyledView className="flex-row items-center bg-surface/50 border border-border-default rounded-2xl px-4 py-2">
        <StyledTextInput
          className="flex-1 text-foreground font-light py-2"
          placeholder="Enter remote command..."
          placeholderTextColor="#8A8F98"
          value={command}
          onChangeText={setCommand}
          onSubmitEditing={handleSend}
          editable={isConnected}
        />
        <StyledTouchableOpacity 
          onPress={handleSend}
          className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${isConnected ? 'bg-accent' : 'bg-surface-subtle opacity-50'}`}
        >
          <Send size={18} color="#FFFFFF" />
        </StyledTouchableOpacity>
      </StyledView>
    </StyledView>
  );
};

export default CommandTerminal;
