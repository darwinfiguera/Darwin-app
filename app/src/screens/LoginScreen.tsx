import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { GhostButton, PrimaryButton } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import type { AuthStackParamList } from "../navigation/types";
import { useTheme } from "../theme/useTheme";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text1 }]}>Hola de nuevo 👋</Text>
          <Text style={[styles.subtitle, { color: colors.text2 }]}>Iniciá sesión para seguir con tu plan financiero.</Text>

          <Text style={[styles.label, { color: colors.muted }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="vos@email.com"
            placeholderTextColor={colors.muted}
            style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text1 }]}
          />
          <Text style={[styles.label, { color: colors.muted }]}>Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text1 }]}
          />

          {error ? <Text style={{ color: colors.crit, fontSize: 13, marginTop: 8 }}>{error}</Text> : null}

          <View style={{ marginTop: 18 }}>
            <PrimaryButton label="Ingresar" onPress={handleLogin} loading={loading} disabled={!email || !password} />
          </View>

          <SocialAuthButtons onError={setError} />

          <View style={{ marginTop: 22 }}>
            <GhostButton label="Todavía no tengo cuenta" onPress={() => navigation.navigate("Register")} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 26 },
  label: { fontSize: 12.5, fontWeight: "700", marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
});
