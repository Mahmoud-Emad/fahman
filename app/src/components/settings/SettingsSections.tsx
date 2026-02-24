/**
 * SettingsSections - Expandable panel sections for SettingsScreen
 * Sounds, Privacy, and Language preferences
 */
import React from "react";
import { View, Pressable, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../../App";
import { Text, Icon, Divider, ExpandablePanel } from "@/components/ui";
import { SettingToggle, ActionRow } from "@/components/settings";
import { colors, withOpacity } from "@/themes";
import type { UserSettings } from "@/services/settingsService";

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface PreferencesSectionProps {
  settings: UserSettings;
  updateSetting: (key: keyof Omit<UserSettings, "id" | "userId" | "createdAt" | "updatedAt">, value: any) => void;
}

/**
 * Sound preferences expandable panel
 */
export function SoundsSection({ settings, updateSetting }: PreferencesSectionProps) {
  return (
    <ExpandablePanel
      title="Sounds"
      icon="volume-high"
      iconColor={colors.primary[500]}
      className="mb-3"
    >
      <SettingToggle
        title="Game Sounds"
        description="Sound effects during gameplay"
        value={settings.gameSound}
        onValueChange={(value) => updateSetting("gameSound", value)}
      />
      <Divider className="ml-6" />
      <SettingToggle
        title="Attention Sounds"
        description="Sounds when other players try to get your attention"
        value={settings.userSound}
        onValueChange={(value) => updateSetting("userSound", value)}
      />
      <Divider className="ml-6" />
      <SettingToggle
        title="Notification Sounds"
        description="Sounds for push notifications"
        value={settings.notificationSound}
        onValueChange={(value) => updateSetting("notificationSound", value)}
      />
      <Divider className="ml-6" />
      <SettingToggle
        title="In-App Sounds"
        description="Message alerts while the app is open"
        value={settings.appSound}
        onValueChange={(value) => updateSetting("appSound", value)}
      />
    </ExpandablePanel>
  );
}

interface PrivacySectionProps extends PreferencesSectionProps {
  isLoggingOut: boolean;
  isDeleting: boolean;
  onDeleteAccount: () => void;
}

/**
 * Privacy preferences expandable panel (includes account-level actions)
 */
export function PrivacySection({
  settings,
  updateSetting,
  isLoggingOut,
  isDeleting,
  onDeleteAccount,
}: PrivacySectionProps) {
  const navigation = useNavigation<NavigationProp>();

  return (
    <ExpandablePanel
      title="Privacy"
      icon="shield"
      iconColor={colors.primary[500]}
      className="mb-3"
    >
      <SettingToggle
        title="Online Status"
        description="Show when you're online"
        value={settings.onlineStatus}
        onValueChange={(value) => updateSetting("onlineStatus", value)}
      />
      <Divider className="ml-6" />
      <SettingToggle
        title="Room Visibility"
        description="Let friends see when you're playing"
        value={settings.roomVisibility}
        onValueChange={(value) => updateSetting("roomVisibility", value)}
      />
      <Divider className="ml-6" />
      <SettingToggle
        title="Read Receipts"
        description="Show when you've read messages. Disabling also hides when others read yours."
        value={settings.readReceipts}
        onValueChange={(value) => updateSetting("readReceipts", value)}
      />
      <Divider className="ml-6" />
      <ActionRow
        icon={<Icon name="ban" color={colors.error} size="md" />}
        title="Blocked Users"
        subtitle="Manage blocked users"
        onPress={() => navigation.navigate("BlockedUsers")}
      />
      <Divider className="ml-6" />
      <ActionRow
        icon={isDeleting ? undefined : <Icon name="trash" color={colors.primary[500]} size="md" />}
        title="Delete Account"
        subtitle={isDeleting ? "Deleting account..." : "Permanently delete your account and all data"}
        onPress={onDeleteAccount}
        disabled={isLoggingOut || isDeleting}
        rightElement={
          isDeleting ? (
            <ActivityIndicator size="small" color={colors.primary[500]} />
          ) : undefined
        }
      />
    </ExpandablePanel>
  );
}

/**
 * Language preferences expandable panel
 */
export function LanguageSection({ settings, updateSetting }: PreferencesSectionProps) {
  return (
    <ExpandablePanel
      title="Language"
      icon="globe"
      iconColor={colors.primary[500]}
      className="mb-3"
    >
      <View className="px-6 py-4">
        <Text variant="body" color="secondary" className="mb-3">
          Select your preferred language
        </Text>
        <View
          className="flex-row rounded-xl p-1"
          style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
        >
          <Pressable
            onPress={() => updateSetting("language", "en")}
            className="flex-1 py-3 rounded-lg items-center"
            style={{
              backgroundColor:
                settings.language === "en" ? colors.primary[500] : "transparent",
            }}
          >
            <Text
              variant="body"
              className="font-semibold"
              style={{
                color: settings.language === "en" ? colors.white : colors.text.primary,
              }}
            >
              English
            </Text>
          </Pressable>
          <Pressable
            onPress={() => updateSetting("language", "ar")}
            className="flex-1 py-3 rounded-lg items-center"
            style={{
              backgroundColor:
                settings.language === "ar" ? colors.primary[500] : "transparent",
            }}
          >
            <Text
              variant="body"
              className="font-semibold"
              style={{
                color: settings.language === "ar" ? colors.white : colors.text.primary,
              }}
            >
              العربية
            </Text>
          </Pressable>
        </View>
      </View>
    </ExpandablePanel>
  );
}
