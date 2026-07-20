import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CircularProgress } from "../components/charts";
import { GhostButton, PrimaryButton } from "../components/ui";
import type { AuthStackParamList } from "../navigation/types";
import { useTheme } from "../theme/useTheme";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "68%",
    sub: "VAS BIEN 👍",
    title: "Mirá tu plata de un vistazo",
    body: "Verde, amarillo o rojo: vas a saber cómo estás con cada categoría sin abrir una sola planilla.",
    percent: 68,
  },
  {
    icon: "🧭",
    title: "Un coach, no solo una planilla",
    body: "MisCuentas te avisa si tus gastos esenciales, tus gustos o tu ahorro se están yendo de rango, con la regla 50/30/20 y consejos concretos.",
    percent: 82,
  },
  {
    icon: "🎯",
    title: "Metas que sí se cumplen",
    body: "Ponete objetivos de ahorro, mirá tu progreso en tiempo real y recibí un empujón cuando estés por lograrlos.",
    percent: 56,
  },
];

type Props = NativeStackScreenProps<AuthStackParamList, "Onboarding">;

export default function OnboardingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={{ width, padding: 24, justifyContent: "center" }}>
            <View
              style={{
                height: 220,
                borderRadius: 22,
                backgroundColor: colors.brandSoft,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <CircularProgress
                percent={slide.percent}
                size={130}
                color={colors.good}
                trackColor={colors.grid}
                label={slide.icon}
                sublabel={slide.sub}
              />
            </View>
            <Text style={[styles.title, { color: colors.text1 }]}>{slide.title}</Text>
            <Text style={[styles.body, { color: colors.text2 }]}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === index ? 20 : 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: i === index ? colors.brand : colors.border,
              marginHorizontal: 3,
            }}
          />
        ))}
      </View>

      <View style={{ padding: 20, gap: 10 }}>
        <PrimaryButton label="Comenzar" onPress={() => navigation.navigate("Register")} />
        <GhostButton label="Ya tengo cuenta" onPress={() => navigation.navigate("Login")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 23, fontWeight: "800", marginBottom: 8 },
  body: { fontSize: 14.5, lineHeight: 21 },
  dots: { flexDirection: "row", justifyContent: "center", marginBottom: 6 },
});
