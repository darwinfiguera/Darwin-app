import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, apiErrorMessage } from "../api/client";
import type { Account, Category } from "../api/types";
import { PrimaryButton, SectionLabel } from "../components/ui";
import type { AppStackParamList } from "../navigation/types";
import { useTheme } from "../theme/useTheme";

type Props = NativeStackScreenProps<AppStackParamList, "AddTransaction">;

export default function AddTransactionScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const [accRes, catRes] = await Promise.all([api.get<{ accounts: Account[] }>("/accounts"), api.get<{ categories: Category[] }>("/categories")]);
      setAccounts(accRes.data.accounts);
      setCategories(catRes.data.categories);
      if (accRes.data.accounts[0]) setAccountId(accRes.data.accounts[0].id);
    })();
  }, []);

  const relevantCategories = useMemo(
    () => categories.filter((c) => c.kind === "BOTH" || c.kind === type),
    [categories, type],
  );

  async function handleSave() {
    const numericAmount = Number(amount.replace(",", "."));
    if (!numericAmount || numericAmount <= 0) return setError("Ingresá un monto válido.");
    if (!accountId) return setError("Elegí una cuenta.");
    if (!categoryId) return setError("Elegí una categoría.");

    setError("");
    setSaving(true);
    try {
      await api.post("/transactions", { accountId, categoryId, type, amount: numericAmount, note: note || undefined });
      navigation.goBack();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.text1 }}>✕</Text>
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 15, color: colors.text1 }}>Nuevo movimiento</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
        <View style={{ flexDirection: "row", backgroundColor: colors.surface2, borderRadius: 14, padding: 4, marginBottom: 12 }}>
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                setType(t);
                setCategoryId(null);
              }}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 11,
                alignItems: "center",
                backgroundColor: type === t ? (t === "EXPENSE" ? colors.critSoft : colors.goodSoft) : "transparent",
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 14, color: type === t ? (t === "EXPENSE" ? colors.crit : colors.good) : colors.text2 }}>
                {t === "EXPENSE" ? "Gasto" : "Ingreso"}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="$ 0"
          placeholderTextColor={colors.muted}
          style={{ fontSize: 40, fontWeight: "800", textAlign: "center", color: colors.text1, paddingVertical: 16 }}
        />
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Agregá una nota (opcional)"
          placeholderTextColor={colors.muted}
          style={{ fontSize: 14, textAlign: "center", color: colors.text2, marginBottom: 6 }}
        />

        <SectionLabel>Categoría</SectionLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {relevantCategories.map((c) => {
            const selected = categoryId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                style={{
                  width: "29%",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 8,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: selected ? colors.brand : "transparent",
                  backgroundColor: selected ? colors.brandSoft : "transparent",
                }}
              >
                <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: c.color, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 19 }}>{c.icon}</Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: selected ? colors.brandStrong : colors.text2, textAlign: "center" }}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionLabel>Cuenta / billetera</SectionLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {accounts.map((a) => {
            const selected = accountId === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => setAccountId(a.id)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.brand : colors.border,
                  backgroundColor: selected ? colors.brandSoft : "transparent",
                }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: "600", color: selected ? colors.brandStrong : colors.text2 }}>
                  {a.icon} {a.name}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => navigation.navigate("Paywall")}
            style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border }}
          >
            <Text style={{ fontSize: 12.5, fontWeight: "600", color: colors.muted }}>+ Agregar cuenta</Text>
          </Pressable>
        </View>

        {error ? <Text style={{ color: colors.crit, fontSize: 13, marginTop: 14 }}>{error}</Text> : null}

        <View style={{ marginTop: 24 }}>
          <PrimaryButton
            label={type === "EXPENSE" ? "Guardar gasto" : "Guardar ingreso"}
            onPress={handleSave}
            loading={saving}
            color={type === "EXPENSE" ? colors.brand : colors.good}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
