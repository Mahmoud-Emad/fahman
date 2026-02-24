/**
 * ProfilePacksSection - User's packs and rooms sections for ProfileScreen
 */
import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text, Icon } from "@/components/ui";
import { UserPackCard, UserPackCardSkeleton, type UserPackData } from "./UserPackCard";
import { UserRoomCard, UserRoomCardSkeleton } from "./UserRoomCard";
import { colors } from "@/themes";

interface ProfilePacksSectionProps {
  userPacks: UserPackData[];
  packsLoading: boolean;
  userRooms: any[];
  roomsLoading: boolean;
  onPackPress: (pack: UserPackData) => void;
  onPackEdit: (pack: UserPackData) => void;
  onPackDelete: (pack: UserPackData) => void;
  onCreatePack: () => void;
  onRoomPress: (room: any) => void;
  onRoomDelete: (room: any) => void;
}

/**
 * Packs and rooms sections for the profile screen
 */
export function ProfilePacksSection({
  userPacks,
  packsLoading,
  userRooms,
  roomsLoading,
  onPackPress,
  onPackEdit,
  onPackDelete,
  onCreatePack,
  onRoomPress,
  onRoomDelete,
}: ProfilePacksSectionProps) {
  return (
    <>
      {/* Your Packs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="h4" numberOfLines={1} style={{ flex: 0, flexShrink: 0 }}>Your Packs</Text>
          <Pressable onPress={onCreatePack}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Icon name="add-circle-outline" size="sm" color={colors.primary[500]} />
              <Text variant="body-sm" style={{ color: colors.primary[500], marginLeft: 4 }} numberOfLines={1}>
                Create
              </Text>
            </View>
          </Pressable>
        </View>
        <View style={styles.itemsContainer}>
          {packsLoading ? (
            <>
              <UserPackCardSkeleton />
              <UserPackCardSkeleton />
            </>
          ) : userPacks.length > 0 ? (
            userPacks.map((pack) => (
              <UserPackCard
                key={pack.id}
                pack={pack}
                onPress={onPackPress}
                onEdit={onPackEdit}
                onDelete={onPackDelete}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="albums-outline" size="xl" color={colors.neutral[300]} />
              <Text variant="body" color="secondary" style={{ marginTop: 8 }}>No packs created yet</Text>
              <Text variant="caption" color="muted" style={{ marginTop: 4 }}>Create your first pack to get started</Text>
            </View>
          )}
        </View>
      </View>

      {/* Your Rooms */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="h4" numberOfLines={1} style={{ flex: 0, flexShrink: 0 }}>Your Rooms</Text>
        </View>
        <View style={styles.itemsContainer}>
          {roomsLoading ? (
            <>
              <UserRoomCardSkeleton />
              <UserRoomCardSkeleton />
            </>
          ) : userRooms.length > 0 ? (
            userRooms.map((room) => (
              <UserRoomCard
                key={room.id}
                room={room}
                onPress={onRoomPress}
                onDelete={onRoomDelete}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="home-outline" size="xl" color={colors.neutral[300]} />
              <Text variant="body" color="secondary" style={{ marginTop: 8 }}>No rooms created yet</Text>
              <Text variant="caption" color="muted" style={{ marginTop: 4 }}>Create a room to start playing</Text>
            </View>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  itemsContainer: {
    marginHorizontal: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
});
