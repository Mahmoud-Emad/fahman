/**
 * PhoneManagementModal - Add, update, and verify phone number
 */
import React, { useState, useEffect } from "react";
import { View, TextInput, ActivityIndicator, Alert } from "react-native";
import { Text, Icon, Modal, Button } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { useAuth } from "@/contexts";
import { getErrorMessage } from "@/utils/errorUtils";

interface PhoneManagementModalProps {
  visible: boolean;
  onClose: () => void;
  phoneNumber: string | null;
  phoneVerified: boolean;
  onPhoneUpdated: () => void;
}

type Step = "input" | "verify";

export function PhoneManagementModal({
  visible,
  onClose,
  phoneNumber,
  phoneVerified,
  onPhoneUpdated,
}: PhoneManagementModalProps) {
  const { updatePhoneNumber, verifyUserPhone, removePhoneNumber } = useAuth();

  const [step, setStep] = useState<Step>("input");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setStep(phoneNumber && !phoneVerified ? "verify" : "input");
      setPhone(phoneNumber?.replace("+20", "") || "");
      setCode("");
      setError("");
    }
  }, [visible, phoneNumber, phoneVerified]);

  const formatPhoneNumber = (input: string): string => {
    // Remove non-digits
    const digits = input.replace(/\D/g, "");
    // Limit to 11 digits (Egyptian mobile)
    return digits.slice(0, 11);
  };

  const validatePhone = (): boolean => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) {
      setError("Phone number is required");
      return false;
    }
    if (digits.length < 10) {
      setError("Please enter a valid phone number");
      return false;
    }
    return true;
  };

  const handleUpdatePhone = async () => {
    if (!validatePhone()) return;

    setLoading(true);
    setError("");

    try {
      const phoneWithCode = phone.startsWith("+") ? phone : `+20${phone}`;
      const result = await updatePhoneNumber({ phoneNumber: phoneWithCode });

      // In development, show the code
      if (result.code) {
        Alert.alert("Development Mode", `Verification code: ${result.code}`);
      }

      setStep("verify");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await verifyUserPhone({ code });
      onPhoneUpdated();
      Alert.alert("Success", "Phone number verified successfully");
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError("");

    try {
      const phoneWithCode = phone.startsWith("+") ? phone : `+20${phone}`;
      const result = await updatePhoneNumber({ phoneNumber: phoneWithCode });

      if (result.code) {
        Alert.alert("Development Mode", `New verification code: ${result.code}`);
      } else {
        Alert.alert("Code Sent", "A new verification code has been sent to your phone");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhone = () => {
    Alert.alert(
      "Remove Phone",
      "Are you sure you want to remove your phone number?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await removePhoneNumber();
              onPhoneUpdated();
              Alert.alert("Success", "Phone number removed successfully");
              onClose();
            } catch (err) {
              setError(getErrorMessage(err));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const title = step === "input" ? (phoneNumber ? "Update Phone" : "Add Phone") : "Verify Phone";

  return (
    <Modal visible={visible} onClose={onClose} title={title}>
      {step === "input" ? (
        <>
          {/* Current phone display */}
          {phoneNumber && phoneVerified && (
            <View
              className="flex-row items-center p-4 rounded-xl mb-4"
              style={{ backgroundColor: withOpacity(colors.success, 0.1) }}
            >
              <Icon name="checkmark-circle" size="md" color={colors.success} />
              <View className="flex-1 ml-3">
                <Text variant="caption" style={{ color: colors.neutral[500] }}>
                  Current Phone (Verified)
                </Text>
                <Text variant="body" className="font-medium">
                  {phoneNumber}
                </Text>
              </View>
            </View>
          )}

          <View className="mb-4">
            <Text variant="body-sm" className="font-medium mb-2" style={{ color: colors.neutral[700] }}>
              Phone Number
            </Text>
            <View
              className="flex-row items-center px-4 rounded-xl"
              style={{ backgroundColor: colors.neutral[100] }}
            >
              <Text style={{ color: colors.neutral[500], fontSize: 16 }}>+20</Text>
              <TextInput
                value={phone}
                onChangeText={(text) => {
                  setPhone(formatPhoneNumber(text));
                  setError("");
                }}
                placeholder="1234567890"
                placeholderTextColor={colors.neutral[400]}
                keyboardType="phone-pad"
                editable={!loading}
                className="flex-1 py-3 ml-2"
                style={{ color: colors.text.primary, fontSize: 16 }}
              />
            </View>
            {error && step === "input" && (
              <Text variant="caption" className="mt-2" style={{ color: colors.error }}>
                {error}
              </Text>
            )}
          </View>

          <View className="gap-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleUpdatePhone}
              disabled={loading || !phone}
            >
              {loading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={{ color: colors.white }}>Sending code...</Text>
                </View>
              ) : (
                "Send Verification Code"
              )}
            </Button>

            {phoneNumber && phoneVerified && (
              <Button variant="outline" size="lg" fullWidth onPress={handleRemovePhone}>
                Remove Phone Number
              </Button>
            )}
          </View>
        </>
      ) : (
        <>
          <View className="items-center mb-6">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
            >
              <Icon name="chatbubble-outline" size="xl" color={colors.primary[500]} />
            </View>
            <Text variant="body" color="secondary" center>
              Enter the 6-digit code sent to
            </Text>
            <Text variant="body" className="font-semibold">
              +20{phone}
            </Text>
          </View>

          <View className="mb-4">
            <TextInput
              value={code}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, "").slice(0, 6);
                setCode(digits);
                setError("");
              }}
              placeholder="000000"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="number-pad"
              editable={!loading}
              maxLength={6}
              className="px-4 py-4 rounded-xl text-center"
              style={{
                backgroundColor: colors.neutral[100],
                color: colors.text.primary,
                fontSize: 24,
                letterSpacing: 8,
              }}
            />
            {error && (
              <Text variant="caption" className="mt-2 text-center" style={{ color: colors.error }}>
                {error}
              </Text>
            )}
          </View>

          <View className="gap-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleVerifyPhone}
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={{ color: colors.white }}>Verifying...</Text>
                </View>
              ) : (
                "Verify Phone"
              )}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onPress={handleResendCode}
              disabled={loading}
            >
              Resend Code
            </Button>

            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onPress={() => setStep("input")}
              disabled={loading}
            >
              Change Phone Number
            </Button>
          </View>
        </>
      )}
    </Modal>
  );
}
