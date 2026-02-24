/**
 * Divider components for authentication screens
 */
import React from "react";
import { View, Dimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui";
import { colors } from "@/themes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Curved divider between orange and white sections
 */
export function CurvedDivider() {
  return (
    <View style={{ height: 80, marginTop: -1 }}>
      <Svg
        width={SCREEN_WIDTH}
        height={80}
        viewBox={`0 0 ${SCREEN_WIDTH} 80`}
        preserveAspectRatio="none"
      >
        <Path
          d={`M0,0 L${SCREEN_WIDTH},0 L${SCREEN_WIDTH},20 Q${SCREEN_WIDTH / 2},80 0,20 Z`}
          fill={colors.primary[500]}
        />
      </Svg>
    </View>
  );
}

/**
 * "Or continue with" divider
 */
export function OrDivider() {
  return (
    <View className="flex-row items-center my-8">
      <View className="flex-1 h-px" style={{ backgroundColor: colors.neutral[200] }} />
      <View
        className="px-4 py-2 rounded-full mx-3"
        style={{ backgroundColor: colors.neutral[100] }}
      >
        <Text variant="caption" color="muted" className="font-medium">
          or continue with
        </Text>
      </View>
      <View className="flex-1 h-px" style={{ backgroundColor: colors.neutral[200] }} />
    </View>
  );
}
