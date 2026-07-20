import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, apiErrorMessage } from "../api/client";
import { Card, PrimaryButton } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import type { AppStackParamList } from "../navigation/types";
import { useTheme } from "../theme/useTheme";

type Props = NativeStackScreenProps<AppStackParamList, "RedeemCode">;

const BENEFITS = [
  { title: "Cuentas ilimitadas", sub: "Efectivo, tarjetas y bancos sin límite" },
  { title: "Categorías personalizadas", sub: "Con ícono y color a tu elección" },
  { title: "Metas ilimitadas", sub: "Sin el tope de 1 meta activa" },
  { title: "Alertas e históricos avanzados", sub: "Comparativas, tendencias y exportables" },
];

export default function RedeemCodeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { refreshUser } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ message: string; premiumUntil: string | null; premiumLifetime: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRedeem() {
    if (!code.trim()) return;
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/codes/redeem", { code: code.trim() });
      setSuccess(data);
      await refreshUser();
    } catch (err) {
      setError(apiErrorMessage(err, "Ese código no es válido."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.text1 }}>←</Text>
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 15, color: colors.text1 }}>Canjear código</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.premiumSoft, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 30 }}>🎁</Text>
          </View>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text1 }}>¿Tenés un código de acceso?</Text>
          <Text style={{ fontSize: 13, color: colors.text2, textAlign: "center", marginTop: 6 }}>
            Canjealo acá y activá Premium sin pagar, por el tiempo que indique tu código.
          </Text>
        </View>

        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          placeholder="MC-XXXX-XXXX"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          style={{
            borderWidth: 1.5,
            borderColor: colors.border,
            borderRadius: 14,
            padding: 16,
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
            letterSpacing: 2,
            color: colors.text1,
            marginBottom: 12,
          }}
        />
        {error ? <Text style={{ color: colors.crit, fontSize: 13, marginBottom: 10, textAlign: "center" }}>{error}</Text> : null}
        <PrimaryButton label="Canjear código" onPress={handleRedeem} loading={loading} disabled={!code.trim()} />

        {success && (
          <Card style={{ marginTop: 22, borderColor: colors.good, backgroundColor: colors.goodSoft }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text1 }}>¡Listo! Premium activado 🎉</Text>
            <Text style={{ fontSize: 13, color: colors.text2, marginTop: 6 }}>
              {success.premiumLifetime
                ? "Tu acceso Premium es de por vida."
                : `Válido hasta el ${success.premiumUntil ? new Date(success.premiumUntil).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : ""}.`}
            </Text>
          </Card>
        )}

        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, textTransform: "uppercase", marginTop: 26, marginBottom: 10 }}>
          Esto desbloqueás
        </Text>
        <Card>
          {BENEFITS.map((b, i) => (
            <View
              key={b.title}
              style={{ flexDirection: "row", gap: 10, paddingVertical: 9, borderBottomWidth: i === BENEFITS.length - 1 ? 0 : 1, borderColor: colors.border }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.goodSoft, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: colors.good, fontSize: 11, fontWeight: "800" }}>✓</Text>
              </View>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text1 }}>{b.title}</Text>
                <Text style={{ fontSize: 11.5, color: colors.muted }}>{b.sub}</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
