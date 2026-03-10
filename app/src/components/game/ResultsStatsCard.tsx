/**
 * ResultsStatsCard - Winner card and confetti celebration for GameResultsScreen
 */
import React, { useEffect, useRef } from "react";
import { View, Animated, Dimensions } from "react-native";
import { Text, Icon, Avatar } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { getInitials } from "./ResultsLeaderboard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/** Decorative confetti colors — celebratory palette distinct from the primary theme */
const CONFETTI_COLORS = [
  colors.primary[500],
  colors.medals.gold.bg,
  colors.confetti.coral,
  colors.confetti.teal,
  colors.confetti.purple,
  colors.confetti.blue,
] as const;

export interface Winner {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  score: number;
}

/**
 * Single confetti particle
 */
function ConfettiParticle({ delay, startX }: { delay: number; startX: number }) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = 8 + Math.random() * 8;

  useEffect(() => {
    const duration = 2500 + Math.random() * 1000;
    const drift = (Math.random() - 0.5) * 100;

    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, { toValue: 600, duration, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: drift, duration, useNativeDriver: true }),
          Animated.timing(rotate, {
            toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: duration * 0.7, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: duration * 0.3, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(translateY, { toValue: -50, duration: 0, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [delay, translateY, translateX, rotate, opacity]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        width: size,
        height: size * 1.5,
        backgroundColor: color,
        borderRadius: 2,
        opacity,
        transform: [
          { translateY },
          { translateX },
          {
            rotate: rotate.interpolate({
              inputRange: [0, 360],
              outputRange: ["0deg", "360deg"],
            }),
          },
        ],
      }}
    />
  );
}

/**
 * Confetti overlay for winner celebration
 */
export function Confetti() {
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    delay: Math.random() * 2000,
    startX: Math.random() * SCREEN_WIDTH,
  }));

  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}
      pointerEvents="none"
    >
      {particles.map((p) => (
        <ConfettiParticle key={p.id} delay={p.delay} startX={p.startX} />
      ))}
    </View>
  );
}

/**
 * Winner card with trophy and animated scale
 */
export function WinnerCard({
  winner,
  animatedScale,
}: {
  winner: Winner;
  animatedScale: Animated.Value;
}) {
  const initials = getInitials(winner.displayName || winner.username);

  return (
    <Animated.View className="items-center" style={{ transform: [{ scale: animatedScale }] }}>
      <View className="mb-2">
        <Icon name="trophy" customSize={48} color={colors.medals.gold.bg} />
      </View>

      <View
        className="rounded-full p-1"
        style={{
          backgroundColor: withOpacity(colors.medals.gold.bg, 0.2),
          borderWidth: 3,
          borderColor: colors.medals.gold.bg,
        }}
      >
        <Avatar
          uri={winner.avatar || undefined}
          initials={initials}
          size="xl"
          style={{ width: 100, height: 100 }}
        />
      </View>

      <View className="mt-3 px-4 py-1.5 rounded-full" style={{ backgroundColor: colors.medals.gold.bg }}>
        <Text variant="body-sm" className="font-bold" style={{ color: colors.black }}>
          WINNER
        </Text>
      </View>

      <Text variant="h2" className="font-bold mt-3" center>
        {winner.displayName || winner.username}
      </Text>

      <View className="flex-row items-center mt-1">
        <Icon name="trophy" customSize={20} color={colors.primary[500]} />
        <Text variant="h3" className="font-bold ml-1" style={{ color: colors.primary[500] }}>
          {winner.score.toLocaleString()} pts
        </Text>
      </View>
    </Animated.View>
  );
}
