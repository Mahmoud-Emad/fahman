/**
 * Hook for picking images from the device gallery
 * Requires: npx expo install expo-image-picker
 */
import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { useToast } from "@/contexts";

interface UseImagePickerOptions {
  /** Aspect ratio for cropping [width, height] */
  aspect?: [number, number];
  /** Image quality (0-1) */
  quality?: number;
  /** Allow editing/cropping */
  allowsEditing?: boolean;
}

interface UseImagePickerReturn {
  /** Pick an image from the gallery */
  pickImage: () => Promise<string | null>;
  /** Whether permission was denied */
  permissionDenied: boolean;
  /** Reset permission denied state */
  resetPermission: () => void;
}

/**
 * Hook for picking images with expo-image-picker
 */
export function useImagePicker(
  options: UseImagePickerOptions = {}
): UseImagePickerReturn {
  const {
    aspect = [1, 1],
    quality = 0.8,
    allowsEditing = true,
  } = options;

  const toast = useToast();
  const [permissionDenied, setPermissionDenied] = useState(false);

  const pickImage = useCallback(async (): Promise<string | null> => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setPermissionDenied(true);
        return null;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error: any) {
      toast.error(error.message || "Failed to pick image");
      return null;
    }
  }, [aspect, quality, allowsEditing]);

  const resetPermission = useCallback(() => {
    setPermissionDenied(false);
  }, []);

  return {
    pickImage,
    permissionDenied,
    resetPermission,
  };
}
