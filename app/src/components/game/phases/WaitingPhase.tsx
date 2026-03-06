/**
 * WaitingPhase - Loading screen while first question is being prepared
 * Shown briefly between lobby → first question arrival via socket
 */
import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

/**
 * Animated loading screen — no lobby, no chat, just a quick transition state
 */
export function WaitingPhase() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const dotAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    // Pulsing glow on the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Staggered bouncing dots
    dotAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(anim, {
            toValue: -8,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
  }, []);

  return (
    <View className="items-center justify-center py-20">
      {/* Pulsing icon */}
      <Animated.View
        style={{
          opacity: pulseAnim,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: withOpacity(colors.primary[500], 0.1),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <Icon name="game-controller" size="xl" color={colors.primary[500]} />
      </Animated.View>

      <Text variant="h3" className="font-bold">
        Get Ready!
      </Text>
      <Text variant="body" color="secondary" className="mt-2">
        Loading first question...
      </Text>

      {/* Bouncing dots */}
      <View className="flex-row items-center mt-6 gap-2">
        {dotAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.primary[500],
              transform: [{ translateY: anim }],
            }}
          />
        ))}
      </View>
    </View>
  );
}
