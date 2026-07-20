import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, apiErrorMessage } from "../api/client";
import type { Goal } from "../api/types";
import { CircularProgress } from "../components/charts";
import { Card, Pill, PrimaryButton, SectionLabel } from "../components/ui";
import { useFetch } from "../hooks/useFetch";
import type { AppStackParamList, MainTabParamList } from "../navigation/types";
import { useTheme } from "../theme/useTheme";
import { formatMoney } from "../utils/format";

type Props = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, "Goals">, NativeStackScreenProps<AppStackParamList>>;

async function loadGoals() {
  const { data } = await api.get<{ goals: Goal[] }>("/goals");
  return data.goals;
}

export default function GoalsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { data: goals, reload } = useFetch(loadGoals, []);
  const [showCreate, setShowCreate] = useState(false);

  const active = (goals ?? []).filter((g) => g.status === "ACTIVE" && !g.locked);
  const locked = (goals ?? []).filter((g) => g.locked);
  const completed = (goals ?? []).filter((g) => g.status === "COMPLETED");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text1 }}>Tus metas 🎯</Text>
          <Pressable onPress={() => setShowCreate(true)}>
            <Text style={{ color: colors.brand, fontWeight: "700", fontSize: 14 }}>+ Nueva</Text>
          </Pressable>
        </View>

        {active.length === 0 && completed.length === 0 && (
          <Card style={{ marginTop: 10 }}>
            <Text style={{ color: colors.text2, fontSize: 13.5 }}>
              Todavía no creaste ninguna meta. Arrancá con algo concreto: un viaje, un fondo de emergencia, lo que sea. 🙂
            </Text>
          </Card>
        )}

        {[...active, ...completed].map((g) => (
          <Card key={g.id} style={{ flexDirection: "row", gap: 14, marginTop: 12 }}>
            <CircularProgress
              percent={g.percent}
              size={92}
              color={g.status === "COMPLETED" ? colors.good : colors.premium}
              trackColor={colors.grid}
              label={`${Math.min(100, Math.round(g.percent))}%`}
              sublabel={g.status === "COMPLETED" ? "¡lograda!" : "alcanzado"}
            />
            <View style={{ flex: 1, gap: 4, justifyContent: "center" }}>
              <Text style={{ fontWeight: "800", fontSize: 14.5, color: colors.text1 }}>
                {g.icon} {g.name}
              </Text>
              <Text style={{ fontSize: 12.5, color: colors.text2 }}>
                {formatMoney(g.currentAmount)} <Text style={{ color: colors.muted }}>de {formatMoney(g.targetAmount)}</Text>
              </Text>
              {g.targetDate && (
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  Estimado: {new Date(g.targetDate).toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
                </Text>
              )}
              {g.nudgeMessage ? (
                <Text style={{ fontSize: 12, color: colors.good, fontWeight: "700", marginTop: 2 }}>{g.nudgeMessage}</Text>
              ) : (
                <Pill label={g.status === "COMPLETED" ? "Lograda" : "En camino"} status={g.status === "COMPLETED" ? "green" : "brand"} />
              )}
            </View>
          </Card>
        ))}

        {locked.length > 0 && (
          <>
            <SectionLabel>Bloqueado en el plan gratuito</SectionLabel>
            {locked.map((g) => (
              <Pressable key={g.id} onPress={() => navigation.navigate("Paywall")}>
                <Card style={{ flexDirection: "row", gap: 14, opacity: 0.55 }}>
                  <View style={{ width: 76, height: 76, borderRadius: 20, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 30 }}>{g.icon}</Text>
                  </View>
                  <View style={{ justifyContent: "center", flex: 1 }}>
                    <Text style={{ fontWeight: "700", color: colors.text1 }}>{g.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.text2 }}>
                      {formatMoney(g.currentAmount)} de {formatMoney(g.targetAmount)}
                    </Text>
                  </View>
                </Card>
                <View style={{ marginTop: -70, marginBottom: 10, alignItems: "center", gap: 6 }}>
                  <Pill label="✨ Premium" status="premium" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text1 }}>Metas ilimitadas con Premium</Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      <CreateGoalModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={reload} />
    </SafeAreaView>
  );
}

function CreateGoalModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: () => void }) {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [targetAmount, setTargetAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const amount = Number(targetAmount.replace(",", "."));
    if (!name.trim()) return setError("Ponele un nombre a tu meta.");
    if (!amount || amount <= 0) return setError("Ingresá un monto objetivo válido.");
    setSaving(true);
    setError("");
    try {
      await api.post("/goals", { name: name.trim(), icon, targetAmount: amount });
      setName("");
      setTargetAmount("");
      onCreated();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20 }}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text1, marginBottom: 14 }}>Nueva meta</Text>
          <TextInput
            value={icon}
            onChangeText={setIcon}
            placeholder="🎯"
            style={{ fontSize: 30, textAlign: "center", marginBottom: 10 }}
          />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="ej: Viaje a Bariloche"
            placeholderTextColor={colors.muted}
            style={{ backgroundColor: colors.surface2, borderRadius: 12, padding: 12, marginBottom: 10, color: colors.text1 }}
          />
          <TextInput
            value={targetAmount}
            onChangeText={setTargetAmount}
            placeholder="Monto objetivo"
            keyboardType="decimal-pad"
            placeholderTextColor={colors.muted}
            style={{ backgroundColor: colors.surface2, borderRadius: 12, padding: 12, marginBottom: 10, color: colors.text1 }}
          />
          {error ? <Text style={{ color: colors.crit, fontSize: 13, marginBottom: 8 }}>{error}</Text> : null}
          <PrimaryButton label="Crear meta" onPress={handleCreate} loading={saving} />
          <View style={{ height: 10 }} />
          <Pressable onPress={onClose} style={{ alignItems: "center", padding: 8 }}>
            <Text style={{ color: colors.text2 }}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
