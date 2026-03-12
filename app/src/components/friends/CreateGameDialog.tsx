/**
 * CreateGameDialog - Dialog for creating a private game room to play with a friend
 * Shows pack selection, room title, and max players configuration
 */
import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { Modal, Text, Button, Input, Icon, Avatar } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { usePacks } from "@/hooks";
import { roomsService } from "@/services/roomsService";
import { messageService } from "@/services/messageService";
import { useToast } from "@/contexts";
import { getErrorMessage } from "@/utils/errorUtils";
import type { PackData } from "@/components/packs/types";
import type { Friend } from "./types";
import type { RootStackParamList } from "../../../App";

interface CreateGameDialogProps {
  visible: boolean;
  friend: Friend | null;
  onClose: () => void;
}

/**
 * Pack card for selection within the dialog
 */
function PackOption({
  pack,
  isSelected,
  onPress,
}: {
  pack: PackData;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      delayPressIn={0}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: isSelected ? colors.primary[500] : colors.neutral[200],
        backgroundColor: isSelected ? withOpacity(colors.primary[500], 0.05) : "transparent",
        marginBottom: 8,
      }}
    >
      {pack.logoUri ? (
        <Avatar uri={pack.logoUri} initials={pack.logoInitials} size="sm" />
      ) : (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: colors.primary[500],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text variant="body-sm" className="font-bold" style={{ color: colors.white }}>
            {pack.logoInitials || pack.title.substring(0, 2).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text variant="body" className="font-medium" numberOfLines={1}>
          {pack.title}
        </Text>
        <Text variant="caption" style={{ color: colors.neutral[500] }}>
          {pack.questionsCount} questions
        </Text>
      </View>
      {isSelected && (
        <Icon name="checkmark-circle" size="md" color={colors.primary[500]} />
      )}
    </Pressable>
  );
}

/**
 * Max players selector row
 */
function MaxPlayersSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const options = [2, 4, 6, 8];

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {options.map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          delayPressIn={0}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor: value === n ? colors.primary[500] : colors.neutral[200],
            backgroundColor: value === n ? colors.primary[500] : "transparent",
            alignItems: "center",
          }}
        >
          <Text
            variant="body-sm"
            className="font-semibold"
            style={{ color: value === n ? colors.white : colors.text.primary }}
          >
            {n}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function CreateGameDialog({ visible, friend, onClose }: CreateGameDialogProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const toast = useToast();
  const packsHook = usePacks();

  const [selectedPack, setSelectedPack] = useState<PackData | null>(null);
  const [roomTitle, setRoomTitle] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isCreating, setIsCreating] = useState(false);

  // Load packs when dialog opens
  useEffect(() => {
    if (visible) {
      packsHook.fetchPacks();
      setSelectedPack(null);
      setRoomTitle("");
      setMaxPlayers(8);
    }
  }, [visible]);

  // Auto-set room title when pack is selected
  useEffect(() => {
    if (selectedPack && !roomTitle) {
      setRoomTitle(`${selectedPack.title} Game`);
    }
  }, [selectedPack]);

  const allPacks = [
    ...packsHook.ownedPacks,
    ...packsHook.suggestedPacks,
    ...packsHook.popularPacks,
  ];

  // Deduplicate packs by id
  const uniquePacks = allPacks.filter(
    (pack, index, arr) => arr.findIndex((p) => p.id === pack.id) === index
  );

  const handleCreate = useCallback(async () => {
    if (!selectedPack || !friend) return;

    const title = roomTitle.trim() || `${selectedPack.title} Game`;

    setIsCreating(true);
    try {
      // Create private room
      const roomResponse = await roomsService.createRoom({
        packId: selectedPack.id,
        title,
        maxPlayers,
        isPublic: false,
      });

      if (!roomResponse.success || !roomResponse.data) {
        toast.error(roomResponse.message || "Failed to create room");
        return;
      }

      const room = roomResponse.data;

      // Send room invite DM to friend
      try {
        await messageService.sendRoomInvite({
          recipientIds: [friend.id],
          roomCode: room.code,
          roomTitle: title,
        });
      } catch {
        // Don't fail if invite send fails — room was still created
      }

      toast.success(`Invite sent to ${friend.name}!`);
      onClose();

      // Navigate to room lobby
      setTimeout(() => {
        navigation.navigate("RoomLobby", {
          pack: selectedPack,
          config: {
            packId: selectedPack.id,
            title,
            description: "",
            maxPlayers,
            isPublic: false,
            isPasswordProtected: false,
            password: "",
          },
          isHost: true,
          room,
        });
      }, 300);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  }, [selectedPack, friend, roomTitle, maxPlayers, navigation, toast, onClose]);

  if (!friend) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`Play with ${friend.name}`}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Pack Selection */}
        <Text variant="body" className="font-semibold mb-2">
          Select a Pack
        </Text>

        {packsHook.isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
          </View>
        ) : uniquePacks.length === 0 ? (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <Text variant="body-sm" style={{ color: colors.neutral[500] }}>
              No packs available. Create a pack first!
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            {uniquePacks.map((pack) => (
              <PackOption
                key={pack.id}
                pack={pack}
                isSelected={selectedPack?.id === pack.id}
                onPress={() => setSelectedPack(pack)}
              />
            ))}
          </View>
        )}

        {/* Room Title */}
        <Text variant="body" className="font-semibold mb-2">
          Room Title
        </Text>
        <Input
          variant="filled"
          placeholder="Enter room title"
          value={roomTitle}
          onChangeText={setRoomTitle}
        />

        {/* Max Players */}
        <Text variant="body" className="font-semibold mb-2 mt-4">
          Max Players
        </Text>
        <MaxPlayersSelector value={maxPlayers} onChange={setMaxPlayers} />
      </ScrollView>

      {/* Create Button */}
      <View style={{ marginTop: 16 }}>
        <Button
          variant="primary"
          fullWidth
          loading={isCreating}
          disabled={!selectedPack || isCreating}
          onPress={handleCreate}
        >
          Create & Invite
        </Button>
      </View>
    </Modal>
  );
}
