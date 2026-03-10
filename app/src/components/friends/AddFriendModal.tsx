/**
 * AddFriendModal - Modal for searching and adding friends
 */
import React, { useState, useCallback, useRef } from "react";
import { View, ScrollView, ActivityIndicator, Keyboard } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { Modal, Text, Icon, SearchInput, Pressable } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { friendsService, type UserSearchResult } from "@/services/friendsService";
import { FriendSearchResults } from "./FriendSearchResults";
import type { RootStackParamList } from "../../../App";

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onCloseAll?: () => void;
  onFriendAdded?: () => void;
}

/**
 * AddFriendModal component
 */
export function AddFriendModal({
  visible,
  onClose,
  onCloseAll,
  onFriendAdded,
}: AddFriendModalProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleViewProfile = useCallback((userId: string) => {
    if (onCloseAll) {
      onCloseAll();
    } else {
      onClose();
    }
    setTimeout(() => {
      navigation.navigate("UserProfile", { userId });
    }, 300);
  }, [navigation, onClose, onCloseAll]);

  const handleClose = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setError(null);
    setSuccessMessage(null);
    onClose();
  }, [onClose]);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await friendsService.searchUsers(query.trim());
      if (response.success && response.data) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message || "Search failed");
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      setSuccessMessage(null);

      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      searchTimeout.current = setTimeout(() => {
        performSearch(text);
      }, 400);
    },
    [performSearch]
  );

  const handleSendRequest = useCallback(
    async (user: UserSearchResult) => {
      setSendingTo(user.id);
      setError(null);
      setSuccessMessage(null);

      try {
        const response = await friendsService.sendFriendRequest(user.id);
        if (response.success) {
          const requestId = response.data?.id;
          setSearchResults((prev) =>
            prev.map((u) =>
              u.id === user.id
                ? { ...u, hasPendingRequest: true, isSentByMe: true, pendingRequestId: requestId }
                : u
            )
          );
          setSuccessMessage(`Friend request sent to ${user.displayName || user.username}!`);
          onFriendAdded?.();
        }
      } catch (err: any) {
        setError(err.message || "Failed to send request");
      } finally {
        setSendingTo(null);
      }
    },
    [onFriendAdded]
  );

  const handleCancelRequest = useCallback(
    async (user: UserSearchResult) => {
      if (!user.pendingRequestId) return;

      setSendingTo(user.id);
      setError(null);
      setSuccessMessage(null);

      try {
        const response = await friendsService.cancelFriendRequest(user.pendingRequestId);
        if (response.success) {
          setSearchResults((prev) =>
            prev.map((u) =>
              u.id === user.id
                ? { ...u, hasPendingRequest: false, isSentByMe: false, pendingRequestId: undefined }
                : u
            )
          );
          setSuccessMessage("Friend request cancelled");
          onFriendAdded?.();
        }
      } catch (err: any) {
        setError(err.message || "Failed to cancel request");
      } finally {
        setSendingTo(null);
      }
    },
    [onFriendAdded]
  );

  const handleDirectAdd = useCallback(async () => {
    if (searchQuery.trim().length < 2) return;

    Keyboard.dismiss();
    setIsSearching(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await friendsService.sendFriendRequestByIdentifier(searchQuery.trim());
      if (response.success) {
        setSuccessMessage("Friend request sent!");
        setSearchQuery("");
        setSearchResults([]);
        setHasSearched(false);
        onFriendAdded?.();
      }
    } catch (err: any) {
      if (err.message?.includes("not found")) {
        performSearch(searchQuery);
      } else {
        setError(err.message || "Failed to send request");
      }
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, performSearch, onFriendAdded]);

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Add Friend"
      padding="p-0"
    >
      {/* Search Section */}
      <View className="px-4 pb-3">
        <View className="flex-row items-center">
          <View className="flex-1">
            <SearchInput
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Search by username or Game ID..."
              autoFocus
            />
          </View>
          {searchQuery.trim().length >= 2 && (
            <Pressable
              onPress={handleDirectAdd}
              disabled={isSearching}
              className="ml-2 px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: colors.primary[500] }}
              delayPressIn={0}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text
                  variant="body-sm"
                  className="font-semibold"
                  style={{ color: colors.white }}
                >
                  Add
                </Text>
              )}
            </Pressable>
          )}
        </View>

        <Text
          variant="caption"
          className="mt-2"
          style={{ color: colors.neutral[500] }}
        >
          Enter a username or Game ID to find friends
        </Text>
      </View>

      {/* Success/Error Messages */}
      {successMessage && (
        <View
          className="mx-4 mb-3 px-4 py-3 rounded-xl flex-row items-center"
          style={{ backgroundColor: withOpacity(colors.success, 0.1) }}
        >
          <Icon name="checkmark-circle" customSize={18} color={colors.success} />
          <Text
            variant="body-sm"
            className="ml-2 flex-1"
            style={{ color: colors.success }}
          >
            {successMessage}
          </Text>
        </View>
      )}

      {error && (
        <View
          className="mx-4 mb-3 px-4 py-3 rounded-xl flex-row items-center"
          style={{ backgroundColor: withOpacity(colors.error, 0.1) }}
        >
          <Icon name="alert-circle" customSize={18} color={colors.error} />
          <Text
            variant="body-sm"
            className="ml-2 flex-1"
            style={{ color: colors.error }}
          >
            {error}
          </Text>
        </View>
      )}

      {/* Results */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, minHeight: 200 }}
        keyboardShouldPersistTaps="handled"
      >
        <FriendSearchResults
          searchResults={searchResults}
          isSearching={isSearching}
          hasSearched={hasSearched}
          searchQuery={searchQuery}
          sendingTo={sendingTo}
          onSendRequest={handleSendRequest}
          onCancelRequest={handleCancelRequest}
          onViewProfile={handleViewProfile}
        />
      </ScrollView>
    </Modal>
  );
}
