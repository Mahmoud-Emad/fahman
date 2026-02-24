/**
 * Welcome Screen - Splash screen displayed on app launch
 * Shows the app name/logo for a brief moment before transitioning to Home
 */
import React, { useEffect, useRef, useMemo } from "react";
import { View, Animated, Image } from "react-native";
import { Text, Icon } from "@/components/ui";
import { DecoCircle } from "@/components/decorative";
import { colors, withOpacity } from "@/themes";

/**
 * Tips to display randomly on the welcome screen
 */
const TIPS = [
  "Invite friends to make the game more fun!",
  "The higher your bet, the more points you can win!",
  "Answer quickly to get bonus points.",
  "Create private rooms to play with close friends.",
  "Check the leaderboard to see top players.",
  "You can mute other players if needed.",
  "Host your own room and set custom rules.",
  "Practice makes perfect - play often!",
  "Join public rooms to meet new players.",
  "Use hints wisely - they're limited!",
];

/**
 * Props for the WelcomeScreen component
 */
interface WelcomeScreenProps {
  /** Callback when splash duration completes */
  onComplete: () => void;
  /** Duration in milliseconds (default: 3000) */
  duration?: number;
}

/**
 * Welcome Screen component with fade animation
 */
export function WelcomeScreen({ onComplete, duration = 3000 }: WelcomeScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const tipFadeAnim = useRef(new Animated.Value(0)).current;
  const tipSlideAnim = useRef(new Animated.Value(30)).current;

  // Select a random tip on mount
  const randomTip = useMemo(() => {
    const index = Math.floor(Math.random() * TIPS.length);
    return TIPS[index];
  }, []);

  useEffect(() => {
    // Main content fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Tip animation - delayed slide up and fade in
    const tipTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(tipFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(tipSlideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);

    // Trigger completion after duration
    const timer = setTimeout(() => {
      // Fade out before completing
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(tipFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete();
      });
    }, duration - 300);

    return () => {
      clearTimeout(timer);
      clearTimeout(tipTimer);
    };
  }, [fadeAnim, scaleAnim, tipFadeAnim, tipSlideAnim, duration, onComplete]);

  return (
    <View
      className="flex-1 items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: colors.primary[500] }}
    >
      {/* Decorative Background Circles */}
      <DecoCircle size={150} position={{ top: -50, left: -50 }} opacity={0.08} />
      <DecoCircle size={100} position={{ top: 80, right: -30 }} opacity={0.1} />
      <DecoCircle size={80} position={{ bottom: 120, left: 30 }} opacity={0.06} />
      <DecoCircle size={120} position={{ bottom: -40, right: 40 }} opacity={0.08} />
      <DecoCircle size={60} position={{ top: 200, left: 60 }} opacity={0.05} />
      <DecoCircle size={90} position={{ bottom: 200, right: -20 }} opacity={0.07} />

      {/* Main Content */}
      <Animated.View
        className="items-center"
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >

        {/* Title */}
        <Text
          style={{
            fontSize: 48,
            fontWeight: "bold",
            fontFamily: "sans-serif-condensed",
            color: colors.white,
            letterSpacing: 4,
            textShadowColor: "rgba(0, 0, 0, 0.3)",
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 2,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          FAHMAN
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "400",
            color: withOpacity(colors.white, 0.8),
            letterSpacing: 2,
          }}
        >
          Your fun starts here
        </Text>

        {/* Main Image */}
        <Image
          source={require("../../assets/welcome/logo.png")}
          style={{ width: 320, height: 240, marginTop: 24 }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Tip Section - Animated separately */}
      <Animated.View
        className="absolute bottom-16 left-6 right-6"
        style={{
          opacity: tipFadeAnim,
          transform: [{ translateY: tipSlideAnim }],
        }}
      >
        <View
          className="flex-row items-center px-4 py-3 rounded-2xl"
          style={{
            backgroundColor: withOpacity(colors.white, 0.15),
            borderWidth: 1,
            borderColor: withOpacity(colors.white, 0.2),
          }}
        >
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: withOpacity(colors.white, 0.2) }}
          >
            <Icon name="flash" customSize={18} color={colors.white} />
          </View>
          <View className="flex-1">
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: withOpacity(colors.white, 0.7),
                letterSpacing: 1,
                marginBottom: 2,
              }}
            >
              TIP
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                color: colors.white,
                lineHeight: 18,
              }}
            >
              {randomTip}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
