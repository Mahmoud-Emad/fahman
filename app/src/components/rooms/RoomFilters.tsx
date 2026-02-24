/**
 * RoomFilters - Filter bar for rooms list
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "@/components/ui";
import { colors } from "@/themes";
import type { PrivacyFilter, StatusFilter } from "./hooks";

/**
 * Filter chip component
 */
interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function FilterChip({ label, isActive, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full active:opacity-80"
      style={{
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: isActive ? colors.primary[500] : "transparent",
        borderWidth: isActive ? 0 : 1,
        borderColor: colors.neutral[200],
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "500",
          color: isActive ? colors.white : colors.neutral[500],
          textTransform: "capitalize",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Privacy filter options
 */
const PRIVACY_OPTIONS: { key: PrivacyFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "public", label: "Public" },
  { key: "private", label: "Private" },
];

/**
 * Status filter options
 */
const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "waiting", label: "Wait" },
  { key: "playing", label: "Live" },
  { key: "finished", label: "Done" },
];

interface RoomFiltersProps {
  privacyFilter: PrivacyFilter;
  statusFilter: StatusFilter;
  showMyRoomsOnly: boolean;
  onPrivacyChange: (filter: PrivacyFilter) => void;
  onStatusChange: (filter: StatusFilter) => void;
  onMyRoomsToggle: (show: boolean) => void;
}

/**
 * Room filters component - displays privacy and status filter chips
 */
export function RoomFilters({
  privacyFilter,
  statusFilter,
  showMyRoomsOnly,
  onPrivacyChange,
  onStatusChange,
  onMyRoomsToggle,
}: RoomFiltersProps) {
  return (
    <View
      className="flex-row items-center gap-2 px-4 py-3 bg-white"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.neutral[100] }}
    >
      {/* My Rooms filter */}
      <FilterChip
        label="My Rooms"
        isActive={showMyRoomsOnly}
        onPress={() => onMyRoomsToggle(!showMyRoomsOnly)}
      />

      {/* Divider */}
      <View
        style={{
          width: 1,
          height: 16,
          backgroundColor: colors.neutral[200],
          marginHorizontal: 4,
        }}
      />

      {/* Privacy filters */}
      {PRIVACY_OPTIONS.map((option) => (
        <FilterChip
          key={option.key}
          label={option.label}
          isActive={privacyFilter === option.key}
          onPress={() => onPrivacyChange(option.key)}
        />
      ))}

      {/* Divider */}
      <View
        style={{
          width: 1,
          height: 16,
          backgroundColor: colors.neutral[200],
          marginHorizontal: 4,
        }}
      />

      {/* Status filters */}
      {STATUS_OPTIONS.map((option) => (
        <FilterChip
          key={option.key}
          label={option.label}
          isActive={statusFilter === option.key}
          onPress={() => onStatusChange(option.key)}
        />
      ))}
    </View>
  );
}
