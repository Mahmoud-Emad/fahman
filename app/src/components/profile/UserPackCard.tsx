/**
 * UserPackCard - Card displaying user's pack with stats and edit option
 */
import React from "react";
import { View, Pressable, Image } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

// Default pack logo fallback
const DEFAULT_PACK_LOGO = require("../../../assets/icon.png");

export interface UserPackData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  questionsCount: number;
  timesPlayed: number;
  visibility: "PUBLIC" | "PRIVATE" | "FRIENDS";
  isPublished: boolean;
  createdAt: string;
}

interface UserPackCardProps {
  pack: UserPackData;
  onPress: (pack: UserPackData) => void;
  onEdit: (pack: UserPackData) => void;
  onDelete?: (pack: UserPackData) => void;
}

/**
 * Format date to relative or short format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Get visibility icon and color
 */
function getVisibilityInfo(visibility: UserPackData["visibility"]) {
  switch (visibility) {
    case "PUBLIC":
      return { icon: "globe-outline" as const, color: colors.success, label: "Public" };
    case "FRIENDS":
      return { icon: "people-outline" as const, color: colors.primary[500], label: "Friends" };
    case "PRIVATE":
      return { icon: "lock-closed-outline" as const, color: colors.neutral[500], label: "Private" };
  }
}

export function UserPackCard({ pack, onPress, onEdit, onDelete }: UserPackCardProps) {
  const visibilityInfo = getVisibilityInfo(pack.visibility);

  return (
    <Pressable
      onPress={() => onPress(pack)}
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
          {/* Pack Image/Logo */}
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
              source={pack.imageUrl ? { uri: pack.imageUrl } : DEFAULT_PACK_LOGO}
              style={{ width: 56, height: 56 }}
              resizeMode="cover"
            />
          </View>

          {/* Pack Info */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            {/* Title Row with Badges */}
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
              <Text variant="body" className="font-semibold" numberOfLines={1} style={{ flexShrink: 1 }}>
                {pack.title}
              </Text>
              {!pack.isPublished && (
                <View
                  style={{
                    backgroundColor: withOpacity(colors.warning, 0.15),
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text variant="caption" style={{ color: colors.warning, fontWeight: "600", fontSize: 10 }}>
                    DRAFT
                  </Text>
                </View>
              )}
              <View
                style={{
                  backgroundColor: withOpacity(visibilityInfo.color, 0.12),
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Icon name={visibilityInfo.icon} size="xs" color={visibilityInfo.color} />
                <Text variant="caption" style={{ color: visibilityInfo.color, fontWeight: "600", fontSize: 10 }}>
                  {visibilityInfo.label.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Description */}
            {pack.description && (
              <Text variant="caption" color="muted" numberOfLines={2} style={{ marginTop: 4, lineHeight: 16 }}>
                {pack.description}
              </Text>
            )}

            {/* Stats Row - Cleaner Layout */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 16 }}>
              {/* Questions count */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Icon name="help-circle-outline" size="xs" color={colors.primary[500]} />
                <Text variant="caption" style={{ color: colors.neutral[700], fontWeight: "500" }}>
                  {pack.questionsCount}
                </Text>
              </View>

              {/* Times played */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Icon name="play-circle-outline" size="xs" color={colors.success} />
                <Text variant="caption" style={{ color: colors.neutral[700], fontWeight: "500" }}>
                  {pack.timesPlayed}
                </Text>
              </View>

              {/* Created date - moved to main area */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Icon name="calendar-outline" size="xs" color={colors.neutral[400]} />
                <Text variant="caption" color="muted">
                  {formatDate(pack.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons Row - Below content for better spacing */}
        <View style={{ flexDirection: "row", marginTop: 12, gap: 8, justifyContent: "flex-end" }}>
          {/* Edit Button */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onEdit(pack);
            }}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 10,
              backgroundColor: withOpacity(colors.primary[500], 0.1),
              gap: 6,
            }}
          >
            <Icon name="create-outline" size="sm" color={colors.primary[500]} />
            <Text variant="body-sm" style={{ color: colors.primary[500], fontWeight: "600" }}>
              Edit
            </Text>
          </Pressable>

          {/* Delete Button */}
          {onDelete && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDelete(pack);
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
                Delete
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Skeleton loading card
 */
export function UserPackCardSkeleton() {
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
        {/* Image skeleton */}
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
      {/* Button skeleton */}
      <View style={{ flexDirection: "row", marginTop: 12, gap: 8 }}>
        <View
          style={{
            flex: 1,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.neutral[200],
          }}
        />
        <View
          style={{
            flex: 1,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.neutral[200],
          }}
        />
      </View>
    </View>
  );
}
