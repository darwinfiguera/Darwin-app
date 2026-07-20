import { useEffect, useState } from "react";
import { Platform, Pressable, Text } from "react-native";
import { googleSignInAvailable, isAppleSignInAvailable, signInWithApple, useGoogleSignIn } from "../api/socialAuth";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/useTheme";

function GoogleAuthButton({ onError }: { onError: (message: string) => void }) {
  const { colors } = useTheme();
  const { loginWithGoogle } = useAuth();
  const { request, promptAsync } = useGoogleSignIn(async (idToken) => {
    try {
      await loginWithGoogle(idToken);
    } catch (err) {
      onError(err instanceof Error ? err.message : "No pudimos iniciar sesión con Google.");
    }
  });

  return (
    <Pressable
      disabled={!request}
      onPress={() => promptAsync()}
      style={{
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 14,
        paddingVertical: 13,
        marginTop: 10,
      }}
    >
      <Text style={{ fontSize: 16 }}>🔵</Text>
      <Text style={{ color: colors.text1, fontWeight: "700", fontSize: 14.5 }}>Continuar con Google</Text>
    </Pressable>
  );
}

function AppleAuthButton({ onError }: { onError: (message: string) => void }) {
  const { colors } = useTheme();
  const { loginWithApple } = useAuth();

  async function handleApple() {
    try {
      const { identityToken, name } = await signInWithApple();
      await loginWithApple(identityToken, name);
    } catch (err: any) {
      if (err?.code === "ERR_REQUEST_CANCELED") return;
      onError(err instanceof Error ? err.message : "No pudimos iniciar sesión con Apple.");
    }
  }

  return (
    <Pressable
      onPress={handleApple}
      style={{
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.text1,
        borderRadius: 14,
        paddingVertical: 13,
        marginTop: 10,
      }}
    >
      <Text style={{ fontSize: 16 }}></Text>
      <Text style={{ color: colors.page, fontWeight: "700", fontSize: 14.5 }}>Continuar con Apple</Text>
    </Pressable>
  );
}

export function SocialAuthButtons({ onError }: { onError: (message: string) => void }) {
  const [appleReady, setAppleReady] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios") {
      isAppleSignInAvailable().then(setAppleReady).catch(() => setAppleReady(false));
    }
  }, []);

  if (!googleSignInAvailable && !appleReady) return null;

  return (
    <>
      {googleSignInAvailable && <GoogleAuthButton onError={onError} />}
      {appleReady && <AppleAuthButton onError={onError} />}
    </>
  );
}
