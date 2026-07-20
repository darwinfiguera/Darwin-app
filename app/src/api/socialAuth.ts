import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";

WebBrowser.maybeCompleteAuthSession();

export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

export const googleSignInAvailable = Boolean(GOOGLE_IOS_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);
export const isAppleSignInAvailable = AppleAuthentication.isAvailableAsync;

/** Wraps expo-auth-session's Google hook; call onToken when a valid id_token comes back. */
export function useGoogleSignIn(onToken: (idToken: string) => void) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
  });

  useEffect(() => {
    if (response?.type === "success" && response.authentication?.idToken) {
      onToken(response.authentication.idToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return { request, promptAsync };
}

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
  });
  const name = credential.fullName?.givenName
    ? `${credential.fullName.givenName} ${credential.fullName.familyName ?? ""}`.trim()
    : undefined;
  return { identityToken: credential.identityToken!, name };
}
