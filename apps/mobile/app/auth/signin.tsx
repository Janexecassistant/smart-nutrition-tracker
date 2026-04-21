import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/stores/auth";

// Food photography hero. Run this once to fetch it:
//   curl -sSL "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85" \
//     -o apps/mobile/assets/images/login-bg.jpg
const HERO = require("../../assets/images/login-bg.jpg");

export default function SignInScreen() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Sign In Failed", err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={HERO} style={styles.hero} resizeMode="cover">
        {/* Dark scrim so text stays readable over any photo */}
        <View style={styles.scrim} />

        <View style={styles.heroContent}>
          <Text style={styles.brand}>
            Smart<Text style={styles.brandAccent}>Nutrition</Text>
          </Text>
          <Text style={styles.tagline}>
            Track what you eat.{"\n"}Reach your goals.
          </Text>
        </View>
      </ImageBackground>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.sheetScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Welcome back</Text>
            <Text style={styles.sheetSubtitle}>
              Sign in to keep your streak going
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => router.push("/auth/signup")}
            >
              <Text style={styles.linkText}>
                New here?{" "}
                <Text style={styles.linkAccent}>Create an account</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f172a" },
  hero: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 31, 23, 0.55)",
  },
  heroContent: {
    paddingTop: 80,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  brand: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  brandAccent: { color: "#6ee7b7" },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.92)",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetScroll: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 24,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  sheetSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 22,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  linkRow: { marginTop: 18, alignItems: "center" },
  linkText: { fontSize: 15, color: "#64748b" },
  linkAccent: { color: "#059669", fontWeight: "700" },
});
