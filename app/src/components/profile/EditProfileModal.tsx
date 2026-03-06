/**
 * EditProfileModal - Modal for editing user profile
 * Integrated with backend API
 */
import React, { useState, useEffect } from "react";
import { View, Pressable, TextInput, ActivityIndicator, Alert } from "react-native";
import { Text, Icon, Avatar, Modal, Button } from "@/components/ui";
import { colors } from "@/themes";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: {
    displayName: string;
    bio: string;
    avatar: string | null;
  };
  onSave: (data: { displayName: string; bio: string }) => Promise<void>;
}

export function EditProfileModal({ visible, onClose, user, onSave }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setDisplayName(user.displayName);
      setBio(user.bio);
    }
  }, [visible, user]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name is required");
      return;
    }

    if (displayName.trim().length < 2) {
      Alert.alert("Error", "Display name must be at least 2 characters");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        displayName: displayName.trim(),
        bio: bio.trim(),
      });
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const isValid = displayName.trim().length >= 2;
  const hasChanges = displayName !== user.displayName || bio !== user.bio;

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Edit Profile">
      <View className="items-center mb-6">
        <View className="relative">
          <Avatar
            initials={getInitials(displayName || "?")}
            uri={user.avatar || undefined}
            size="xl"
          />
          <Pressable
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary[500] }}
          >
            <Icon name="create" size="sm" color={colors.white} />
          </Pressable>
        </View>
        <Text variant="caption" style={{ color: colors.neutral[500], marginTop: 8 }}>
          Tap to change photo
        </Text>
      </View>

      <View className="mb-4">
        <Text variant="body-sm" className="font-medium mb-2" style={{ color: colors.neutral[700] }}>
          Display Name
        </Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Enter your name"
          placeholderTextColor={colors.neutral[400]}
          maxLength={100}
          editable={!saving}
          className="px-4 py-3 rounded-xl"
          style={{ backgroundColor: colors.neutral[100], color: colors.text.primary, fontSize: 16 }}
        />
        <Text variant="caption" style={{ color: colors.neutral[400], marginTop: 4 }}>
          This is how other players will see you
        </Text>
      </View>

      <View className="mb-6">
        <Text variant="body-sm" className="font-medium mb-2" style={{ color: colors.neutral[700] }}>
          Bio
        </Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself..."
          placeholderTextColor={colors.neutral[400]}
          maxLength={500}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!saving}
          className="px-4 py-3 rounded-xl"
          style={{ backgroundColor: colors.neutral[100], color: colors.text.primary, fontSize: 16, minHeight: 80 }}
        />
        <Text variant="caption" style={{ color: colors.neutral[400], marginTop: 4, textAlign: "right" }}>
          {bio.length}/500
        </Text>
      </View>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onPress={handleSave}
        disabled={!isValid || !hasChanges || saving}
      >
        {saving ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color={colors.white} />
            <Text style={{ color: colors.white }}>Saving...</Text>
          </View>
        ) : (
          "Save Changes"
        )}
      </Button>
    </Modal>
  );
}
