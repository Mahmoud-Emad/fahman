/**
 * useSound - Hook for playing app sounds that respects user settings
 *
 * Loads user sound settings on mount and provides methods to play
 * specific sounds. Each sound type is gated by its corresponding setting:
 * - appSound: in-app message alerts (chat messages while app is open)
 * - gameSound: gameplay sound effects
 * - notificationSound: push notification sounds
 * - userSound: attention sounds from other players
 */
import { useRef, useEffect, useCallback } from "react";
import { Audio } from "expo-av";
import { settingsService, type UserSettings } from "@/services/settingsService";

// Bundled sound assets
const SOUNDS = {
  message: require("../../assets/sounds/message.wav"),
  notification: require("../../assets/sounds/notification.wav"),
} as const;

type SoundName = keyof typeof SOUNDS;

export function useSound() {
  const settingsRef = useRef<UserSettings | null>(null);
  const soundCacheRef = useRef<Map<SoundName, Audio.Sound>>(new Map());

  // Fetch settings once on mount
  useEffect(() => {
    settingsService.getSettings().then((res) => {
      if (res.success && res.data) {
        settingsRef.current = res.data;
      }
    });

    return () => {
      // Unload all cached sounds on unmount
      soundCacheRef.current.forEach((sound) => {
        sound.unloadAsync().catch(() => {});
      });
      soundCacheRef.current.clear();
    };
  }, []);

  const playSound = useCallback(async (name: SoundName) => {
    try {
      const cached = soundCacheRef.current.get(name);
      if (cached) {
        await cached.setPositionAsync(0);
        await cached.playAsync();
        return;
      }

      const { sound } = await Audio.Sound.createAsync(SOUNDS[name], {
        shouldPlay: true,
      });
      soundCacheRef.current.set(name, sound);
    } catch {
      // Silently fail — sound is non-critical
    }
  }, []);

  const playMessageSound = useCallback(() => {
    const settings = settingsRef.current;
    // Default to playing if settings haven't loaded yet
    if (settings && !settings.appSound) return;
    playSound("message");
  }, [playSound]);

  const playNotificationSound = useCallback(() => {
    const settings = settingsRef.current;
    if (settings && !settings.notificationSound) return;
    playSound("notification");
  }, [playSound]);

  return { playMessageSound, playNotificationSound };
}
