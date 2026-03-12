/**
 * RoomConfigScreen - Configure room settings before hosting
 * Shows selected pack and room configuration options
 */
import React, { useState, useEffect } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable, Image, type ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { Text, Button, Input, Switch, Icon, NumberStepper } from "@/components/ui";
import { PackSelectionModal } from "@/components/packs";
import { colors, withOpacity } from "@/themes";
import { ROOM_LIMITS } from "@/constants";
import { usePacks } from "@/hooks";
import { roomsService } from "@/services/roomsService";
import { useToast, useAuth } from "@/contexts";
import { getErrorMessage } from "@/utils/errorUtils";
import type { ApiError } from "@/services/api";
import type { RootStackParamList } from "../../App";
import type { PackData, RoomConfigData, RoomConfigErrors } from "@/components/packs/types";

const DEFAULT_PACK_LOGO: ImageSourcePropType = require("../../assets/icon.png");

type RoomConfigNavigationProp = StackNavigationProp<RootStackParamList, "RoomConfig">;
type RoomConfigRouteProp = RouteProp<RootStackParamList, "RoomConfig">;

/**
 * Room configuration screen
 */
export function RoomConfigScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RoomConfigNavigationProp>();
  const route = useRoute<RoomConfigRouteProp>();
  const initialPack = route.params.pack;
  const toast = useToast();
  const { user, refreshUser } = useAuth();

  // Selected pack state (can be changed via modal)
  const [selectedPack, setSelectedPack] = useState<PackData>(initialPack);
  const [packModalVisible, setPackModalVisible] = useState(false);

  // Pack selection data
  const packsHook = usePacks();

  // Fetch packs when modal opens
  useEffect(() => {
    if (packModalVisible) {
      packsHook.fetchPacks();
    }
  }, [packModalVisible]);

  // Form state
  const [config, setConfig] = useState<RoomConfigData>({
    packId: initialPack.id,
    title: "",
    description: "",
    maxPlayers: ROOM_LIMITS.DEFAULT_MAX_PLAYERS,
    isPublic: true,
    isPasswordProtected: false,
    password: "",
  });
  const [errors, setErrors] = useState<RoomConfigErrors>({});
  const [isCreating, setIsCreating] = useState(false);

  const updateConfig = <K extends keyof RoomConfigData>(
    key: K,
    value: RoomConfigData[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof RoomConfigErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: RoomConfigErrors = {};

    const trimmedTitle = config.title.trim();
    if (!trimmedTitle) {
      newErrors.title = "Room title is required";
    } else if (trimmedTitle.length < ROOM_LIMITS.TITLE_MIN_LENGTH) {
      newErrors.title = `Title must be at least ${ROOM_LIMITS.TITLE_MIN_LENGTH} characters`;
    } else if (config.title.length > ROOM_LIMITS.TITLE_MAX_LENGTH) {
      newErrors.title = `Title must be ${ROOM_LIMITS.TITLE_MAX_LENGTH} characters or less`;
    }

    if (config.description.length > ROOM_LIMITS.DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `Description must be ${ROOM_LIMITS.DESCRIPTION_MAX_LENGTH} characters or less`;
    }

    if (config.isPasswordProtected && !config.password.trim()) {
      newErrors.password = "Password is required when protection is enabled";
    } else if (config.isPasswordProtected && config.password.trim().length < ROOM_LIMITS.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${ROOM_LIMITS.PASSWORD_MIN_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStart = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      // Create room via API
      const response = await roomsService.createRoom({
        packId: config.packId,
        title: config.title.trim(),
        description: config.description?.trim() || undefined,
        maxPlayers: config.maxPlayers,
        isPublic: config.isPublic,
        password: config.isPasswordProtected ? config.password : undefined,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to create room");
      }

      const createdRoom = response.data;

      // Navigate to room lobby as host with room data
      // Strip password from nav params to avoid leaking to state persistence
      navigation.replace("RoomLobby", {
        pack: selectedPack,
        config: { ...config, password: undefined },
        isHost: true,
        room: createdRoom,
      });
    } catch (error) {
      const apiError = error as ApiError;

      // Map backend field validation errors to form fields
      if (apiError.fieldErrors && Object.keys(apiError.fieldErrors).length > 0) {
        const fieldMap: Record<string, keyof RoomConfigErrors> = {
          title: "title",
          description: "description",
          maxPlayers: "maxPlayers",
          password: "password",
        };

        const newErrors: RoomConfigErrors = {};
        let hasFieldError = false;

        for (const [field, message] of Object.entries(apiError.fieldErrors)) {
          const formField = fieldMap[field];
          if (formField) {
            newErrors[formField] = message;
            hasFieldError = true;
          }
        }

        if (hasFieldError) {
          setErrors(newErrors);
        } else {
          toast.error(getErrorMessage(error));
        }
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleChangePack = () => {
    setPackModalVisible(true);
  };

  const handlePackSelected = (pack: PackData) => {
    setSelectedPack(pack);
    setConfig((prev) => ({ ...prev, packId: pack.id }));
  };

  const handleCreatePack = () => {
    setPackModalVisible(false);
    navigation.navigate("PackCreation", {});
  };

  return (
    <View className="flex-1 bg-surface-secondary">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-primary-500"
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full items-center justify-center -ml-2 active:opacity-70"
          >
            <Icon name="chevron-back" color={colors.white} size="lg" />
          </Pressable>
          <Text
            variant="h3"
            className="flex-1 text-center font-bold"
            style={{ color: colors.white }}
          >
            Room Settings
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Selected Pack Card */}
          <View className="mb-6">
            <Text variant="label" className="mb-2 font-medium">
              Selected Pack
            </Text>
            <View
              className="flex-row items-center p-4 rounded-xl"
              style={{
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {/* Pack Logo */}
              <View
                className="w-14 h-14 rounded-lg items-center justify-center overflow-hidden mr-4"
                style={{ backgroundColor: colors.white }}
              >
                <Image
                  source={selectedPack.logoUri ? { uri: selectedPack.logoUri } : DEFAULT_PACK_LOGO}
                  style={{ width: 56, height: 56 }}
                  resizeMode="cover"
                />
              </View>

              {/* Pack Info */}
              <View className="flex-1">
                <Text variant="body" className="font-semibold">
                  {selectedPack.title}
                </Text>
                <Text variant="caption" color="muted">
                  {selectedPack.questionsCount} questions
                </Text>
              </View>

              {/* Change Button */}
              <Pressable
                onPress={handleChangePack}
                className="px-3 py-2 rounded-lg active:opacity-70"
                style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
              >
                <Text
                  variant="caption"
                  className="font-semibold"
                  style={{ color: colors.primary[500] }}
                >
                  Change
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Room Title */}
          <View className="mb-4">
            <Input
              label="Room Title"
              placeholder="Enter room title"
              value={config.title}
              onChangeText={(text) => updateConfig("title", text)}
              error={errors.title}
              maxLength={ROOM_LIMITS.TITLE_MAX_LENGTH}
            />
            <Text variant="caption" color="muted" className="mt-1 text-right">
              {config.title.length}/{ROOM_LIMITS.TITLE_MAX_LENGTH}
            </Text>
          </View>

          {/* Room Description */}
          <View className="mb-4">
            <Input
              label="Description (optional)"
              placeholder="Describe your room"
              value={config.description}
              onChangeText={(text) => updateConfig("description", text)}
              error={errors.description}
              multiline
              numberOfLines={3}
              maxLength={ROOM_LIMITS.DESCRIPTION_MAX_LENGTH}
              style={{ minHeight: 80, textAlignVertical: "top" }}
            />
            <Text variant="caption" color="muted" className="mt-1 text-right">
              {config.description.length}/{ROOM_LIMITS.DESCRIPTION_MAX_LENGTH}
            </Text>
          </View>

          {/* Max Players */}
          <View className="mb-6">
            <NumberStepper
              label="Max Players"
              value={config.maxPlayers}
              onValueChange={(value) => updateConfig("maxPlayers", value)}
              min={ROOM_LIMITS.MIN_PLAYERS}
              max={ROOM_LIMITS.MAX_PLAYERS}
              helperText={`Between ${ROOM_LIMITS.MIN_PLAYERS} and ${ROOM_LIMITS.MAX_PLAYERS} players`}
            />
          </View>

          {/* Public Room Toggle */}
          <View
            className="flex-row items-center justify-between p-4 rounded-xl mb-4"
            style={{
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-1 mr-4">
              <Text variant="body" className="font-medium">
                Public Room
              </Text>
              <Text variant="caption" color="muted">
                Anyone can find and join this room
              </Text>
            </View>
            <Switch
              value={config.isPublic}
              onValueChange={(value) => updateConfig("isPublic", value)}
            />
          </View>

          {/* Password Protection Toggle */}
          <View
            className="rounded-xl mb-4 overflow-hidden"
            style={{
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-1 mr-4">
                <Text variant="body" className="font-medium">
                  Password Protected
                </Text>
                <Text variant="caption" color="muted">
                  Require password to join
                </Text>
              </View>
              <Switch
                value={config.isPasswordProtected}
                onValueChange={(value) => {
                  updateConfig("isPasswordProtected", value);
                  if (!value) {
                    updateConfig("password", "");
                  }
                }}
              />
            </View>

            {/* Password Input (shown when toggle is on) */}
            {config.isPasswordProtected && (
              <View className="px-4 pb-4">
                <Input
                  placeholder="Enter room password"
                  value={config.password}
                  onChangeText={(text) => updateConfig("password", text)}
                  error={errors.password}
                  secureTextEntry
                  maxLength={ROOM_LIMITS.PASSWORD_MAX_LENGTH}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View
          className="px-4 pt-4 bg-surface border-t"
          style={{
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isCreating}
            disabled={isCreating}
            onPress={handleStart}
          >
            Start Hosting
          </Button>
        </View>
      </KeyboardAvoidingView>

      {/* Pack Selection Modal */}
      <PackSelectionModal
        visible={packModalVisible}
        onClose={() => setPackModalVisible(false)}
        onNext={handlePackSelected}
        onCreatePack={handleCreatePack}
        suggestedPacks={packsHook.suggestedPacks}
        ownedPacks={packsHook.ownedPacks}
        popularPacks={packsHook.popularPacks}
        freeStorePacks={packsHook.freeStorePacks}
        paidStorePacks={packsHook.paidStorePacks}
        isLoading={packsHook.isLoading}
        userCoins={user?.coins ?? 0}
        onPackPurchased={() => { refreshUser(); packsHook.refreshPacks(); }}
        onBuyCoins={() => { toast.info("Buy coins feature coming soon"); }}
      />
    </View>
  );
}
