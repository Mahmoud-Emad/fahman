/**
 * Welcome Screen - Splash screen displayed on app launch
 * Shows connection error with retry when server is unreachable
 */
import React, { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { View, Animated, Image, Pressable } from "react-native";
import { Text, Icon } from "@/components/ui";
import { DecoCircle } from "@/components/decorative";
import { colors, withOpacity } from "@/themes";
import { useAuth } from "@/contexts";

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
  const [isRetrying, setIsRetrying] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const hasProceeded = useRef(false);

  const { isInitializing, connectionError, reinitialize } = useAuth();

  // Select a random tip on mount
  const randomTip = useMemo(() => {
    const index = Math.floor(Math.random() * TIPS.length);
    return TIPS[index];
  }, []);

  const proceedToApp = useCallback(() => {
    if (hasProceeded.current) return;
    hasProceeded.current = true;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(tipFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onComplete());
  }, [fadeAnim, tipFadeAnim, onComplete]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    await reinitialize();
    setIsRetrying(false);
  }, [reinitialize]);

  // Animate in on mount + splash timer
  useEffect(() => {
    hasProceeded.current = false;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    const tipTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(tipFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(tipSlideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();
    }, 600);

    // Mark splash as done after minimum duration
    const splashTimer = setTimeout(() => setSplashDone(true), duration - 300);

    return () => {
      clearTimeout(tipTimer);
      clearTimeout(splashTimer);
    };
  }, [fadeAnim, scaleAnim, tipFadeAnim, tipSlideAnim, duration]);

  // Decide what to do when both splash is done AND auth finished initializing
  useEffect(() => {
    if (!splashDone || isInitializing || hasProceeded.current) return;

    // If no connection error, proceed to app (login or home depending on auth state)
    if (!connectionError) {
      proceedToApp();
    }
    // If there IS a connectionError, we stay here and show the error UI
  }, [splashDone, isInitializing, connectionError, proceedToApp]);

  // Show error state: splash done + not initializing + has connection error
  const showError = splashDone && !isInitializing && !!connectionError;

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
            textShadowColor: withOpacity(colors.black, 0.3),
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

      {/* Bottom Section - Error or Tip */}
      <Animated.View
        className="absolute bottom-16 left-6 right-6"
        style={{
          opacity: tipFadeAnim,
          transform: [{ translateY: tipSlideAnim }],
        }}
      >
        {showError ? (
          <View
            className="items-center px-4 py-5 rounded-2xl"
            style={{
              backgroundColor: withOpacity(colors.white, 0.2),
              borderWidth: 1,
              borderColor: withOpacity(colors.white, 0.3),
            }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: withOpacity(colors.error, 0.2) }}
            >
              <Icon name="cloud-offline" customSize={22} color={colors.white} />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.white,
                marginBottom: 4,
              }}
            >
              No Connection
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "400",
                color: withOpacity(colors.white, 0.8),
                textAlign: "center",
                lineHeight: 18,
                marginBottom: 12,
              }}
            >
              Unable to reach the server. Please check your internet connection and try again.
            </Text>
            <Pressable
              onPress={handleRetry}
              disabled={isRetrying}
              delayPressIn={0}
              className="px-6 py-2.5 rounded-full active:opacity-80"
              style={{
                backgroundColor: colors.white,
                opacity: isRetrying ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.primary[500],
                }}
              >
                {isRetrying ? "Retrying..." : "Retry"}
              </Text>
            </Pressable>
          </View>
        ) : (
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
        )}
      </Animated.View>
    </View>
  );
}
