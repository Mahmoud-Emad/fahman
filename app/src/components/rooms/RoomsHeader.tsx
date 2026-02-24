/**
 * RoomsHeader - Header with smart event carousel and user info
 */
import React, { useState, useEffect, useRef } from "react";
import { View, Pressable, ImageBackground, Animated, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { Text, Icon, Avatar, GlassButton } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { UI_TIMING } from "@/constants";
import type { EventData } from "./types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Map local asset keys to require statements
 */
const LOCAL_IMAGES: Record<string, any> = {
  ramadan: require("../../../assets/rooms-top-bg/ramadan-event.jpg"),
};

/**
 * Get image source from event data
 */
const getImageSource = (imageUrl: string) => {
  if (LOCAL_IMAGES[imageUrl]) {
    return LOCAL_IMAGES[imageUrl];
  }
  return { uri: imageUrl };
};

/**
 * Wave cutout overlay - creates wave shape at bottom of image
 */
function WaveCutout() {
  return (
    <View className="absolute bottom-0 left-0 right-0" style={{ height: 30 }}>
      <Svg
        width={SCREEN_WIDTH}
        height={30}
        viewBox={`0 0 ${SCREEN_WIDTH} 30`}
        preserveAspectRatio="none"
      >
        <Path
          d={`M0,30 L0,15 Q${SCREEN_WIDTH * 0.25},0 ${SCREEN_WIDTH * 0.5},12 Q${SCREEN_WIDTH * 0.75},24 ${SCREEN_WIDTH},8 L${SCREEN_WIDTH},30 Z`}
          fill={colors.white}
        />
      </Svg>
    </View>
  );
}

interface RoomsHeaderProps {
  events: EventData[];
  userAvatar?: any;
  userInitials?: string;
  coins: number;
  onSearchPress?: () => void;
  onAvatarPress?: () => void;
  onBackPress?: () => void;
  onHostPress?: () => void;
  onCoinsPress?: () => void;
}

/**
 * Configurable rooms header with smart event carousel
 */
export function RoomsHeader({
  events,
  userAvatar,
  userInitials = "U",
  coins,
  onSearchPress,
  onAvatarPress,
  onBackPress,
  onHostPress,
  onCoinsPress,
}: RoomsHeaderProps) {
  const insets = useSafeAreaInsets();
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const imageAnim = useRef(new Animated.Value(1)).current;

  const activeEvents = events.filter((e) => e.is_active);
  const currentEvent = activeEvents[currentEventIndex] || activeEvents[0];
  const imageSource = currentEvent
    ? getImageSource(currentEvent.image_url)
    : LOCAL_IMAGES.ramadan;

  const primaryColor = currentEvent?.primary_color || colors.primary[500];

  useEffect(() => {
    if (activeEvents.length <= 1) return;

    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(imageAnim, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentEventIndex((prev) => (prev + 1) % activeEvents.length);
        slideAnim.setValue(50);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(imageAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, UI_TIMING.EVENT_CHANGE_INTERVAL);

    return () => clearInterval(interval);
  }, [activeEvents.length, fadeAnim, slideAnim, imageAnim]);

  return (
    <View>
      <Animated.View style={{ opacity: imageAnim }}>
        <ImageBackground source={imageSource} style={{ minHeight: 200 }} resizeMode="cover">
          <LinearGradient
            colors={[
              withOpacity(colors.black, 0.5),
              withOpacity(colors.black, 0.2),
              withOpacity(primaryColor, 0.5),
            ]}
            locations={[0, 0.5, 1]}
            className="absolute inset-0"
          />

          <View style={{ paddingTop: insets.top }}>
            {/* Top Row */}
            <View className="flex-row items-center justify-between px-4 py-3">
              <GlassButton onPress={onBackPress} style={{ width: 40, height: 40 }}>
                <Icon name="chevron-back" size="md" color={colors.white} />
              </GlassButton>

              <View className="flex-row items-center gap-3">
                <GlassButton
                  onPress={onCoinsPress}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row" }}
                >
                  <View
                    className="w-5 h-5 rounded-full items-center justify-center mr-2"
                    style={{ backgroundColor: colors.gold }}
                  >
                    <Icon name="diamond" customSize={12} color={colors.white} />
                  </View>
                  <Text variant="body" className="font-bold" style={{ color: colors.white }}>
                    {coins.toLocaleString()}
                  </Text>
                </GlassButton>

                <GlassButton onPress={onHostPress} style={{ width: 40, height: 40 }}>
                  <Icon name="add" size="md" color={colors.white} />
                </GlassButton>

                <GlassButton onPress={onSearchPress} style={{ width: 40, height: 40 }}>
                  <Icon name="search" size="md" color={colors.white} />
                </GlassButton>
              </View>
            </View>

            {/* User Info Row */}
            <View className="flex-row items-center px-4 pb-6 pt-2">
              <Pressable onPress={onAvatarPress} className="active:scale-95">
                <View
                  className="rounded-full p-0.5"
                  style={{
                    borderWidth: 2,
                    borderColor: colors.white,
                    shadowColor: colors.black,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Avatar
                    source={userAvatar}
                    initials={userInitials}
                    size="lg"
                    bgColor="bg-primary-400"
                    textColor="text-white"
                  />
                </View>
              </Pressable>

              <View className="ml-4 flex-1">
                <Text variant="caption" style={{ color: withOpacity(colors.white, 0.8) }}>
                  Welcome back
                </Text>
                <Text variant="h3" className="font-bold" style={{ color: colors.white }}>
                  Find a Room
                </Text>
              </View>

              {currentEvent && (
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    transform: [{ translateX: slideAnim }],
                  }}
                >
                  <View
                    className="px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: colors.gold }}
                  >
                    <Text
                      variant="caption"
                      className="font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {currentEvent.tag_title}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Event Indicators */}
            {activeEvents.length > 1 && (
              <View className="flex-row justify-center pb-8 gap-1.5">
                {activeEvents.map((_, index) => (
                  <View
                    key={index}
                    className="rounded-full"
                    style={{
                      width: index === currentEventIndex ? 16 : 6,
                      height: 6,
                      backgroundColor:
                        index === currentEventIndex
                          ? colors.white
                          : withOpacity(colors.white, 0.4),
                    }}
                  />
                ))}
              </View>
            )}
          </View>

          <WaveCutout />
        </ImageBackground>
      </Animated.View>
    </View>
  );
}
