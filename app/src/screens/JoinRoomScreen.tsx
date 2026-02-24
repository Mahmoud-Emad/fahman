/**
 * JoinRoomScreen - Screen for joining a room
 * Used when pressing on any room from room list, chat invites, etc.
 */
import React, { useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Icon, Avatar, Input, Button } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { useToast } from "@/contexts";
import { roomsService } from "@/services/roomsService";
import type { RootStackParamList } from "../../App";
import type { RoomData, RoomUser } from "@/components/rooms/types";

type JoinRoomScreenNavigationProp = StackNavigationProp<RootStackParamList, "JoinRoom">;
type JoinRoomScreenRouteProp = RouteProp<RootStackParamList, "JoinRoom">;

/**
 * Avatar stack for showing room participants
 */
function AvatarStack({ users, totalUsers, maxShow = 4 }: { users: RoomUser[]; totalUsers: number; maxShow?: number }) {
  const displayUsers = users.slice(0, maxShow);

  return (
    <View className="flex-row">
      {displayUsers.map((user, index) => (
        <View
          key={user.id}
          style={{
            marginLeft: index === 0 ? 0 : -8,
            zIndex: maxShow - index,
          }}
        >
          {user.avatar ? (
            <Avatar source={user.avatar} size="sm" />
          ) : (
            <View
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{
                backgroundColor: colors.primary[100],
                borderWidth: 2,
                borderColor: colors.white,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "600", color: colors.primary[600] }}>
                {user.initials}
              </Text>
            </View>
          )}
        </View>
      ))}
      {totalUsers > maxShow && (
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{
            marginLeft: -8,
            backgroundColor: colors.neutral[200],
            borderWidth: 2,
            borderColor: colors.white,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "600", color: colors.neutral[600] }}>
            +{totalUsers - maxShow}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Accent colors for room cards — provides visual variety across rooms */
const ROOM_ACCENT_COLORS = [
  colors.primary[500],
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#10B981", // emerald
  "#F59E0B", // amber
  "#3B82F6", // blue
] as const;

/**
 * Get accent color based on room ID
 */
function getAccentColor(id: string): string {
  const index = id.charCodeAt(0) % ROOM_ACCENT_COLORS.length;
  return ROOM_ACCENT_COLORS[index];
}

/**
 * JoinRoomScreen component
 */
export function JoinRoomScreen() {
  const navigation = useNavigation<JoinRoomScreenNavigationProp>();
  const route = useRoute<JoinRoomScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const { room, roomCode, password: prefilledPassword } = route.params;

  const [password, setPassword] = useState(prefilledPassword || "");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPrivate = room.type === "private";
  const accent = getAccentColor(room.id);
  const needsPassword = isPrivate && !prefilledPassword;

  const handleJoin = async () => {
    // Validate password input for private rooms
    if (isPrivate && !password.trim()) {
      setError("Please enter a password");
      return;
    }

    setError(null);
    setIsJoining(true);

    try {
      // Call backend API to join room
      const response = await roomsService.joinRoom(
        room.id,
        isPrivate ? { password: password.trim() } : undefined
      );

      if (response.success && response.data) {
        // Navigate to RoomLobby with actual backend data
        navigation.replace("RoomLobby", {
          pack: {
            id: response.data.room.selectedPack?.id || room.id,
            title: response.data.room.selectedPack?.title || room.title,
            questionsCount: room.questionsCount,
            isPublic: response.data.room.isPublic,
          },
          config: {
            packId: response.data.room.selectedPack?.id || room.id,
            title: response.data.room.title,
            description: response.data.room.description || "",
            maxPlayers: response.data.room.maxPlayers,
            isPublic: response.data.room.isPublic,
            isPasswordProtected: !response.data.room.isPublic,
            password: isPrivate ? password : undefined,
          },
          isHost: response.data.member.role === 'CREATOR',
        });
      } else {
        setError(response.message || "Failed to join room");
        toast.error(response.message || "Failed to join room");
      }
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes("password") || error.message?.includes("incorrect")) {
        setError("Incorrect password. Please try again.");
        toast.error("Incorrect password. Please try again.");
      } else if (error.message?.includes("full")) {
        setError("This room is full");
        toast.error("This room is full");
      } else if (error.message?.includes("already started") || error.message?.includes("PLAYING")) {
        setError("Game has already started");
        toast.error("Game has already started");
      } else if (error.message?.includes("FINISHED") || error.message?.includes("CLOSED")) {
        setError("This room has ended");
        toast.error("This room has ended");
      } else {
        setError(error.message || "Failed to join room");
        toast.error(error.message || "Failed to join room. Please try again.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-neutral-100">
        <Pressable
          onPress={handleBack}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.neutral[100] }}
        >
          <Icon name="chevron-back" size="md" color={colors.neutral[700]} />
        </Pressable>
        <Text variant="h3" className="flex-1 ml-3 font-bold">
          Join Room
        </Text>
        {roomCode && (
          <View
            className="px-3 py-1.5 rounded-full"
            style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary[500] }}>
              #{roomCode}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Room Card */}
        <View
          className="rounded-2xl p-4 mb-6"
          style={{ backgroundColor: colors.neutral[50] }}
        >
          {/* Header */}
          <View className="flex-row items-start mb-4">
            <View
              className="w-16 h-16 rounded-xl items-center justify-center"
              style={{ backgroundColor: withOpacity(accent, 0.15) }}
            >
              {room.logo ? (
                <Avatar source={room.logo} size="lg" borderRadius="rounded-lg" />
              ) : (
                <Text className="font-bold" style={{ color: accent, fontSize: 22 }}>
                  {room.logoInitials || room.title.slice(0, 2).toUpperCase()}
                </Text>
              )}
            </View>

            <View className="flex-1 ml-4">
              <Text variant="h2" className="font-bold" style={{ lineHeight: 28 }}>
                {room.title}
              </Text>
              <View className="flex-row items-center mt-2 gap-2">
                {/* Privacy Badge */}
                <View
                  className="px-2.5 py-1 rounded-full flex-row items-center"
                  style={{
                    backgroundColor: isPrivate
                      ? withOpacity(colors.warning, 0.1)
                      : withOpacity(colors.success, 0.1),
                  }}
                >
                  <Icon
                    name={isPrivate ? "lock-closed" : "globe"}
                    customSize={12}
                    color={isPrivate ? colors.warning : colors.success}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      color: isPrivate ? colors.warning : colors.success,
                      marginLeft: 4,
                      fontWeight: "600",
                    }}
                  >
                    {isPrivate ? "Private" : "Public"}
                  </Text>
                </View>
                {/* Status Badge */}
                <View
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor:
                      room.status === "waiting"
                        ? withOpacity(colors.primary[500], 0.1)
                        : room.status === "playing"
                        ? withOpacity(colors.success, 0.1)
                        : withOpacity(colors.neutral[400], 0.1),
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color:
                        room.status === "waiting"
                          ? colors.primary[500]
                          : room.status === "playing"
                          ? colors.success
                          : colors.neutral[400],
                    }}
                  >
                    {room.status === "waiting"
                      ? "Waiting"
                      : room.status === "playing"
                      ? "Live"
                      : "Ended"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          {room.description && (
            <View
              className="rounded-xl p-3 mb-4"
              style={{ backgroundColor: colors.white }}
            >
              <Text style={{ fontSize: 14, color: colors.neutral[600], lineHeight: 22 }}>
                {room.description}
              </Text>
            </View>
          )}

          {/* Stats Row */}
          <View className="flex-row gap-3 mb-4">
            <View
              className="flex-1 rounded-xl p-3"
              style={{ backgroundColor: colors.white }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                  style={{ backgroundColor: withOpacity(colors.success, 0.1) }}
                >
                  <Icon name="people" customSize={16} color={colors.success} />
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: colors.neutral[500] }}>Players</Text>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text.primary }}>
                    {room.totalUsers}
                  </Text>
                </View>
              </View>
            </View>

            <View
              className="flex-1 rounded-xl p-3"
              style={{ backgroundColor: colors.white }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                  style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
                >
                  <Icon name="help-circle" customSize={16} color={colors.primary[500]} />
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: colors.neutral[500] }}>Questions</Text>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text.primary }}>
                    {room.questionsCount}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Progress (if playing) */}
          {room.status === "playing" && (
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text style={{ fontSize: 12, color: colors.neutral[500] }}>Game Progress</Text>
                <Text
                  style={{ fontSize: 12, color: colors.primary[500], fontWeight: "600" }}
                >
                  Question {room.currentQuestion} of {room.questionsCount}
                </Text>
              </View>
              <View
                className="h-2.5 rounded-full overflow-hidden"
                style={{ backgroundColor: colors.neutral[200] }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: colors.primary[500],
                    width: `${(room.currentQuestion / room.questionsCount) * 100}%`,
                  }}
                />
              </View>
            </View>
          )}

          {/* Players */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <AvatarStack users={room.users} totalUsers={room.totalUsers} maxShow={5} />
            </View>
            <Text style={{ fontSize: 12, color: colors.neutral[500] }}>
              {room.totalUsers} {room.totalUsers === 1 ? "player" : "players"} online
            </Text>
          </View>
        </View>

        {/* Password Input (if private room) */}
        {needsPassword && (
          <View className="mb-6">
            <Text variant="body" className="font-semibold mb-2">
              Room Password
            </Text>
            <Text variant="caption" color="secondary" className="mb-3">
              This is a private room. Enter the password to join.
            </Text>
            <Input
              variant="filled"
              placeholder="Enter password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              containerClassName="mb-2"
            />
            {error && (
              <View className="flex-row items-center mt-1">
                <Icon name="alert-circle" customSize={14} color={colors.error} />
                <Text style={{ fontSize: 12, color: colors.error, marginLeft: 4 }}>
                  {error}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Info Note */}
        <View
          className="flex-row items-start p-3 rounded-xl mb-6"
          style={{ backgroundColor: withOpacity(colors.primary[500], 0.05) }}
        >
          <Icon name="information-circle" customSize={18} color={colors.primary[500]} />
          <Text style={{ fontSize: 12, color: colors.neutral[600], marginLeft: 8, flex: 1 }}>
            {room.status === "playing"
              ? "This game is in progress. You can join and participate in the remaining questions."
              : room.status === "waiting"
              ? "The host is waiting for players. Join now to be ready when the game starts!"
              : "This game has ended. You cannot join."}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View
        className="px-4 py-4 border-t border-neutral-100"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleJoin}
          disabled={isJoining || room.status === "finished" || (needsPassword && !password)}
        >
          {isJoining ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={{ color: colors.white, fontWeight: "600", marginLeft: 8 }}>
                Joining...
              </Text>
            </View>
          ) : room.status === "finished" ? (
            "Game Ended"
          ) : (
            <>
              <Icon name="play" size="sm" color={colors.white} style={{ marginRight: 8 }} />
              Join Room
            </>
          )}
        </Button>
      </View>
    </View>
  );
}
