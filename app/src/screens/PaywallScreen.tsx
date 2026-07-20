import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, apiErrorMessage } from "../api/client";
import { Card, PrimaryButton } from "../components/ui";
import type { AppStackParamList } from "../navigation/types";
import { useTheme } from "../theme/useTheme";

type Props = NativeStackScreenProps<AppStackParamList, "Paywall">;

const FEATURES = [
  "Cuentas y billeteras ilimitadas",
  "Categorías personalizadas con ícono y color propio",
  "Metas de ahorro ilimitadas",
  "Alertas predictivas de presupuesto",
  "Históricos y comparativas de todos tus meses",
  "Informes exportables",
];

export default function PaywallScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [plan, setPlan] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post<{ url: string }>("/billing/checkout-session", { plan });
      await Linking.openURL(data.url);
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos abrir el pago. Probá de nuevo en un rato."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.text1 }}>✕</Text>
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 15, color: colors.text1 }}>MisCuentas Premium</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text1, marginBottom: 6 }}>
          Llevá tus finanzas un paso más allá ✨
        </Text>
        <Text style={{ fontSize: 13.5, color: colors.text2, marginBottom: 20 }}>
          Todo lo del plan gratuito, más el acompañamiento completo del coach financiero.
        </Text>

        <Card>
          {FEATURES.map((f, i) => (
            <View key={f} style={{ flexDirection: "row", gap: 10, paddingVertical: 8, borderBottomWidth: i === FEATURES.length - 1 ? 0 : 1, borderColor: colors.border }}>
              <Text style={{ color: colors.premium, fontWeight: "800" }}>✓</Text>
              <Text style={{ fontSize: 13.5, color: colors.text1, flex: 1 }}>{f}</Text>
            </View>
          ))}
        </Card>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 20, marginBottom: 20 }}>
          {(["MONTHLY", "ANNUAL"] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPlan(p)}
              style={{
                flex: 1,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: plan === p ? colors.premium : colors.border,
                backgroundColor: plan === p ? colors.premiumSoft : colors.surface,
                padding: 14,
              }}
            >
              <Text style={{ fontWeight: "800", color: colors.text1 }}>{p === "MONTHLY" ? "Mensual" : "Anual"}</Text>
              <Text style={{ fontSize: 11.5, color: colors.muted, marginTop: 2 }}>
                {p === "MONTHLY" ? "Cancelás cuando quieras" : "2 meses gratis"}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={{ color: colors.crit, fontSize: 13, marginBottom: 10, textAlign: "center" }}>{error}</Text> : null}
        <PrimaryButton label="Continuar al pago" onPress={handleSubscribe} loading={loading} color={colors.premium} />

        <Pressable onPress={() => navigation.navigate("RedeemCode")} style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={{ color: colors.brand, fontWeight: "700", fontSize: 13 }}>Tengo un código de acceso gratuito</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
