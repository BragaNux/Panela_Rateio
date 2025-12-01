import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { Check } from 'lucide-react-native';

type Props = { source?: any; size?: number };

export default function SuccessCheck({ source, size = 84 }: Props){
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true })
    ]).start();
  }, []);
  return (
    <View style={{ alignItems:'center', justifyContent:'center' }}>
      {source ? (
        <LottieView source={source} autoPlay loop={false} style={{ width: size, height: size }} />
      ) : (
        <Animated.View style={{ width: size, height: size, borderRadius: size/2, backgroundColor: '#10b981', alignItems:'center', justifyContent:'center', transform:[{ scale }], opacity }}>
          <Check size={size*0.45} color="#fff" />
        </Animated.View>
      )}
    </View>
  );
}
