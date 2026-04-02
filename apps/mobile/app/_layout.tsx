import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "../src/stores/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuth((s) => s.user);
  const isLoading = useAuth((s) => s.isLoading);
  const hasProfile = useAuth((s) => s.hasProfile);
  const initialize = useAuth((s) => s.initialize);
  const checkProfile = useAuth((s) => s.checkProfile);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initialize().then(() => setReady(true));
  }, []);

  // Once we have a user, check if they've completed onboarding
  useEffect(() => {
    if (ready && user && hasProfile === null) {
      checkProfile();
    }
  }, [ready, user]);

  useEffect(() => {
    if (!ready) return;
    // Still checking profile status
    if (user && hasProfile === null) return;

    const inAuthGroup = segments[0] === "auth";
    const inOnboarding = segments[0] === "onboarding";

    if (!user && !inAuthGroup) {
      // Not logged in → go to sign in
      router.replace("/auth/signin");
    } else if (user && inAuthGroup) {
      // Logged in but on auth screen → check profile
      if (hasProfile === false) {
        router.replace("/onboarding/step-basics");
      } else {
        router.replace("/(tabs)");
      }
    } else if (user && hasProfile === false && !inOnboarding) {
      // Logged in, no profile, not in onboarding → send to onboarding
      router.replace("/onboarding/step-basics");
    } else if (user && hasProfile === true && inOnboarding) {
      // Has profile but still on onboarding → go to tabs
      router.replace("/(tabs)");
    }
  }, [user, ready, hasProfile, segments]);

  if (!ready || isLoading || (user && hasProfile === null)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <AuthGate>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#ffffff" },
            headerTintColor: "#059669",
            headerTitleStyle: { fontWeight: "bold" },
          }}
        >
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-food"
            options={{
              title: "Add Food",
              presentation: "modal",
            }}
          />
        </Stack>
      </AuthGate>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8faf9",
  },
});
