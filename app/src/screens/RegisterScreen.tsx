import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { GhostButton, PrimaryButton } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import type { AuthStackParamList } from "../navigation/types";
import { useTheme } from "../theme/useTheme";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError("");
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear tu cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text1 }]}>Creemos tu cuenta 🚀</Text>
          <Text style={[styles.subtitle, { color: colors.text2 }]}>Arrancás con el plan gratuito, sin tarjeta.</Text>

          <Text style={[styles.label, { color: colors.muted }]}>Nombre</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={colors.muted}
            style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text1 }]}
          />
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
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor={colors.muted}
            style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text1 }]}
          />

          {error ? <Text style={{ color: colors.crit, fontSize: 13, marginTop: 8 }}>{error}</Text> : null}

          <View style={{ marginTop: 18 }}>
            <PrimaryButton
              label="Crear cuenta"
              onPress={handleRegister}
              loading={loading}
              disabled={!email || !password || !name}
            />
          </View>

          <SocialAuthButtons onError={setError} />

          <View style={{ marginTop: 22 }}>
            <GhostButton label="Ya tengo cuenta" onPress={() => navigation.navigate("Login")} />
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
