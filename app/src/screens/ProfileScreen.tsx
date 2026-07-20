import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../api/client";
import { AvatarBadge, Card, Pill, PrimaryButton, SectionLabel } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import type { AppStackParamList, MainTabParamList } from "../navigation/types";
import { useTheme } from "../theme/useTheme";

type Props = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, "Profile">, NativeStackScreenProps<AppStackParamList>>;

function Row({ label, onPress, right }: { label: string; onPress: () => void; right?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13 }}>
      <Text style={{ fontSize: 14, color: colors.text1, fontWeight: "600" }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.muted }}>{right ?? "›"}</Text>
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const [income, setIncome] = useState(user?.estimatedMonthlyIncome ? String(user.estimatedMonthlyIncome) : "");
  const [savingIncome, setSavingIncome] = useState(false);

  async function handleSaveIncome() {
    const value = Number(income.replace(",", "."));
    if (Number.isNaN(value)) return;
    setSavingIncome(true);
    try {
      await updateProfile({ estimatedMonthlyIncome: value });
    } finally {
      setSavingIncome(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={{ alignItems: "center", marginTop: 10, marginBottom: 20 }}>
          <AvatarBadge emoji={user?.avatarEmoji ?? "🙂"} size={72} background={colors.brandSoft} />
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text1, marginTop: 10 }}>{user?.name}</Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>{user?.email}</Text>
          <View style={{ marginTop: 8 }}>
            {user?.premium ? <Pill label="✨ Premium" status="premium" /> : <Pill label="Plan gratuito" status="brand" />}
          </View>
        </View>

        {!user?.premium && (
          <Card style={{ marginBottom: 16, backgroundColor: colors.premiumSoft, borderColor: "transparent" }}>
            <Text style={{ fontWeight: "800", color: colors.text1, marginBottom: 4 }}>Pasate a Premium</Text>
            <Text style={{ fontSize: 12.5, color: colors.text2, marginBottom: 10 }}>
              Cuentas y metas ilimitadas, categorías personalizadas y alertas predictivas.
            </Text>
            <PrimaryButton label="Ver planes" onPress={() => navigation.navigate("Paywall")} color={colors.premium} />
          </Card>
        )}

        <SectionLabel>Ingreso mensual estimado</SectionLabel>
        <Card>
          <Text style={{ fontSize: 12, color: colors.text2, marginBottom: 8, lineHeight: 17 }}>
            Tu coach lo usa para calcular la regla 50/30/20 los meses en que todavía no cargaste todos tus ingresos.
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={income}
              onChangeText={setIncome}
              keyboardType="decimal-pad"
              placeholder="$ 0"
              placeholderTextColor={colors.muted}
              style={{ flex: 1, backgroundColor: colors.surface2, borderRadius: 12, padding: 10, color: colors.text1 }}
            />
            <Pressable
              onPress={handleSaveIncome}
              disabled={savingIncome}
              style={{ backgroundColor: colors.brand, borderRadius: 12, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Guardar</Text>
            </Pressable>
          </View>
        </Card>

        <SectionLabel>Cuenta</SectionLabel>
        <Card>
          <Row label="Canjear código de acceso" onPress={() => navigation.navigate("RedeemCode")} />
          {user?.isAdmin && (
            <Row label="Panel de administración" onPress={() => Linking.openURL(`${API_URL.replace(/\/api$/, "")}/admin`)} />
          )}
          <Row label="Cerrar sesión" onPress={logout} right="" />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
