import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api/client";
import type { BalancePoint, DashboardSummary, MonthlyComparisonPoint } from "../api/types";
import { BalanceLineChart, BarChartMonthly, DonutChart, GaugeArc } from "../components/charts";
import { CoachInsightCard } from "../components/CoachInsightCard";
import { AvatarBadge, Card, Pill, SectionLabel } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import type { AppStackParamList, MainTabParamList } from "../navigation/types";
import { useTheme } from "../theme/useTheme";
import { formatMoney } from "../utils/format";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps as RootStackScreenProps } from "@react-navigation/native-stack";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Dashboard">,
  RootStackScreenProps<AppStackParamList>
>;

async function loadDashboard() {
  const [summary, monthly, balance] = await Promise.all([
    api.get<DashboardSummary>("/dashboard/summary"),
    api.get<{ months: MonthlyComparisonPoint[] }>("/dashboard/monthly-comparison?months=6"),
    api.get<{ points: BalancePoint[] }>("/dashboard/balance-evolution?months=6"),
  ]);
  return { summary: summary.data, monthly: monthly.data.months, balance: balance.data.points };
}

export default function DashboardScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data, loading, reload } = useFetch(loadDashboard, []);

  const onRefresh = useCallback(() => {
    reload();
  }, [reload]);

  const monthLabel = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <AvatarBadge emoji={user?.avatarEmoji ?? "👋"} background={colors.brandSoft} size={44} />
            <View>
              <Text style={{ color: colors.muted, fontSize: 12.5 }}>Hola, {user?.name?.split(" ")[0] ?? ""}</Text>
              <Text style={{ color: colors.text1, fontSize: 15, fontWeight: "800", textTransform: "capitalize" }}>{monthLabel}</Text>
            </View>
          </View>
          {user?.premium ? <Pill label="✨ Premium" status="premium" /> : <Pill label="Plan gratuito" status="brand" />}
        </View>

        <View style={{ backgroundColor: colors.brand, borderRadius: 18, padding: 16, marginBottom: 8 }}>
          <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5 }}>Saldo disponible</Text>
          <Text style={{ color: "#fff", fontSize: 27, fontWeight: "800", marginTop: 4 }}>
            {formatMoney(data?.summary.balance ?? 0)}
          </Text>
        </View>

        {data?.summary.coach && (
          <>
            <SectionLabel>Tu coach financiero</SectionLabel>
            <Card>
              <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
                <GaugeArc percent={data.summary.coach.score} status={data.summary.coach.scoreStatus} size={92} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "700", textTransform: "uppercase" }}>
                    Salud financiera
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text1, marginTop: 2 }}>
                    {data.summary.coach.scoreLabel}
                  </Text>
                </View>
              </View>
              <View style={{ gap: 8, marginTop: 12 }}>
                {data.summary.coach.topInsights.map((insight) => (
                  <CoachInsightCard key={insight.id} insight={insight} />
                ))}
              </View>
            </Card>
          </>
        )}

        <SectionLabel>Evolución del saldo</SectionLabel>
        <Card>
          <BalanceLineChart data={data?.balance ?? []} width={320} height={140} />
        </Card>

        <SectionLabel>Gasto por categoría · este mes</SectionLabel>
        <Card>
          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            <DonutChart
              data={data?.summary.categoryBreakdown.map((c) => ({ name: c.name, color: c.color, amount: c.amount, percent: c.percent })) ?? []}
              centerLabel={formatMoney(data?.summary.monthExpense ?? 0)}
              centerSubLabel="gastado"
              size={140}
            />
            <View style={{ flex: 1, gap: 6 }}>
              {(data?.summary.categoryBreakdown ?? []).slice(0, 4).map((c) => (
                <View key={c.categoryId} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.color }} />
                    <Text style={{ fontSize: 12.5, color: colors.text2 }}>{c.name}</Text>
                  </View>
                  <Text style={{ fontSize: 12.5, fontWeight: "700", color: colors.text1 }}>{c.percent}%</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        <SectionLabel>Últimos meses</SectionLabel>
        <Card>
          <BarChartMonthly data={data?.monthly ?? []} width={320} height={150} />
        </Card>

        <SectionLabel>Presupuesto por categoría</SectionLabel>
        <View style={{ gap: 10 }}>
          {(data?.summary.budgetGauges ?? []).length === 0 && (
            <Card>
              <Text style={{ color: colors.text2, fontSize: 13 }}>
                Todavía no configuraste presupuestos por categoría. Agregalos desde una transacción para empezar a ver alertas
                acá.
              </Text>
            </Card>
          )}
          {(data?.summary.budgetGauges ?? []).map((g) => (
            <Card key={g.categoryId} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <GaugeArc percent={g.percent} status={g.status} size={80} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontWeight: "800", fontSize: 13.5, color: colors.text1 }}>
                    {g.icon} {g.name}
                  </Text>
                  <Pill label={g.status === "green" ? "Verde" : g.status === "yellow" ? "Amarillo" : "Rojo"} status={g.status} />
                </View>
                <Text style={{ fontSize: 11.5, color: colors.text2, lineHeight: 16 }}>{g.message}</Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
