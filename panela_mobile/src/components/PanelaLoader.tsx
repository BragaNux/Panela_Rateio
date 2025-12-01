import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

type Props = { size?: number };

export default function PanelaLoader({ size = 56 }: Props){
  const rotate = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(rotate, { toValue: 1, duration: 1200, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 600, useNativeDriver: true }),
    ])).start();
  }, []);
  const rot = rotate.interpolate({ inputRange:[0,1], outputRange:['0deg','360deg'] });
  const ty = bob.interpolate({ inputRange:[0,1], outputRange:[0,-4] });
  return (
    <View style={{ alignItems:'center', justifyContent:'center' }}>
      <Animated.View style={{ transform:[{ rotate: rot },{ translateY: ty }] }}>
        <Text style={{ fontSize: size }}>🍲</Text>
      </Animated.View>
    </View>
  );
}
