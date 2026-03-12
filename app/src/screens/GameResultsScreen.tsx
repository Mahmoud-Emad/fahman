/**
 * GameResultsScreen - Displays game results with winner and rankings
 * Shows after a game ends with celebratory UI
 */
import React, { useEffect, useRef, useState } from "react";
import { View, ScrollView, Animated, Pressable, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { Text, Icon, Button } from "@/components/ui";
import { colors } from "@/themes";
import { roomsService } from "@/services/roomsService";
import { useToast } from "@/contexts";
import { getErrorMessage } from "@/utils/errorUtils";
import { Confetti, WinnerCard } from "@/components/game/ResultsStatsCard";
import { Podium, LeaderboardRow } from "@/components/game/ResultsLeaderboard";
import type { RootStackParamList } from "../../App";

type GameResultsScreenRouteProp = RouteProp<RootStackParamList, "GameResults">;
type GameResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, "GameResults">;

/**
 * Main GameResultsScreen component
 */
export function GameResultsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<GameResultsScreenNavigationProp>();
  const route = useRoute<GameResultsScreenRouteProp>();
  const toast = useToast();

  const { roomId, currentUserId } = route.params;

  // Use route params as initial data, refresh from API
  const [winner, setWinner] = useState(route.params.winner);
  const [finalScores, setFinalScores] = useState(route.params.finalScores);
  const [packTitle, setPackTitle] = useState(route.params.packTitle);
  const [isValidating, setIsValidating] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const winnerScale = useRef(new Animated.Value(0.5)).current;

  // Fetch fresh results from API
  useEffect(() => {
    if (!roomId) return;
    roomsService.getGameResults(roomId).then((res) => {
      if (!res.success || !res.data) return;
      const { results, winner: apiWinner, pack } = res.data;
      if (apiWinner) {
        const topResult = results[0];
        setWinner({
          id: apiWinner.id,
          username: apiWinner.username,
          displayName: apiWinner.displayName,
          avatar: apiWinner.avatar,
          score: topResult?.score ?? 0,
        });
      }
      if (results?.length) {
        setFinalScores(results.map((r: { user: { id: string; username: string; displayName: string | null; avatar: string | null }; score: number; rank: number }) => ({
          playerId: r.user.id,
          username: r.user.username,
          displayName: r.user.displayName,
          avatar: r.user.avatar,
          score: r.score,
          rank: r.rank,
        })));
      }
      if (pack?.title) {
        setPackTitle(pack.title);
      }
    }).catch(() => {
      // Silently fall back to route params (already set as initial state)
    });
  }, [roomId]);

  // Intercept hardware back button — go to Home instead of stale game screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(winnerScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, winnerScale]);

  const handlePlayAgain = async () => {
    if (!roomId) {
      toast.error("Room information not found");
      return;
    }

    setIsValidating(true);
    try {
      const roomResponse = await roomsService.getRoom(roomId);

      if (roomResponse.success && roomResponse.data) {
        const room = roomResponse.data;

        if (room.status === "FINISHED" || room.status === "CLOSED") {
          toast.error("This room has ended. Create a new one!");
          navigation.reset({ index: 0, routes: [{ name: "Home" }] });
        } else {
          navigation.reset({
            index: 1,
            routes: [
              { name: "Home" },
              {
                name: "RoomLobby",
                params: {
                  pack: route.params.pack,
                  config: route.params.config,
                  isHost: route.params.isHost,
                  room: route.params.room,
                },
              },
            ],
          });
        }
      } else {
        toast.error("Failed to check room status");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsValidating(false);
    }
  };

  const handleExit = () => {
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  const sortedPlayers = [...finalScores].sort((a, b) => a.rank - b.rank);
  const remainingPlayers = sortedPlayers.slice(3);

  return (
    <View className="flex-1 bg-white">
      {winner && <Confetti />}

      {/* Header */}
      <View style={{ paddingTop: insets.top, backgroundColor: colors.primary[500] }}>
        <View className="flex-row items-center justify-between px-4 py-4">
          <View className="w-10" />
          <Text variant="h3" className="font-bold" style={{ color: colors.white }}>
            Game Over
          </Text>
          <Pressable
            onPress={handleExit}
            className="w-10 h-10 rounded-full items-center justify-center active:bg-white/10"
          >
            <Icon name="close" color={colors.white} size="md" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {packTitle && (
            <View className="items-center mt-4 px-4">
              <Text variant="caption" color="muted">Pack</Text>
              <Text variant="body" className="font-semibold" center>{packTitle}</Text>
            </View>
          )}

          {winner ? (
            <View className="items-center mt-6 px-4">
              <WinnerCard winner={winner} animatedScale={winnerScale} />
            </View>
          ) : (
            <View className="items-center mt-8 px-4">
              <Icon name="people" customSize={64} color={colors.neutral[300]} />
              <Text variant="h3" className="font-bold mt-4" center>It's a Tie!</Text>
              <Text variant="body" color="secondary" className="mt-2" center>
                No clear winner this time
              </Text>
            </View>
          )}

          {sortedPlayers.length >= 2 && (
            <View className="mt-8">
              <Podium players={sortedPlayers} />
            </View>
          )}

          {remainingPlayers.length > 0 && (
            <View className="mt-8 px-4">
              <Text variant="h4" className="font-bold mb-3">Leaderboard</Text>
              {remainingPlayers.map((player) => (
                <LeaderboardRow
                  key={player.playerId}
                  player={player}
                  isCurrentUser={player.playerId === currentUserId}
                />
              ))}
            </View>
          )}

          {sortedPlayers.length <= 3 && sortedPlayers.length > 0 && (
            <View className="mt-8 px-4">
              <Text variant="h4" className="font-bold mb-3">Final Scores</Text>
              {sortedPlayers.map((player) => (
                <LeaderboardRow
                  key={player.playerId}
                  player={player}
                  isCurrentUser={player.playerId === currentUserId}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom action buttons */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pt-4 bg-white border-t"
        style={{ paddingBottom: insets.bottom + 16, borderTopColor: colors.border }}
      >
        <View className="flex-row gap-3">
          <Button variant="outline" size="lg" fullWidth onPress={handleExit} className="flex-1">
            Exit
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handlePlayAgain}
            disabled={isValidating}
            className="flex-1"
          >
            <View className="flex-row items-center">
              <Icon name="refresh" customSize={18} color={colors.white} />
              <Text variant="body" className="font-semibold ml-2" style={{ color: colors.white }}>
                {isValidating ? "Checking..." : "Play Again"}
              </Text>
            </View>
          </Button>
        </View>
      </View>
    </View>
  );
}
