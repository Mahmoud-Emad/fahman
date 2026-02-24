/**
 * BottomNavBar component - Flexible bottom navigation with context-based tabs
 * Supports: Room List, Lobby, and default configurations
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
  isCenter?: boolean;
  isDestructive?: boolean;
}

/**
 * Room List tabs: Home | Chats | Rooms (center) | Notifications | Profile
 */
export const ROOM_LIST_TABS: TabConfig[] = [
  { id: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  { id: "chats", label: "Chats", icon: "chatbubbles-outline", activeIcon: "chatbubbles" },
  { id: "rooms", label: "Rooms", icon: "game-controller-outline", activeIcon: "game-controller", isCenter: true },
  { id: "notifications", label: "Alerts", icon: "notifications-outline", activeIcon: "notifications" },
  { id: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" },
];

/**
 * Lobby tabs: Leave | Chats | Notifications | Profile
 */
export const LOBBY_TABS: TabConfig[] = [
  { id: "leave", label: "Leave", icon: "log-out-outline", activeIcon: "log-out", isDestructive: true },
  { id: "chats", label: "Chats", icon: "chatbubbles-outline", activeIcon: "chatbubbles" },
  { id: "notifications", label: "Alerts", icon: "notifications-outline", activeIcon: "notifications" },
  { id: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" },
];

/**
 * Default tabs (original configuration)
 */
export const DEFAULT_TABS: TabConfig[] = [
  { id: "edit", label: "Create", icon: "create-outline", activeIcon: "create" },
  { id: "friends", label: "Friends", icon: "people-outline", activeIcon: "people" },
  { id: "home", label: "Home", icon: "home-outline", activeIcon: "home", isCenter: true },
  { id: "marketplace", label: "Store", icon: "storefront-outline", activeIcon: "storefront" },
  { id: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" },
];

/**
 * Profile tabs: Home | Chats | Profile (center) | Notifications | Friends
 */
export const PROFILE_TABS: TabConfig[] = [
  { id: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  { id: "chats", label: "Chats", icon: "chatbubbles-outline", activeIcon: "chatbubbles" },
  { id: "profile", label: "Profile", icon: "person-outline", activeIcon: "person", isCenter: true },
  { id: "notifications", label: "Alerts", icon: "notifications-outline", activeIcon: "notifications" },
  { id: "friends", label: "Friends", icon: "people-outline", activeIcon: "people" },
];

/**
 * Props for the BottomNavBar component
 */
export interface BottomNavBarProps {
  /** Tab configuration to use */
  tabs?: TabConfig[];
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
  tabs = DEFAULT_TABS,
  activeTab,
  onTabPress,
  badges = {},
}: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-surface border-t border-border"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isCenter = tab.isCenter;
          const isDestructive = tab.isDestructive;
          const badgeCount = badges[tab.id] || 0;

          // Determine tab color
          let tabColor: string = isActive ? colors.primary[500] : colors.neutral[400];
          if (isDestructive) {
            tabColor = colors.error;
          }

          // Center tab styling
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
                    backgroundColor: isActive ? colors.primary[500] : colors.white,
                    borderWidth: 3,
                    borderColor: isActive ? colors.primary[600] : colors.neutral[200],
                    shadowColor: colors.black,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 5,
                  }}
                >
                  <Icon
                    name={isActive ? tab.activeIcon : tab.icon}
                    color={isActive ? colors.white : colors.neutral[500]}
                    size="lg"
                  />
                </View>
                <Text
                  variant="caption"
                  className="mt-1"
                  style={{
                    color: isActive ? colors.primary[500] : colors.neutral[400],
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

/**
 * Legacy type exports for backwards compatibility
 */
export type TabId = "home" | "edit" | "marketplace" | "friends" | "profile";
