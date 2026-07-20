import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTheme } from "../theme/useTheme";
import type { SemaphoreStatus } from "../theme/colors";
import { semaphoreColor, semaphoreSoft } from "../theme/colors";

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 18,
          padding: 15,
          shadowColor: "#16151F",
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: colors.muted,
        marginTop: 20,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

export function Pill({ label, status }: { label: string; status: SemaphoreStatus | "brand" | "premium" }) {
  const { colors } = useTheme();
  let bg = colors.brandSoft;
  let fg = colors.brandSoftText;
  if (status === "premium") {
    bg = colors.premiumSoft;
    fg = colors.premiumSoftText;
  } else if (status === "green" || status === "yellow" || status === "red") {
    bg = semaphoreSoft(colors, status);
    fg = semaphoreColor(colors, status);
  }
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" }}>
      <Text style={{ color: fg, fontSize: 11.5, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  color,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  color?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: color ?? colors.brand, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{label}</Text>}
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={[styles.btnText, { color: colors.text2 }]}>{label}</Text>
    </Pressable>
  );
}

export function AvatarBadge({ emoji, size = 46, background, color }: { emoji: string; size?: number; background: string; color?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.46, color }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
