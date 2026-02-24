/**
 * UserRoomCard - Card displaying user's room with stats and delete option
 */
import React from "react";
import { View, Pressable, Image } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

// Default pack logo fallback
const DEFAULT_PACK_LOGO = require("../../../assets/icon.png");

export interface UserRoomData {
  id: string;
  title: string;
  code: string;
  description: string | null;
  isPublic: boolean;
  maxPlayers: number;
  currentPlayers: number;
  status: "WAITING" | "PLAYING" | "FINISHED";
  selectedPack?: {
    id: string;
    title: string;
    imageUrl?: string | null;
  } | null;
}

interface UserRoomCardProps {
  room: UserRoomData;
  onPress: (room: UserRoomData) => void;
  onDelete?: (room: UserRoomData) => void;
}

/**
 * Get status badge info
 */
function getStatusInfo(status: UserRoomData["status"]) {
  switch (status) {
    case "WAITING":
      return { label: "Active", color: colors.success, bgColor: withOpacity(colors.success, 0.15) };
    case "PLAYING":
      return { label: "Playing", color: colors.warning, bgColor: withOpacity(colors.warning, 0.15) };
    case "FINISHED":
      return { label: "Finished", color: colors.neutral[500], bgColor: withOpacity(colors.neutral[500], 0.15) };
  }
}

export function UserRoomCard({ room, onPress, onDelete }: UserRoomCardProps) {
  const statusInfo = getStatusInfo(room.status);
  const visibilityColor = room.isPublic ? colors.success : colors.neutral[500];
  const packImageUrl = room.selectedPack?.imageUrl;

  return (
    <Pressable
      onPress={() => onPress(room)}
      style={{
        backgroundColor: colors.white,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        overflow: "hidden",
      }}
    >
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: "row" }}>
          {/* Pack Logo or Room Icon */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: colors.white,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <Image
              source={packImageUrl ? { uri: packImageUrl } : DEFAULT_PACK_LOGO}
              style={{ width: 56, height: 56 }}
              resizeMode="cover"
            />
          </View>

          {/* Room Info */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            {/* Title Row with Badges */}
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
              <Text variant="body" className="font-semibold" numberOfLines={1} style={{ flexShrink: 1 }}>
                {room.title}
              </Text>
              <View
                style={{
                  backgroundColor: statusInfo.bgColor,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text variant="caption" style={{ color: statusInfo.color, fontWeight: "600", fontSize: 10 }}>
                  {statusInfo.label.toUpperCase()}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: withOpacity(visibilityColor, 0.12),
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Icon
                  name={room.isPublic ? "globe-outline" : "lock-closed-outline"}
                  size="xs"
                  color={visibilityColor}
                />
                <Text variant="caption" style={{ color: visibilityColor, fontWeight: "600", fontSize: 10 }}>
                  {room.isPublic ? "PUBLIC" : "PRIVATE"}
                </Text>
              </View>
            </View>

            {/* Description or Pack Info */}
            {room.description ? (
              <Text variant="caption" color="muted" numberOfLines={2} style={{ marginTop: 4, lineHeight: 16 }}>
                {room.description}
              </Text>
            ) : (
              <Text variant="caption" color="muted" numberOfLines={1} style={{ marginTop: 4 }}>
                {room.selectedPack?.title || "No pack selected"}
              </Text>
            )}

            {/* Stats Row - Cleaner Layout */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 16 }}>
              {/* Players */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Icon name="people-outline" size="xs" color={colors.primary[500]} />
                <Text variant="caption" style={{ color: colors.neutral[700], fontWeight: "500" }}>
                  {room.currentPlayers}/{room.maxPlayers}
                </Text>
              </View>

              {/* Room Code */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: colors.neutral[100],
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}
              >
                <Icon name="key-outline" size="xs" color={colors.neutral[600]} />
                <Text variant="caption" style={{ color: colors.neutral[700], fontWeight: "600", letterSpacing: 0.5 }}>
                  {room.code}
                </Text>
              </View>

              {/* Pack info if no description */}
              {room.description && room.selectedPack && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Icon name="albums-outline" size="xs" color={colors.neutral[400]} />
                  <Text variant="caption" color="muted" numberOfLines={1} style={{ maxWidth: 100 }}>
                    {room.selectedPack.title}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons Row - Below content for better spacing */}
        {onDelete && (
          <View style={{ flexDirection: "row", marginTop: 12 }}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDelete(room);
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: withOpacity(colors.error, 0.1),
                gap: 6,
              }}
            >
              <Icon name="trash-outline" size="sm" color={colors.error} />
              <Text variant="body-sm" style={{ color: colors.error, fontWeight: "600" }}>
                Delete Room
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

/**
 * Skeleton loading card (matching UserPackCard skeleton)
 */
export function UserRoomCardSkeleton() {
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: 16,
        marginBottom: 12,
        padding: 16,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row" }}>
        {/* Icon skeleton */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: colors.neutral[200],
          }}
        />
        {/* Content skeleton */}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View
            style={{
              width: "70%",
              height: 16,
              borderRadius: 4,
              backgroundColor: colors.neutral[200],
            }}
          />
          <View
            style={{
              width: "50%",
              height: 12,
              borderRadius: 4,
              backgroundColor: colors.neutral[200],
              marginTop: 8,
            }}
          />
          <View
            style={{
              width: "80%",
              height: 12,
              borderRadius: 4,
              backgroundColor: colors.neutral[200],
              marginTop: 8,
            }}
          />
        </View>
      </View>
    </View>
  );
}
