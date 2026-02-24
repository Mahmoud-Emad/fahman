/**
 * SettingsScreen - User settings and preferences
 * Includes: Sound settings, Privacy, Language, Remove Ads, Share, Support
 */
import React, { useState, useEffect } from "react";
import { View, ScrollView, Pressable, Share, Linking, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../App";
import { Text, Icon, Skeleton } from "@/components/ui";
import { ActionRow } from "@/components/settings";
import { SoundsSection, PrivacySection, LanguageSection } from "@/components/settings/SettingsSections";
import { colors } from "@/themes";
import { settingsService, type UserSettings } from "@/services/settingsService";
import { useAuth, useToast } from "@/contexts";
import { SOCKET_URL } from "@/config/env";

type NavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * SettingsScreen component
 */
export function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();
  const toast = useToast();

  // Settings state
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("1.0.0");

  // Action loading states
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load settings and version on mount
  useEffect(() => {
    loadSettings();
    loadVersion();
  }, []);

  const loadSettings = async (isRetry = false) => {
    if (isRetry) {
      setIsRetrying(true);
    } else {
      setIsLoading(true);
    }
    setLoadError(false);

    try {
      const response = await settingsService.getSettings();
      if (response.success && response.data) {
        setSettings(response.data);
        setLoadError(false);
      } else {
        setLoadError(true);
      }
    } catch (error) {
      setLoadError(true);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const loadVersion = async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/health`);
      const data = await response.json();
      if (data.version) {
        setAppVersion(data.version);
      }
    } catch (error) {
      // Version fetch failure is non-critical, fail silently
    }
  };

  const updateSetting = async (key: keyof Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, value: any) => {
    if (!settings) return;

    // Store previous value for potential revert
    const previousValue = settings[key];

    // Optimistic update
    setSettings(prev => prev ? { ...prev, [key]: value } : null);

    // Save to backend
    try {
      const response = await settingsService.updateSettings({ [key]: value });
      if (response.success && response.data) {
        // Sync with server response
        setSettings(response.data);
      } else {
        toast.error(response.message || "Failed to update setting");
        setSettings(prev => prev ? { ...prev, [key]: previousValue } : null);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update setting");
      setSettings(prev => prev ? { ...prev, [key]: previousValue } : null);
    }
  };

  const handleRemoveAds = () => {
    toast.info("Remove Ads feature coming soon!");
  };

  const handleShare = async () => {
    try {
      // App store links
      const appStoreLink = "https://apps.apple.com/app/fahman";
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.fahman.app";

      // Generate referral deep link
      const referralLink = user?.id
        ? `fahman://invite?referrer=${user.id}`
        : "fahman://";

      const shareMessage = `Join me on Fahman! The ultimate party game for friends. 🎮\n\n🔗 Tap to join: ${referralLink}\n\nDownload:\n📱 iOS: ${appStoreLink}\n🤖 Android: ${playStoreLink}`;

      await Share.share({
        message: shareMessage,
        title: "Join me on Fahman!",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to share app");
    }
  };

  const handleSupport = () => {
    Linking.openURL("mailto:support@fahman.app?subject=Fahman App Support");
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              // Navigation happens automatically via AuthStack swap
              // when isAuthenticated changes to false
            } catch (error) {
              setIsLoggingOut(false);
              Alert.alert("Error", "Failed to log out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "DELETE",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const response = await settingsService.deleteAccount();
              if (response.success) {
                // Logout will clear storage and update auth state
                await logout();
                // Navigation happens automatically via AuthStack swap
              } else {
                setIsDeleting(false);
                Alert.alert("Error", response.message || "Failed to delete account. Please try again.");
              }
            } catch (error) {
              setIsDeleting(false);
              Alert.alert("Error", "Failed to delete account. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-secondary">
        {/* Header */}
        <View
          className="flex-row items-center px-4 py-3"
          style={{
            paddingTop: insets.top + 8,
            backgroundColor: colors.primary[500],
          }}
        >
          <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Icon name="chevron-back" color={colors.white} size="lg" />
          </Pressable>
          <Text
            variant="h3"
            className="flex-1 text-center mr-8"
            style={{ color: colors.white }}
          >
            Settings
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 20, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Skeleton for expandable panels */}
          <View className="mb-3 bg-white">
            <View className="px-4 py-4">
              <Skeleton.Box width={120} height={20} />
            </View>
          </View>

          <View className="mb-3 bg-white">
            <View className="px-4 py-4">
              <Skeleton.Box width={100} height={20} />
            </View>
          </View>

          <View className="mb-3 bg-white">
            <View className="px-4 py-4">
              <Skeleton.Box width={110} height={20} />
            </View>
          </View>

          {/* Skeleton for action rows */}
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="bg-white px-4 py-4 mb-px">
              <View className="flex-row items-center">
                <Skeleton.Circle size={40} className="mr-3" />
                <View className="flex-1">
                  <Skeleton.Box width="60%" height={16} className="mb-2" />
                  <Skeleton.Box width="80%" height={12} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (loadError || !settings) {
    return (
      <View className="flex-1 bg-surface-secondary">
        {/* Header */}
        <View
          className="flex-row items-center px-4 py-3"
          style={{
            paddingTop: insets.top + 8,
            backgroundColor: colors.primary[500],
          }}
        >
          <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Icon name="chevron-back" color={colors.white} size="lg" />
          </Pressable>
          <Text
            variant="h3"
            className="flex-1 text-center mr-8"
            style={{ color: colors.white }}
          >
            Settings
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-4">
          <Icon name="cloud-offline-outline" size="xl" color={colors.error} />
          <Text variant="h3" className="mt-4 mb-2 text-center">
            Unable to Load Settings
          </Text>
          <Text variant="body" color="secondary" className="mb-6 text-center">
            Please check your connection and try again
          </Text>
          <Pressable
            onPress={() => loadSettings(true)}
            disabled={isRetrying}
            className="px-6 py-3 rounded-xl flex-row items-center"
            style={{ backgroundColor: colors.primary[500] }}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon name="refresh" color={colors.white} size="md" />
            )}
            <Text variant="body" className="font-semibold ml-2" style={{ color: colors.white }}>
              {isRetrying ? "Retrying..." : "Retry"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-secondary">
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3"
        style={{
          paddingTop: insets.top + 8,
          backgroundColor: colors.primary[500],
        }}
      >
        <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Icon name="chevron-back" color={colors.white} size="lg" />
        </Pressable>
        <Text
          variant="h3"
          className="flex-1 text-center mr-8"
          style={{ color: colors.white }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <SoundsSection settings={settings} updateSetting={updateSetting} />

        <PrivacySection
          settings={settings}
          updateSetting={updateSetting}
          isLoggingOut={isLoggingOut}
          isDeleting={isDeleting}
          onDeleteAccount={handleDeleteAccount}
        />

        <LanguageSection settings={settings} updateSetting={updateSetting} />

        {/* Premium - Remove Ads */}
        <ActionRow
          icon={<Icon name="diamond" color={colors.primary[500]} size="md" />}
          title="Remove Ads"
          subtitle="29.99 EGP / month"
          onPress={handleRemoveAds}
          rightElement={
            <View
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: colors.primary[500] }}
            >
              <Text variant="body-sm" className="font-semibold" style={{ color: colors.white }}>
                Subscribe
              </Text>
            </View>
          }
        />

        <View className="h-3" />

        {/* Share */}
        <ActionRow
          icon={<Icon name="share-social" color={colors.primary[500]} size="md" />}
          title="Share Fahman"
          subtitle="Invite your friends to play"
          onPress={handleShare}
        />

        <Divider />

        {/* Support */}
        <ActionRow
          icon={<Icon name="mail" color={colors.primary[500]} size="md" />}
          title="Support"
          subtitle="Report an issue or get help"
          onPress={handleSupport}
        />

        {/* Logout Button */}
        <View className="h-3" />
        <ActionRow
          icon={isLoggingOut ? undefined : <Icon name="log-out-outline" color={colors.primary[500]} size="md" />}
          title="Log Out"
          subtitle={isLoggingOut ? "Logging out..." : "Sign out of your account"}
          onPress={handleLogout}
          disabled={isLoggingOut || isDeleting}
          rightElement={
            isLoggingOut ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : undefined
          }
        />

        {/* Footer */}
        <View className="items-center py-8 px-4">
          <Text variant="caption" color="muted">
            Fahman v{appVersion}
          </Text>
          <Text variant="caption" color="muted" className="mt-1">
            © 2024 Fahman. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
