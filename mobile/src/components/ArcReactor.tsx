import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  interpolate,
  withSequence,
  withSpring
} from 'react-native-reanimated';
import { Svg, Circle, G, Path } from 'react-native-svg';

interface ArcReactorProps {
  isActive: boolean;
  onPress?: () => void;
  size?: number;
}

const ArcReactor: React.FC<ArcReactorProps> = ({ isActive, onPress, size = 200 }) => {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const innerScale = useSharedValue(1);

  useEffect(() => {
    // Continuous rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 15000, easing: Easing.linear }),
      -1,
      false
    );

    // Idle breathing
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (isActive) {
      innerScale.value = withSpring(1.2);
    } else {
      innerScale.value = withSpring(1);
    }
  }, [isActive]);

  const animatedOuterStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: pulse.value }],
  }));

  const animatedInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
    opacity: isActive ? 1 : 0.7,
  }));

  const centerColor = isActive ? '#6872D9' : '#5E6AD2';
  const glowOpacity = isActive ? 0.6 : 0.3;

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={onPress}
      style={[styles.container, { width: size, height: size }]}
    >
      {/* Outer Glow */}
      <Animated.View 
        style={[
          styles.glow, 
          { 
            backgroundColor: centerColor, 
            opacity: glowOpacity,
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: size / 2,
          }
        ]} 
      />

      {/* Main Rings */}
      <Animated.View style={[styles.ringsContainer, animatedOuterStyle]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Ring 1 - Sections */}
          <G stroke="#5E6AD2" strokeWidth="2" fill="none">
            <Path d="M 50,10 A 40,40 0 0,1 90,50" strokeOpacity="0.8" />
            <Path d="M 90,50 A 40,40 0 0,1 50,90" strokeOpacity="0.4" />
            <Path d="M 50,90 A 40,40 0 0,1 10,50" strokeOpacity="0.8" />
            <Path d="M 10,50 A 40,40 0 0,1 50,10" strokeOpacity="0.4" />
          </G>
          
          {/* Ring 2 - Dots */}
          <G fill="#5E6AD2">
            <Circle cx="50" cy="5" r="1.5" />
            <Circle cx="95" cy="50" r="1.5" />
            <Circle cx="50" cy="95" r="1.5" />
            <Circle cx="5" cy="50" r="1.5" />
          </G>
        </Svg>
      </Animated.View>

      {/* Inner Core */}
      <Animated.View style={[styles.coreContainer, animatedInnerStyle]}>
        <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 50 50">
          <Circle 
            cx="25" 
            cy="25" 
            r="15" 
            fill={centerColor} 
            fillOpacity="0.2" 
            stroke={centerColor} 
            strokeWidth="1.5" 
          />
          <Circle 
            cx="25" 
            cy="25" 
            r="8" 
            fill={centerColor} 
          />
          {/* Triangular accents */}
          <G stroke={centerColor} strokeWidth="1">
             <Path d="M 25,5 L 20,15 L 30,15 Z" fill="none" opacity="0.6" />
             <Path d="M 25,45 L 20,35 L 30,35 Z" fill="none" opacity="0.6" />
          </G>
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    shadowColor: '#5E6AD2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  ringsContainer: {
    position: 'absolute',
  },
  coreContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ArcReactor;
