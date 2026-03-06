/**
 * BottomNavBar component - Unified bottom navigation
 * 4 fixed tabs + 1 configurable center button that changes per screen
 */
import React from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Icon, type IconName } from "@/components/ui/Icon";
import { colors } from "@/themes";

/**
 * Tab configuration
 */
interface TabConfig {
  id: string;
  label: string;
  icon: IconName;
  activeIcon: IconName;
}

/**
 * Configurable center tab — changes per screen
 */
export interface CenterTabConfig {
  id: string;
  label: string;
  icon: IconName;
  activeIcon: IconName;
}

/**
 * The 4 fixed tabs (same on every screen)
 */
export const BASE_TABS: TabConfig[] = [
  { id: "friends", label: "Friends", icon: "people-outline", activeIcon: "people" },
  { id: "chats", label: "Chats", icon: "chatbubbles-outline", activeIcon: "chatbubbles" },
  // Center slot is inserted dynamically
  { id: "notifications", label: "Alerts", icon: "notifications-outline", activeIcon: "notifications" },
  { id: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" },
];

/**
 * Props for the BottomNavBar component
 */
export interface BottomNavBarProps {
  /** Configurable center button */
  centerTab: CenterTabConfig;
  /** Currently active tab */
  activeTab: string;
  /** Callback when a tab is pressed */
  onTabPress: (tabId: string) => void;
  /** Optional notification badge counts */
  badges?: Record<string, number>;
}

/**
 * BottomNavBar component
 */
export function BottomNavBar({
  centerTab,
  activeTab,
  onTabPress,
  badges = {},
}: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  // Build the full tab list: [friends, chats, CENTER, alerts, profile]
  const allTabs = [
    BASE_TABS[0],
    BASE_TABS[1],
    { ...centerTab, isCenter: true as const },
    BASE_TABS[2],
    BASE_TABS[3],
  ];

  return (
    <View
      className="bg-surface border-t border-border"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-center justify-around py-2">
        {allTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isCenter = "isCenter" in tab && tab.isCenter;
          const badgeCount = badges[tab.id] || 0;

          const tabColor: string = isActive ? colors.primary[500] : colors.neutral[400];

          // Center tab styling — always prominent primary style
          if (isCenter) {
            return (
              <Pressable
                key={tab.id}
                onPress={() => onTabPress(tab.id)}
                delayPressIn={0}
                className="items-center justify-center"
                style={{ marginTop: -20 }}
              >
                <View
                  className="items-center justify-center rounded-full"
                  style={{
                    width: 60,
                    height: 60,
                    backgroundColor: colors.primary[500],
                    borderWidth: 3,
                    borderColor: colors.primary[600],
                    shadowColor: colors.black,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 5,
                  }}
                >
                  <Icon
                    name={tab.activeIcon}
                    color={colors.white}
                    size="lg"
                  />
                </View>
                <Text
                  variant="caption"
                  className="mt-1"
                  style={{
                    color: colors.primary[500],
                    fontSize: 10,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabPress(tab.id)}
              delayPressIn={0}
              className="items-center justify-center px-3 py-2"
            >
              <View className="relative">
                <Icon
                  name={isActive ? tab.activeIcon : tab.icon}
                  color={tabColor}
                  size="md"
                />
                {badgeCount > 0 && (
                  <View
                    className="absolute -top-1.5 -right-2 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: colors.error,
                      minWidth: 18,
                      height: 18,
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.white,
                        fontSize: 10,
                        fontWeight: "700",
                        textAlign: "center",
                        lineHeight: 12,
                      }}
                    >
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                variant="caption"
                className="mt-1"
                style={{ color: tabColor, fontSize: 10 }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
