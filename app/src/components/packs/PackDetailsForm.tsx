/**
 * PackDetailsForm - Pack title, description, logo and visibility form
 */
import React from "react";
import { View, Pressable, Image } from "react-native";
import { Text, Input, Switch, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { PACK_LIMITS } from "@/constants";
import type { PackFormData, PackFormErrors } from "./types";

interface PackDetailsFormProps {
  formData: PackFormData;
  errors: PackFormErrors;
  onPickLogo: () => void;
  onRemoveLogo: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  onTogglePublic: () => void;
}

/**
 * Form section for pack metadata (logo, title, description, visibility)
 */
export function PackDetailsForm({
  formData,
  errors,
  onPickLogo,
  onRemoveLogo,
  onUpdateTitle,
  onUpdateDescription,
  onTogglePublic,
}: PackDetailsFormProps) {
  return (
    <View className="p-4 rounded-xl mb-4" style={{ backgroundColor: colors.white }}>
      <Text variant="body" className="font-semibold mb-4">
        Pack Details
      </Text>

      {/* Logo Picker */}
      <View className="items-center mb-4">
        <Pressable
          onPress={onPickLogo}
          className="w-20 h-20 rounded-xl items-center justify-center overflow-hidden active:opacity-70"
          style={{
            backgroundColor: formData.logoUri
              ? colors.white
              : withOpacity(colors.primary[500], 0.1),
            borderWidth: 1,
            borderStyle: formData.logoUri ? "solid" : "dashed",
            borderColor: formData.logoUri
              ? colors.border
              : withOpacity(colors.primary[500], 0.3),
          }}
        >
          {formData.logoUri ? (
            <>
              <Image
                source={{ uri: formData.logoUri }}
                style={{ width: 80, height: 80 }}
                resizeMode="cover"
              />
              <Pressable
                onPress={onRemoveLogo}
                className="absolute top-1 right-1 w-5 h-5 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.error }}
              >
                <Icon name="close" customSize={10} color={colors.white} />
              </Pressable>
            </>
          ) : (
            <>
              <Icon name="add" size="md" color={colors.primary[500]} />
              <Text variant="caption" style={{ color: colors.primary[500], marginTop: 2 }}>
                Logo
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Title */}
      <View className="mb-4">
        <Input
          label="Title"
          placeholder="Pack title"
          value={formData.title}
          onChangeText={onUpdateTitle}
          error={errors.title}
          maxLength={PACK_LIMITS.TITLE_MAX_LENGTH}
        />
      </View>

      {/* Description */}
      <View className="mb-4">
        <Input
          label="Description (optional)"
          placeholder="Describe your pack"
          value={formData.description}
          onChangeText={onUpdateDescription}
          error={errors.description}
          multiline
          numberOfLines={2}
          maxLength={PACK_LIMITS.DESCRIPTION_MAX_LENGTH}
          style={{ minHeight: 60 }}
        />
      </View>

      {/* Public Toggle */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <Text variant="body-sm" className="font-medium">
            Public Pack
          </Text>
          <Text variant="caption" color="muted">
            Anyone can use this pack to play
          </Text>
        </View>
        <Switch value={formData.isPublic} onValueChange={onTogglePublic} />
      </View>
    </View>
  );
}
