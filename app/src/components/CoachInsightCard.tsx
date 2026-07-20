import { Text, View } from "react-native";
import type { CoachInsight } from "../api/types";
import { useTheme } from "../theme/useTheme";

const TYPE_COLOR: Record<CoachInsight["type"], "green" | "yellow" | "red" | "brand"> = {
  positive: "green",
  info: "brand",
  warning: "yellow",
  critical: "red",
};

export function CoachInsightCard({ insight }: { insight: CoachInsight }) {
  const { colors } = useTheme();
  const kind = TYPE_COLOR[insight.type];
  const accent =
    kind === "green" ? colors.good : kind === "yellow" ? colors.warn : kind === "red" ? colors.crit : colors.brand;
  const soft =
    kind === "green" ? colors.goodSoft : kind === "yellow" ? colors.warnSoft : kind === "red" ? colors.critSoft : colors.brandSoft;

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 4,
        borderLeftColor: accent,
        borderRadius: 14,
        padding: 12,
      }}
    >
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: soft, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 15 }}>{insight.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "800", color: colors.text1, marginBottom: 2 }}>{insight.title}</Text>
        <Text style={{ fontSize: 12.5, color: colors.text2, lineHeight: 18 }}>{insight.message}</Text>
      </View>
    </View>
  );
}
